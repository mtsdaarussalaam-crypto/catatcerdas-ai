import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const importItemSchema = z.object({
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  account_id: z.string().uuid('Akun wajib valid'),
  category_id: z.string().uuid().nullable().optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'qris', 'debit_card', 'credit_card', 'e_wallet', 'other']).default('cash'),
  merchant_name: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

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
    const { rows, dryRun } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada baris data transaksi yang dikirim untuk diimpor.' },
        { status: 400 }
      );
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: 'Batas maksimum impor adalah 500 baris per batch.' },
        { status: 400 }
      );
    }

    const validRows: any[] = [];
    const errors: { row: number; error: string; data: any }[] = [];

    // Check user's accounts to verify validity
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('id, name')
      .eq('user_id', user.id);
    const validAccountIds = new Set((accounts || []).map((a) => a.id));

    // Validate each row
    rows.forEach((row, index) => {
      const parsed = importItemSchema.safeParse(row);
      if (!parsed.success) {
        errors.push({
          row: index + 1,
          error: 'Format data tidak valid: ' + Object.values(parsed.error.flatten().fieldErrors).flat().join(', '),
          data: row,
        });
        return;
      }

      if (!validAccountIds.has(parsed.data.account_id)) {
        errors.push({
          row: index + 1,
          error: 'Akun keuangan tidak ditemukan atau tidak valid.',
          data: row,
        });
        return;
      }

      validRows.push({
        ...parsed.data,
        user_id: user.id,
        source: 'import',
        status: 'confirmed',
      });
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        summary: {
          total: rows.length,
          valid: validRows.length,
          failed: errors.length,
        },
        errors,
        preview: validRows.slice(0, 10),
      });
    }

    // Insert valid rows
    if (validRows.length > 0) {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(validRows);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: rows.length,
        imported: validRows.length,
        failed: errors.length,
      },
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengimpor data transaksi.' }, { status: 500 });
  }
}
