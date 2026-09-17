// src/screens/SplashScreen.js

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect, Path, Ellipse } from 'react-native-svg';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Logo } from '../components/icons';

const PRIMARY_DARK = COLORS.primaryDark || '#085C38';

const SplashScreen = ({ navigation }) => {
  // Indeterminate loading bar — slides back and forth like the reference
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 70],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />

      {/* Background: gradient + soft curved shapes (like the reference) */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={PRIMARY_DARK} />
            <Stop offset="1" stopColor={COLORS.primary} />
          </SvgGradient>
        </Defs>
        <Rect width="375" height="812" fill="url(#bg)" />

        {/* Decorative curves */}
        <Path
          d="M-40 620 C 120 560, 260 700, 430 610 L 430 860 L -40 860 Z"
          fill="#FFFFFF"
          opacity="0.05"
        />
        <Path
          d="M-60 680 C 100 640, 300 760, 450 670 L 450 860 L -60 860 Z"
          fill="#FFFFFF"
          opacity="0.06"
        />
        <Ellipse cx="330" cy="90" rx="120" ry="120" fill="#FFFFFF" opacity="0.04" />
        <Ellipse cx="30" cy="250" rx="90" ry="90" fill="#000000" opacity="0.05" />
      </Svg>

      {/* Logo + Wordmark */}
      <View style={styles.logoContainer}>
        <Logo
          size={88}
          color="#FFFFFF"
          showWordmark={false}
        />
        <Text style={styles.appName}>
          <Text style={styles.appNameViva}>Viva</Text>
          <Text style={styles.appNameWorks}>Works</Text>
        </Text>
        <Text style={styles.tagline}>Work  •  Connect  •  Grow</Text>
      </View>

      {/* Loading */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              { transform: [{ translateX }] },
            ]}
          />
        </View>
        <Text style={styles.taglineBottom}>Building opportunities,{'\n'}not just jobs.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    ...FONTS.h2,
    fontWeight: '700',
    marginTop: SIZES.md,
  },
  appNameViva: {
    color: COLORS.white,
  },
  appNameWorks: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  tagline: {
    ...FONTS.body1,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 3,
    marginTop: SIZES.sm,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 90,
    alignItems: 'center',
  },
  loadingBar: {
    width: 110,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
  },
  loadingProgress: {
    position: 'absolute',
    width: 45,
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  taglineBottom: {
    ...FONTS.body3,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SplashScreen;
