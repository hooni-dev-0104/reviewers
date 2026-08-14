export function requirePublicSupabaseKey(env = process.env) {
  const key = String(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!key) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return key;
}
