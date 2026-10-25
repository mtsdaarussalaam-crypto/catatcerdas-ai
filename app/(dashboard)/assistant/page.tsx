'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Send, Trash2, ShieldCheck, User, Bot, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AIMessage } from '@/types';
import Link from 'next/link';

const QUICK_PROMPTS = [
  'Berapa total pengeluaran saya bulan ini?',
  'Kategori apa yang paling banyak menghabiskan uang?',
  'Bandingkan pengeluaran bulan ini dengan bulan lalu.',
  'Beri saran realistis supaya saya bisa lebih hemat.',
  'Apakah pengeluaran saya lebih besar daripada pemasukan?',
  'Berapa sisa anggaran yang masih bisa saya gunakan?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadLatestConversation() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: convs } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (convs && convs.length > 0) {
        setConversationId(convs[0].id);

        const { data: msgs } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', convs[0].id)
          .order('created_at', { ascending: true });

        if (msgs) setMessages(msgs);
      }
    }
    loadLatestConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setErrorMessage(null);

    // Optimistically add user message
    const userMsg: AIMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: conversationId || '',
      user_id: '',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses pesan dengan AI.');
      }

      if (json.data?.conversationId && !conversationId) {
        setConversationId(json.data.conversationId);
      }

      const assistantMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: json.data?.conversationId || conversationId || '',
        user_id: '',
        role: 'assistant',
        content: json.data.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan pada layanan AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (!confirm('Hapus seluruh riwayat percakapan dengan Asisten AI?')) return;

    try {
      await supabase.from('ai_conversations').delete().eq('id', conversationId);
      setMessages([]);
      setConversationId(null);
    } catch (err) {
      alert('Gagal menghapus percakapan.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 flex flex-col h-[calc(100vh-140px)]">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Asisten Keuangan AI</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase">
                Gemini 3.8
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Analisis cerdas berbasis data mutasi keuangan riil Anda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Riwayat</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Chat Box */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border border-gray-100 dark:border-gray-800">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Ada yang bisa saya bantu dengan keuangan Anda?
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Saya dapat menganalisis kebiasaan belanja Anda, membandingkan pengeluaran bulanan, dan memberi saran penghematan.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-1.5 text-left pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Pertanyaan Populer:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p)}
                      className="text-left text-xs p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors border border-gray-100 dark:border-gray-800"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-teal-600 text-white shadow-sm'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-gray-100 dark:bg-gray-800 text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1">Asisten AI sedang menganalisis data keuangan Anda...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 mx-4 mb-2 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan analisis keuangan Anda..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Privacy Note */}
          <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>
              Asisten AI hanya menganalisis ringkasan angka Anda. AI tidak memiliki izin melakukan transaksi perbankan.
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
