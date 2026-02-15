import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// ПРИНУДИТЕЛЬНО ОТКЛЮЧАЕМ СТАТИЧЕСКИЙ АНАЛИЗ ДЛЯ ЭТОГО РОУТА
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
