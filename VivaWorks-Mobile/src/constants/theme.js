// src/constants/theme.js

export const COLORS = {
  // Primary Colors
  primary: '#0B7A3E',        // Deep green (main brand color)
  primaryLight: '#E8F5E9',   // Light green background
  primaryDark: '#065F2F',    // Darker green for pressed states
  
  // Secondary Colors
  secondary: '#FF6B35',      // Orange accent
  secondaryLight: '#FFF3ED', // Light orange background
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  card: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

export const SIZES = {
  // Font Sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  body1: 16,
  body2: 14,
  body3: 12,
  caption: 12,
  small: 10,
  
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Border Radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
  
  // Icon Sizes
  iconSm: 16,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,
};

export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: '700' },
  h2: { fontSize: SIZES.h2, fontWeight: '700' },
  h3: { fontSize: SIZES.h3, fontWeight: '600' },
  h4: { fontSize: SIZES.h4, fontWeight: '600' },
  h5: { fontSize: SIZES.h5, fontWeight: '600' },
  h6: { fontSize: SIZES.h6, fontWeight: '600' },
  body1: { fontSize: SIZES.body1, fontWeight: '400' },
  body2: { fontSize: SIZES.body2, fontWeight: '400' },
  body3: { fontSize: SIZES.body3, fontWeight: '400' },
  caption: { fontSize: SIZES.caption, fontWeight: '400' },
  button: { fontSize: SIZES.body1, fontWeight: '600' },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default { COLORS, SIZES, FONTS, SHADOWS };