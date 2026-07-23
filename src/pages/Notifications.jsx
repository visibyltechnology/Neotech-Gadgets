import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import Footer from '../components/Footer';
import useAuthStore from '../store/useAuthStore';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NOTIFICATION_TYPES
} from '../utils/notificationService';
import { formatTimestamp } from '../utils/orderStatusHelper';
import toast from 'react-hot-toast';

const NT = {
  bg: '#0E0E10', card: '#161618', cardHover: '#1E1E22', border: '#2A2A30',
  primary: '#D42B2B', textMain: '#E8E8F0', textMuted: '#707080', textAccent: '#C8C8D4',
};

const NOTIFICATION_ICON_MAP = {
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: '💳',
  [NOTIFICATION_TYPES.ORDER_OTP]: '🔑',
  [NOTIFICATION_TYPES.TRACKING_UPDATE]: '📦',
  [NOTIFICATION_TYPES.ORDER_PLACED]: '✅',
  [NOTIFICATION_TYPES.GENERAL]: 'ℹ️',
  [NOTIFICATION_TYPES.CART_REMINDER]: '🛒',
  [NOTIFICATION_TYPES.STOCK_ALERT]: '⚠️'
};

const NOTIFICATION_COLOR_MAP = {
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: { accent: '#4ade80', border: 'rgba(74,222,128,0.3)' },
  [NOTIFICATION_TYPES.ORDER_OTP]:        { accent: '#F0A500', border: 'rgba(240,165,0,0.3)' },
  [NOTIFICATION_TYPES.TRACKING_UPDATE]:  { accent: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
  [NOTIFICATION_TYPES.ORDER_PLACED]:     { accent: '#4ade80', border: 'rgba(74,222,128,0.3)' },
  [NOTIFICATION_TYPES.GENERAL]:         { accent: NT.textAccent, border: NT.border },
  [NOTIFICATION_TYPES.CART_REMINDER]:   { accent: '#F0A500', border: 'rgba(240,165,0,0.3)' },
  [NOTIFICATION_TYPES.STOCK_ALERT]:     { accent: NT.primary, border: 'rgba(212,43,43,0.3)' },
};

function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOTPCode, setShowOTPCode] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const notifs = await getUserNotifications(user.uid, 100);
        setNotifications(notifs.filter(n => !n.is_deleted));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally { setLoading(false); }
    };
    fetchNotifications();
  }, [user, navigate]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifs => notifs.map(n => n.id === notificationId ? { ...n, status: 'read' } : n));
    } catch (error) { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(notifs => notifs.map(n => ({ ...n, status: 'read' })));
      toast.success('All notifications marked as read');
    } catch (error) { toast.error('Failed to mark all as read'); }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifs => notifs.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) { toast.error('Failed to delete notification'); }
  };

  const handleCopyOTP = (otpCode) => {
    navigator.clipboard.writeText(otpCode);
    toast.success('OTP copied to clipboard!');
  };

  const toggleShowOTP = (notificationId) => {
    setShowOTPCode(prev => ({ ...prev, [notificationId]: !prev[notificationId] }));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread';
    if (filter === 'read') return n.status === 'read';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const renderNotificationCard = (notification) => {
    const colors = NOTIFICATION_COLOR_MAP[notification.type] || NOTIFICATION_COLOR_MAP[NOTIFICATION_TYPES.GENERAL];
    const icon = NOTIFICATION_ICON_MAP[notification.type] || '📬';
    const isUnread = notification.status === 'unread';

    return (
      <div
        key={notification.id}
        onClick={() => { if (isUnread) handleMarkAsRead(notification.id); }}
        style={{
          background: NT.card,
          border: `1px solid ${isUnread ? colors.border : NT.border}`,
          borderLeft: `3px solid ${colors.accent}`,
          borderRadius: 14,
          padding: '1.25rem 1.5rem',
          cursor: 'pointer',
          transition: 'all 0.25s',
          position: 'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = NT.cardHover; e.currentTarget.style.borderColor = colors.border; }}
        onMouseLeave={e => { e.currentTarget.style.background = NT.card; e.currentTarget.style.borderColor = isUnread ? colors.border : NT.border; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {/* Icon */}
          <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
              <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', fontWeight: 700, color: colors.accent, margin: 0, lineHeight: 1.3 }}>
                {notification.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isUnread && (
                  <span style={{ background: colors.accent, color: '#0E0E10', fontSize: '0.55rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif' }}>
                    New
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#505060', padding: 4, borderRadius: 6, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = NT.primary; e.currentTarget.style.background = 'rgba(212,43,43,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#505060'; e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <p style={{ color: NT.textMuted, fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              {notification.message}
            </p>

            {/* OTP Code Display */}
            {notification.type === NOTIFICATION_TYPES.ORDER_OTP && notification.metadata?.otp_code && (
              <div style={{ background: NT.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.75rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: NT.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Rajdhani, sans-serif', marginBottom: 4 }}>Delivery OTP</p>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.2em', color: colors.accent }}>
                    {showOTPCode[notification.id] ? notification.metadata.otp_code : '••••'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleShowOTP(notification.id); }}
                    style={{ width: 34, height: 34, background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 8, cursor: 'pointer', color: NT.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = NT.textMain; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = NT.border; e.currentTarget.style.color = NT.textMuted; }}
                  >
                    {showOTPCode[notification.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleCopyOTP(notification.metadata.otp_code); }}
                    style={{ height: 34, background: colors.accent, border: 'none', borderRadius: 8, cursor: 'pointer', color: '#0E0E10', fontSize: '0.7rem', fontWeight: 800, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
            )}

            {/* Order meta */}
            {notification.metadata?.order_id && (
              <div style={{ background: NT.bg, border: `1px solid ${NT.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                <p style={{ fontSize: '0.7rem', color: NT.textMuted, fontFamily: 'Rajdhani, sans-serif' }}>
                  <strong style={{ color: NT.textAccent }}>Order:</strong> {notification.metadata.order_id}
                  {notification.metadata?.amount && (
                    <> &nbsp;·&nbsp; <strong style={{ color: NT.textAccent }}>Amount:</strong> ₦{Number(notification.metadata.amount).toLocaleString()}</>
                  )}
                </p>
              </div>
            )}

            <p style={{ fontSize: '0.65rem', color: '#505060', marginTop: 6, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}>
              {formatTimestamp(notification.created_at)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const FILTERS = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'read', label: 'Read', count: notifications.filter(n => n.status === 'read').length },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: NT.bg }}>
      <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>

        {/* Back link */}
        <Link
          to="/profile"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, color: NT.textMuted, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'Rajdhani, sans-serif', marginBottom: '1.5rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = NT.primary}
          onMouseLeave={e => e.currentTarget.style.color = NT.textMuted}
        >
          <ArrowLeft size={14} /> Back to Profile
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ width: 24, height: 3, background: NT.primary, borderRadius: 99, display: 'block' }} />
                <span style={{ width: 14, height: 3, background: 'rgba(212,43,43,0.4)', borderRadius: 99, display: 'block' }} />
              </div>
              <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Notifications
              </h1>
            </div>
            <p style={{ color: NT.textMuted, fontSize: '0.8rem' }}>
              {unreadCount > 0 && <><strong style={{ color: NT.textMain }}>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}</>}
              {unreadCount === 0 && notifications.length > 0 && 'You are all caught up!'}
              {notifications.length === 0 && 'No notifications yet'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{ background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: NT.primary, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,43,43,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,43,43,0.1)'; }}
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem', background: NT.card, border: `1px solid ${NT.border}`, borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '0.5rem 1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: filter === f.id ? 'linear-gradient(135deg,#D42B2B,#A01E1E)' : 'transparent',
                color: filter === f.id ? '#fff' : NT.textMuted,
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.2s',
                boxShadow: filter === f.id ? '0 4px 14px rgba(212,43,43,0.3)' : 'none',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: NT.primary, marginBottom: '1rem', display: 'block' }} />
            <p style={{ color: NT.textMuted, fontSize: '0.85rem' }}>Loading notifications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNotifications.length === 0 && (
          <div style={{ background: NT.card, border: `2px dashed ${NT.border}`, borderRadius: 16, padding: '4rem', textAlign: 'center' }}>
            <i className="fas fa-inbox" style={{ fontSize: '3.5rem', color: '#2A2A30', marginBottom: '1rem', display: 'block' }} />
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: NT.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </h3>
            <p style={{ color: NT.textMuted, fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {filter === 'unread'
                ? 'You are all caught up! Check back for new updates.'
                : 'You will receive notifications about your orders, payments, and more here.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                style={{ background: 'rgba(212,43,43,0.1)', border: '1px solid rgba(212,43,43,0.3)', color: NT.primary, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', borderRadius: 10, cursor: 'pointer' }}
              >
                View All Notifications
              </button>
            )}
          </div>
        )}

        {/* Notifications List */}
        {!loading && filteredNotifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredNotifications.map(renderNotificationCard)}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default NotificationsPage;
