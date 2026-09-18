import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Theme
import { COLORS, FONTS } from '../constants/theme';

// API
import api from '../utils/api'; // Adjust path if needed

// Icons
import {
  MapPin,
  Briefcase,
  Users,
  Mail,
  UserPlus,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react-native';

const UserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🎯 IMPORTANT: Change this endpoint to match your actual backend API
      // e.g., `/users/${userId}`, `/profiles/${userId}`, or `/connections/user/${userId}`
      const response = await api.get(`/users/${userId}`);
      setUser(response.data.user || response.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.response?.data?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to your chat screen with this user
    navigation.navigate('Chat', { userId: user.id, userName: `${user.firstName} ${user.lastName}` });
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      await api.post(`/connections/request/${userId}`);
      // You could show a toast here, or update local state to show "Request Sent"
      alert('Connection request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const f = firstName?.trim()?.[0] || '';
    const l = lastName?.trim()?.[0] || '';
    return `${f}${l}`.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary || '#059669'} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <View style={styles.errorIconWrap}>
          <AlertCircle size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error || 'User not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile} activeOpacity={0.8}>
          <RefreshCw size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover / Header Area */}
        <View style={styles.headerSection}>
          <View style={styles.coverPhoto} />
          
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(user.firstName, user.lastName)}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.name}>{fullName || 'Unknown User'}</Text>
            {user.headline && <Text style={styles.headline}>{user.headline}</Text>}
            
            <View style={styles.metaRow}>
              {user.location && (
                <View style={styles.metaItem}>
                  <MapPin size={14} color={COLORS.textTertiary || '#9CA3AF'} />
                  <Text style={styles.metaText}>{user.location}</Text>
                </View>
              )}
              {user.connectionsCount !== undefined && (
                <View style={styles.metaItem}>
                  <Users size={14} color={COLORS.textTertiary || '#9CA3AF'} />
                  <Text style={styles.metaText}>{user.connectionsCount} connections</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleMessage}
                activeOpacity={0.8}
              >
                <Mail size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleConnect}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary || '#059669'} />
                ) : (
                  <>
                    <UserPlus size={18} color={COLORS.primary || '#059669'} />
                    <Text style={styles.secondaryButtonText}>Connect</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About Section */}
        {user.about && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{user.about}</Text>
          </View>
        )}

        {/* Experience / Current Role Section */}
        {(user.currentRole || user.company) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current Role</Text>
            <View style={styles.experienceItem}>
              <View style={styles.experienceIconWrap}>
                <Briefcase size={20} color={COLORS.primary || '#059669'} />
              </View>
              <View style={styles.experienceDetails}>
                <Text style={styles.experienceTitle}>{user.currentRole || 'Professional'}</Text>
                {user.company && <Text style={styles.experienceCompany}>{user.company}</Text>}
                {user.employmentType && <Text style={styles.experienceType}>{user.employmentType}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Skills Section */}
        {user.skills && user.skills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Top Skills</Text>
            <View style={styles.skillsContainer}>
              {user.skills.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Website / Links Section */}
        {user.website && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Links</Text>
            <TouchableOpacity 
              style={styles.linkItem} 
              onPress={() => Linking.openURL(user.website)}
              activeOpacity={0.7}
            >
              <LinkIcon size={16} color={COLORS.primary || '#059669'} />
              <Text style={styles.linkText} numberOfLines={1}>{user.website}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerSection: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    marginBottom: 12,
  },
  coverPhoto: {
    height: 120,
    backgroundColor: '#D1FAE5', // Light emerald
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headline: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  experienceItem: {
    flexDirection: 'row',
    gap: 12,
  },
  experienceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceDetails: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  experienceCompany: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  experienceType: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});

export default UserProfileScreen;