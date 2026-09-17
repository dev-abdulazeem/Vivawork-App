// src/components/icons/CheckIcon.js
import React from 'react';
import Svg, { Path } from 'react-native-svg';

const CheckIcon = ({ size = 12, color = '#FFFFFF' }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

export default CheckIcon;
