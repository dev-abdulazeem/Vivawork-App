// src/screens/VerifyEmailScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Button from '../components/Button';
import Loading from '../components/Loading';

const VerifyEmailScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const lastIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-email', {
        email,
        code: verificationCode,
      });

      Alert.alert(
        'Success',
        'Your email has been verified successfully!',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error.friendlyMessage || 'Invalid verification code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Sent', 'Verification code has been resent to your email');
    } catch (error) {
      Alert.alert('Error', error.friendlyMessage || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Verification',
      'You can verify your email later from settings. Some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📧</Text>
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            <Text style={styles.email}>{email || 'your email'}</Text>
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                index === 0 && styles.codeInputFirst,
                index === 5 && styles.codeInputLast,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify Button */}
        <Button
          title="Verify Email"
          onPress={handleVerify}
          loading={isLoading}
          disabled={isLoading || code.join('').length !== 6}
          variant="primary"
          size="large"
        />

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={countdown > 0 || isResending}
          >
            <Text
              style={[
                styles.resendLink,
                (countdown > 0 || isResending) && styles.resendLinkDisabled,
              ]}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SIZES.xl,
    gap: SIZES.sm,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.gray50,
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  codeInputFirst: {
    marginLeft: 0,
  },
  codeInputLast: {
    marginRight: 0,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  resendText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  resendLink: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: COLORS.textTertiary,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: SIZES.xl,
    padding: SIZES.md,
  },
  skipText: {
    ...FONTS.body1,
    color: COLORS.textTertiary,
  },
});

export default VerifyEmailScreen;