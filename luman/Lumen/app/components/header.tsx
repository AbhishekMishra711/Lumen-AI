import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./logout-button";

export default async function Header() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("lumen_user")?.value;
  let user: { username?: string; selected_class?: string; level?: number } | null = null;

  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      user = null;
    }
  }

  return (
    <div className="w-full border-b-4 border-lumen-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-lumen-yellow to-lumen-orange border-4 border-lumen-black flex items-center justify-center shadow-brutalist">
            <span className="font-press-start text-xl text-black font-black">L</span>
          </div>
          <Link href="/" className="font-press-start text-2xl text-black font-black hover:scale-105 transition-transform">
            LUMEN
          </Link>
        </div>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* User Badge */}
              <div className="font-press-start text-xs bg-lumen-black text-lumen-yellow px-4 py-2 border-2 border-lumen-black shadow-brutalist">
                [LVL {user.level || 1}] {user.username || "USER"}
              </div>

              {/* Logout Button */}
              <LogoutButton />
            </>
          ) : (
            <>
              {/* Login Button */}
              <Link
                href="/login?mode=login"
                className="px-6 py-2 bg-lumen-black text-lumen-yellow border-2 border-lumen-black font-press-start text-xs transition-all hover:bg-lumen-cyan hover:translate-x-1 hover:-translate-y-1 hover:shadow-lg shadow-brutalist"
              >
                LOGIN
              </Link>

              {/* Signup Button */}
              <Link
                href="/login?mode=signup"
                className="px-6 py-2 bg-lumen-yellow text-black border-2 border-lumen-black font-press-start text-xs transition-all hover:bg-lumen-cyan hover:translate-x-1 hover:-translate-y-1 hover:shadow-lg shadow-brutalist"
              >
                SIGNUP
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
