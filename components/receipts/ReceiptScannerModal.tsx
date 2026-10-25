'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Camera, Upload, Sparkles, Check, AlertTriangle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Category, FinancialAccount, Transaction } from '@/types';
import { ReceiptAnalyzeResult } from '@/lib/ai/gemini';
import { formatIDR, formatDateID } from '@/lib/finance/formatters';
import { createClient } from '@/lib/supabase/client';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
  categories: Category[];
  accounts: FinancialAccount[];
}

export function ReceiptScannerModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  accounts,
}: ReceiptScannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<(ReceiptAnalyzeResult & { potential_duplicate?: boolean; duplicate_match?: any }) | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields
  const [merchantName, setMerchantName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [transactionDate, setTransactionDate] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [items, setItems] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setExtractedData(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Format berkas tidak didukung. Harap pilih foto JPG, PNG, atau WEBP.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file foto melebihi batas 10MB.');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview || !selectedFile) {
      setErrorMessage('Pilih atau ambil foto struk terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // Extract base64 without prefix
      const base64Data = imagePreview.split(',')[1];

      const res = await fetch('/api/ai/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal membaca struk belanja.');
      }

      const data = json.data;
      setExtractedData(data);

      // Populate form
      setMerchantName(data.merchant_name || '');
      setTotalAmount(data.total_amount || 0);
      setTransactionDate(data.transaction_date || new Date().toISOString().slice(0, 10));
      setCategoryId(data.suggested_category_id || '');
      setPaymentMethod(data.payment_method || 'cash');
      setItems(data.items || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menganalisis struk belanja.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (totalAmount <= 0) {
      setErrorMessage('Nominal total transaksi harus lebih dari 0.');
      return;
    }
    if (!accountId) {
      setErrorMessage('Pilih akun pembayaran.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 1. Create transaction in DB
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          category_id: categoryId || null,
          transaction_type: 'expense',
          amount: totalAmount,
          description: merchantName ? `Belanja di ${merchantName}` : 'Belanja Struk',
          transaction_date: transactionDate,
          payment_method: paymentMethod,
          merchant_name: merchantName || null,
          source: 'photo',
          status: 'confirmed',
          items: items.map((i) => ({
            item_name: i.item_name,
            quantity: Number(i.quantity) || 1,
            unit_price: Number(i.unit_price) || 0,
            total_price: Number(i.total_price) || 0,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan transaksi.');
      }

      const createdTx = json.data;

      // 2. Upload photo to private Supabase Storage if user attached file
      if (selectedFile && createdTx) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const fileExt = selectedFile.name.split('.').pop() || 'jpg';
          const filePath = `${userData.user.id}/${createdTx.id}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadError) {
            // Save attachment record
            await supabase.from('attachments').insert({
              user_id: userData.user.id,
              transaction_id: createdTx.id,
              storage_path: filePath,
              mime_type: selectedFile.type,
              file_size: selectedFile.size,
              original_filename: selectedFile.name,
            });
          }
        }
      }

      onSuccess(createdTx);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Struk & Nota Belanja (AI OCR)"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Phase 1: Upload / Capture Picture */}
        {!extractedData ? (
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-72 flex items-center justify-center bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Pratinjau Struk"
                  className="max-h-72 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50 dark:bg-gray-800/40">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Ambil Foto atau Pilih Gambar Struk
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Mendukung struk belanja, nota restoran, kuitansi, atau bukti transfer (JPG, PNG, WEBP maks 10MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Buka Kamera</span>
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih dari Galeri</span>
                  </Button>
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={onClose} disabled={isAnalyzing}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  isLoading={isAnalyzing}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ekstrak Data dengan AI</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Phase 2: Review & Edit Form */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Duplicate Warning */}
            {extractedData.potential_duplicate && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 text-xs border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Peringatan Potensi Duplikat:</strong> Ditemukan transaksi yang mirip pada tanggal{' '}
                  {formatDateID(extractedData.duplicate_match?.transaction_date)} sebesar{' '}
                  {formatIDR(extractedData.duplicate_match?.amount)}. Mohon periksa kembali sebelum menyimpan.
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span>
                <strong>Tingkat Keyakinan AI:</strong> {Math.round(extractedData.confidence * 100)}%
              </span>
              <span className="text-gray-500">{extractedData.notes}</span>
            </div>

            {/* Merchant & Total */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Merchant / Toko</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Total Pembayaran (Rp)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm font-bold text-emerald-600"
                />
              </div>
            </div>

            {/* Date & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Akun Pembayaran</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
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
            </div>

            {/* Category & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="cash">Tunai</option>
                  <option value="qris">QRIS</option>
                  <option value="debit_card">Kartu Debit</option>
                  <option value="credit_card">Kartu Kredit</option>
                  <option value="e_wallet">E-Wallet</option>
                  <option value="bank_transfer">Transfer Bank</option>
                </select>
              </div>
            </div>

            {/* Item Breakdown (if any) */}
            {items.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Rincian Barang yang Dibeli ({items.length} item)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-none">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {it.item_name} (x{it.quantity})
                      </span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {formatIDR(it.total_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtractedData(null)}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Foto Ulang</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAndSave}
                  isLoading={isSaving}
                  className="gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi & Simpan</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
