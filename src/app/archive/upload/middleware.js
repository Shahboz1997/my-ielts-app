import { auth } from "@/auth";

export default auth((req) => {
  // Логика проверки сессии
});

export const config = {
  matcher: ["/archive/:path*"], 
};
