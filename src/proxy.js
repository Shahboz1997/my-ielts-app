import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAdminEmail } from '@/lib/admin';
import { allAuthCookieNames, appendClearAuthCookies } from '@/lib/authSessionCookies';
import {
  getAuthSecretMaterial,
  getTokenEmail,
  getTokenUserId,
  isAuxiliaryOpenAiCheckRequest,
  jsonAuthRequired,
  jsonForbidden,
  nextWithAuthHeaders,
} from '@/lib/aiAccessShared';

async function readJsonBody(request) {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}

async function resolveSessionToken(request) {
  const secret = getAuthSecretMaterial();
  if (!secret) return null;
  return getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === 'production',
  });
}

function isAuthenticated(token) {
  return Boolean(getTokenUserId(token));
}

function requestHasAuthSessionCookie(request) {
  for (const name of allAuthCookieNames()) {
    if (request.cookies.get(name)?.value) return true;
  }
  return false;
}

function withStaleSessionCookieClear(response, shouldClear) {
  return shouldClear ? appendClearAuthCookies(response) : response;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = await resolveSessionToken(request);
  const staleSession = !token && requestHasAuthSessionCookie(request);
  const authed = isAuthenticated(token);

  if (pathname.startsWith('/api/admin')) {
    if (!authed) {
      return withStaleSessionCookieClear(
        jsonAuthRequired('Sign in to access admin API.'),
        staleSession
      );
    }
    if (!isAdminEmail(getTokenEmail(token))) {
      return withStaleSessionCookieClear(jsonForbidden('Forbidden'), staleSession);
    }
    return withStaleSessionCookieClear(nextWithAuthHeaders(request, token), staleSession);
  }

  if (pathname.startsWith('/api/assistant') || pathname.startsWith('/api/tts')) {
    if (request.method !== 'POST') {
      return withStaleSessionCookieClear(NextResponse.next(), staleSession);
    }
    if (!authed) {
      return withStaleSessionCookieClear(
        jsonAuthRequired('Sign in to use AI features.'),
        staleSession
      );
    }
    return withStaleSessionCookieClear(nextWithAuthHeaders(request, token), staleSession);
  }

  if (pathname.startsWith('/api/check')) {
    if (request.method === 'DELETE') {
      if (!authed) {
        return withStaleSessionCookieClear(
          jsonAuthRequired('Sign in to manage your archive.'),
          staleSession
        );
      }
      return withStaleSessionCookieClear(nextWithAuthHeaders(request, token), staleSession);
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (body && isAuxiliaryOpenAiCheckRequest(body)) {
        if (authed) {
          return withStaleSessionCookieClear(nextWithAuthHeaders(request, token), staleSession);
        }
        return withStaleSessionCookieClear(NextResponse.next(), staleSession);
      }
      if (authed) {
        return withStaleSessionCookieClear(nextWithAuthHeaders(request, token), staleSession);
      }
      return withStaleSessionCookieClear(NextResponse.next(), staleSession);
    }
  }

  return withStaleSessionCookieClear(NextResponse.next(), staleSession);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

