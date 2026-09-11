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
    <div className="w-full border-b-4 border-lumen-black bg-lumen-yellow sticky top-0 z-50">
      <div className="grid grid-cols-12 gap-0">
        {/* Left: Logo/Brand (8 columns) */}
        <div className="col-span-8 border-r-4 border-lumen-black p-4 flex items-center">
          <Link href="/" className="font-press-start text-sm hover:opacity-80 transition-opacity">
            LUMEN
          </Link>
        </div>

        {/* Right: Auth Buttons (4 columns) */}
        <div className="col-span-4 p-4 flex gap-4 items-center justify-end">
          {user ? (
            <>
              {/* User Badge */}
              <div className="font-press-start text-xs bg-lumen-black text-lumen-yellow px-3 py-2 border-2 border-lumen-black">
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
                className="px-4 py-2 bg-black text-[#FFCC00] border-2 border-black font-press-start text-xs transition-all hover:bg-[#FFCC00] hover:text-black hover:translate-y-0.5 shadow-[2px_2px_0px_#000000]"
                style={{ backgroundColor: "#000000", color: "#FFCC00", borderColor: "#000000" }}
              >
                LOGIN
              </Link>

              {/* Signup Button */}
              <Link
                href="/login?mode=signup"
                className="px-4 py-2 bg-[#FFCC00] text-black border-2 border-black font-press-start text-xs transition-all shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#FFCC00] hover:translate-y-0.5"
                style={{ backgroundColor: "#FFCC00", color: "#000000", borderColor: "#000000" }}
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
