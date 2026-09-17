// src/components/icons/Logo.js
// VivaWorks logo: open "V" wordmark — NOT inside a box.
// Pass `color` for a monochrome version (e.g. white on the splash screen).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const Logo = ({
  size = 56,
  color,                 // solid stroke color — overrides gradient when provided
  showWordmark = true,
  vivaColor,
  worksColor,
}) => {
  const scale = size / 48;
  const stroke = color || 'url(#vivaGrad)';
  const dotColor = color || COLORS.primary;

  return (
    <View style={styles.container}>
      <Svg width={48 * scale} height={48 * scale} viewBox="0 0 48 48">
        {!color && (
          <Defs>
            <LinearGradient id="vivaGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={COLORS.primary} />
              <Stop offset="1" stopColor={COLORS.primaryDark || COLORS.primary} />
            </LinearGradient>
          </Defs>
        )}
        {/* Left stroke */}
        <Path
          d="M9 6 L23.5 42"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right stroke */}
        <Path
          d="M39 6 L24.5 42"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Accent dot */}
        <Path
          d="M42.5 2.5 m-2.5 0 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0"
          fill={dotColor}
        />
      </Svg>

      {showWordmark && (
        <Text style={styles.wordmark}>
          <Text style={[styles.viva, { color: vivaColor || COLORS.primary }]}>
            Viva
          </Text>
          <Text style={[styles.works, { color: worksColor || COLORS.textPrimary }]}>
            Works
          </Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wordmark: {
    ...FONTS.h3,
    marginTop: SIZES.sm,
  },
  viva: {
    fontWeight: '700',
  },
  works: {
    fontWeight: '700',
  },
});

export default Logo;
