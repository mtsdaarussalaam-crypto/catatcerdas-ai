'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Mic, MicOff, Square, RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Category, FinancialAccount, Transaction } from '@/types';
import { VoiceParseResult } from '@/lib/ai/gemini';
import { formatIDR, formatDateID } from '@/lib/finance/formatters';

interface VoiceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
  categories: Category[];
  accounts: FinancialAccount[];
}

export function VoiceRecordModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  accounts,
}: VoiceRecordModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<VoiceParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Editable fields for confirmation
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editType, setEditType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [editDate, setEditDate] = useState<string>('');
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('cash');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setParsedData(null);
      setErrorMessage(null);
      setIsRecording(false);
      setIsProcessing(false);
    } else {
      stopRecording();
    }
  }, [isOpen]);

  const startRecording = () => {
    setErrorMessage(null);
    setTranscript('');
    setParsedData(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Browser Anda tidak mendukung Web Speech API. Silakan ketik ucapan Anda secara manual.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Izin mikrofon ditolak oleh browser. Mohon izinkan mikrofon di pengaturan browser.');
        } else {
          setErrorMessage('Terjadi gangguan pada mikrofon: ' + event.error);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      setErrorMessage('Tidak dapat mengaktifkan mikrofon: ' + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const processTranscription = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      setErrorMessage('Transkrip masih kosong. Silakan berbicara atau ketik ucapan Anda.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textToProcess.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses suara dengan AI.');
      }

      const result: VoiceParseResult = json.data;
      setParsedData(result);

      // Populate editable fields for review
      setEditAmount(result.amount);
      setEditDescription(result.description);
      setEditType(result.transaction_type);
      setEditDate(result.transaction_date);
      setEditPaymentMethod(result.payment_method);
      setEditAccountId(result.suggested_account_id || accounts[0]?.id || '');
      setEditCategoryId(result.suggested_category_id || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses suara.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveConfirmed = async () => {
    if (editAmount <= 0) {
      setErrorMessage('Nominal transaksi harus lebih dari 0.');
      return;
    }
    if (!editAccountId) {
      setErrorMessage('Pilih akun keuangan.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: editAccountId,
          category_id: editCategoryId || null,
          transaction_type: editType,
          amount: editAmount,
          description: editDescription.trim(),
          transaction_date: editDate,
          payment_method: editPaymentMethod,
          source: 'voice',
          status: 'confirmed',
          notes: `Dicatat melalui Suara AI: "${transcript}"`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan transaksi.');
      }

      onSuccess(json.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pencatatan Keuangan Melalui Suara"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Error Notice */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Phase 1: Recording / Speech Input */}
        {!parsedData ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
            {/* Mic Pulse Button */}
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 shadow-rose-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                }`}
              >
                {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {isRecording ? 'Mendengarkan...' : 'Tekan Mikrofon & Mulai Bicara'}
              </h4>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Contoh: &ldquo;Tadi pagi beli bensin lima puluh ribu tunai&rdquo; atau &ldquo;Makan siang dua puluh lima ribu pakai QRIS&rdquo;
              </p>
            </div>

            {/* Transcript preview / Manual fallback input */}
            <div className="w-full text-left space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Teks Ucapan (Dapat diedit manual):
              </label>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Ucapan Anda akan muncul di sini secara otomatis..."
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Parse Button */}
            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={() => processTranscription(transcript)}
                isLoading={isProcessing}
                disabled={!transcript.trim() || isRecording}
                className="flex-1 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analisis dengan AI</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Phase 2: Review & Confirmation Form */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                <strong>AI Berhasil Mengekstrak:</strong> Periksa dan sesuaikan data sebelum disimpan.
              </p>
            </div>

            {parsedData.clarification_needed && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 text-xs border border-amber-200">
                <strong>Perhatian:</strong> {parsedData.clarification_needed}
              </div>
            )}

            {/* Type & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Tipe Transaksi</label>
                <select
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nominal (Rp)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            {/* Description & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Deskripsi</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Tanggal</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Account & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Akun Keuangan</label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="">Pilih Akun</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Kategori</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="">Belum Dikategorikan</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.transaction_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParsedData(null)}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ulangi Suara</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveConfirmed}
                  isLoading={isProcessing}
                  className="gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui & Simpan</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
