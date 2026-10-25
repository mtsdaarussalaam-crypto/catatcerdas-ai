import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const transactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Nominal transaksi harus lebih dari 0'),
  description: z.string().min(1, 'Deskripsi transaksi wajib diisi'),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  payment_method: z.enum(['cash', 'bank_transfer', 'qris', 'debit_card', 'credit_card', 'e_wallet', 'other']).default('cash'),
  merchant_name: z.string().nullable().optional(),
  source: z.enum(['manual', 'voice', 'photo', 'recurring', 'import']).default('manual'),
  status: z.enum(['draft', 'confirmed', 'cancelled']).default('confirmed'),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  transfer_target_account_id: z.string().uuid().nullable().optional(),
  items: z.array(z.object({
    item_name: z.string(),
    quantity: z.number().default(1),
    unit_price: z.number().default(0),
    total_price: z.number().default(0),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const paymentMethod = searchParams.get('paymentMethod');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('transactions')
      .select('*, account:financial_accounts!account_id(id, name, account_type, color), target_account:financial_accounts!transfer_target_account_id(id, name, account_type, color), category:categories(id, name, icon, color), attachments(*), receipt_items(*)', { count: 'exact' })
      .eq('user_id', user.id);

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }
    if (type) {
      query = query.eq('transaction_type', type);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (accountId) {
      query = query.or(`account_id.eq.${accountId},transfer_target_account_id.eq.${accountId}`);
    }
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    if (minAmount) {
      query = query.gte('amount', Number(minAmount));
    }
    if (maxAmount) {
      query = query.lte('amount', Number(maxAmount));
    }
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }
    if (source) {
      query = query.eq('source', source);
    }

    query = query
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Gagal mengambil data transaksi.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const validated = transactionSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Data formulir tidak valid', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { items, ...txData } = validated.data;

    // Transfer validation: source and destination cannot be the same
    if (txData.transaction_type === 'transfer') {
      if (!txData.transfer_target_account_id) {
        return NextResponse.json(
          { error: 'Akun tujuan transfer wajib dipilih.' },
          { status: 400 }
        );
      }
      if (txData.account_id === txData.transfer_target_account_id) {
        return NextResponse.json(
          { error: 'Akun asal dan akun tujuan transfer tidak boleh sama.' },
          { status: 400 }
        );
      }
    }

    // Insert transaction
    const { data: newTx, error: insertError } = await supabase
      .from('transactions')
      .insert({
        ...txData,
        user_id: user.id,
      })
      .select('*, account:financial_accounts!account_id(id, name, account_type, color), target_account:financial_accounts!transfer_target_account_id(id, name, account_type, color), category:categories(id, name, icon, color)')
      .single();

    if (insertError) {
      console.error('Error creating transaction:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Insert receipt items if present
    if (items && items.length > 0 && newTx) {
      const itemsToInsert = items.map((item) => ({
        user_id: user.id,
        transaction_id: newTx.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      await supabase.from('receipt_items').insert(itemsToInsert);
    }

    return NextResponse.json({
      success: true,
      data: newTx,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Gagal menyimpan transaksi.' }, { status: 500 });
  }
}
