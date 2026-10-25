import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  transaction_type: z.enum(['income', 'expense', 'transfer']).optional(),
  amount: z.number().positive('Nominal transaksi harus lebih dari 0').optional(),
  description: z.string().min(1, 'Deskripsi transaksi wajib diisi').optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'qris', 'debit_card', 'credit_card', 'e_wallet', 'other']).optional(),
  merchant_name: z.string().nullable().optional(),
  status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  transfer_target_account_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const { data: tx, error } = await supabase
      .from('transactions')
      .select('*, account:financial_accounts!account_id(id, name, account_type, color), target_account:financial_accounts!transfer_target_account_id(id, name, account_type, color), category:categories(id, name, icon, color), attachments(*), receipt_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tx });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil detail transaksi.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const validated = updateSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { data: updatedTx, error: updateError } = await supabase
      .from('transactions')
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, account:financial_accounts!account_id(id, name, account_type, color), target_account:financial_accounts!transfer_target_account_id(id, name, account_type, color), category:categories(id, name, icon, color)')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedTx });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memperbarui transaksi.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    // Delete transaction (Row Level Security ensures only owner's transaction is deleted)
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus transaksi.' }, { status: 500 });
  }
}
