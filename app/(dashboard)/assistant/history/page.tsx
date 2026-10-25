'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { formatDateID } from '@/lib/finance/formatters';
import { Sparkles, MessageSquare, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AssistantHistoryPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadConversations() {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data } = await supabase
          .from('ai_conversations')
          .select('*, ai_messages(count)')
          .eq('user_id', userData.user.id)
          .order('updated_at', { ascending: false });

        setConversations(data || []);
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConversations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus riwayat percakapan ini?')) return;
    try {
      await supabase.from('ai_conversations').delete().eq('id', id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Gagal menghapus.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/assistant"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Asisten AI</span>
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          Riwayat Percakapan AI
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Daftar sesi tanya jawab konsultasi keuangan yang pernah Anda lakukan
        </p>
      </div>

      <Card className="p-0 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {conversations.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Belum ada riwayat percakapan yang tersimpan.
          </div>
        ) : (
          conversations.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">{c.title}</h3>
                  <p className="text-[10px] text-gray-400">{formatDateID(c.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/assistant">
                  <Button variant="outline" size="sm" className="text-xs">
                    Buka
                  </Button>
                </Link>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
