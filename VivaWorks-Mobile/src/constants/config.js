// src/constants/config.js

// ⚠️ IMPORTANT: Replace with your computer's IP address
// Find it by running 'ipconfig' in Command Prompt
// Look for "IPv4 Address" under your WiFi adapter

const YOUR_COMPUTER_IP = '192.168.43.57'; // ← CHANGE THIS TO YOUR IP

const CONFIG = {
  // API Base URL
  API_URL: `http://${YOUR_COMPUTER_IP}:5000/api`, // Change port if your backend uses different port
  
  // Socket URL (if you use Socket.io for messages)
  SOCKET_URL: `http://${YOUR_COMPUTER_IP}:5000`,
  
  // App Info
  APP_NAME: 'VivaWorks',
  APP_VERSION: '1.0.0',
  
  // Pagination
  ITEMS_PER_PAGE: 20,
  
  // Timeout
  API_TIMEOUT: 30000, // 30 seconds
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    ONBOARDING_COMPLETED: 'onboardingCompleted',
  },
};

export default CONFIG;