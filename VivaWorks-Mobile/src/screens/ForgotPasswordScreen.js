// src/screens/ForgotPasswordScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEmailSent(true);
    } catch (err) {
      setError(err.friendlyMessage || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>📧</Text>
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            size="large"
          />
          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.resendText}>Didn't receive it? Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔒</Text>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Text style={styles.inputIcon}>📧</Text>}
              />

              <Button
                title="Send Reset Link"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                size="large"
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.lg,
  },
  header: {
    paddingTop: SIZES.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SIZES.xl,
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
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.md,
  },
  form: {
    width: '100%',
  },
  inputIcon: {
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  footerText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  footerLink: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
  },
  successIcon: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.successLight,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  successEmoji: {
    fontSize: 56,
  },
  successTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  successMessage: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.xl,
  },
  successEmail: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: SIZES.lg,
    padding: SIZES.sm,
  },
  resendText: {
    ...FONTS.body2,
    color: COLORS.primary,
  },
});

export default ForgotPasswordScreen;