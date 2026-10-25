import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeReceiptImage } from '@/lib/ai/gemini';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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
    const { imageBase64, mimeType, fileName } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Data gambar bukti transaksi tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Allowed mime types
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah format JPG, JPEG, PNG, atau WEBP.' },
        { status: 400 }
      );
    }

    // Size limit check (base64 string length <= ~14MB which corresponds to ~10MB file)
    if (imageBase64.length > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Batas maksimum adalah 10MB.' },
        { status: 400 }
      );
    }

    // Fetch user categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .eq('is_archived', false);

    // Call Gemini Multimodal OCR
    const extractedData = await analyzeReceiptImage(
      imageBase64,
      mimeType,
      categories || []
    );

    // Check potential duplicate in user's transactions
    let potentialDuplicate = false;
    let duplicateMatch = null;

    if (extractedData.total_amount > 0 && extractedData.transaction_date) {
      const { data: existingTxs } = await supabase
        .from('transactions')
        .select('id, description, amount, transaction_date, merchant_name, status')
        .eq('user_id', user.id)
        .eq('amount', extractedData.total_amount)
        .eq('transaction_date', extractedData.transaction_date)
        .limit(1);

      if (existingTxs && existingTxs.length > 0) {
        potentialDuplicate = true;
        duplicateMatch = existingTxs[0];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...extractedData,
        potential_duplicate: potentialDuplicate,
        duplicate_match: duplicateMatch,
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

    console.error('Error analyzing receipt:', error);
    return NextResponse.json(
      {
        error:
          'Gagal menganalisis struk belanja dengan AI. Pastikan foto struk terlihat jelas dan coba kembali.',
      },
      { status: 500 }
    );
  }
}
