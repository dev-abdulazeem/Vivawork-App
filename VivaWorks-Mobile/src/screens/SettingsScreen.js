// src/screens/SettingsScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    messageNotifications: true,
    jobAlerts: true,
    marketingEmails: false,
    darkMode: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, type = 'toggle', value, onPress, onToggle }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={type === 'toggle'}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'toggle' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
          thumbColor={value ? COLORS.primary : COLORS.gray400}
        />
      )}
      {type === 'link' && (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Settings"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Avatar source={user?.avatar} name={user?.name} size="large" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Account Section */}
        <SectionHeader title="Account" />
        <Card style={styles.section}>
          <SettingItem
            icon="🔒"
            title="Account & Security"
            subtitle="Password, 2FA, sessions"
            type="link"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="💳"
            title="Payment Methods"
            subtitle="Manage your payment options"
            type="link"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🆔"
            title="Verification"
            subtitle="Verify your identity"
            type="link"
            onPress={() => {}}
          />
        </Card>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <Card style={styles.section}>
          <SettingItem
            icon="🔔"
            title="Push Notifications"
            subtitle="Receive push notifications"
            type="toggle"
            value={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📧"
            title="Email Notifications"
            subtitle="Receive email updates"
            type="toggle"
            value={settings.emailNotifications}
            onToggle={() => toggleSetting('emailNotifications')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="💬"
            title="Message Notifications"
            subtitle="Get notified for new messages"
            type="toggle"
            value={settings.messageNotifications}
            onToggle={() => toggleSetting('messageNotifications')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="💼"
            title="Job Alerts"
            subtitle="Get notified about new jobs"
            type="toggle"
            value={settings.jobAlerts}
            onToggle={() => toggleSetting('jobAlerts')}
          />
        </Card>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <Card style={styles.section}>
          <SettingItem
            icon="🎨"
            title="Appearance"
            subtitle="Light or dark mode"
            type="link"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🔊"
            title="Sound"
            type="toggle"
            value={settings.soundEnabled}
            onToggle={() => toggleSetting('soundEnabled')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📳"
            title="Vibration"
            type="toggle"
            value={settings.vibrationEnabled}
            onToggle={() => toggleSetting('vibrationEnabled')}
          />
        </Card>

        {/* Support Section */}
        <SectionHeader title="Support" />
        <Card style={styles.section}>
          <SettingItem
            icon="❓"
            title="Help & Support"
            subtitle="FAQs, contact us"
            type="link"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📄"
            title="Terms of Service"
            type="link"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🔏"
            title="Privacy Policy"
            type="link"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="ℹ️"
            title="About VivaWorks"
            subtitle="Version 1.0.0"
            type="link"
            onPress={() => {}}
          />
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="large"
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  profileCard: {
    margin: SIZES.md,
    marginBottom: SIZES.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  profileName: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
  },
  profileEmail: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    marginLeft: SIZES.lg,
  },
  section: {
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    paddingVertical: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  settingSubtitle: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: SIZES.md + 40 + SIZES.md,
  },
  logoutContainer: {
    padding: SIZES.md,
    marginTop: SIZES.lg,
  },
  logoutButton: {
    borderColor: COLORS.error,
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;