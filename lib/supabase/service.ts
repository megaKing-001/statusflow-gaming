import 'server-only';
import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY. The `server-only` import above makes Next.js throw a
// build error if any Client Component or client-bundled module ever
// imports this file, even indirectly. This client bypasses Row Level
// Security entirely — it is the only thing allowed to call our
// service_role-only RPCs (create_football_match,
// join_and_settle_football_match, cancel_football_match,
// play_football_solo_wager, credit_sfp_reward). Never use it for
// general queries, never return it, never log its output verbatim.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
