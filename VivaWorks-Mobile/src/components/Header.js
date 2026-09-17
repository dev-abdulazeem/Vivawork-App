// src/components/Header.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Header = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBack = false,
  onBackPress,
  centerComponent,
  transparent = false,
  style,
  titleStyle,
}) => {
  const renderLeft = () => {
    if (leftIcon) {
      return (
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onLeftPress}
          activeOpacity={0.7}
        >
          {leftIcon}
        </TouchableOpacity>
      );
    }

    if (showBack) {
      return (
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.sideButton} />;
  };

  const renderCenter = () => {
    if (centerComponent) {
      return centerComponent;
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };

  const renderRight = () => {
    if (rightIcon) {
      return (
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onRightPress}
          activeOpacity={0.7}
        >
          {rightIcon}
        </TouchableOpacity>
      );
    }

    return <View style={styles.sideButton} />;
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.container,
        transparent && styles.transparentContainer,
        style,
      ]}
    >
      <StatusBar
        barStyle={transparent ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : COLORS.white}
      />
      <View style={styles.header}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    minHeight: 56,
  },
  sideButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
  },
  title: {
    ...FONTS.h5,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default Header;