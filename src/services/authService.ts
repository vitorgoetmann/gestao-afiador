import { supabase } from '@/lib/supabase';

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error('Sessão inválida. Entre novamente no sistema.');
  return data.user.id;
}

export type SignUpInput = {
  username: string;
  email: string;
  password: string;
};

export async function signUp({ username, email, password }: SignUpInput) {
  const safeEmail = email.trim().toLowerCase();
  const safeUsername = username.trim();
  const { data, error } = await supabase.auth.signUp({
    email: safeEmail,
    password,
    options: {
      data: { username: safeUsername },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(input: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
