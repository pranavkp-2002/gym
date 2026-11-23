"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { ApiError, authApi } from "@/lib/api";
import { clearSession, setSession } from "@/lib/session";
import { safeNextPath } from "@/lib/session-cookie";

export type AuthFormState = { error?: string; values?: { name?: string; email?: string } };

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const { token } = await authApi.login({ email, password });
    await setSession(token);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message, values: { email } };
    throw err;
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirmPassword") ?? "")) {
    return { error: "Passwords don't match", values: { name, email } };
  }
  try {
    const { token } = await authApi.register({ name, email, password });
    await setSession(token);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message, values: { name, email } };
    throw err;
  }
  redirect("/");
}

/** Clears the cookie. The caller does a full page load so no client state survives. */
export async function logout() {
  await clearSession();
}

export type SettingsFormState = { error?: string; success?: string; attempt?: number };

export async function updateProfile(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  try {
    await authApi.updateMe({ name, email });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message, attempt: Date.now() };
    throw err;
  }
  refresh();
  return { success: "Profile updated" };
}

export async function changePassword(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword !== String(formData.get("confirmPassword") ?? "")) {
    return { error: "New passwords don't match" };
  }
  try {
    await authApi.changePassword({ currentPassword, newPassword });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
  return { success: "Password changed" };
}
