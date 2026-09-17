// src/components/Card.js

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Card = ({
  children,
  onPress,
  variant = 'elevated', // elevated, outlined, filled
  padding = 'md', // none, sm, md, lg
  style,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'filled':
        baseStyle.push(styles.filled);
        break;
      default:
        baseStyle.push(styles.elevated);
    }

    // Padding styles
    switch (padding) {
      case 'none':
        baseStyle.push(styles.paddingNone);
        break;
      case 'sm':
        baseStyle.push(styles.paddingSm);
        break;
      case 'lg':
        baseStyle.push(styles.paddingLg);
        break;
      default:
        baseStyle.push(styles.paddingMd);
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.9}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

// Card sub-components for better composition
Card.Header = ({ children, style, ...props }) => (
  <View style={[styles.header, style]} {...props}>
    {children}
  </View>
);

Card.Body = ({ children, style, ...props }) => (
  <View style={[styles.body, style]} {...props}>
    {children}
  </View>
);

Card.Footer = ({ children, style, ...props }) => (
  <View style={[styles.footer, style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
  },
  elevated: {
    ...SHADOWS.medium,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filled: {
    backgroundColor: COLORS.gray50,
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: SIZES.sm,
  },
  paddingMd: {
    padding: SIZES.md,
  },
  paddingLg: {
    padding: SIZES.lg,
  },

  // Sub-components
  header: {
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  body: {
    paddingVertical: SIZES.md,
  },
  footer: {
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});

export default Card;