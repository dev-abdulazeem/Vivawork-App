import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Import your custom components
import Input from '../components/Input';
import Button from '../components/Button';

// Import your custom brand icons from your local folder
import { GoogleIcon, AppleIcon } from '../components/icons';

// Lucide React Native Icons (Standard UI icons only)
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Briefcase,
} from 'lucide-react-native';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState('buyer'); // 'buyer' or 'freelancer'

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateName = (value, fieldName) => {
    if (!value.trim()) return `${fieldName} is required`;
    if (value.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    return null;
  };

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain a lowercase letter';
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain an uppercase letter';
    if (!/(?=.*\d)/.test(value)) return 'Password must contain a number';
    return null;
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return null;
  };

  const handleBlur = (field) => {
    let error = null;
    switch (field) {
      case 'firstName': error = validateName(formData.firstName, 'First name'); break;
      case 'lastName': error = validateName(formData.lastName, 'Last name'); break;
      case 'email': error = validateEmail(formData.email); break;
      case 'password': error = validatePassword(formData.password); break;
      case 'confirmPassword': error = validateConfirmPassword(formData.confirmPassword, formData.password); break;
    }
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleRegister = async () => {
    const newErrors = {};
    const firstNameError = validateName(formData.firstName, 'First name');
    const lastNameError = validateName(formData.lastName, 'Last name');
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (firstNameError) newErrors.firstName = firstNameError;
    if (lastNameError) newErrors.lastName = lastNameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        isBuyer: accountType === 'buyer',
        isFreelancer: accountType === 'freelancer',
      });

      if (result.success) {
        navigation.navigate('VerifyEmail', { email: formData.email.toLowerCase().trim() });
      } else {
        const errorCode = result.code;
        const errorMessage = result.error;

        switch (errorCode) {
          case 'EMAIL_EXISTS':
            setErrors({ email: 'This email is already registered.', general: 'Email already exists' });
            break;
          case 'WEAK_PASSWORD':
            setErrors({ password: errorMessage || 'Password is too weak.', general: 'Weak password' });
            break;
          case 'MISSING_FIELDS':
            setErrors({ general: 'Please fill in all required fields.' });
            break;
          default:
            setErrors({ general: errorMessage || 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Coming Soon', 'Google Sign-Up will be available soon');
  };

  const handleAppleSignUp = () => {
    Alert.alert('Coming Soon', 'Apple Sign-Up will be available soon');
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join our community and start your journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* General Error Banner */}
            {errors.general && (
              <View style={styles.errorBanner}>
                <AlertCircle size={20} color={COLORS.error || '#EF4444'} style={styles.errorIcon} />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorBannerTitle}>Registration Failed</Text>
                  <Text style={styles.errorBannerText}>{errors.general}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setErrors((prev) => ({ ...prev, general: null }))}
                  style={styles.errorCloseButton}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Account Type Selection */}
            <View style={styles.accountTypeContainer}>
              <Text style={styles.accountTypeLabel}>I want to:</Text>
              <View style={styles.accountTypeRow}>
                <TouchableOpacity
                  style={[styles.accountTypeButton, accountType === 'buyer' && styles.accountTypeButtonActive]}
                  onPress={() => setAccountType('buyer')}
                  activeOpacity={0.7}
                >
                  <Briefcase size={20} color={accountType === 'buyer' ? (COLORS.primary || '#2563EB') : (COLORS.textTertiary || '#9CA3AF')} />
                  <Text style={[styles.accountTypeText, accountType === 'buyer' && styles.accountTypeTextActive]}>
                    Hire Talent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountTypeButton, accountType === 'freelancer' && styles.accountTypeButtonActive]}
                  onPress={() => setAccountType('freelancer')}
                  activeOpacity={0.7}
                >
                  <User size={20} color={accountType === 'freelancer' ? (COLORS.primary || '#2563EB') : (COLORS.textTertiary || '#9CA3AF')} />
                  <Text style={[styles.accountTypeText, accountType === 'freelancer' && styles.accountTypeTextActive]}>
                    Find Work
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Input
                  label="First Name"
                  placeholder="John"
                  value={formData.firstName}
                  onChangeText={(value) => updateField('firstName', value)}
                  onBlur={() => handleBlur('firstName')}
                  error={errors.firstName}
                  autoCapitalize="words"
                  autoComplete="name"
                  leftIcon={<User size={20} color={errors.firstName ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />}
                />
              </View>
              <View style={styles.nameInput}>
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                  onBlur={() => handleBlur('lastName')}
                  error={errors.lastName}
                  autoCapitalize="words"
                  autoComplete="name"
                  leftIcon={<User size={20} color={errors.lastName ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />}
                />
              </View>
            </View>

            {/* Email Input */}
            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Mail size={20} color={errors.email ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />}
              containerStyle={styles.inputContainer}
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              onBlur={() => handleBlur('password')}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              leftIcon={<Lock size={20} color={errors.password ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />}
              rightIcon={
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  activeOpacity={0.7}
                  style={styles.eyeIconContainer}
                >
                  {showPassword ? <EyeOff size={20} color={COLORS.textTertiary || '#9CA3AF'} /> : <Eye size={20} color={COLORS.textTertiary || '#9CA3AF'} />}
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
            />

            {/* Confirm Password Input */}
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              onBlur={() => handleBlur('confirmPassword')}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              leftIcon={<Lock size={20} color={errors.confirmPassword ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />}
              rightIcon={
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                  activeOpacity={0.7}
                  style={styles.eyeIconContainer}
                >
                  {showConfirmPassword ? <EyeOff size={20} color={COLORS.textTertiary || '#9CA3AF'} /> : <Eye size={20} color={COLORS.textTertiary || '#9CA3AF'} />}
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
            />

            {/* Submit Button */}
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

            {/* Social Buttons (Using your local brand icons) */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignUp}
              variant="outline"
              size="large"
              icon={<GoogleIcon size={20} />}
              style={styles.socialButton}
            />

            <Button
              title="Continue with Apple"
              onPress={handleAppleSignUp}
              variant="outline"
              size="large"
              icon={<AppleIcon size={20} />}
              style={styles.socialButton}
            />

            {/* Terms */}
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
    backgroundColor: COLORS.white || '#FFFFFF',
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
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary || '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary || '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    flex: 1,
  },
  accountTypeContainer: {
    marginBottom: 24,
  },
  accountTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary || '#64748B',
    marginBottom: 12,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border || '#E2E8F0',
    backgroundColor: COLORS.white || '#FFFFFF',
    gap: 8,
  },
  accountTypeButtonActive: {
    borderColor: COLORS.primary || '#2563EB',
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary || '#64748B',
  },
  accountTypeTextActive: {
    color: COLORS.primary || '#2563EB',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  nameInput: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error || '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 14,
    color: COLORS.error || '#B91C1C',
    lineHeight: 20,
  },
  errorCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
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
    backgroundColor: COLORS.border || '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textTertiary || '#94A3B8',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButton: {
    marginBottom: 12,
    borderRadius: 12,
  },
  eyeIconContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 13,
    color: COLORS.textSecondary || '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary || '#2563EB',
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
    fontSize: 15,
    color: COLORS.textSecondary || '#64748B',
  },
  footerLink: {
    fontSize: 15,
    color: COLORS.primary || '#2563EB',
    fontWeight: '700',
  },
});

export default RegisterScreen;