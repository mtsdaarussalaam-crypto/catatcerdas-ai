'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Transaction } from '@/types';
import { formatIDR, formatDateLongID } from '@/lib/finance/formatters';
import {
  ArrowLeft,
  Calendar,
  Wallet,
  Tag,
  CreditCard,
  Store,
  FileText,
  Trash2,
  Edit2,
  Paperclip,
  ArrowRightLeft,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadTx() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/transactions/${id}`);
        if (res.ok) {
          const json = await res.json();
          setTransaction(json.data);

          // If attachment present, fetch signed URL
          if (json.data?.attachments && json.data.attachments.length > 0) {
            const path = json.data.attachments[0].storage_path;
            const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
            if (data?.signedUrl) {
              setSignedImageUrl(data.signedUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching tx:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadTx();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/transactions');
      } else {
        alert('Gagal menghapus transaksi.');
      }
    } catch {
      alert('Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
        <h2 className="text-base font-bold text-gray-700">Transaksi tidak ditemukan</h2>
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            Kembali ke Riwayat Transaksi
          </Button>
        </Link>
      </div>
    );
  }

  const isIncome = transaction.transaction_type === 'income';
  const isTransfer = transaction.transaction_type === 'transfer';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Transaksi</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/transactions/${id}/edit`)}
            className="gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </Button>
        </div>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        {/* Header Hero */}
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Badge
            variant={isIncome ? 'emerald' : isTransfer ? 'blue' : 'rose'}
            className="mb-2 uppercase text-[10px] tracking-wider font-extrabold"
          >
            {isIncome ? 'Pemasukan' : isTransfer ? 'Transfer Antar-Akun' : 'Pengeluaran'}
          </Badge>
          <h1
            className={`text-3xl font-black ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : isTransfer
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}
            {formatIDR(transaction.amount)}
          </h1>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
            {transaction.description}
          </p>
        </div>

        {/* Details list */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Tanggal</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatDateLongID(transaction.transaction_date)}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-gray-500">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>{isTransfer ? 'Dari Akun' : 'Akun Keuangan'}</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {transaction.account?.name || '-'}
            </span>
          </div>

          {isTransfer && transaction.target_account && (
            <div className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2 text-gray-500">
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                <span>Ke Akun Tujuan</span>
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {transaction.target_account.name}
              </span>
            </div>
          )}

          {!isTransfer && (
            <div className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2 text-gray-500">
                <Tag className="w-4 h-4 text-gray-400" />
                <span>Kategori</span>
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {transaction.category?.name || 'Tanpa Kategori'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-gray-500">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span>Metode Pembayaran</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 uppercase">
              {transaction.payment_method.replace('_', ' ')}
            </span>
          </div>

          {transaction.merchant_name && (
            <div className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2 text-gray-500">
                <Store className="w-4 h-4 text-gray-400" />
                <span>Merchant / Toko</span>
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {transaction.merchant_name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-gray-500">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Sumber Pencatatan</span>
            </span>
            <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">
              {transaction.source === 'voice'
                ? 'Suara AI'
                : transaction.source === 'photo'
                ? 'Scan Struk AI'
                : transaction.source === 'recurring'
                ? 'Berulang'
                : transaction.source === 'import'
                ? 'Impor CSV'
                : 'Manual'}
            </span>
          </div>

          {transaction.notes && (
            <div className="py-3">
              <span className="text-gray-500 block mb-1">Catatan:</span>
              <p className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 italic">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Receipt items list */}
        {transaction.receipt_items && transaction.receipt_items.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Rincian Item Struk ({transaction.receipt_items.length})
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs">
              {transaction.receipt_items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <span>
                    {it.item_name} {Number(it.quantity) > 1 && `(x${it.quantity})`}
                  </span>
                  <span className="font-bold">{formatIDR(it.total_price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt photo preview */}
        {signedImageUrl && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Foto Bukti Transaksi</span>
            </h3>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-72 bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedImageUrl}
                alt="Bukti transaksi"
                className="max-h-72 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
