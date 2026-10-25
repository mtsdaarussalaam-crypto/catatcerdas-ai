'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FinancialAccount, Category } from '@/types';
import { formatIDR } from '@/lib/finance/formatters';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function ImportExportPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState('');

  // File import state
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewSummary, setPreviewSummary] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadMeta() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true);
      if (accs) {
        setAccounts(accs);
        if (accs[0]) setDefaultAccountId(accs[0].id);
      }

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false);
      if (cats) setCategories(cats);
    }
    loadMeta();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStatusMessage(null);
    setPreviewSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selected);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setStatusMessage({ type: 'error', text: 'File CSV kosong atau tidak memiliki baris data.' });
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 4) continue;

      // Extract date, description, type, amount
      const date = cols[0] || new Date().toISOString().slice(0, 10);
      const desc = cols[1] || 'Transaksi Impor';
      const rawType = (cols[2] || '').toLowerCase();
      const type = rawType.includes('pemasukan') || rawType === 'income' ? 'income' : 'expense';
      const amount = parseFloat(cols[3].replace(/[^0-9.]/g, '')) || 0;

      rows.push({
        transaction_date: date,
        description: desc,
        transaction_type: type,
        amount,
        account_id: defaultAccountId || accounts[0]?.id,
        payment_method: 'cash',
        notes: 'Diimpor dari file CSV',
      });
    }

    setParsedRows(rows);
    setPreviewSummary({
      total: rows.length,
      sample: rows.slice(0, 5),
    });
  };

  const handleImportExecute = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows.map((r) => ({
            ...r,
            account_id: defaultAccountId || r.account_id,
          })),
          dryRun: false,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengimpor.');

      setStatusMessage({
        type: 'success',
        text: `Berhasil mengimpor ${json.summary.imported} transaksi baru ke database!`,
      });
      setFile(null);
      setParsedRows([]);
      setPreviewSummary(null);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mengimpor transaksi.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const sample = `Tanggal,Deskripsi,Tipe,Nominal\r\n2026-10-25,Belanja Sayur,Pengeluaran,50000\r\n2026-10-25,Gaji Bulanan,Pemasukan,5000000\r\n2026-10-24,Beli Bensin,Pengeluaran,35000`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contoh_format_impor_catatcerdas.csv';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          Impor & Ekspor Data Keuangan
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Migrasikan data transaksi Anda dari spreadsheet atau unduh cadangan laporan lengkap
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid Cards: Import & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Ekspor Data</h3>
              <p className="text-xs text-gray-400">Unduh seluruh riwayat keuangan Anda</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Format file CSV kompatibel dengan Microsoft Excel, Google Sheets, dan Apple Numbers dengan format lokal Indonesia.
          </p>

          <div className="pt-2">
            <a href="/api/exports?format=csv" target="_blank" className="block">
              <Button variant="primary" className="w-full gap-2 text-xs">
                <Download className="w-4 h-4" />
                <span>Unduh File CSV Lengkap</span>
              </Button>
            </a>
          </div>
        </Card>

        {/* Template Sample Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Contoh Format CSV</h3>
              <p className="text-xs text-gray-400">Gunakan template resmi untuk impor</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Pastikan kolom CSV berisi: <strong>Tanggal (YYYY-MM-DD), Deskripsi, Tipe (Pemasukan/Pengeluaran), Nominal</strong>.
          </p>

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={downloadSampleCSV}
              className="w-full gap-2 text-xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Unduh Template CSV</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Import Section */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Unggah Berkas CSV untuk Diimpor
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Periksa pratinjau data sebelum konfirmasi penyimpanan permanen ke database
          </p>
        </div>

        {/* Account Selector for Imported Txs */}
        <div className="max-w-xs space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Masukkan ke Akun Keuangan:
          </label>
          <select
            value={defaultAccountId}
            onChange={(e) => setDefaultAccountId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-xs font-semibold"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.account_type})
              </option>
            ))}
          </select>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-gray-50/50 dark:bg-gray-800/20">
          <Upload className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {file ? file.name : 'Pilih file CSV dari komputer Anda'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Maksimum 500 baris per batch impor</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 text-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Pilih Berkas CSV</span>
          </Button>
        </div>

        {/* Preview Summary */}
        {previewSummary && (
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                Pratinjau Data: {previewSummary.total} baris ditemukan
              </span>
              <span className="text-gray-400 text-[11px]">Menampilkan 5 baris pertama</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Deskripsi</th>
                    <th className="p-2.5">Tipe</th>
                    <th className="p-2.5 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {previewSummary.sample.map((row: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5">{row.transaction_date}</td>
                      <td className="p-2.5 font-medium">{row.description}</td>
                      <td className="p-2.5 capitalize">{row.transaction_type}</td>
                      <td className="p-2.5 text-right font-bold">{formatIDR(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setPreviewSummary(null);
                }}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImportExecute}
                isLoading={isProcessing}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Konfirmasi & Simpan {previewSummary.total} Transaksi</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
