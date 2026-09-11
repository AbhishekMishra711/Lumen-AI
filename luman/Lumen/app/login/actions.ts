"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/utils/api";

export async function login(email: string, password: string) {
  if (!email || !password) {
    return { error: "EMAIL AND PASSWORD REQUIRED" };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { error: data.error || "INVALID CREDENTIALS" };
    }

    const cookieStore = await cookies();
    cookieStore.set("lumen_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookieStore.set("lumen_user", JSON.stringify(data.user), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (data.user?.id || data.user?._id) {
      cookieStore.set("lumen_user_id", String(data.user.id || data.user._id), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "LOGIN SERVICE UNAVAILABLE";
    return { error: msg };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  email: string,
  password: string,
  username: string
) {
  if (!email || !password || !username) {
    return { error: "ALL FIELDS REQUIRED" };
  }

  if (password.length < 6) {
    return { error: "PASSWORD MUST BE 6+ CHARS" };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        username,
        selected_class: "grinder",
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { error: data.error || "SIGNUP FAILED" };
    }

    const cookieStore = await cookies();
    cookieStore.set("lumen_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("lumen_user", JSON.stringify(data.user), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (data.user?.id || data.user?._id) {
      cookieStore.set("lumen_user_id", String(data.user.id || data.user._id), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SIGNUP SERVICE UNAVAILABLE";
    return { error: msg };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("lumen_token");
  cookieStore.delete("lumen_user");
  cookieStore.delete("lumen_user_id");

  revalidatePath("/", "layout");
  redirect("/");
}
