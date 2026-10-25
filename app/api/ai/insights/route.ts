import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateFinancialSummary } from '@/lib/finance/calculator';
import { generateFinancialInsights } from '@/lib/ai/gemini';
import { getTodayISODate } from '@/lib/finance/formatters';

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

    const today = getTodayISODate();
    const currentMonthPrefix = today.substring(0, 7); // "YYYY-MM"

    // Fetch accounts
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Fetch transactions (past 3 months for good comparison)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, category:categories(id, name, color, icon)')
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

    const insights = await generateFinancialInsights(summary);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        insights,
      },
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Gagal menghasilkan analisis AI saat ini.' },
      { status: 500 }
    );
  }
}
