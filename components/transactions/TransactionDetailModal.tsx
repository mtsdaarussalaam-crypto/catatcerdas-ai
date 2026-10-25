'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Transaction } from '@/types';
import { formatIDR, formatDateLongID } from '@/lib/finance/formatters';
import {
  Calendar,
  Wallet,
  Tag,
  CreditCard,
  Store,
  FileText,
  Trash2,
  Edit2,
  Mic,
  Camera,
  Repeat,
  FileSpreadsheet,
  ArrowRightLeft,
  Paperclip,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit: (tx: Transaction) => void;
  onDeleteSuccess: (txId: string) => void;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDeleteSuccess,
}: TransactionDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const supabase = createClient();

  React.useEffect(() => {
    // If transaction has attachment, fetch signed URL
    async function loadSignedUrl() {
      if (transaction?.attachments && transaction.attachments.length > 0) {
        const path = transaction.attachments[0].storage_path;
        const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
        if (data?.signedUrl) {
          setSignedImageUrl(data.signedUrl);
        }
      } else {
        setSignedImageUrl(null);
      }
    }

    if (isOpen && transaction) {
      loadSignedUrl();
      setShowConfirmDelete(false);
    }
  }, [isOpen, transaction]);

  if (!transaction) return null;

  const isIncome = transaction.transaction_type === 'income';
  const isTransfer = transaction.transaction_type === 'transfer';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal menghapus transaksi.');
      }
      onDeleteSuccess(transaction.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Transaksi" maxWidth="md">
      <div className="space-y-5">
        {/* Header Amount & Type */}
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Badge
            variant={isIncome ? 'emerald' : isTransfer ? 'blue' : 'rose'}
            className="mb-2 uppercase text-[10px] tracking-wider font-extrabold"
          >
            {isIncome ? 'Pemasukan' : isTransfer ? 'Transfer Antar-Akun' : 'Pengeluaran'}
          </Badge>
          <h2
            className={`text-2xl font-black ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : isTransfer
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}
            {formatIDR(transaction.amount)}
          </h2>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
            {transaction.description}
          </p>
        </div>

        {/* Info Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Tanggal</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatDateLongID(transaction.transaction_date)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-gray-500">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>{isTransfer ? 'Dari Akun' : 'Akun Keuangan'}</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {transaction.account?.name || '-'}
            </span>
          </div>

          {isTransfer && transaction.target_account && (
            <div className="flex items-center justify-between py-2.5">
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
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-gray-500">
                <Tag className="w-4 h-4 text-gray-400" />
                <span>Kategori</span>
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {transaction.category?.name || 'Tanpa Kategori'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-gray-500">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span>Metode Pembayaran</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 uppercase">
              {transaction.payment_method.replace('_', ' ')}
            </span>
          </div>

          {transaction.merchant_name && (
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-gray-500">
                <Store className="w-4 h-4 text-gray-400" />
                <span>Merchant / Toko</span>
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {transaction.merchant_name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-2.5">
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
                ? 'Jadwal Berulang'
                : transaction.source === 'import'
                ? 'Impor CSV'
                : 'Manual'}
            </span>
          </div>

          {transaction.notes && (
            <div className="py-2.5">
              <span className="text-gray-500 block mb-1">Catatan:</span>
              <p className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 italic">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Receipt items list */}
        {transaction.receipt_items && transaction.receipt_items.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Daftar Rincian Struk ({transaction.receipt_items.length} item)
            </h4>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs">
              {transaction.receipt_items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <span className="text-gray-700 dark:text-gray-300">
                    {it.item_name} {Number(it.quantity) > 1 && `(x${it.quantity})`}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatIDR(it.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attached photo preview (signed URL) */}
        {signedImageUrl && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Foto Bukti Transaksi</span>
            </h4>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-56 bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedImageUrl}
                alt="Bukti transaksi"
                className="max-h-56 w-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Confirm Delete prompt */}
        {showConfirmDelete && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
              Konfirmasi Penghapusan Transaksi
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              Apakah Anda yakin ingin menghapus transaksi ini? Perubahan saldo akan disesuaikan kembali secara otomatis.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Ya, Hapus Permanen
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        {!showConfirmDelete && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowConfirmDelete(true)}
              className="gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(transaction);
                }}
                className="gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Transaksi</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
