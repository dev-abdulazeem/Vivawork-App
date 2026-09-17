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
import {
  Logo,
  GoogleIcon,
  AppleIcon,
  MailIcon,
  LockIcon,
  CheckIcon,
} from '../components/icons';
import Eye from '../components/icons/Eye';
import EyeOff from '../components/icons/EyeOff';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrors({ general: result.error });
    }
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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo size={56} />
            </View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitle}>Please enter your details to sign in.</Text>
          </View>

          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<MailIcon color={errors.email ? COLORS.error : COLORS.textTertiary} size={20} />}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoComplete="password"
              leftIcon={<LockIcon color={errors.password ? COLORS.error : COLORS.textTertiary} size={20} />}
              rightIcon={
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  activeOpacity={0.7}
                  style={styles.eyeIconContainer}
                >
                  {showPassword ? (
                    <EyeOff color={COLORS.textTertiary} size={20} />
                  ) : (
                    <Eye color={COLORS.textTertiary} size={20} />
                  )}
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <CheckIcon color={COLORS.white} size={14} />}
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

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              size="large"
              style={styles.submitButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue with Google"
              onPress={() => {}}
              variant="outline"
              size="large"
              icon={<GoogleIcon size={20} />}
              style={styles.socialButton}
            />

            <Button
              title="Continue with Apple"
              onPress={() => {}}
              variant="outline"
              size="large"
              icon={<AppleIcon size={20} />}
              style={styles.socialButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Do not have an account? </Text>
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
    marginTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  welcomeText: {
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
    backgroundColor: COLORS.white,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border || '#E5E7EB',
  },
  dividerText: {
    ...FONTS.body2,
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

export default LoginScreen;