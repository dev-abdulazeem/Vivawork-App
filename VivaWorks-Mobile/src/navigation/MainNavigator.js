import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Theme
import { COLORS, SIZES } from '../constants/theme';

// Tab Screens
import HomeScreen from '../screens/HomeScreen';
import JobsScreen from '../screens/JobsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AudioRoomsScreen from '../screens/AudioRoomsScreen';

// Stack Screens
import JobDetailScreen from '../screens/JobDetailScreen';
import PostJobScreen from '../screens/PostJobScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import AudioRoomDetailScreen from '../screens/AudioRoomDetailScreen';
import WalletScreen from '../screens/WalletScreen';

// Import clean, professional icons from lucide-react-native
import { 
  Home, 
  Briefcase, 
  Mic, 
  MessageSquare, 
  User 
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Premium Tab Icon Component
const TabIcon = ({ Icon, focused }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    <Icon 
      size={24} 
      color={focused ? COLORS.primary : COLORS.textTertiary} 
      strokeWidth={focused ? 2.5 : 2} 
    />
  </View>
);

// Bottom Tabs Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true, // Hides tab bar when keyboard is open for better UX
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Briefcase} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Rooms"
        component={AudioRoomsScreen}
        options={{
          tabBarLabel: 'Rooms',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Mic} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageSquare} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator (Tabs + Detail Screens)
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="AudioRoomDetail" component={AudioRoomDetailScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || '#F1F5F9',
    paddingTop: 12,
    paddingBottom: 24, // Extra padding for iPhone home indicator
    height: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  tabIconContainer: {
    width: 48,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  tabIconFocused: {
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
  },
});

export default MainNavigator;