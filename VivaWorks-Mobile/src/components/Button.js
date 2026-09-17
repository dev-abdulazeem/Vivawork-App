// src/components/Button.js

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, text, danger
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
      case 'text':
        baseStyle.push(styles.textButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
      default:
        baseStyle.push(styles.primaryButton);
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
      default:
        baseStyle.push(styles.mediumButton);
    }

    // Full width
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];

    // Variant text colors
    switch (variant) {
      case 'primary':
      case 'danger':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'text':
        baseStyle.push(styles.textOnlyText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }

    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText);
        break;
      case 'large':
        baseStyle.push(styles.largeText);
        break;
      default:
        baseStyle.push(styles.mediumText);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: COLORS.error,
    ...SHADOWS.small,
  },

  // Sizes
  smallButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  mediumButton: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  largeButton: {
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.lg,
    borderRadius: SIZES.radiusLg,
  },

  // Disabled
  disabledButton: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  textOnlyText: {
    color: COLORS.primary,
  },

  // Text sizes
  smallText: {
    fontSize: SIZES.body3,
  },
  mediumText: {
    fontSize: SIZES.body1,
  },
  largeText: {
    fontSize: SIZES.h6,
  },

  disabledText: {
    opacity: 0.7,
  },

  // Icons
  iconLeft: {
    marginRight: SIZES.sm,
  },
  iconRight: {
    marginLeft: SIZES.sm,
  },
});

export default Button;