import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatDateID, formatIDR } from '@/lib/finance/formatters';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('transactions')
      .select('*, account:financial_accounts!account_id(name), category:categories(name)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (format === 'json') {
      return NextResponse.json({ success: true, data: transactions });
    }

    // CSV format
    const headers = [
      'ID',
      'Tanggal',
      'Deskripsi',
      'Tipe',
      'Kategori',
      'Akun',
      'Nominal',
      'Metode Pembayaran',
      'Merchant/Toko',
      'Sumber',
      'Status',
      'Catatan',
    ];

    const rows = (transactions || []).map((t) => [
      t.id,
      t.transaction_date,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.transaction_type === 'income' ? 'Pemasukan' : t.transaction_type === 'expense' ? 'Pengeluaran' : 'Transfer',
      `"${(t.category?.name || '').replace(/"/g, '""')}"`,
      `"${(t.account?.name || '').replace(/"/g, '""')}"`,
      Number(t.amount) || 0,
      t.payment_method || 'cash',
      `"${(t.merchant_name || '').replace(/"/g, '""')}"`,
      t.source || 'manual',
      t.status || 'confirmed',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 Indonesian accents cleanly
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const fileName = `catatcerdas_transaksi_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengekspor data transaksi.' }, { status: 500 });
  }
}
