export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/archive/:path*"], // Защищает все страницы в папке archive
}
