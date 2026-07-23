import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Copy, Eye, EyeOff } from 'lucide-react';
import {
  subscribeToUserNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NOTIFICATION_TYPES
} from '../utils/notificationService';
import { formatTimestamp } from '../utils/orderStatusHelper';
import toast from 'react-hot-toast';

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
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: { bg: '#ecfdf5', accent: '#059669', border: '#a7f3d0' },
  [NOTIFICATION_TYPES.ORDER_OTP]: { bg: '#fffbeb', accent: '#d97706', border: '#fde68a' },
  [NOTIFICATION_TYPES.TRACKING_UPDATE]: { bg: '#eff6ff', accent: '#0284c7', border: '#bae6fd' },
  [NOTIFICATION_TYPES.ORDER_PLACED]: { bg: '#ecfdf5', accent: '#059669', border: '#a7f3d0' },
  [NOTIFICATION_TYPES.GENERAL]: { bg: '#f3f4f6', accent: '#6b7280', border: '#e5e7eb' },
  [NOTIFICATION_TYPES.CART_REMINDER]: { bg: '#fef3c7', accent: '#d97706', border: '#fde68a' },
  [NOTIFICATION_TYPES.STOCK_ALERT]: { bg: '#fee2e2', accent: '#dc2626', border: '#fca5a5' }
};

function NotificationBell({ userId, isMobile = false }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOTPCode, setShowOTPCode] = useState({});
  const dropdownRef = useRef(null);
  const bellButtonRef = useRef(null);

  // Subscribe to notifications and unread count
  useEffect(() => {
    if (!userId) return;

    const unsubNotifications = subscribeToUserNotifications(userId, (notifs) => {
      setNotifications(notifs.filter(n => !n.is_deleted));
    });

    const unsubUnreadCount = subscribeToUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubNotifications?.();
      unsubUnreadCount?.();
    };
  }, [userId]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          bellButtonRef.current && !bellButtonRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleCopyOTP = (otpCode) => {
    navigator.clipboard.writeText(otpCode);
    toast.success('OTP copied to clipboard!');
  };

  const toggleShowOTP = (notificationId) => {
    setShowOTPCode(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };

  const renderNotificationContent = (notification) => {
    const colors = NOTIFICATION_COLOR_MAP[notification.type] || NOTIFICATION_COLOR_MAP[NOTIFICATION_TYPES.GENERAL];
    const icon = NOTIFICATION_ICON_MAP[notification.type] || '📬';

    return (
      <div
        key={notification.id}
        onClick={() => {
          if (notification.status === 'unread') {
            handleMarkAsRead(notification.id);
          }
        }}
        style={{
          background: colors.bg,
          borderLeft: `4px solid ${colors.accent}`,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        className="p-4 hover:shadow-md"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-lg">{icon}</span>
            <div className="flex-1">
              <h4 style={{ color: colors.accent }} className="font-bold text-sm">
                {notification.title}
              </h4>
              {notification.status === 'unread' && (
                <span style={{ background: colors.accent }} className="text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                  New
                </span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNotification(notification.id);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700 mb-2">{notification.message}</p>

        {/* OTP Code Display */}
        {notification.type === NOTIFICATION_TYPES.ORDER_OTP && notification.metadata?.otp_code && (
          <div style={{ background: '#fff', border: `2px solid ${colors.accent}` }} className="p-3 rounded mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600">Delivery OTP</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShowOTP(notification.id);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {showOTPCode[notification.id] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black tracking-widest">
                {showOTPCode[notification.id]
                  ? notification.metadata.otp_code
                  : '•••• '}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyOTP(notification.metadata.otp_code);
                }}
                className="text-xs font-bold text-white px-3 py-1 rounded"
                style={{ background: colors.accent }}
              >
                <Copy size={14} className="inline mr-1" /> Copy
              </button>
            </div>
          </div>
        )}

        {/* Order Link */}
        {notification.metadata?.order_id && (
          <div className="text-xs text-gray-500">
            <strong>Order:</strong> {notification.metadata.order_id}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 mt-2">
          {formatTimestamp(notification.created_at)}
        </p>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        onClick={() => {
          if (isMobile) {
            navigate('/notifications');
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`relative p-2 transition-colors ${isMobile ? 'text-gray-800 text-2xl' : 'text-gray-600 hover:text-gray-900'}`}
        title="Notifications"
      >
        <Bell size={isMobile ? 24 : 20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#dc2626',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Desktop only */}
      {isOpen && !isMobile && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '8px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 50,
            minWidth: '380px',
            maxWidth: '420px',
            maxHeight: '600px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f9fafb',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#dc2626' }}>({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Check size={14} className="inline mr-1" /> Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Bell size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
                <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map(renderNotificationContent)
            )}
          </div>

          {/* View All Link */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              background: '#f9fafb'
            }}>
              <a
                href="/notifications"
                style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', textDecoration: 'none' }}
                className="hover:underline"
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;
