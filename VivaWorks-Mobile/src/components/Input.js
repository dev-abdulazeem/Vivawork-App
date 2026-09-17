import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Eye from './icons/Eye';
import EyeOff from './icons/EyeOff';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];

    if (isFocused) {
      baseStyle.push(styles.inputFocused);
    }

    if (error) {
      baseStyle.push(styles.inputError);
    }

    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }

    if (rightIcon || secureTextEntry) {
      baseStyle.push(styles.inputWithRightIcon);
    }

    if (multiline) {
      baseStyle.push(styles.inputMultiline);
    }

    if (!editable) {
      baseStyle.push(styles.inputDisabled);
    }

    return baseStyle;
  };

  // Clean logic to determine what renders on the right side
  const renderRightIcon = () => {
    // 1. If parent passes a rightIcon (like in LoginScreen), use it
    if (rightIcon) {
      return <View style={styles.rightIconContainer}>{rightIcon}</View>;
    }

    // 2. If secureTextEntry is true and no rightIcon is passed, use internal SVG toggle
    if (secureTextEntry) {
      return (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={togglePasswordVisibility}
          activeOpacity={0.7}
        >
          {isPasswordVisible ? (
            <EyeOff color={COLORS.textTertiary || '#9CA3AF'} size={20} />
          ) : (
            <Eye color={COLORS.textTertiary || '#9CA3AF'} size={20} />
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={styles.inputWrapper}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400 || '#9CA3AF'}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          {...props}
        />

        {renderRightIcon()}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md || 16,
  },
  label: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm || 8,
    fontWeight: '500',
    fontSize: 14,
  },
  required: {
    color: COLORS.error || '#EF4444',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.gray50 || '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.border || '#E5E7EB',
    borderRadius: SIZES.radiusMd || 12,
    paddingHorizontal: SIZES.md || 16,
    paddingVertical: SIZES.md || 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error || '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputWithLeftIcon: {
    paddingLeft: 48,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SIZES.md || 16,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray100 || '#F3F4F6',
    color: COLORS.gray400 || '#9CA3AF',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  rightIconContainer: {
    position: 'absolute',
    right: 8,
    zIndex: 1,
    padding: 8, // Larger touch target for the eye icon
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error || '#EF4444',
    marginTop: SIZES.xs || 4,
    fontSize: 13,
    fontWeight: '500',
  },
  helperText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs || 4,
    fontSize: 13,
  },
});

export default Input;