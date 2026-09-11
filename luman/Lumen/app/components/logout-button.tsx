"use client";

import { logout } from "@/app/login/actions";

export default function LogoutButton() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-black text-[#FFCC00] border-2 border-black font-press-start text-xs transition-all hover:bg-[#FFCC00] hover:text-black hover:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_#000000]"
      style={{ backgroundColor: "#000000", color: "#FFCC00", borderColor: "#000000" }}
    >
      LOGOUT
    </button>
  );
}
