#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const port = process.argv[2] ?? "3000";

const AUTH_CATCH_ALL_ROUTE = path.join(
  root,
  "src",
  "app",
  "api",
  "auth",
  "[...nextauth]",
  "route.js"
);

/** Turbopack can leave a broken routes.d.ts; then /api/auth/* 404 and SessionProvider gets HTML. */
function routesTypesNeedReset(content) {
  if (!content) return true;
  if (/e<ParamMap\[AppRoute\]>/i.test(content)) return true;
  if (/\}\s*\n\* \}/.test(content)) return true;
  if ((content.match(/interface RouteContext/g) || []).length > 1) return true;
  if (!content.includes("/api/auth/[...nextauth]")) return true;
  return false;
}

function shouldClearNextCache() {
  const nextDir = path.join(root, ".next");
  if (!fs.existsSync(nextDir)) return false;
  if (!fs.existsSync(AUTH_CATCH_ALL_ROUTE)) return false;

  const routesTypes = path.join(nextDir, "dev", "types", "routes.d.ts");
  if (!fs.existsSync(routesTypes)) return true;

  try {
    return routesTypesNeedReset(fs.readFileSync(routesTypes, "utf8"));
  } catch {
    return true;
  }
}

function removePathWithRetry(target, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      return true;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        const deadline = Date.now() + 400;
        while (Date.now() < deadline) {
          /* brief pause for Windows file locks */
        }
      }
    }
  }
  console.warn(`[dev] Could not remove ${path.relative(root, target)}:`, lastErr?.message ?? lastErr);
  return false;
}

function clearNextCacheIfStale() {
  if (!shouldClearNextCache()) return;

  const nextDir = path.join(root, ".next");
  const routesTypes = path.join(nextDir, "dev", "types", "routes.d.ts");

  if (removePathWithRetry(nextDir)) {
    console.warn(
      "[dev] Removed stale .next cache (auth routes missing or routes.d.ts corrupt)."
    );
    return;
  }

  if (fs.existsSync(routesTypes) && removePathWithRetry(routesTypes)) {
    console.warn("[dev] Removed corrupt routes.d.ts only (could not delete full .next).");
  }
}

function cleanedEnv() {
  const env = { ...process.env };
  const ca = env.NODE_EXTRA_CA_CERTS;
  if (!ca || !String(ca).trim()) return env;
  try {
    if (!fs.existsSync(ca)) {
      delete env.NODE_EXTRA_CA_CERTS;
      console.warn(
        `[dev] NODE_EXTRA_CA_CERTS points to a missing file (${ca}); unset for this Next.js process. Fix: remove the variable or set it to a real PEM path.`
      );
    }
  } catch {
    delete env.NODE_EXTRA_CA_CERTS;
  }
  return env;
}

// Stop any running dev server first so Windows releases .next file locks before cache cleanup.
const killPort = path.join(root, "kill-port.cjs");
const killResult = spawnSync(process.execPath, [killPort, port], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (killResult.status !== 0 && killResult.status !== null) {
  process.exit(killResult.status);
}

clearNextCacheIfStale();

const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextCli)) {
  console.error("Next.js CLI not found under node_modules. Run npm install.");
  process.exit(1);
}

const child = spawn(process.execPath, [nextCli, "dev", "-p", port, "-H", "0.0.0.0"], {
  cwd: root,
  stdio: "inherit",
  env: cleanedEnv(),
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
