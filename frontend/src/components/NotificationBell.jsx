import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationsApi.js';

const POLL_MS = 30000;

function timeAgo(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      setUnread(Number(result?.unread) || 0);
    } catch {
      // The badge is optional; stay quiet if the request fails.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems((await listNotifications()) || []);
    } catch (requestError) {
      setError(requestError.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the unread count.
  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function readOne(item) {
    if (item.is_read) return;
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, is_read: true } : row)));
    setUnread((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(item.id);
    } catch {
      refreshCount();
      loadList();
    }
  }

  async function readAll() {
    setItems((current) => current.map((row) => ({ ...row, is_read: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refreshCount();
      loadList();
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="icon-button relative"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 disabled:opacity-40"
              onClick={readAll}
              disabled={unread === 0}
            >
              <CheckCheck size={14} aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
            )}
            {error && <p className="px-4 py-6 text-center text-sm text-red-600">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">You have no notifications.</p>
            )}

            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => readOne(item)}
                className={`block w-full border-b border-slate-200 border-l-4 px-4 py-3 text-left hover:bg-slate-50 ${
                  item.is_read ? 'border-l-transparent' : 'border-l-emerald-600 bg-slate-50'
                }`}
              >
                <p className={`text-sm text-slate-800 ${item.is_read ? '' : 'font-semibold'}`}>{item.title}</p>
                {item.message && <p className="mt-1 text-xs text-slate-500">{item.message}</p>}
                <p className="mt-1 text-[11px] text-slate-500">{timeAgo(item.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}