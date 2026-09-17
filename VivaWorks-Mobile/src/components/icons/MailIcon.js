// src/components/icons/MailIcon.js
import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MailIcon = ({ size = 20, color = '#9CA3AF' }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path d="m22 6-10 7L2 6" />
  </Svg>
);

export default MailIcon;
