import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Header from '../components/Header';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Button from '../components/Button';

import {
  Settings,
  AlertCircle,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  TrendingUp,
  Users,
  Award,
  Globe,
  Link as LinkIcon,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  DollarSign,
  ExternalLink,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [profileStats, setProfileStats] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setError(null);
      const response = await api.get('/users/profile');
      const userData = response.data?.user || response.data;
      
      if (userData && userData.id) {
        setUser(userData);
        try {
          const statsRes = await api.get('/users/profile-stats');
          setProfileStats(statsRes.data);
        } catch (e) {
          console.log('Stats not available');
        }
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (err) {
      console.error('Error fetching profile:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load profile');
      if (authUser && authUser.id) {
        setUser(authUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        onPress: () => {
          logout();
          navigation.navigate('Auth');
        },
        style: 'destructive',
      },
    ]);
  };

  const getFullName = () => {
    if (!user) return 'User';
    const first = user.firstName || '';
    const last = user.lastName || '';
    const full = `${first} ${last}`.trim();
    return full || user.name || 'User';
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getHeadline = () => user?.headline || user?.title || 'Member';

  const getVerificationStatus = () => {
    if (user?.isVerified) return 'verified';
    const status = user?.verificationStatus?.toLowerCase();
    if (status === 'pending') return 'pending';
    return 'unverified';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-NG', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'experience', label: 'Experience', icon: Briefcase },
    { key: 'portfolio', label: 'Portfolio', icon: Award },
    { key: 'skills', label: 'Skills', icon: Globe },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.bannerContainer}>
        {user?.banner ? (
          <Image source={{ uri: user.banner }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder]} />
        )}
        <View style={styles.bannerOverlay} />
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          {user?.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{getFullName()}</Text>
            {user?.isVerified && (
              <BadgeCheck size={20} color={COLORS.success || '#10B981'} fill={COLORS.success || '#10B981'} />
            )}
          </View>
          
          <Text style={styles.headline}>{getHeadline()}</Text>
          
          <View style={styles.metaRow}>
            {user?.location && (
              <View style={styles.metaItem}>
                <MapPin size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{user.location}</Text>
              </View>
            )}
            {user?.createdAt && (
              <View style={styles.metaItem}>
                <Calendar size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>Joined {formatDate(user.createdAt)}</Text>
              </View>
            )}
          </View>

          <View style={[
            styles.verificationBadge,
            getVerificationStatus() === 'verified' && styles.verifiedBadge,
            getVerificationStatus() === 'pending' && styles.pendingBadge,
          ]}>
            {getVerificationStatus() === 'verified' ? (
              <ShieldCheck size={14} color={COLORS.success || '#10B981'} />
            ) : getVerificationStatus() === 'pending' ? (
              <Clock size={14} color={COLORS.warning || '#F59E0B'} />
            ) : (
              <ShieldAlert size={14} color={COLORS.textTertiary} />
            )}
            <Text style={[
              styles.verificationText,
              getVerificationStatus() === 'verified' && styles.verifiedText,
              getVerificationStatus() === 'pending' && styles.pendingText,
            ]}>
              {getVerificationStatus() === 'verified' ? 'Verified Professional' : 
               getVerificationStatus() === 'pending' ? 'Verification Pending' : 'Unverified'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.followersCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.ratingRow}>
            <Star size={16} color={COLORS.warning || '#F59E0B'} fill={COLORS.warning || '#F59E0B'} />
            <Text style={styles.statValue}>{user?.averageRating?.toFixed(1) || '0.0'}</Text>
          </View>
          <Text style={styles.statLabel}>{user?.totalReviews || 0} Reviews</Text>
        </View>
      </View>
    </View>
  );

  const renderOverview = () => {
    const links = {
      website: user?.profile?.website || user?.website,
      linkedin: user?.profile?.linkedin || user?.linkedin,
      twitter: user?.profile?.twitter || user?.twitter,
      github: user?.profile?.github || user?.github,
    };
    const hasLinks = links.website || links.linkedin || links.twitter || links.github;

    return (
      <>
        {user?.bio && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </Card>
        )}

        {user?.hourlyRate && (
          <Card style={styles.section}>
            <View style={styles.rateHeader}>
              <DollarSign size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Hourly Rate</Text>
            </View>
            <Text style={styles.rateValue}>{formatCurrency(user.hourlyRate)}</Text>
            <Text style={styles.rateSubtext}>per hour</Text>
          </Card>
        )}

        {profileStats && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <TrendingUp size={20} color={COLORS.primary} />
                <Text style={styles.statBoxValue}>{profileStats.profileViewsLast7Days || 0}</Text>
                <Text style={styles.statBoxLabel}>Profile Views</Text>
              </View>
              <View style={styles.statBox}>
                <Users size={20} color={COLORS.success || '#10B981'} />
                <Text style={styles.statBoxValue}>{profileStats.impressionsLast7Days || 0}</Text>
                <Text style={styles.statBoxLabel}>Impressions</Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactList}>
            {user?.email && (
              <View style={styles.contactItem}>
                <View style={styles.contactIconBg}>
                  <Mail size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText} numberOfLines={1}>{user.email}</Text>
              </View>
            )}
            {(user?.profile?.phone || user?.phone) && (
              <View style={styles.contactItem}>
                <View style={styles.contactIconBg}>
                  <Phone size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText}>{user.profile?.phone || user.phone}</Text>
              </View>
            )}
            {user?.location && (
              <View style={styles.contactItem}>
                <View style={styles.contactIconBg}>
                  <MapPin size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.contactText}>{user.location}</Text>
              </View>
            )}
          </View>
        </Card>

        {hasLinks && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>
            <View style={styles.linksList}>
              {links.website && (
                <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                  <Globe size={18} color={COLORS.primary} />
                  <Text style={styles.linkText}>Website</Text>
                  <ExternalLink size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
              {links.linkedin && (
                <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                  <LinkIcon size={18} color="#0077B5" />
                  <Text style={styles.linkText}>LinkedIn</Text>
                  <ExternalLink size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
              {links.twitter && (
                <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                  <LinkIcon size={18} color="#1DA1F2" />
                  <Text style={styles.linkText}>Twitter</Text>
                  <ExternalLink size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
              {links.github && (
                <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                  <LinkIcon size={18} color="#333333" />
                  <Text style={styles.linkText}>GitHub</Text>
                  <ExternalLink size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      </>
    );
  };

  const renderExperience = () => {
    const experience = user?.profile?.experience || user?.experience || [];
    return (
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {experience.length > 0 ? (
          experience.map((exp, index) => (
            <View key={exp.id || index} style={[styles.experienceItem, index !== experience.length - 1 && styles.experienceItemBorder]}>
              <View style={styles.experienceIcon}>
                <Briefcase size={20} color={COLORS.primary} />
              </View>
              <View style={styles.experienceContent}>
                <Text style={styles.experienceTitle}>{exp.title || exp.role || 'Role'}</Text>
                <Text style={styles.experienceCompany}>{exp.company || 'Company'}</Text>
                <View style={styles.experienceMeta}>
                  {exp.type && <Text style={styles.experienceType}>{exp.type}</Text>}
                  {exp.period && <Text style={styles.experiencePeriod}>{exp.period}</Text>}
                </View>
                {exp.description && (
                  <Text style={styles.experienceDesc} numberOfLines={3}>
                    {exp.description}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Briefcase size={32} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No experience added yet</Text>
          </View>
        )}
      </Card>
    );
  };

  const renderPortfolio = () => {
    const portfolio = user?.profile?.portfolio || user?.portfolio || [];
    const itemWidth = (width - 48 - 12) / 2; // 48 = padding (16*2), 12 = gap

    return (
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio</Text>
        {portfolio.length > 0 ? (
          <View style={styles.portfolioGrid}>
            {portfolio.slice(0, 4).map((item, index) => (
              <TouchableOpacity 
                key={item.id || index} 
                style={[styles.portfolioItem, { width: itemWidth }]}
                activeOpacity={0.8}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
                ) : (
                  <View style={styles.portfolioPlaceholder}>
                    <Award size={28} color={COLORS.textTertiary} />
                  </View>
                )}
                <View style={styles.portfolioOverlay}>
                  <Text style={styles.portfolioTitle} numberOfLines={1}>
                    {item.title || 'Untitled Project'}
                  </Text>
                  {item.category && (
                    <Text style={styles.portfolioCategory}>{item.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Award size={32} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No portfolio items yet</Text>
          </View>
        )}
      </Card>
    );
  };

  const renderSkills = () => {
    const skills = user?.skills || [];
    const languages = user?.profile?.languages || user?.languages || [];

    return (
      <>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {skills.length > 0 ? (
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Globe size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No skills added yet</Text>
            </View>
          )}
        </Card>

        {languages.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsContainer}>
              {languages.map((lang, index) => (
                <View key={index} style={[styles.skillTag, styles.languageTag]}>
                  <Globe size={14} color={COLORS.success || '#10B981'} />
                  <Text style={[styles.skillText, styles.languageText]}>{lang}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </>
    );
  };

  if (isLoading) {
    return <Loading.FullScreen text="Loading your profile..." />;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Profile" />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={COLORS.error || '#EF4444'} strokeWidth={1.5} />
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
          <Text style={styles.errorMessage}>{error || 'Please try again'}</Text>
          <Button
            title="Retry"
            onPress={fetchProfile}
            variant="primary"
            size="medium"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Profile"
        rightIcon={
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <Settings size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderHeader()}

        <View style={styles.actionButtons}>
          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            variant="primary"
            size="medium"
            style={styles.editButton}
          />
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Icon 
                    size={16} 
                    color={isActive ? COLORS.white : COLORS.textSecondary} 
                  />
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'experience' && renderExperience()}
          {activeTab === 'portfolio' && renderPortfolio()}
          {activeTab === 'skills' && renderSkills()}
        </View>

        <View style={styles.logoutContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="large"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary || '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingBottom: 16,
  },
  bannerContainer: {
    height: 140,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    backgroundColor: COLORS.primary || '#2563EB',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  profileInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -45,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray100 || '#F3F4F6',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success || '#10B981',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  nameContainer: {
    flex: 1,
    paddingTop: 50,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.gray100 || '#F3F4F6',
    marginTop: 12,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  verifiedText: {
    color: COLORS.success || '#10B981',
  },
  pendingText: {
    color: COLORS.warning || '#F59E0B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border || '#E2E8F0',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  editButton: {
    borderRadius: 12,
  },
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight || '#F1F5F9',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.gray100 || '#F3F4F6',
  },
  activeTab: {
    backgroundColor: COLORS.primary || '#2563EB',
    shadowColor: COLORS.primary || '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  rateSubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary || '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statBoxLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  linksList: {
    gap: 10,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.backgroundSecondary || '#F8FAFC',
    borderRadius: 12,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: '600',
  },
  experienceItem: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  experienceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight || '#F1F5F9',
  },
  experienceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  experienceContent: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  experienceCompany: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  experienceMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  experienceType: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
  },
  experiencePeriod: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  experienceDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 22,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioItem: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.gray100 || '#F3F4F6',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  portfolioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  portfolioCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillTag: {
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  languageTag: {
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageText: {
    color: COLORS.success || '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 8,
  },
  settingsButton: {
    padding: 8,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  logoutButton: {
    borderColor: COLORS.error || '#EF4444',
  },
});

export default ProfileScreen;