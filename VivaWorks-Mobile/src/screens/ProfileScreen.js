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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import {
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
  Pencil,
  Plus,
  X,
  Trash2,
  PencilLine,
  Building2,
  Activity,
  Zap,
  Crown,
  Diamond,
  Medal,
  BarChart3,
  Eye,
  UserPlus,
  Check,
  Heart,
  MessageCircle,
  FileText,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ─── CONSTANTS & HELPERS ────────────────────────────────────────────────
const EARNINGS_TIERS = [
  { key: 'newcomer', label: 'Newcomer', min: 0, max: 49999, color: '#6B7280', icon: Users },
  { key: 'rising_talent', label: 'Rising Talent', min: 50000, max: 249999, color: '#059669', icon: Zap },
  { key: 'established', label: 'Established', min: 250000, max: 999999, color: '#2563EB', icon: Star },
  { key: 'top_rated', label: 'Top Rated', min: 1000000, max: 4999999, color: '#D97706', icon: Crown },
  { key: 'legend', label: 'Legend', min: 5000000, max: Infinity, color: '#7C3AED', icon: Diamond },
];

const getTierByEarnings = (earnings) => {
  return EARNINGS_TIERS.find((t) => earnings >= t.min && earnings <= t.max) || EARNINGS_TIERS[0];
};

const formatEarningsPublic = (earnings) => {
  if (earnings === 0) return '₦0 earned';
  if (earnings < 10000) return 'Less than ₦10K earned';
  if (earnings < 50000) return '₦10K – ₦50K earned';
  if (earnings < 100000) return '₦50K – ₦100K earned';
  if (earnings < 500000) return '₦100K – ₦500K earned';
  if (earnings < 1000000) return '₦500K – ₦1M earned';
  if (earnings < 5000000) return '₦1M – ₦5M earned';
  return '₦5M+ earned';
};

const getActivityStatus = (profile) => {
  if (!profile) return { label: 'Offline', dot: null, show: false };
  if (profile.isOnline === true) return { label: 'Online', dot: '#059669', show: true };
  const lastActive = profile.lastActive || profile.last_active;
  if (!lastActive) return { label: 'Offline', dot: null, show: false };
  const lastActiveDate = new Date(lastActive);
  if (isNaN(lastActiveDate.getTime())) return { label: 'Offline', dot: null, show: false };
  const diff = Date.now() - lastActiveDate.getTime();
  if (diff < 5 * 60 * 1000) return { label: 'Online', dot: '#059669', show: true };
  if (diff < 30 * 60 * 1000) return { label: 'Recently active', dot: '#F59E0B', show: true };
  if (diff < 24 * 60 * 60 * 1000) return { label: 'Active today', dot: '#9CA3AF', show: false };
  return { label: 'Offline', dot: null, show: false };
};

const getVerificationLabel = (profile) => {
  if (!profile) return 'Unverified';
  if (profile.isVerified === true) return 'Verified';
  const vStatus = (profile.verificationStatus || '').toLowerCase();
  const docStatus = (profile.verification?.status || '').toLowerCase();
  const kycStatus = (profile.kycStatus || '').toLowerCase();
  if (vStatus === 'pending' || docStatus === 'pending' || kycStatus === 'pending') return 'Pending';
  if (vStatus === 'rejected' || docStatus === 'rejected' || kycStatus === 'rejected') return 'Rejected';
  return 'Unverified';
};

const getVerificationMessage = (profile) => {
  const label = getVerificationLabel(profile);
  if (label === 'Verified') return 'Identity confirmed';
  if (label === 'Pending') return 'Verification under review';
  if (label === 'Rejected') return 'Verification was rejected. Please resubmit.';
  return 'Complete signup verification to get verified';
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Not set';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const getInitials = (firstName, lastName) => {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────
const ProfileScreen = ({ navigation, route }) => {
  const targetUserId = route.params?.userId;
  const { user: currentUser, logout } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [profileStats, setProfileStats] = useState(null);
  
  const [userPosts, setUserPosts] = useState([]);
  const [userJobs, setUserJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [postLikes, setPostLikes] = useState({});

  // Modals State
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showProfileViews, setShowProfileViews] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0 });

  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', company: '', type: 'Full-time', period: '', description: '' });
  const [expSaving, setExpSaving] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);

  const [showPortModal, setShowPortModal] = useState(false);
  const [portForm, setPortForm] = useState({ title: '', category: '', description: '', url: '', imageUrl: '' });
  const [portSaving, setPortSaving] = useState(false);
  const [editingPortId, setEditingPortId] = useState(null);

  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id;

  // ─── FETCH DATA ───────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const uid = targetUserId || currentUser?.id;
      const response = await api.get(`/users/profile/${uid}`);
      const userData = response.data.user;

      setProfile(userData);
      setFollowerCount(userData.followersCount || 0);
      setFollowingCount(userData.followingCount || 0);
      setEditForm({
        headline: userData.headline || '',
        bio: userData.bio || '',
        location: userData.location || '',
        hourlyRate: userData.hourlyRate || '',
        skills: (userData.skills || []).join(', '),
        website: userData.profile?.website || userData.website || '',
        linkedin: userData.profile?.linkedin || userData.linkedin || '',
        twitter: userData.profile?.twitter || userData.twitter || '',
        github: userData.profile?.github || userData.github || '',
        availability: userData.profile?.availability || userData.availability || '',
        languages: ((userData.profile?.languages || userData.languages) || []).join(', '),
        phone: userData.phone || '',
        company: userData.company || '',
      });

      try {
        const postsResponse = await api.get(`/posts/user/${uid}?page=1&limit=10`);
        setUserPosts(postsResponse.data.posts || []);
      } catch { setUserPosts([]); }

      if (userData.isBuyer) {
        try {
          const jobsRes = isOwnProfile ? await api.get('/jobs/my-jobs') : await api.get('/jobs?limit=100');
          const allJobs = jobsRes.data.jobs || [];
          setUserJobs(isOwnProfile ? allJobs : allJobs.filter(job => job.buyerId === uid));
        } catch { setUserJobs([]); }
      }

      if (!isOwnProfile && targetUserId) {
        try {
          const followRes = await api.get(`/users/follow-status/${targetUserId}`);
          setIsFollowing(followRes.data.isFollowing);
        } catch { setIsFollowing(false); }
        
        try {
          await api.post(`/users/profile/${uid}/view`).catch(() => {});
        } catch {}
      }

      if (isOwnProfile) {
        try {
          const statsRes = await api.get('/users/profile-stats');
          setProfileStats(statsRes.data);
        } catch { setProfileStats(null); }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId, currentUser?.id, isOwnProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  // ─── ACTIONS ──────────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (isOwnProfile || !targetUserId) return;
    try {
      setFollowLoading(true);
      const res = await api.post(`/users/follow/${targetUserId}`);
      setIsFollowing(res.data.isFollowing);
      setFollowerCount(res.data.followersCount || 0);
      setFollowingCount(res.data.followingCount || 0);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchFollowList = async (type) => {
    try {
      setFollowList([]);
      setFollowListLoading(true);
      const uid = targetUserId || currentUser?.id;
      const res = await api.get(`/users/${type}/${uid}`);
      setFollowList(res.data.users || []);
    } catch (err) {
      Alert.alert('Error', `Failed to load ${type}`);
    } finally {
      setFollowListLoading(false);
    }
  };

  const fetchProfileViews = async () => {
    try {
      setFollowList([]);
      setFollowListLoading(true);
      const res = await api.get('/users/profile-views');
      setFollowList(res.data.users || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile views');
    } finally {
      setFollowListLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const uid = targetUserId || currentUser?.id;
      const res = await api.get(`/reviews/user/${uid}`);
      setReviewsList(res.data.reviews || []);
      setReviewsData({ averageRating: res.data.averageRating || 0, totalReviews: res.data.totalReviews || 0 });
    } catch (err) {
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const payload = {
        headline: editForm.headline || undefined,
        bio: editForm.bio || undefined,
        location: editForm.location || undefined,
        hourlyRate: editForm.hourlyRate ? parseFloat(editForm.hourlyRate) : undefined,
        skills: editForm.skills ? editForm.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        website: editForm.website || undefined,
        linkedin: editForm.linkedin || undefined,
        twitter: editForm.twitter || undefined,
        github: editForm.github || undefined,
        availability: editForm.availability || undefined,
        languages: editForm.languages ? editForm.languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        phone: editForm.phone || undefined,
        company: editForm.company || undefined,
      };
      const response = await api.patch('/users/profile', payload);
      setProfile(prev => ({ ...prev, ...response.data.user }));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExperience = async () => {
    if (!expForm.title.trim() || !expForm.company.trim()) {
      Alert.alert('Error', 'Title and company are required');
      return;
    }
    try {
      setExpSaving(true);
      if (editingExpId) await api.delete(`/users/experience/${editingExpId}`);
      const res = await api.post('/users/experience', {
        title: expForm.title, role: expForm.title, company: expForm.company,
        type: expForm.type, period: expForm.period, description: expForm.description,
      });
      const newExp = res.data.allExperience || [];
      setProfile(prev => ({ ...prev, experience: newExp, profile: { ...(prev.profile || {}), experience: newExp } }));
      setShowExpModal(false);
      setEditingExpId(null);
      setExpForm({ title: '', company: '', type: 'Full-time', period: '', description: '' });
      Alert.alert('Success', editingExpId ? 'Experience updated' : 'Experience added');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save experience');
    } finally {
      setExpSaving(false);
    }
  };

  const handleDeleteExperience = async (expId) => {
    Alert.alert('Delete', 'Delete this experience?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.delete(`/users/experience/${expId}`);
            const newExp = res.data.experience || [];
            setProfile(prev => ({ ...prev, experience: newExp, profile: { ...(prev.profile || {}), experience: newExp } }));
            Alert.alert('Success', 'Experience deleted');
          } catch { Alert.alert('Error', 'Failed to delete experience'); }
        }
      }
    ]);
  };

  const handleSavePortfolio = async () => {
    if (!portForm.title.trim()) {
      Alert.alert('Error', 'Project title is required');
      return;
    }
    try {
      setPortSaving(true);
      if (editingPortId) await api.delete(`/users/portfolio/${editingPortId}`);
      const res = await api.post('/users/portfolio', portForm);
      const newPort = res.data.allPortfolio || [];
      setProfile(prev => ({ ...prev, portfolio: newPort, profile: { ...(prev.profile || {}), portfolio: newPort } }));
      setShowPortModal(false);
      setEditingPortId(null);
      setPortForm({ title: '', category: '', description: '', url: '', imageUrl: '' });
      Alert.alert('Success', editingPortId ? 'Project updated' : 'Project added');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save project');
    } finally {
      setPortSaving(false);
    }
  };

  const handleDeletePortfolio = async (portId) => {
    Alert.alert('Delete', 'Delete this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.delete(`/users/portfolio/${portId}`);
            const newPort = res.data.portfolio || [];
            setProfile(prev => ({ ...prev, portfolio: newPort, profile: { ...(prev.profile || {}), portfolio: newPort } }));
            Alert.alert('Success', 'Project deleted');
          } catch { Alert.alert('Error', 'Failed to delete project'); }
        }
      }
    ]);
  };

  const handleLikePost = async (postId) => {
    try {
      const isLiked = postLikes[postId];
      if (isLiked) {
        await api.delete(`/posts/${postId}/like`);
        setPostLikes(prev => ({ ...prev, [postId]: false }));
        setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 1) - 1 } : p));
      } else {
        await api.post(`/posts/${postId}/like`);
        setPostLikes(prev => ({ ...prev, [postId]: true }));
        setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
      }
    } catch {
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive', 
        onPress: () => { 
          // ✅ FIX: Removed navigation.reset(). 
          // The AuthContext automatically updates `isAuthenticated` to false, 
          // which triggers your root AppNavigator to switch to the Auth screens.
          logout(); 
        } 
      }
    ]);
  };

  // ─── RENDER HELPERS ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <View style={styles.errorIconWrap}>
          <AlertCircle size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Profile not found</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Anonymous';
  const headline = profile.headline || 'Member';
  const earnings = profile.earnings?.totalEarned || 0;
  const tier = getTierByEarnings(earnings);
  const TierIcon = tier.icon;
  const activity = getActivityStatus(profile);
  const tierProgress = tier.max === Infinity ? 100 : Math.min(100, Math.round(((earnings - tier.min) / (tier.max - tier.min)) * 100));
  
  const profileLinks = {
    website: profile.profile?.website || profile.website,
    linkedin: profile.profile?.linkedin || profile.linkedin,
    twitter: profile.profile?.twitter || profile.twitter,
    github: profile.profile?.github || profile.github,
  };
  const hasLinks = profileLinks.website || profileLinks.linkedin || profileLinks.twitter || profileLinks.github;
  const profileLanguages = profile.profile?.languages || profile.languages || [];
  const profileExperience = profile.profile?.experience || profile.experience || [];
  const profilePortfolio = profile.profile?.portfolio || profile.portfolio || [];
  const verificationLabel = getVerificationLabel(profile);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'posts', label: 'Posts', icon: FileText },
  ];
  if (profile.isBuyer) tabs.push({ id: 'jobs', label: 'Jobs', icon: Briefcase });
  tabs.push({ id: 'portfolio', label: 'Portfolio', icon: Award }, { id: 'experience', label: 'Experience', icon: Calendar });

  // ─── MODALS ───────────────────────────────────────────────────────────
  const renderListModal = (visible, onClose, title, Icon, count, data, loading) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.listModalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Icon size={20} color="#059669" />
              <Text style={styles.modalTitle}>{title} ({count || 0})</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.listModalScroll}>
            {loading ? (
              <View style={styles.modalLoading}><ActivityIndicator color="#059669" /></View>
            ) : data.length > 0 ? (
              data.map(u => (
                <TouchableOpacity key={u.id} style={styles.listItem} onPress={() => { onClose(); navigation.push('UserProfile', { userId: u.id }); }}>
                  {u.avatar ? <Image source={{ uri: u.avatar }} style={styles.listAvatar} /> : (
                    <View style={styles.listAvatarPlaceholder}><Text style={styles.listAvatarText}>{getInitials(u.firstName, u.lastName)}</Text></View>
                  )}
                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={1}>{u.firstName} {u.lastName}</Text>
                    <Text style={styles.listHeadline} numberOfLines={1}>{u.headline || 'Member'}</Text>
                    {u.viewedAt && <Text style={styles.listTime}>{formatTimeAgo(u.viewedAt)}</Text>}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyModalText}>No data found</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderReviewModal = () => (
    <Modal visible={showReviews} transparent animationType="fade" onRequestClose={() => setShowReviews(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.listModalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Star size={20} color="#D97706" fill="#D97706" />
              <Text style={styles.modalTitle}>Reviews ({reviewsData.totalReviews})</Text>
              {reviewsData.averageRating > 0 && (
                <View style={styles.ratingBadge}>
                  <Star size={14} color="#D97706" fill="#D97706" />
                  <Text style={styles.ratingText}>{reviewsData.averageRating}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowReviews(false)}><X size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.listModalScroll}>
            {reviewsLoading ? (
              <View style={styles.modalLoading}><ActivityIndicator color="#059669" /></View>
            ) : reviewsList.length > 0 ? (
              reviewsList.map(review => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {review.reviewer?.avatar ? <Image source={{ uri: review.reviewer.avatar }} style={styles.reviewAvatar} /> : (
                      <View style={styles.reviewAvatarPlaceholder}><Text style={styles.reviewAvatarText}>{getInitials(review.reviewer?.firstName, review.reviewer?.lastName)}</Text></View>
                    )}
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewName}>{review.reviewer?.firstName} {review.reviewer?.lastName}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={12} color={star <= review.rating ? '#D97706' : '#E5E7EB'} fill={star <= review.rating ? '#D97706' : 'transparent'} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewTime}>{formatTimeAgo(review.createdAt)}</Text>
                  </View>
                  {(review.projectName || review.contract?.job?.title || review.contract?.title) && (
                    <View style={styles.reviewProject}>
                      <Briefcase size={12} color="#059669" />
                      <Text style={styles.reviewProjectText}>{review.projectName || review.contract?.job?.title || review.contract?.title}</Text>
                    </View>
                  )}
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                </View>
              ))
            ) : (
              <Text style={styles.emptyModalText}>No reviews yet</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderFormModal = (visible, onClose, title, Icon, form, setForm, saving, onSave, fields) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.formModalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Icon size={20} color="#059669" />
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.formModalScroll}>
            {fields.map((field, idx) => (
              <View key={idx} style={styles.formField}>
                <Text style={styles.formLabel}>{field.label}{field.required && ' *'}</Text>
                {field.type === 'select' ? (
                  <View style={styles.input}>
                    <Text style={styles.inputText}>{form[field.key]}</Text>
                  </View>
                ) : field.type === 'textarea' ? (
                  <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={form[field.key]} onChangeText={text => setForm({ ...form, [field.key]: text })} placeholder={field.placeholder} placeholderTextColor="#9CA3AF" />
                ) : (
                  <TextInput style={styles.input} value={form[field.key]} onChangeText={text => setForm({ ...form, [field.key]: text })} placeholder={field.placeholder} placeholderTextColor="#9CA3AF" keyboardType={field.keyboardType} />
                )}
              </View>
            ))}
          </ScrollView>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {profile.banner ? <Image source={{ uri: profile.banner }} style={styles.banner} /> : <View style={[styles.banner, styles.bannerPlaceholder]} />}
          <View style={styles.bannerOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <View style={styles.backBtnIcon}><Text style={{ fontSize: 20, color: '#111827', fontWeight: '600' }}>←</Text></View>
          </TouchableOpacity>
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarWrap}>
            {profile.avatar ? <Image source={{ uri: profile.avatar }} style={styles.avatar} /> : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{getInitials(profile.firstName, profile.lastName)}</Text></View>
            )}
            {activity.show && <View style={[styles.onlineDot, { backgroundColor: activity.dot }]} />}
          </View>
          
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{fullName}</Text>
              {profile.isVerified && <BadgeCheck size={20} color="#059669" fill="#059669" />}
            </View>
            <Text style={styles.headline}>{headline}</Text>
            {profile.company && (
              <View style={styles.companyRow}>
                <Building2 size={14} color="#6B7280" />
                <Text style={styles.companyText}>{profile.company}</Text>
              </View>
            )}
            
            <View style={styles.metaRow}>
              {profile.location && <View style={styles.metaItem}><MapPin size={14} color="#6B7280" /><Text style={styles.metaText}>{profile.location}</Text></View>}
              {profile.createdAt && <View style={styles.metaItem}><Calendar size={14} color="#6B7280" /><Text style={styles.metaText}>Joined {formatDate(profile.createdAt)}</Text></View>}
              {(profile.profile?.availability || profile.availability) && <View style={styles.metaItem}><Clock size={14} color="#6B7280" /><Text style={styles.metaText}>{profile.profile?.availability || profile.availability}</Text></View>}
              <View style={styles.metaItem}>
                <Activity size={14} color={activity.show ? '#059669' : '#9CA3AF'} />
                <Text style={[styles.metaText, activity.show && { color: '#059669' }]}>{activity.label}</Text>
              </View>
            </View>

            <View style={styles.statsInline}>
              {profile.totalReviews > 0 && (
                <TouchableOpacity style={styles.statInlineItem} onPress={() => { setShowReviews(true); fetchReviews(); }}>
                  <Star size={14} color="#D97706" fill="#D97706" />
                  <Text style={styles.statInlineValue}>{profile.averageRating?.toFixed(1)}</Text>
                  <Text style={styles.statInlineLabel}>({profile.totalReviews})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.statInlineItem} onPress={() => { setShowFollowers(true); fetchFollowList('followers'); }}>
                <Text style={styles.statInlineValue}>{followerCount}</Text>
                <Text style={styles.statInlineLabel}>followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statInlineItem} onPress={() => { setShowFollowing(true); fetchFollowList('following'); }}>
                <Text style={styles.statInlineValue}>{followingCount}</Text>
                <Text style={styles.statInlineLabel}>following</Text>
              </TouchableOpacity>
              {profile.completionRate !== undefined && (
                <View style={styles.statInlineItem}>
                  <TrendingUp size={14} color="#059669" />
                  <Text style={styles.statInlineValue}>{profile.completionRate}%</Text>
                  <Text style={styles.statInlineLabel}>completion</Text>
                </View>
              )}
            </View>

            <View style={styles.badgesRow}>
              {profile.isFreelancer && <View style={[styles.badge, styles.badgeFreelancer]}><Text style={styles.badgeTextFreelancer}>Freelancer</Text></View>}
              {profile.isBuyer && <View style={[styles.badge, styles.badgeBuyer]}><Text style={styles.badgeTextBuyer}>Buyer</Text></View>}
              {profile.isAdmin && <View style={[styles.badge, styles.badgeAdmin]}><Text style={styles.badgeTextAdmin}>Admin</Text></View>}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              {profile.isBuyer && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PostJob')}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Post Job</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsEditing(!isEditing)}>
                <Pencil size={18} color={isEditing ? '#374151' : '#fff'} />
                <Text style={[styles.secondaryBtnText, isEditing && { color: '#374151' }]}>{isEditing ? 'Cancel' : 'Edit Profile'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.primaryBtn, isFollowing && styles.followingBtn]} onPress={handleFollow} disabled={followLoading}>
                {followLoading ? <ActivityIndicator color={isFollowing ? '#059669' : '#fff'} size="small" /> : (
                  <>{isFollowing ? <Check size={18} color="#059669" /> : <UserPlus size={18} color="#fff" />}
                  <Text style={[styles.primaryBtnText, isFollowing && { color: '#059669' }]}>{isFollowing ? 'Following' : 'Follow'}</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Chat', { userId: profile.id })}>
                <Mail size={18} color="#374151" />
                <Text style={styles.outlineBtnText}>Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Edit Form */}
        {isEditing && (
          <View style={styles.editFormContainer}>
            <Text style={styles.editFormTitle}>Edit Profile</Text>
            <View style={styles.formGrid}>
              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Headline</Text>
                <TextInput style={styles.input} value={editForm.headline} onChangeText={text => setEditForm({ ...editForm, headline: text })} placeholder="e.g. Full Stack Developer" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Company</Text>
                <TextInput style={styles.input} value={editForm.company} onChangeText={text => setEditForm({ ...editForm, company: text })} placeholder="e.g. Tech Corp" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput style={styles.input} value={editForm.location} onChangeText={text => setEditForm({ ...editForm, location: text })} placeholder="e.g. Lagos, Nigeria" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput style={styles.input} value={editForm.phone} onChangeText={text => setEditForm({ ...editForm, phone: text })} placeholder="+234..." placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Hourly Rate (₦)</Text>
                <TextInput style={styles.input} value={editForm.hourlyRate} onChangeText={text => setEditForm({ ...editForm, hourlyRate: text })} placeholder="15000" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
              </View>
              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} value={editForm.bio} onChangeText={text => setEditForm({ ...editForm, bio: text })} placeholder="Tell us about yourself..." placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Skills (comma separated)</Text>
                <TextInput style={styles.input} value={editForm.skills} onChangeText={text => setEditForm({ ...editForm, skills: text })} placeholder="React, Node.js..." placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Languages (comma separated)</Text>
                <TextInput style={styles.input} value={editForm.languages} onChangeText={text => setEditForm({ ...editForm, languages: text })} placeholder="English, Yoruba..." placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
                <Icon size={16} color={isActive ? '#fff' : '#6B7280'} />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <>
              {profile.isFreelancer && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Medal size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Earnings Tier</Text>
                  </View>
                  <View style={[styles.tierBox, { backgroundColor: `${tier.color}10`, borderColor: `${tier.color}30` }]}>
                    <View style={[styles.tierIconBox, { backgroundColor: `${tier.color}20` }]}>
                      <TierIcon size={20} color={tier.color} />
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                      <Text style={styles.tierEarnings}>{isOwnProfile ? formatCurrency(earnings) + ' earned' : formatEarningsPublic(earnings)}</Text>
                    </View>
                  </View>
                  {tier.max !== Infinity && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress to next tier</Text>
                        <Text style={styles.progressValue}>{tierProgress}%</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${tierProgress}%`, backgroundColor: tier.color }]} />
                      </View>
                      <Text style={styles.progressSubtext}>{isOwnProfile ? formatCurrency(tier.max + 1) + ' for next tier' : formatEarningsPublic(tier.max + 1) + ' to advance'}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <ShieldCheck size={18} color="#059669" />
                  <Text style={styles.cardTitle}>Verification</Text>
                </View>
                <View style={[styles.verificationBox, verificationLabel === 'Verified' ? styles.verifiedBox : verificationLabel === 'Pending' ? styles.pendingBox : styles.unverifiedBox]}>
                  {verificationLabel === 'Verified' ? <ShieldCheck size={20} color="#059669" /> : verificationLabel === 'Pending' ? <Clock size={20} color="#D97706" /> : <ShieldAlert size={20} color="#9CA3AF" />}
                  <View style={styles.verificationInfo}>
                    <Text style={[styles.verificationLabel, verificationLabel === 'Verified' ? styles.verifiedText : verificationLabel === 'Pending' ? styles.pendingText : styles.unverifiedText]}>{verificationLabel}</Text>
                    <Text style={styles.verificationMessage}>{getVerificationMessage(profile)}</Text>
                  </View>
                </View>
              </View>

              {isOwnProfile && profileStats && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <BarChart3 size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Your Stats (Last 7 Days)</Text>
                  </View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <BarChart3 size={20} color="#059669" />
                      <Text style={styles.statBoxValue}>{(profileStats.impressionsLast7Days || 0).toLocaleString()}</Text>
                      <Text style={styles.statBoxLabel}>Impressions</Text>
                    </View>
                    <TouchableOpacity style={[styles.statBox, styles.statBoxClickable]} onPress={() => { setShowProfileViews(true); fetchProfileViews(); }}>
                      <Eye size={20} color="#2563EB" />
                      <Text style={[styles.statBoxValue, { color: '#2563EB' }]}>{(profileStats.profileViewsLast7Days || 0).toLocaleString()}</Text>
                      <Text style={[styles.statBoxLabel, { color: '#2563EB' }]}>Profile Views</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {profile.bio && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}><Users size={18} color="#059669" /><Text style={styles.cardTitle}>About</Text></View>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              )}

              {profile.hourlyRate && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}><DollarSign size={18} color="#059669" /><Text style={styles.cardTitle}>Rate</Text></View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateValue}>{formatCurrency(profile.hourlyRate)}</Text>
                    <Text style={styles.rateSubtext}>/hr</Text>
                  </View>
                </View>
              )}

              <View style={styles.card}>
                <View style={styles.cardHeader}><Calendar size={18} color="#059669" /><Text style={styles.cardTitle}>Member Since</Text></View>
                <Text style={styles.metaTextLarge}>{profile.createdAt ? formatDate(profile.createdAt) : 'Unknown'}</Text>
                {profile.createdAt && <Text style={styles.metaTextSmall}>{Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} months on VivaWork</Text>}
              </View>

              {(profile.phone || profile.email) && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}><Phone size={18} color="#059669" /><Text style={styles.cardTitle}>Contact</Text></View>
                  <View style={styles.contactList}>
                    {profile.email && <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`mailto:${profile.email}`)}><Mail size={18} color="#059669" /><Text style={styles.contactText} numberOfLines={1}>{profile.email}</Text></TouchableOpacity>}
                    {profile.phone && <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`tel:${profile.phone}`)}><Phone size={18} color="#059669" /><Text style={styles.contactText}>{profile.phone}</Text></TouchableOpacity>}
                  </View>
                </View>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}><Award size={18} color="#059669" /><Text style={styles.cardTitle}>Skills</Text></View>
                  <View style={styles.skillsContainer}>
                    {profile.skills.map((skill, idx) => <View key={idx} style={styles.skillTag}><Text style={styles.skillText}>{skill}</Text></View>)}
                  </View>
                </View>
              )}

              {profileLanguages.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}><Globe size={18} color="#059669" /><Text style={styles.cardTitle}>Languages</Text></View>
                  <View style={styles.skillsContainer}>
                    {profileLanguages.map((lang, idx) => <View key={idx} style={[styles.skillTag, styles.languageTag]}><Globe size={14} color="#059669" /><Text style={[styles.skillText, styles.languageText]}>{lang}</Text></View>)}
                  </View>
                </View>
              )}

              {hasLinks && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}><LinkIcon size={18} color="#059669" /><Text style={styles.cardTitle}>Links</Text></View>
                  <View style={styles.linksList}>
                    {profileLinks.website && <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL(profileLinks.website.startsWith('http') ? profileLinks.website : `https://${profileLinks.website}`)}><Globe size={18} color="#059669" /><Text style={styles.linkText} numberOfLines={1}>{profileLinks.website}</Text><ExternalLink size={16} color="#9CA3AF" /></TouchableOpacity>}
                    {profileLinks.linkedin && <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL(profileLinks.linkedin.startsWith('http') ? profileLinks.linkedin : `https://${profileLinks.linkedin}`)}><LinkIcon size={18} color="#0077B5" /><Text style={styles.linkText}>LinkedIn</Text><ExternalLink size={16} color="#9CA3AF" /></TouchableOpacity>}
                    {profileLinks.twitter && <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL(profileLinks.twitter.startsWith('http') ? profileLinks.twitter : `https://${profileLinks.twitter}`)}><LinkIcon size={18} color="#1DA1F2" /><Text style={styles.linkText}>Twitter / X</Text><ExternalLink size={16} color="#9CA3AF" /></TouchableOpacity>}
                    {profileLinks.github && <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL(profileLinks.github.startsWith('http') ? profileLinks.github : `https://${profileLinks.github}`)}><LinkIcon size={18} color="#333333" /><Text style={styles.linkText}>GitHub</Text><ExternalLink size={16} color="#9CA3AF" /></TouchableOpacity>}
                  </View>
                </View>
              )}

              {/* Overview Previews */}
              {profileExperience.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Briefcase size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Experience</Text>
                    <TouchableOpacity onPress={() => setActiveTab('experience')}><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
                  </View>
                  {profileExperience.slice(0, 2).map((exp, idx) => (
                    <View key={exp.id || idx} style={[styles.expPreviewItem, idx !== 0 && styles.expPreviewBorder]}>
                      <View style={styles.expPreviewIcon}><Briefcase size={20} color="#059669" /></View>
                      <View style={styles.expPreviewContent}>
                        <Text style={styles.expPreviewTitle}>{exp.title || exp.role}</Text>
                        <Text style={styles.expPreviewCompany}>{exp.company} · {exp.type || 'Full-time'}</Text>
                        {exp.period && <Text style={styles.expPreviewPeriod}>{exp.period}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {profilePortfolio.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Award size={18} color="#059669" />
                    <Text style={styles.cardTitle}>Portfolio</Text>
                    <TouchableOpacity onPress={() => setActiveTab('portfolio')}><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
                  </View>
                  <View style={styles.portfolioGrid}>
                    {profilePortfolio.slice(0, 3).map((item, idx) => (
                      <TouchableOpacity key={item.id || idx} style={styles.portfolioItem} activeOpacity={0.8}>
                        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} /> : <View style={styles.portfolioPlaceholder}><LinkIcon size={24} color="#9CA3AF" /></View>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'posts' && (
            <View style={styles.tabList}>
              {userPosts.length > 0 ? userPosts.map(post => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    {profile.avatar ? <Image source={{ uri: profile.avatar }} style={styles.postAvatar} /> : <View style={styles.postAvatarPlaceholder}><Text style={styles.postAvatarText}>{getInitials(profile.firstName, profile.lastName)}</Text></View>}
                    <View>
                      <Text style={styles.postAuthor}>{fullName}</Text>
                      <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                  {post.media && post.media.length > 0 && (
                    <View style={styles.postMediaGrid}>
                      {post.media.slice(0, 3).map((url, idx) => <Image key={idx} source={{ uri: url }} style={styles.postMediaImage} />)}
                    </View>
                  )}
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.postActionBtn} onPress={() => handleLikePost(post.id)}>
                      <Heart size={18} color={postLikes[post.id] ? '#EF4444' : '#6B7280'} fill={postLikes[post.id] ? '#EF4444' : 'transparent'} />
                      <Text style={[styles.postActionText, postLikes[post.id] && { color: '#EF4444' }]}>{post.likes || 0}</Text>
                    </TouchableOpacity>
                    <View style={styles.postActionBtn}>
                      <MessageCircle size={18} color="#6B7280" />
                      <Text style={styles.postActionText}>{post.comments || 0}</Text>
                    </View>
                  </View>
                </View>
              )) : (
                <View style={styles.emptyTabState}>
                  <FileText size={32} color="#9CA3AF" />
                  <Text style={styles.emptyTabText}>No posts yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'jobs' && profile.isBuyer && (
            <View style={styles.tabList}>
              {isOwnProfile && (
                <TouchableOpacity style={styles.addJobBtn} onPress={() => navigation.navigate('PostJob')}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.addJobBtnText}>Post New Job</Text>
                </TouchableOpacity>
              )}
              {jobsLoading ? <View style={styles.modalLoading}><ActivityIndicator color="#059669" /></View> : userJobs.length > 0 ? userJobs.map(job => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={[styles.jobStatusBadge, job.status === 'open' ? styles.statusOpen : job.status === 'in_progress' ? styles.statusProgress : styles.statusCompleted]}>
                      <Text style={styles.jobStatusText}>{job.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>
                  <View style={styles.jobMeta}>
                    {job.budget && <View style={styles.jobMetaItem}><DollarSign size={14} color="#059669" /><Text style={styles.jobMetaText}>{formatCurrency(job.budget)}</Text></View>}
                    <View style={styles.jobMetaItem}><Users size={14} color="#6B7280" /><Text style={styles.jobMetaText}>{job.proposals?.length || 0} proposals</Text></View>
                    <View style={styles.jobMetaItem}><Clock size={14} color="#6B7280" /><Text style={styles.jobMetaText}>{formatTimeAgo(job.createdAt)}</Text></View>
                  </View>
                  {isOwnProfile && (
                    <View style={styles.jobActions}>
                      <TouchableOpacity style={styles.jobActionBtn} onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}>
                        <Eye size={14} color="#2563EB" />
                        <Text style={styles.jobActionText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.jobActionBtnDanger} onPress={() => Alert.alert('Delete', 'Delete this job?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/jobs/${job.id}`); setUserJobs(prev => prev.filter(j => j.id !== job.id)); Alert.alert('Success', 'Job deleted'); } catch { Alert.alert('Error', 'Failed to delete'); } }}])}>
                        <Trash2 size={14} color="#EF4444" />
                        <Text style={[styles.jobActionText, { color: '#EF4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )) : (
                <View style={styles.emptyTabState}>
                  <Briefcase size={32} color="#9CA3AF" />
                  <Text style={styles.emptyTabText}>No jobs posted yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Award size={18} color="#059669" />
                <Text style={styles.cardTitle}>Portfolio Projects</Text>
                {isOwnProfile && (
                  <TouchableOpacity style={styles.addBtnSmall} onPress={() => { setEditingPortId(null); setPortForm({ title: '', category: '', description: '', url: '', imageUrl: '' }); setShowPortModal(true); }}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addBtnSmallText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {profilePortfolio.length > 0 ? (
                <View style={styles.portfolioGridFull}>
                  {profilePortfolio.map((item, idx) => (
                    <View key={item.id || idx} style={styles.portfolioCard}>
                      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.portfolioCardImage} /> : <View style={styles.portfolioCardPlaceholder}><LinkIcon size={32} color="#9CA3AF" /></View>}
                      <View style={styles.portfolioCardContent}>
                        <Text style={styles.portfolioCardTitle} numberOfLines={1}>{item.title}</Text>
                        {item.category && <Text style={styles.portfolioCardCategory}>{item.category}</Text>}
                      </View>
                      {isOwnProfile && (
                        <View style={styles.portfolioCardActions}>
                          <TouchableOpacity onPress={() => { setEditingPortId(item.id); setPortForm({ title: item.title || '', category: item.category || '', description: item.description || '', url: item.url || '', imageUrl: item.imageUrl || '' }); setShowPortModal(true); }} style={styles.portfolioActionIcon}><PencilLine size={16} color="#6B7280" /></TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeletePortfolio(item.id)} style={styles.portfolioActionIcon}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTabState}>
                  <Award size={32} color="#9CA3AF" />
                  <Text style={styles.emptyTabText}>No portfolio items yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'experience' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar size={18} color="#059669" />
                <Text style={styles.cardTitle}>Work Experience</Text>
                {isOwnProfile && (
                  <TouchableOpacity style={styles.addBtnSmall} onPress={() => { setEditingExpId(null); setExpForm({ title: '', company: '', type: 'Full-time', period: '', description: '' }); setShowExpModal(true); }}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addBtnSmallText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {profileExperience.length > 0 ? (
                profileExperience.map((exp, idx) => (
                  <View key={exp.id || idx} style={[styles.expItem, idx !== profileExperience.length - 1 && styles.expItemBorder]}>
                    <View style={styles.expIcon}><Briefcase size={20} color="#059669" /></View>
                    <View style={styles.expContent}>
                      <View style={styles.expHeader}>
                        <Text style={styles.expTitle}>{exp.title || exp.role}</Text>
                        {isOwnProfile && (
                          <View style={styles.expActions}>
                            <TouchableOpacity onPress={() => { setEditingExpId(exp.id); setExpForm({ title: exp.title || exp.role || '', company: exp.company || '', type: exp.type || 'Full-time', period: exp.period || '', description: exp.description || '' }); setShowExpModal(true); }} style={styles.expActionIcon}><PencilLine size={16} color="#6B7280" /></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteExperience(exp.id)} style={styles.expActionIcon}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                          </View>
                        )}
                      </View>
                      <Text style={styles.expCompany}>{exp.company}</Text>
                      <View style={styles.expMeta}>
                        {exp.type && <View style={styles.expTypeBadge}><Text style={styles.expTypeText}>{exp.type}</Text></View>}
                        {exp.period && <Text style={styles.expPeriod}>{exp.period}</Text>}
                      </View>
                      {exp.description && <Text style={styles.expDesc}>{exp.description}</Text>}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTabState}>
                  <Calendar size={32} color="#9CA3AF" />
                  <Text style={styles.emptyTabText}>No experience listed yet</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {isOwnProfile && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderListModal(showFollowers, () => setShowFollowers(false), 'Followers', Users, followerCount, followList, followListLoading)}
      {renderListModal(showFollowing, () => setShowFollowing(false), 'Following', Users, followingCount, followList, followListLoading)}
      {renderListModal(showProfileViews, () => setShowProfileViews(false), 'Profile Views', Eye, profileStats?.profileViewsLast7Days || 0, followList, followListLoading)}
      {renderReviewModal()}
      
      {renderFormModal(showExpModal, () => setShowExpModal(false), editingExpId ? 'Edit Experience' : 'Add Experience', Briefcase, expForm, setExpForm, expSaving, handleSaveExperience, [
        { key: 'title', label: 'Job Title', required: true, placeholder: 'e.g. Senior Developer' },
        { key: 'company', label: 'Company', required: true, placeholder: 'e.g. TechCorp' },
        { key: 'type', label: 'Type', type: 'select' },
        { key: 'period', label: 'Period', placeholder: 'e.g. 2022 - Present' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe your role...' },
      ])}

      {renderFormModal(showPortModal, () => setShowPortModal(false), editingPortId ? 'Edit Project' : 'Add Project', Award, portForm, setPortForm, portSaving, handleSavePortfolio, [
        { key: 'title', label: 'Project Title', required: true, placeholder: 'e.g. E-commerce Platform' },
        { key: 'category', label: 'Category', placeholder: 'e.g. Web Development' },
        { key: 'url', label: 'Project URL', placeholder: 'https://...', keyboardType: 'url' },
        { key: 'imageUrl', label: 'Image URL', placeholder: 'https://image-url.com/...' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the project...' },
      ])}
    </SafeAreaView>
  );
};

// ─── STYLES ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryButton: { backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  bannerContainer: { height: 160, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  bannerPlaceholder: { backgroundColor: '#059669' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  backBtnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },

  profileInfo: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -50, alignItems: 'flex-end' },
  avatarWrap: { position: 'relative', marginRight: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff', backgroundColor: '#F3F4F6' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff', backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#fff' },

  nameSection: { flex: 1, paddingBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headline: { fontSize: 15, color: '#4B5563', marginTop: 4, lineHeight: 20 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  companyText: { fontSize: 13, color: '#6B7280' },
  
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#6B7280' },
  metaTextLarge: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
  metaTextSmall: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  statsInline: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 16 },
  statInlineItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statInlineValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  statInlineLabel: { fontSize: 13, color: '#6B7280' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeFreelancer: { backgroundColor: '#ECFDF5' },
  badgeTextFreelancer: { fontSize: 12, fontWeight: '600', color: '#047857' },
  badgeBuyer: { backgroundColor: '#EFF6FF' },
  badgeTextBuyer: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  badgeAdmin: { backgroundColor: '#F5F3FF' },
  badgeTextAdmin: { fontSize: 12, fontWeight: '600', color: '#6D28D9' },

  actionButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  followingBtn: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 12 },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, borderRadius: 12 },
  outlineBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },

  editFormContainer: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  editFormTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  formGrid: { gap: 16 },
  formField: { flex: 1 },
  formFieldFull: { width: '100%' },
  formLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#059669', alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#D1D5DB' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  tabsContainer: { marginTop: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#fff' },

  tabContent: { padding: 16 },
  tabList: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#059669' },

  tierBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  tierIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tierInfo: { flex: 1 },
  tierLabel: { fontSize: 15, fontWeight: '700' },
  tierEarnings: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  progressContainer: { marginTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#6B7280' },
  progressValue: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  progressBarBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSubtext: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },

  verificationBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  verifiedBox: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  pendingBox: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  unverifiedBox: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  verificationInfo: { flex: 1 },
  verificationLabel: { fontSize: 14, fontWeight: '600' },
  verifiedText: { color: '#047857' },
  pendingText: { color: '#B45309' },
  unverifiedText: { color: '#6B7280' },
  verificationMessage: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  statBoxClickable: { backgroundColor: '#EFF6FF' },
  statBoxValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statBoxLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  bioText: { fontSize: 15, lineHeight: 24, color: '#4B5563' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rateValue: { fontSize: 28, fontWeight: '800', color: '#111827' },
  rateSubtext: { fontSize: 14, color: '#6B7280' },

  contactList: { gap: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  contactText: { fontSize: 14, color: '#111827', flex: 1, fontWeight: '500' },

  linksList: { gap: 10 },
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#F9FAFB', borderRadius: 12 },
  linkText: { fontSize: 14, color: '#111827', flex: 1, fontWeight: '600' },

  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  skillText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  languageTag: { backgroundColor: '#F0FDF4', flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageText: { color: '#059669' },

  expPreviewItem: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  expPreviewBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 12, paddingTop: 16 },
  expPreviewIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  expPreviewContent: { flex: 1 },
  expPreviewTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  expPreviewCompany: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  expPreviewPeriod: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  portfolioGrid: { flexDirection: 'row', gap: 12, marginTop: 8 },
  portfolioItem: { width: (width - 84) / 3, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  portfolioImage: { width: '100%', height: '100%' },
  portfolioPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

  postCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  postAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  postAuthor: { fontSize: 15, fontWeight: '600', color: '#111827' },
  postTime: { fontSize: 12, color: '#9CA3AF' },
  postContent: { fontSize: 15, color: '#1F2937', lineHeight: 22, marginBottom: 12 },
  postMediaGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  postMediaImage: { width: 80, height: 80, borderRadius: 8 },
  postActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  addJobBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12, marginBottom: 8 },
  addJobBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  jobCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  jobStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusOpen: { backgroundColor: '#ECFDF5' },
  statusProgress: { backgroundColor: '#FFFBEB' },
  statusCompleted: { backgroundColor: '#EFF6FF' },
  jobStatusText: { fontSize: 12, fontWeight: '600', color: '#047857' },
  jobDesc: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { fontSize: 13, color: '#6B7280' },
  jobActions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  jobActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#EFF6FF', borderRadius: 8 },
  jobActionBtnDanger: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FEF2F2', borderRadius: 8 },
  jobActionText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },

  portfolioGridFull: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  portfolioCard: { width: (width - 44) / 2, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#fff' },
  portfolioCardImage: { width: '100%', aspectRatio: 16/9 },
  portfolioCardPlaceholder: { width: '100%', aspectRatio: 16/9, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  portfolioCardContent: { padding: 12 },
  portfolioCardTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  portfolioCardCategory: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  portfolioCardActions: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 8 },
  portfolioActionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },

  expItem: { flexDirection: 'row', gap: 14, paddingVertical: 16 },
  expItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  expIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  expContent: { flex: 1 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  expActions: { flexDirection: 'row', gap: 8 },
  expActionIcon: { padding: 4 },
  expCompany: { fontSize: 14, color: '#4B5563', fontWeight: '500', marginTop: 2 },
  expMeta: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  expTypeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  expTypeText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  expPeriod: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  expDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginTop: 10 },

  addBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnSmallText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  emptyTabState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTabText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },

  logoutContainer: { paddingHorizontal: 20, paddingVertical: 16, marginTop: 8, marginBottom: 32 },
  logoutBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
  logoutBtnText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  listModalContent: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: '80%' },
  formModalContent: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  listModalScroll: { maxHeight: 400 },
  formModalScroll: { padding: 20 },
  modalLoading: { paddingVertical: 40, alignItems: 'center' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listAvatar: { width: 44, height: 44, borderRadius: 22 },
  listAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  listAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  listHeadline: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  listTime: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  emptyModalText: { textAlign: 'center', color: '#9CA3AF', fontSize: 15, paddingVertical: 40 },

  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#B45309' },
  reviewItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reviewInfo: { flex: 1 },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reviewStars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewTime: { fontSize: 12, color: '#9CA3AF' },
  reviewProject: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  reviewProjectText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  reviewComment: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});

export default ProfileScreen;