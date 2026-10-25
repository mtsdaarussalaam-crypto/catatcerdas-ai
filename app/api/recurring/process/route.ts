import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTodayISODate } from '@/lib/finance/formatters';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getTodayISODate();

    // Fetch active recurring transactions where next_due_date <= today
    const { data: dueRecurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_due_date', today);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!dueRecurring || dueRecurring.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0, message: 'Tidak ada transaksi berulang yang jatuh tempo.' });
    }

    let processedCount = 0;

    for (const rec of dueRecurring) {
      // Idempotency key based on recurring ID and current due date
      const idempotencyKey = `rec_${rec.id}_${rec.next_due_date}`;

      // Check if already processed
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('idempotency_key', idempotencyKey)
        .limit(1);

      if (!existing || existing.length === 0) {
        // Create transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          account_id: rec.account_id,
          category_id: rec.category_id,
          transaction_type: rec.transaction_type,
          amount: rec.amount,
          description: rec.description,
          transaction_date: rec.next_due_date,
          payment_method: 'bank_transfer',
          source: 'recurring',
          status: 'confirmed',
          idempotency_key: idempotencyKey,
        });
        processedCount++;
      }

      // Calculate next due date based on rule
      const currDue = new Date(rec.next_due_date);
      let nextDue = new Date(currDue);

      if (rec.recurrence_rule === 'daily') {
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (rec.recurrence_rule === 'weekly') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (rec.recurrence_rule === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (rec.recurrence_rule === 'yearly') {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      const nextDueStr = nextDue.toISOString().slice(0, 10);
      const isStillActive = !rec.end_date || nextDueStr <= rec.end_date;

      await supabase
        .from('recurring_transactions')
        .update({
          next_due_date: nextDueStr,
          last_processed_date: rec.next_due_date,
          is_active: isStillActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rec.id);
    }

    return NextResponse.json({
      success: true,
      processedCount,
      message: `${processedCount} transaksi berulang berhasil diproses.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memproses transaksi berulang.' }, { status: 500 });
  }
}
