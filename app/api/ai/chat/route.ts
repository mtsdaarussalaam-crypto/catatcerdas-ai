import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateFinancialSummary } from '@/lib/finance/calculator';
import { chatWithFinancialAssistant } from '@/lib/ai/gemini';
import { getTodayISODate } from '@/lib/finance/formatters';

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

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Pesan pertanyaan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const today = getTodayISODate();
    const currentMonthPrefix = today.substring(0, 7);

    // Fetch accounts
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Fetch transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, category:categories(id, name), account:financial_accounts(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('transaction_date', { ascending: false });

    // Fetch budgets
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, category:categories(id, name)')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Fetch savings goals
    const { data: goals } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const summary = calculateFinancialSummary(
      accounts || [],
      transactions || [],
      budgets || [],
      goals || [],
      currentMonthPrefix
    );

    const recentTxList = (transactions || []).slice(0, 10).map((t) => {
      return `- ${t.transaction_date}: ${t.description} (Rp${Number(t.amount).toLocaleString(
        'id-ID'
      )}) [${t.transaction_type}] via ${t.account?.name || 'Akun'} - Kategori: ${
        t.category?.name || 'Tanpa Kategori'
      }`;
    });

    const financialContext = `
Hari Ini: ${today}
Nama Pengguna: ${user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'}
Total Saldo Semua Akun: Rp${summary.totalBalance.toLocaleString('id-ID')}
Pemasukan Bulan Ini: Rp${summary.totalIncome.toLocaleString('id-ID')}
Pengeluaran Bulan Ini: Rp${summary.totalExpense.toLocaleString('id-ID')}
Selisih Arus Kas (Net): Rp${summary.netCashFlow.toLocaleString('id-ID')}
Tingkat Tabungan: ${Math.round(summary.savingsRate)}%
Total Anggaran: Rp${summary.budgetTotal.toLocaleString('id-ID')}
Anggaran Terpakai: Rp${summary.budgetUsed.toLocaleString('id-ID')}
Sisa Anggaran: Rp${summary.budgetRemaining.toLocaleString('id-ID')}
Total Tabungan Terkumpul: Rp${summary.totalSavings.toLocaleString('id-ID')}

Daftar Akun Keuangan:
${(accounts || [])
  .map(
    (a) =>
      `- ${a.name} (${a.account_type}): Saldo Awal Rp${Number(a.opening_balance).toLocaleString(
        'id-ID'
      )}`
  )
  .join('\n')}

Daftar Target Tabungan:
${(goals || [])
  .map(
    (g) =>
      `- ${g.name}: Target Rp${Number(g.target_amount).toLocaleString(
        'id-ID'
      )}, Terkumpul: Rp${Number(g.current_amount).toLocaleString('id-ID')}`
  )
  .join('\n')}

10 Transaksi Terakhir:
${recentTxList.length > 0 ? recentTxList.join('\n') : 'Belum ada transaksi tercatat.'}
`;

    // Ensure conversation exists
    let activeConvId = conversationId;
    if (!activeConvId) {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: message.slice(0, 40) + '...',
        })
        .select('id')
        .single();
      if (newConv) {
        activeConvId = newConv.id;
      }
    }

    // Fetch existing messages in conversation
    let history: any[] = [];
    if (activeConvId) {
      const { data: prevMessages } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true })
        .limit(10);
      history = prevMessages || [];
    }

    // Call Gemini
    const reply = await chatWithFinancialAssistant(message, history, financialContext);

    // Save messages to DB if conversation exists
    if (activeConvId) {
      await supabase.from('ai_messages').insert([
        {
          conversation_id: activeConvId,
          user_id: user.id,
          role: 'user',
          content: message,
        },
        {
          conversation_id: activeConvId,
          user_id: user.id,
          role: 'assistant',
          content: reply,
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        conversationId: activeConvId,
      },
    });
  } catch (error: any) {
    if (error?.message === 'GEMINI_API_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          error:
            'Layanan AI belum dikonfigurasi. Harap tambahkan GEMINI_API_KEY pada environment variables.',
          code: 'GEMINI_KEY_MISSING',
        },
        { status: 503 }
      );
    }

    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Gagal memproses pesan dengan Asisten AI.' },
      { status: 500 }
    );
  }
}
