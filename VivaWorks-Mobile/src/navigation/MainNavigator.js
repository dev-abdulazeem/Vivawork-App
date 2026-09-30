import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Theme
import { COLORS, SIZES } from '../constants/theme';

// Context & API
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Tab Screens
import HomeScreen from '../screens/HomeScreen';
import JobsScreen from '../screens/JobsScreen';
import WalletScreen from '../screens/WalletScreen';
import NetworkScreen from '../screens/NetworkScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen'; 

// Stack Screens
import JobDetailScreen from '../screens/JobDetailScreen';
import PostJobScreen from '../screens/PostJobScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import AudioRoomsScreen from '../screens/AudioRoomsScreen';
import AudioRoomDetailScreen from '../screens/AudioRoomDetailScreen';

// 🎯 NEW: Find Freelancer Screen
import FindFreelancerScreen from '../screens/FindFreelancerScreen';

// 🎯 NEW: Contract Screens
import ContractsScreen from '../screens/ContractsScreen';
import ContractDetailScreen from '../screens/ContractDetailScreen';

// Import clean, professional icons from lucide-react-native
import { 
  Home, 
  Briefcase, 
  Wallet,
  Users,
  MessageSquare, 
  User 
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Configuration Array (6 tabs)
const TABS = [
  { name: 'Home', label: 'Home', icon: Home, component: HomeScreen },
  { name: 'Jobs', label: 'Jobs', icon: Briefcase, component: JobsScreen },
  { name: 'Wallet', label: 'Wallet', icon: Wallet, component: WalletScreen },
  { name: 'Network', label: 'Network', icon: Users, component: NetworkScreen },
  { name: 'Messages', label: 'Messages', icon: MessageSquare, component: MessagesScreen },
  { name: 'Profile', label: 'Profile', icon: User, component: ProfileScreen },
];

// 🎯 Animated Icon Component: Pops up and scales when focused
const AnimatedTabIcon = ({ Icon, focused, color, size }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: focused ? -4 : 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }}>
      <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
};

// 🎨 Custom Tab Bar with Slide-Up Entrance Animation & Message Badge
const CustomTabBar = ({ state, descriptors, navigation, unreadMessages = 0 }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View style={[styles.tabBarWrapper, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused ? COLORS.primary : COLORS.textTertiary;
          const tabConfig = TABS.find(t => t.name === route.name);
          const IconComponent = tabConfig ? tabConfig.icon : Home;
          const isMessagesTab = route.name === 'Messages';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <AnimatedTabIcon 
                  Icon={IconComponent} 
                  focused={isFocused} 
                  color={color} 
                  size={22}
                />
                
                {/* 🎯 Message Badge Indicator */}
                {isMessagesTab && unreadMessages > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={[styles.tabLabel, { color }]}>
                {options.tabBarLabel !== undefined ? options.tabBarLabel : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

// Bottom Tabs Navigator
const MainTabs = () => {
  const { isAuthenticated, user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      // Only fetch if the user is logged in
      if (!isAuthenticated || !user) {
        setUnreadMessages(0);
        return;
      }
      
      try {
        // 🎯 Fetch unread messages count from your backend
        // Adjust the endpoint '/messages/unread-count' to match your actual API route
        const response = await api.get('/messages/unread-count');
        setUnreadMessages(response.data?.count || 0);
      } catch (error) {
        console.error('Failed to fetch unread messages:', error);
        // Fallback to 0 on error so the badge doesn't get stuck
        setUnreadMessages(0);
      }
    };

    // Fetch immediately on mount
    fetchUnreadMessages();

    // Optional: Poll every 30 seconds to keep the badge updated in real-time
    const interval = setInterval(fetchUnreadMessages, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} unreadMessages={unreadMessages} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
          }}
        />
      ))}
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
      
      {/* Audio & Social */}
      <Stack.Screen 
        name="AudioRooms" 
        component={AudioRoomsScreen} 
        options={{ 
          headerShown: true,
          title: 'VivaRooms',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen name="AudioRoomDetail" component={AudioRoomDetailScreen} />
      
      {/* User Profiles */}
      <Stack.Screen 
        name="UserProfile" 
        component={ProfileScreen} 
        options={{ 
          headerShown: true,
          title: 'Profile'
        }} 
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      
      {/* Jobs & Freelancers */}
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="PostJob" component={PostJobScreen} />
      
      {/* 🎯 NEW: Find Freelancer Route */}
      <Stack.Screen 
        name="FindFreelancer" 
        component={FindFreelancerScreen} 
        options={{ 
          headerShown: true,
          title: 'Find Freelancer',
          headerBackTitle: 'Back'
        }} 
      />
      
      {/* 🎯 NEW: Added Contract Screens */}
      <Stack.Screen name="Contracts" component={ContractsScreen} />
      <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
      
      {/* Communication & Settings */}
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || '#F8FAFC',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444', // Standard red for notifications
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.1,
  },
});

export default MainNavigator;