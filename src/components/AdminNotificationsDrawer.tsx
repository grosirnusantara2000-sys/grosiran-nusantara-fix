import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  X,
  CheckCheck,
  ShoppingBag,
  FileQuestion,
  CreditCard,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AdminNotificationsDrawer: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    isNotificationOpen,
    setIsNotificationOpen,
    setCurrentView,
    setSelectedInvoiceId,
  } = useApp();

  if (!isNotificationOpen) return null;

  const handleNotificationClick = async (notif: (typeof notifications)[0]) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }

    if (notif.type === 'order' || notif.type === 'payment') {
      setCurrentView('admin');
      setIsNotificationOpen(false);
    } else if (notif.type === 'request') {
      setCurrentView('admin');
      setIsNotificationOpen(false);
    }
  };

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.isRead) {
        await markNotificationAsRead(n.id);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-blue-900" />;
      case 'request':
        return <Sparkles className="w-4 h-4 text-purple-700" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-700" />;
      default:
        return <Bell className="w-4 h-4 text-orange-600" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Notifikasi Admin</h3>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white font-mono-nums text-[10px] font-bold">
                    {unreadNotificationCount} Baru
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Pembaruan pesanan, bukti transfer & request barang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-200/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-medium">Semua Dibaca</span>
              </button>
            )}
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live sync badge */}
        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Sinkronisasi Real-Time Cloud Aktif</span>
          </div>
          <span className="text-[10px] text-emerald-700">Audio chime enabled</span>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Bell className="w-10 h-10 mb-2 stroke-1 opacity-50" />
              <p className="text-xs font-semibold text-slate-600">Belum ada notifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pesanan baru atau request barang dari pelanggan akan muncul di sini secara real-time.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-xl transition-all cursor-pointer mb-1 border ${
                  notif.isRead
                    ? 'bg-white border-transparent hover:bg-slate-50'
                    : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.isRead ? 'bg-slate-100' : 'bg-white shadow-2xs border border-blue-100'
                    }`}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs ${
                          notif.isRead ? 'font-semibold text-slate-800' : 'font-extrabold text-blue-900'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-mono-nums">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(notif.createdAt)}</span>
                      {notif.referenceId && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-slate-500 uppercase">
                            {notif.referenceId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setCurrentView('admin');
              setIsNotificationOpen(false);
            }}
            className="text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Dashboard Admin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono-nums">
            {notifications.length} Total Log
          </span>
        </div>
      </div>
    </div>
  );
};
