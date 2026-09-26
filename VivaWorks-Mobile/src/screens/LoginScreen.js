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
import Input from '../components/Input';
import Button from '../components/Button';

// Import your custom brand icons from your local folder
import { Logo, GoogleIcon, AppleIcon } from '../components/icons';

// Import clean, professional UI icons from lucide-react-native
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Check,
} from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleEmailBlur = () => {
    const error = validateEmail(email);
    if (error) setErrors((prev) => ({ ...prev, email: error }));
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    if (error) setErrors((prev) => ({ ...prev, password: error }));
  };

  const handleLogin = async () => {
    // 1. Client-side validation
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(email, password);
      console.log('🔍 LOGIN RESULT:', result);
      
      // 🎯 NEW: Catch the requiresVerification flag from AuthContext
      if (result?.success === true && result?.requiresVerification === true) {
        console.log('✅ Redirecting to VerifyEmail because isVerified is false');
        navigation.navigate('VerifyEmail', { email: email });
        return; // Stop execution, don't proceed to main app
      }

      // 2. Robust Error Handling: Explicitly check for failure
      if (!result || result.success === false) {
        const errorCode = result?.code;
        const errorMessage = result?.error || 'Login failed. Please check your credentials.';

        console.log('⚠️ ERROR CODE:', errorCode);
        console.log('⚠️ ERROR MESSAGE:', errorMessage);

        switch (errorCode) {
          case 'INVALID_CREDENTIALS':
          case 'USER_NOT_FOUND':
            setErrors({ 
              general: 'Incorrect email or password. Please try again.',
              password: ' ' 
            });
            break;
          case 'ACCOUNT_LOCKED':
            setErrors({ general: 'Too many failed attempts. Please try again in 15 minutes.' });
            break;
          case 'ACCOUNT_SUSPENDED':
            setErrors({ general: 'Your account has been suspended. Please contact support.' });
            break;
            
          case 'EMAIL_NOT_VERIFIED':
          case 'UNVERIFIED_EMAIL':
          case 'NOT_VERIFIED':
          case 'UNVERIFIED_ACCOUNT':
            console.log('✅ Redirecting to VerifyEmail via error code');
            navigation.navigate('VerifyEmail', { email: email });
            break;
            
          default:
            if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('unverified')) {
              console.log('✅ Fallback redirect to VerifyEmail triggered by message');
              navigation.navigate('VerifyEmail', { email: email });
            } else {
              setErrors({ general: errorMessage });
            }
        }
        
        return; 
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setErrors({ 
        general: error.response?.data?.message || 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Coming Soon', 'Google Sign-In will be available soon');
  };

  const handleAppleLogin = () => {
    Alert.alert('Coming Soon', 'Apple Sign-In will be available soon');
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
            <View style={styles.logoContainer}>
              <Logo size={56} />
            </View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitle}>Please enter your details to sign in.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* General Error Banner */}
            {errors.general && (
              <View style={styles.errorBanner}>
                <AlertCircle size={20} color={COLORS.error || '#EF4444'} style={styles.errorIcon} />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorBannerTitle}>Login Failed</Text>
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

            {/* Email Input */}
            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError('email');
              }}
              onBlur={handleEmailBlur}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={
                <Mail size={20} color={errors.email ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />
              }
              containerStyle={styles.inputContainer}
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError('password');
              }}
              onBlur={handlePasswordBlur}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoComplete="password"
              leftIcon={
                <Lock size={20} color={errors.password ? (COLORS.error || '#EF4444') : (COLORS.textTertiary || '#9CA3AF')} />
              }
              rightIcon={
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  activeOpacity={0.7}
                  style={styles.eyeIconContainer}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.textTertiary || '#9CA3AF'} />
                  ) : (
                    <Eye size={20} color={COLORS.textTertiary || '#9CA3AF'} />
                  )}
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
            />

            {/* Options Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Check size={14} color={COLORS.white || '#FFFFFF'} strokeWidth={3} />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
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

            {/* Social Buttons */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleLogin}
              variant="outline"
              size="large"
              icon={<GoogleIcon size={20} />}
              style={styles.socialButton}
            />

            <Button
              title="Continue with Apple"
              onPress={handleAppleLogin}
              variant="outline"
              size="large"
              icon={<AppleIcon size={20} />}
              style={styles.socialButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>Create account</Text>
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
  logoContainer: {
    marginBottom: 24,
  },
  welcomeText: {
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
  },
  form: {
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.gray300 || '#D1D5DB',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white || '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary || '#2563EB',
    borderColor: COLORS.primary || '#2563EB',
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary || '#64748B',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary || '#2563EB',
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

export default LoginScreen;