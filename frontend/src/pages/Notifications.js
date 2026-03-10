import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatDateShort } from '../lib/utils';
import { 
  Loader2, Inbox, Check, CheckCheck, XCircle, Bell
} from 'lucide-react';

export default function Notifications() {
  const { getAbsenceFeed, markNotificationRead } = useDashboard();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const feed = await getAbsenceFeed();
      setNotifications(feed);
    } catch (error) { console.error('Error loading notifications:', error); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {}
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try { await markNotificationRead(n.id); } catch (e) {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" /></div>);
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="notifications-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meldingen</h1>
          <p className="text-slate-500 mt-1">Afwezigheidsmeldingen en andere notificaties</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} data-testid="mark-all-read-btn">
            <CheckCheck className="w-4 h-4 mr-2" />Alles als gelezen markeren
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm"
          className={filter === 'all' ? 'bg-[#2E5C5A] hover:bg-[#244A48]' : ''}
          onClick={() => setFilter('all')}>
          Alles ({notifications.length})
        </Button>
        <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm"
          className={filter === 'unread' ? 'bg-[#2E5C5A] hover:bg-[#244A48]' : ''}
          onClick={() => setFilter('unread')}>
          Ongelezen ({unreadCount})
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              {filter === 'unread' ? 'Geen ongelezen meldingen' : 'Geen meldingen'}
            </h3>
            <p className="text-slate-500">
              {filter === 'unread' ? 'Alle meldingen zijn gelezen.' : 'Er zijn nog geen meldingen.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 transition-colors ${
                    item.read ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'
                  }`}
                  data-testid={`notification-${item.id}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.read ? 'bg-slate-100' : 'bg-rose-100'
                    }`}>
                      <XCircle className={`w-5 h-5 ${item.read ? 'text-slate-400' : 'text-rose-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm ${item.read ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                        <span className="font-semibold">{item.studentName}</span>
                        <span className="text-slate-500"> ({item.className})</span>
                        <span className={item.read ? 'text-slate-500' : 'text-rose-700'}> was afwezig bij </span>
                        <span className="font-medium">{item.studyLabel}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateShort(item.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {!item.read ? (
                      <Button variant="outline" size="sm" onClick={() => handleMarkRead(item.id)}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" data-testid={`mark-read-${item.id}`}>
                        <Check className="w-4 h-4 mr-1" />Gelezen
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Check className="w-3 h-3" />Gelezen</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
