// src/components/MessageBubble.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Avatar from './Avatar';

const MessageBubble = ({
  message,
  isOwn = false,
  showAvatar = true,
  showTime = true,
  style,
}) => {
  const formatTime = (date) => {
    if (!date) return '';
    const msgDate = new Date(date);
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) return 'Today';
    if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return msgDate.toLocaleDateString();
  };

  return (
    <View style={[styles.container, isOwn && styles.ownContainer, style]}>
      {!isOwn && showAvatar && (
        <Avatar
          source={message.sender?.avatar}
          name={message.sender?.name}
          size="small"
          style={styles.avatar}
        />
      )}

      <View style={[styles.bubbleContainer, isOwn && styles.ownBubbleContainer]}>
        {!isOwn && message.sender?.name && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}

        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          {message.type === 'image' ? (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageIcon}>🖼️</Text>
              <Text style={[styles.imageText, isOwn && styles.ownText]}>
                Image
              </Text>
            </View>
          ) : message.type === 'file' ? (
            <View style={styles.fileContainer}>
              <Text style={styles.fileIcon}>📎</Text>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, isOwn && styles.ownText]}>
                  {message.fileName || 'Attachment'}
                </Text>
                <Text style={[styles.fileSize, isOwn && styles.ownTextSecondary]}>
                  {message.fileSize || ''}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.messageText, isOwn && styles.ownText]}>
              {message.text}
            </Text>
          )}

          {showTime && (
            <View style={styles.timeContainer}>
              <Text style={[styles.time, isOwn && styles.ownTime]}>
                {formatTime(message.createdAt)}
              </Text>
              {isOwn && (
                <Text style={styles.status}>
                  {message.isRead ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Date separator component
MessageBubble.DateSeparator = ({ date }) => (
  <View style={styles.dateSeparator}>
    <View style={styles.dateLine} />
    <Text style={styles.dateText}>{formatDate(date)}</Text>
    <View style={styles.dateLine} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginRight: SIZES.sm,
    alignSelf: 'flex-end',
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  ownBubbleContainer: {
    alignItems: 'flex-end',
  },
  senderName: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginLeft: SIZES.sm,
  },
  bubble: {
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.gray100,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  ownText: {
    color: COLORS.white,
  },
  ownTextSecondary: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  time: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    fontSize: 10,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  status: {
    ...FONTS.body3,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginLeft: 4,
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: SIZES.md,
  },
  imageIcon: {
    fontSize: 32,
    marginBottom: SIZES.xs,
  },
  imageText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: SIZES.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  fileSize: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.lg,
    paddingHorizontal: SIZES.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dateText: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginHorizontal: SIZES.md,
  },
});

export default MessageBubble;