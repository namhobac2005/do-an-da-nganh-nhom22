/**
 * supabase.client.ts
 * Shared Supabase client instances for the backend.
 *
 * - `supabase`      : anon-key client (used for auth.signInWithPassword)
 * - `supabaseAdmin` : service-role client — bypasses Row Level Security.
 *                     Required for all admin DB operations and auth.admin.* calls.
 *
 * Set SUPABASE_SERVICE_ROLE_KEY in backend/.env:
 *   Supabase Dashboard → Project Settings → API → service_role (secret) key
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

// Support both naming conventions for the service key
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY in environment variables.",
  );
}

if (!serviceKey) {
  console.error(
    "❌  SUPABASE_SERVICE_ROLE_KEY is not set.\n" +
      "    User management (create/list/delete) will fail due to RLS.\n" +
      "    Add it to backend/.env from: Supabase Dashboard → Settings → API → service_role key",
  );
}

/** Anon client — used only for auth.signInWithPassword */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Admin (service-role) client.
 * - Bypasses Row Level Security on all tables.
 * - Required for auth.admin.createUser / deleteUser / listUsers.
 * - NEVER expose this client or its key to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
