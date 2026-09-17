// src/components/Avatar.js

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Avatar = ({
  source,
  name = '',
  size = 'medium', // small, medium, large, xlarge
  style,
  textStyle,
  showOnlineStatus = false,
  isOnline = false,
  ...props
}) => {
  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get size dimensions
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: 12, badgeSize: 8 };
      case 'large':
        return { width: 64, height: 64, fontSize: 24, badgeSize: 14 };
      case 'xlarge':
        return { width: 96, height: 96, fontSize: 36, badgeSize: 18 };
      default: // medium
        return { width: 48, height: 48, fontSize: 18, badgeSize: 12 };
    }
  };

  const { width, height, fontSize, badgeSize } = getSize();

  // Get background color based on name (for consistent colors)
  const getBackgroundColor = () => {
    const colors = [
      '#0B7A3E', '#2563EB', '#7C3AED', '#DB2777',
      '#EA580C', '#0891B2', '#65A30D', '#9333EA',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <View style={[styles.container, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.avatar,
            { width, height, borderRadius: width / 2 },
          ]}
          {...props}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.placeholder,
            {
              width,
              height,
              borderRadius: width / 2,
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }, textStyle]}>
            {getInitials()}
          </Text>
        </View>
      )}

      {showOnlineStatus && (
        <View
          style={[
            styles.statusBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: isOnline ? COLORS.success : COLORS.gray400,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: COLORS.primary,
  },
  initials: {
    color: COLORS.white,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default Avatar;