// src/components/Badge.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Badge = ({
  label,
  variant = 'default', // default, success, warning, error, info, primary
  size = 'medium', // small, medium, large
  style,
  textStyle,
  dot = false,
  ...props
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge];

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.badgeSmall);
        break;
      case 'large':
        baseStyle.push(styles.badgeLarge);
        break;
      default:
        baseStyle.push(styles.badgeMedium);
    }

    // Variant styles
    switch (variant) {
      case 'success':
        baseStyle.push(styles.badgeSuccess);
        break;
      case 'warning':
        baseStyle.push(styles.badgeWarning);
        break;
      case 'error':
        baseStyle.push(styles.badgeError);
        break;
      case 'info':
        baseStyle.push(styles.badgeInfo);
        break;
      case 'primary':
        baseStyle.push(styles.badgePrimary);
        break;
      default:
        baseStyle.push(styles.badgeDefault);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];

    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.textSmall);
        break;
      case 'large':
        baseStyle.push(styles.textLarge);
        break;
      default:
        baseStyle.push(styles.textMedium);
    }

    // Variant text colors
    switch (variant) {
      case 'success':
        baseStyle.push(styles.textSuccess);
        break;
      case 'warning':
        baseStyle.push(styles.textWarning);
        break;
      case 'error':
        baseStyle.push(styles.textError);
        break;
      case 'info':
        baseStyle.push(styles.textInfo);
        break;
      case 'primary':
        baseStyle.push(styles.textPrimary);
        break;
      default:
        baseStyle.push(styles.textDefault);
    }

    return baseStyle;
  };

  const getDotColor = () => {
    switch (variant) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      case 'info':
        return COLORS.info;
      case 'primary':
        return COLORS.primary;
      default:
        return COLORS.gray500;
    }
  };

  return (
    <View style={[getBadgeStyle(), style]} {...props}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: getDotColor() }]} />
      )}
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: SIZES.radiusFull,
  },

  // Sizes
  badgeSmall: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
  },
  badgeLarge: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
  },

  // Variants
  badgeDefault: {
    backgroundColor: COLORS.gray100,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
  },
  badgeWarning: {
    backgroundColor: COLORS.warningLight,
  },
  badgeError: {
    backgroundColor: COLORS.errorLight,
  },
  badgeInfo: {
    backgroundColor: COLORS.infoLight,
  },
  badgePrimary: {
    backgroundColor: COLORS.primaryLight,
  },

  // Text base
  text: {
    fontWeight: '600',
  },

  // Text sizes
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },

  // Text colors
  textDefault: {
    color: COLORS.gray700,
  },
  textSuccess: {
    color: COLORS.success,
  },
  textWarning: {
    color: COLORS.warning,
  },
  textError: {
    color: COLORS.error,
  },
  textInfo: {
    color: COLORS.info,
  },
  textPrimary: {
    color: COLORS.primary,
  },

  // Dot
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SIZES.xs,
  },
});

export default Badge;