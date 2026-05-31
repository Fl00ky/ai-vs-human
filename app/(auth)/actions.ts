"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  side: z.enum(["ai", "human"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    side: formData.get("side"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, username, side } = parsed.data;
  const supabase = await createClient();

  // Sign up via Supabase Auth
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, side },
    },
  });

  if (signupError) {
    return { ok: false, error: signupError.message };
  }

  if (!signupData.user) {
    return { ok: false, error: "Signup failed: no user returned" };
  }

  // Create profile row
  const { error: profileError } = await supabase.from("profiles").insert({
    id: signupData.user.id,
    username,
    side,
    total_score: 0,
  });

  if (profileError) {
    // Username taken or other constraint
    return { ok: false, error: profileError.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid email or password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
