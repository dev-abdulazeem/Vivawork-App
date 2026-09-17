// src/components/NotificationItem.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Avatar from './Avatar';
import Badge from './Badge';

const NotificationItem = ({
  notification,
  onPress,
  style,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'job':
        return '💼';
      case 'payment':
        return '💰';
      case 'review':
        return '⭐';
      case 'connection':
        return '🤝';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return notifDate.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer,
        style,
      ]}
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {notification.sender?.avatar ? (
          <Avatar
            source={notification.sender.avatar}
            name={notification.sender.name}
            size="medium"
          />
        ) : (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              {getNotificationIcon(notification.type)}
            </Text>
          </View>
        )}
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        {notification.actionLabel && (
          <View style={styles.actionContainer}>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>
                {notification.actionLabel}
              </Text>
            </View>
          </View>
        )}
      </View>

      {notification.badge && (
        <Badge
          label={notification.badge}
          variant={notification.badgeVariant || 'primary'}
          size="small"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  unreadContainer: {
    backgroundColor: COLORS.primaryLight,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SIZES.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: SIZES.sm,
  },
  time: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
  },
  message: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: SIZES.sm,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  actionText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default NotificationItem;