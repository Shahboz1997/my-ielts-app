import crypto from 'crypto';
import { getPrisma } from '@/lib/prisma';
import { getTelegramBotInfo } from '@/lib/telegram';

const TOKEN_TTL_MS = 15 * 60 * 1000;

function makeToken() {
  return crypto.randomBytes(24).toString('base64url');
}

/** @returns {Promise<string|null>} */
export async function getBotUsername() {
  const fromEnv = (process.env.TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, '');
  if (fromEnv) return fromEnv;
  const info = await getTelegramBotInfo();
  return info.ok ? info.bot?.username || null : null;
}

export async function createTelegramLinkToken(userId) {
  const prisma = getPrisma();
  const now = new Date();
  await prisma.telegramLinkToken.deleteMany({
    where: { userId, usedAt: null, expiresAt: { lt: now } },
  });
  const token = makeToken();
  await prisma.telegramLinkToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
    },
  });
  const username = await getBotUsername();
  const linkUrl = username
    ? `https://t.me/${username}?start=link_${token}`
    : null;
  return { token, linkUrl, expiresInMinutes: 15 };
}

export async function getTelegramLinkStatus(userId) {
  const prisma = getPrisma();
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramChatId: true,
      telegramLinkedAt: true,
      practiceRemindersTelegramEnabled: true,
    },
  });
  if (!u) return null;
  return {
    linked: Boolean(u.telegramChatId),
    linkedAt: u.telegramLinkedAt,
    practiceRemindersTelegramEnabled: u.practiceRemindersTelegramEnabled,
  };
}

export async function disconnectTelegram(userId) {
  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: null,
      telegramLinkedAt: null,
      practiceRemindersTelegramEnabled: false,
    },
  });
}

/**
 * Called from bot webhook when user sends /start link_<token>.
 * @param {string} token
 * @param {{ chat: { id: number, type?: string }, from?: { username?: string } }} message
 */
export async function consumeTelegramLinkToken(token, message) {
  if (!token || message?.chat?.type !== 'private') {
    return { ok: false, reason: 'private_only' };
  }

  const chatId = String(message.chat.id);
  const prisma = getPrisma();
  const now = new Date();

  const row = await prisma.telegramLinkToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, language: true } } },
  });

  if (!row || row.usedAt || row.expiresAt < now) {
    const isRu = message?.from?.language_code === 'ru';
    return {
      ok: false,
      reason: 'invalid_or_expired',
      text: isRu
        ? '❌ Ссылка недействительна или истекла. Создайте новую в настройках на сайте.'
        : '❌ Link invalid or expired. Generate a new one in site settings.',
    };
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { telegramChatId: chatId, NOT: { id: row.userId } },
      data: { telegramChatId: null, telegramLinkedAt: null, practiceRemindersTelegramEnabled: false },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { telegramChatId: chatId, telegramLinkedAt: now },
    }),
    prisma.telegramLinkToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    }),
  ]);

  const isRu = row.user.language === 'ru';
  const settingsUrl = `${process.env.NEXTAUTH_URL || 'https://stratumielts.com'}/settings`;
  return {
    ok: true,
    text: isRu
      ? `✅ Telegram привязан к аккаунту STRATUM.ai.\n\nВключите напоминания: <a href="${settingsUrl}">Настройки</a>`
      : `✅ Telegram linked to your STRATUM.ai account.\n\nEnable reminders: <a href="${settingsUrl}">Settings</a>`,
  };
}
