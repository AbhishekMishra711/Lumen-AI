"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/utils/api";

export async function selectClass(selectedClass: string) {
  const validClasses = ["grinder", "scholar", "tactician"];
  if (!validClasses.includes(selectedClass)) {
    return { error: "INVALID CLASS" };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("lumen_token")?.value;
  const userJson = cookieStore.get("lumen_user")?.value;
  let user = userJson ? JSON.parse(userJson) : null;

  if (user) {
    user.selected_class = selectedClass;
    cookieStore.set("lumen_user", JSON.stringify(user), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  try {
    if (token) {
      await fetch(`${BACKEND_URL}/api/auth/class`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selected_class: selectedClass }),
      });
    }
  } catch (error) {
    console.error("Failed to update class in backend:", error);
  }

  redirect("/dashboard");
}
