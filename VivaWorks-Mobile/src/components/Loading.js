// src/components/Loading.js

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Loading = ({
  size = 'large',
  color = COLORS.primary,
  text = '',
  fullScreen = false,
  overlay = false,
  style,
  textStyle,
}) => {
  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
    style,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={color} />
        {text ? (
          <Text style={[styles.text, textStyle]}>{text}</Text>
        ) : null}
      </View>
    </View>
  );
};

// Full screen loading variant
Loading.FullScreen = ({ text = 'Loading...', ...props }) => (
  <Loading fullScreen text={text} {...props} />
);

// Overlay loading variant (for modals, cards, etc.)
Loading.Overlay = ({ text = '', ...props }) => (
  <Loading overlay text={text} {...props} />
);

// Inline loading (for buttons, small areas)
Loading.Inline = ({ size = 'small', ...props }) => (
  <Loading size={size} {...props} />
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
});

export default Loading;