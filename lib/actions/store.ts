// lib/actions/store.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { SessionManager } from '@/lib/engine/SessionManager';
import { revalidatePath } from 'next/cache';

const BUNDLE_MAP: Record<string, { sfpAmount: number; bonusSfp: number; priceNgn: number }> = {
  starter_pack: { sfpAmount: 1000, bonusSfp: 0, priceNgn: 1000 },
  pro_pack: { sfpAmount: 5000, bonusSfp: 500, priceNgn: 4500 },
  whale_pack: { sfpAmount: 15000, bonusSfp: 3000, priceNgn: 12000 },
};

export async function verifyAndCreditPaystackPurchase(reference: string, bundleId: string) {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const bundle = BUNDLE_MAP[bundleId];
  if (!bundle) {
    return { success: false, error: 'Invalid store bundle selected' };
  }

  // 2. Verify payment status directly with Paystack API
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return { success: false, error: 'Server payment configuration missing' };
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      'Content-Type': 'application/json',
    },
  });

  const verifyData = await verifyRes.json();

  if (!verifyRes.ok || !verifyData.status || verifyData.data.status !== 'success') {
    return { success: false, error: 'Payment verification failed or unconfirmed' };
  }

  // 3. Ensure expected amount was paid (Paystack amounts are in Kobo: ₦1 = 100 kobo)
  const expectedKobo = bundle.priceNgn * 100;
  if (verifyData.data.amount < expectedKobo) {
    return { success: false, error: 'Transaction amount mismatch' };
  }

  // 4. Credit SFP to user wallet using atomic idempotency key
  const totalSfp = bundle.sfpAmount + bundle.bonusSfp;
  const idempotencyKey = `paystack:ref:${reference}`;

  const { data: creditResult, error: creditError } = await supabase.rpc('credit_sfp_reward', {
    p_user_id: user.id,
    p_amount: totalSfp,
    p_reason: `SFP Store Top-Up (${bundleId})`,
    p_idempotency_key: idempotencyKey,
  });

  if (creditError) {
    return { success: false, error: 'Failed to credit wallet' };
  }

  revalidatePath('/store');

  return {
    success: true,
    sfpCredited: totalSfp,
    transactionId: creditResult,
  };
}
