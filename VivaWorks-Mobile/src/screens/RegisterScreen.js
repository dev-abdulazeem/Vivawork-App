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
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

// Import your custom Logo and Brand Icons
import Logo from '../components/icons/Logo';
import { GoogleIcon, AppleIcon } from '../components/icons';

// Import clean, professional UI icons from lucide-react-native
import { User, Mail, Lock, ArrowLeft } from 'lucide-react-native';

const RegisterScreen = ({ navigation }) => {
  const { register, signInWithGoogle, signInWithApple } = useAuth(); // Assuming these exist in your AuthContext
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    const result = await register({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
    });
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('VerifyEmail', { email: formData.email });
    } else {
      setErrors({ general: result.error });
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSocialLoading(true);
    // TODO: Implement actual Google Sign-In logic here
    // const result = await signInWithGoogle();
    console.log('Google Sign Up triggered');
    setIsSocialLoading(false);
  };

  const handleAppleSignUp = async () => {
    setIsSocialLoading(true);
    // TODO: Implement actual Apple Sign-In logic here
    // const result = await signInWithApple();
    console.log('Apple Sign Up triggered');
    setIsSocialLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Logo size={56} />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join our community and be part of something great
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              error={errors.fullName}
              autoCapitalize="words"
              autoComplete="name"
              leftIcon={<User size={20} color={errors.fullName ? COLORS.error : COLORS.textTertiary} />}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Mail size={20} color={errors.email ? COLORS.error : COLORS.textTertiary} />}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              error={errors.password}
              secureTextEntry
              autoComplete="password-new"
              leftIcon={<Lock size={20} color={errors.password ? COLORS.error : COLORS.textTertiary} />}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              error={errors.confirmPassword}
              secureTextEntry
              autoComplete="password-new"
              leftIcon={<Lock size={20} color={errors.confirmPassword ? COLORS.error : COLORS.textTertiary} />}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              size="large"
              style={styles.submitButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Sign Up Buttons */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignUp}
              loading={isSocialLoading}
              disabled={isSocialLoading}
              variant="outline"
              size="large"
              icon={<GoogleIcon size={20} />}
              style={styles.socialButton}
            />

            <Button
              title="Continue with Apple"
              onPress={handleAppleSignUp}
              loading={isSocialLoading}
              disabled={isSocialLoading}
              variant="outline"
              size="large"
              icon={<AppleIcon size={20} />}
              style={styles.socialButton}
            />

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.gray50 || '#F9FAFB',
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error || '#EF4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBannerText: {
    ...FONTS.body2,
    color: COLORS.error || '#B91C1C',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border || '#E5E7EB',
  },
  dividerText: {
    ...FONTS.body3,
    color: COLORS.textTertiary || '#9CA3AF',
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButton: {
    marginBottom: 12,
    borderRadius: 12,
  },
  termsContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  termsText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  footerText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default RegisterScreen;