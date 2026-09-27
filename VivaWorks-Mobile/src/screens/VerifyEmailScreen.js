import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Button from '../components/Button';

import {
  Mail,
  ShieldCheck,
  ArrowRight,
  RotateCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

const VerifyEmailScreen = ({ route, navigation }) => {
  const email = route.params?.email || 'your email';
  
  // State
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Refs
  const inputRefs = useRef([]);
  
  // Animated Values for Fluid Input Effects
  const boxScales = useRef([...Array(6)].map(() => new Animated.Value(1))).current;
  
  // Animated Values for Success Animation
  const boxesOpacity = useRef(new Animated.Value(1)).current;
  const boxesScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successRotate = useRef(new Animated.Value(-0.5)).current; // Starts at -180 degrees

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎯 Fluid Animation Trigger
  const animateBox = (index) => {
    Animated.sequence([
      Animated.spring(boxScales[index], {
        toValue: 1.08,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(boxScales[index], {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCodeChange = (value, index) => {
    setError('');
    
    // Handle paste (e.g., "123456")
    if (value.length > 1) {
      const pastedCode = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
          animateBox(index + i);
        }
      });
      setCode(newCode);
      const lastIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    // Handle single digit
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value) {
      animateBox(index);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  // 🎯 Epic Success Animation
  const triggerSuccessAnimation = () => {
    setIsSuccess(true);
    
    // 1. Fade and shrink the boxes
    Animated.parallel([
      Animated.timing(boxesOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(boxesScale, {
        toValue: 0.5,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Pop and rotate the success checkmark
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(successRotate, {
          toValue: 0, // Rotates from -0.5 (-180deg) to 0
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3. Navigate after a brief pause to admire the animation
        setTimeout(() => {
          navigation.navigate('Login'); // Or 'DocumentVerification' based on your flow
        }, 1200);
      });
    });
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/auth/verify-email', {
        email,
        code: verificationCode,
      });
      
      // Trigger the beautiful success animation instead of instant navigation
      triggerSuccessAnimation();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
      // Shake animation on error could go here, but clearing code is standard
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        
        {/* 🎯 SUCCESS OVERLAY (Animates in on success) */}
        {isSuccess && (
          <View style={styles.successOverlay}>
            <Animated.View
              style={[
                styles.successIconContainer,
                {
                  transform: [
                    { scale: successScale },
                    { rotate: successRotate.interpolate({ inputRange: [-0.5, 0], outputRange: ['-180deg', '0deg'] }) },
                  ],
                },
              ]}
            >
              <CheckCircle size={80} color="#059669" strokeWidth={2.5} />
            </Animated.View>
            <Animated.Text style={[styles.successText, { opacity: successScale }]}>
              Email Verified!
            </Animated.Text>
          </View>
        )}

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: boxesOpacity, transform: [{ scale: boxesScale }] }]}>
          <View style={styles.iconContainer}>
            <Mail size={32} color="#059669" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </Animated.View>

        {/* Error Banner */}
        {error ? (
          <Animated.View style={[styles.errorBanner, { opacity: boxesOpacity, transform: [{ scale: boxesScale }] }]}>
            <AlertCircle size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {/* Code Input */}
        <Animated.View style={[styles.codeContainer, { opacity: boxesOpacity, transform: [{ scale: boxesScale }] }]}>
          {code.map((digit, index) => (
            <Animated.View
              key={index}
              style={[
                styles.inputWrapper,
                { transform: [{ scale: boxScales[index] }] },
              ]}
            >
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  error && styles.codeInputError,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
                contextMenuHidden // Prevents paste menu from blocking UI
              />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Verify Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: boxesOpacity, transform: [{ scale: boxesScale }] }]}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (isLoading || code.join('').length !== 6) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.spinner} />
            ) : (
              <>
                <Text style={styles.verifyButtonText}>Verify Email</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Resend & Footer */}
        <Animated.View style={[styles.footer, { opacity: boxesOpacity, transform: [{ scale: boxesScale }] }]}>
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={countdown > 0 || isResending}
              activeOpacity={0.7}
            >
              <View style={styles.resendLinkWrapper}>
                {countdown > 0 || isResending ? (
                  <RotateCw size={14} color="#9CA3AF" style={styles.spinningIcon} />
                ) : null}
                <Text
                  style={[
                    styles.resendLink,
                    (countdown > 0 || isResending) && styles.resendLinkDisabled,
                  ]}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.expiryContainer}>
            <ShieldCheck size={16} color="#9CA3AF" />
            <Text style={styles.expiryText}>Your verification code expires in 10 minutes</Text>
          </View>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Clean gray-50
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'center',
  },
  
  // Success Overlay
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.5,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    backgroundColor: '#ECFDF5', // Solid emerald-50, NO gradient
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    color: '#059669',
    fontWeight: '700',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#B91C1C',
    fontWeight: '500',
  },

  // Code Input
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 10,
  },
  inputWrapper: {
    // Wrapper needed for independent scale animations
  },
  codeInput: {
    width: 52,
    height: 64,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  codeInputFilled: {
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  // Button
  buttonContainer: {
    marginBottom: 32,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    // Note: For a spinning animation, you'd add an Animated.Value, 
    // but a static spinner is fine for the disabled state, or we can animate it.
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 15,
    color: '#6B7280',
  },
  resendLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spinningIcon: {
    // You can add a continuous rotation animation to this if desired
  },
  resendLink: {
    fontSize: 15,
    color: '#059669',
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    justifyContent: 'center',
  },
  expiryText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default VerifyEmailScreen;