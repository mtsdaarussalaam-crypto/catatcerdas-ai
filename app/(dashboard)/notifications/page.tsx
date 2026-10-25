'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Notification } from '@/types';
import { formatDateID, relativeTimeID } from '@/lib/finance/formatters';
import { Bell, CheckCheck, Trash2, AlertTriangle, AlertCircle, Info, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userData.user.id)
      .is('read_at', null);

    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_exceeded':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'budget_warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'bill_reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Pusat Notifikasi</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Peringatan batas anggaran, jatuh tempo tagihan, dan rekapan keuangan
          </p>
        </div>

        {notifications.some((n) => !n.read_at) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5 text-xs">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Tandai Semua Dibaca</span>
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 space-y-2">
            <Bell className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700 dark:text-gray-300">Tidak ada notifikasi baru</p>
            <p>Semua peringatan anggaran dan jadwal tagihan akan muncul di sini.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'p-4 flex items-start justify-between gap-4 transition-colors',
                !n.read_at ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-gray-50/60'
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                  {getNotificationIcon(n.notification_type)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">{n.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {relativeTimeID(n.created_at)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(n.id)}
                className="p-1 rounded-md text-gray-400 hover:text-rose-600 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
