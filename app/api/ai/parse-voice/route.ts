import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseVoiceTranscription } from '@/lib/ai/gemini';

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
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return NextResponse.json(
        { error: 'Transkrip suara tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Rate-limiting check / length limit (max 1000 chars)
    if (transcript.length > 1000) {
      return NextResponse.json(
        { error: 'Transkrip suara melebihi batas panjang maksimum.' },
        { status: 400 }
      );
    }

    // Fetch user categories (system + user owned)
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .eq('is_archived', false);

    // Fetch user accounts
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const parsedResult = await parseVoiceTranscription(
      transcript.trim(),
      categories || [],
      accounts || []
    );

    return NextResponse.json({
      success: true,
      data: parsedResult,
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

    console.error('Error parsing voice transcript:', error);
    return NextResponse.json(
      { error: 'Gagal memproses suara dengan AI. Silakan coba kembali atau gunakan input manual.' },
      { status: 500 }
    );
  }
}
