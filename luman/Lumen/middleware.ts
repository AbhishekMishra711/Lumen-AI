import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Optional: check session token cookie if protected routes need enforcement
  const token = request.cookies.get("lumen_token")?.value;

  // If needed, auth redirect can be activated here
  // if (request.nextUrl.pathname.startsWith("/dashboard") && !token) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
