'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Filter, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Clock,
  User,
  Calendar,
  BookOpen,
  Users,
  Settings as SettingsIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'system' | 'session' | 'user' | 'achievement';
  action?: {
    label: string;
    url: string;
  };
}

function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'system' | 'session' | 'user' | 'achievement'>('all');

  // Mock notifications based on user role
  const getMockNotifications = (): Notification[] => {
    const baseNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Profile Updated Successfully',
        message: 'Your profile information has been updated.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        category: 'user',
      },
      {
        id: '2',
        type: 'info',
        title: 'System Maintenance Scheduled',
        message: 'System maintenance is scheduled for tonight at 2:00 AM.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        category: 'system',
      },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseNotifications,
        {
          id: '3',
          type: 'warning',
          title: 'New User Registration',
          message: '5 new users have registered and are pending approval.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          read: false,
          category: 'user',
          action: {
            label: 'Review Users',
            url: '/admin/dashboard',
          },
        },
        {
          id: '4',
          type: 'error',
          title: 'System Alert',
          message: 'High server load detected. Please check system status.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          read: false,
          category: 'system',
          action: {
            label: 'View Details',
            url: '/admin/settings',
          },
        },
        {
          id: '5',
          type: 'info',
          title: 'Database Backup Completed',
          message: 'Automated database backup completed successfully.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          read: true,
          category: 'system',
        },
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...baseNotifications,
        {
          id: '3',
          type: 'success',
          title: 'Session Started',
          message: 'Your teaching session "Mathematics 101" has started successfully.',
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          read: false,
          category: 'session',
          action: {
            label: 'View Session',
            url: '/teacher/dashboard',
          },
        },
        {
          id: '4',
          type: 'info',
          title: 'Student Joined Session',
          message: '3 new students have joined your current session.',
          timestamp: new Date(Date.now() - 1000 * 60 * 25),
          read: false,
          category: 'session',
        },
        {
          id: '5',
          type: 'warning',
          title: 'Low Engagement Alert',
          message: 'Student engagement has dropped below 60% in your session.',
          timestamp: new Date(Date.now() - 1000 * 60 * 40),
          read: true,
          category: 'session',
          action: {
            label: 'View Analytics',
            url: '/teacher/dashboard',
          },
        },
        {
          id: '6',
          type: 'success',
          title: 'Session Report Ready',
          message: 'Your session report for "Physics 202" is now available.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
          read: true,
          category: 'session',
        },
      ];
    }

    if (user?.role === 'student') {
      return [
        ...baseNotifications,
        {
          id: '3',
          type: 'info',
          title: 'New Session Available',
          message: 'Your teacher has started a new learning session.',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          read: false,
          category: 'session',
          action: {
            label: 'Join Session',
            url: '/student/dashboard',
          },
        },
        {
          id: '4',
          type: 'success',
          title: 'Achievement Unlocked!',
          message: 'You earned the "Focused Learner" badge for maintaining 90%+ focus.',
          timestamp: new Date(Date.now() - 1000 * 60 * 20),
          read: false,
          category: 'achievement',
        },
        {
          id: '5',
          type: 'warning',
          title: 'Attention Alert',
          message: 'Your focus level has decreased. Take a short break!',
          timestamp: new Date(Date.now() - 1000 * 60 * 35),
          read: true,
          category: 'session',
        },
        {
          id: '6',
          type: 'info',
          title: 'Session Summary Available',
          message: 'Your learning session summary is ready to review.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          read: true,
          category: 'session',
          action: {
            label: 'View Summary',
            url: '/student/dashboard',
          },
        },
      ];
    }

    return baseNotifications;
  };

  const [notifications, setNotifications] = useState<Notification[]>(getMockNotifications());

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean) => {
    const opacity = read ? '50' : '100';
    switch (type) {
      case 'success':
        return `bg-green-${opacity}`;
      case 'warning':
        return `bg-yellow-${opacity}`;
      case 'error':
        return `bg-red-${opacity}`;
      default:
        return `bg-blue-${opacity}`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <SettingsIcon className="w-4 h-4" />;
      case 'session':
        return <BookOpen className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'achievement':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesReadFilter =
      filter === 'all' ||
      (filter === 'unread' && !notif.read) ||
      (filter === 'read' && notif.read);
    
    const matchesCategoryFilter =
      categoryFilter === 'all' || notif.category === categoryFilter;
    
    return matchesReadFilter && matchesCategoryFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Back to Dashboard Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => router.push(`/${user?.role}/dashboard`)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Bell className="w-10 h-10 text-primary-600" />
                Notifications
              </h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </motion.button>
              )}
              {notifications.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </motion.button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {/* Read Status Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-2">
                  {['all', 'unread', 'read'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === f
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="system">System</option>
                  <option value="session">Session</option>
                  <option value="user">User</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl shadow-sm p-12 text-center"
                >
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
                  <p className="text-gray-600">You're all caught up! No notifications to show.</p>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
                      !notification.read ? 'border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-full ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'warning' ? 'bg-yellow-100' :
                          notification.type === 'error' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  {getCategoryIcon(notification.category)}
                                  {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getTimeAgo(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{notification.message}</p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {notification.action && (
                              <button
                                onClick={() => router.push(notification.action!.url)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                              >
                                {notification.action.label}
                              </button>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                              >
                                Mark as Read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}

export default NotificationsPage;
