import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// 🎯 FIX: Default import for api
import api from '../utils/api'; 

// Theme
import { COLORS, FONTS } from '../constants/theme';

// Icons
import {
  Users,
  Clock,
  Lightbulb,
  Search,
  Check,
  X,
  UserX,
  UserPlus,
  Mail,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';

const NetworkScreen = () => {
  const navigation = useNavigation();
  
  // State
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data based on active tab
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      if (activeTab === 'connections') {
        const response = await api.get('/connections');
        setConnections(response.data.connections || []);
      } else if (activeTab === 'pending') {
        const response = await api.get('/connections/pending');
        setPendingRequests(response.data.requests || []);
      } else if (activeTab === 'suggestions') {
        const response = await api.get('/connections/suggestions');
        setSuggestions(response.data.suggestions || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // --- Actions ---
  const sendRequest = async (userId) => {
    try {
      setActionLoading(userId + '-send');
      await api.post(`/connections/request/${userId}`);
      Alert.alert('Success', 'Connection request sent');
      setSuggestions((prev) => prev.filter((s) => s.id !== userId));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (connectionId) => {
    try {
      setActionLoading(connectionId + '-accept');
      await api.patch(`/connections/accept/${connectionId}`);
      Alert.alert('Success', 'Connection accepted');
      setPendingRequests((prev) => prev.filter((r) => r.id !== connectionId));
      if (activeTab === 'connections') fetchData(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (connectionId) => {
    try {
      setActionLoading(connectionId + '-reject');
      await api.patch(`/connections/reject/${connectionId}`);
      Alert.alert('Success', 'Request rejected');
      setPendingRequests((prev) => prev.filter((r) => r.id !== connectionId));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const removeConnection = async (connectionId) => {
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(connectionId + '-remove');
              await api.delete(`/connections/${connectionId}`);
              Alert.alert('Success', 'Connection removed');
              setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // --- Helpers ---
  const getInitials = (firstName, lastName) => {
    const f = firstName?.trim()?.[0] || '';
    const l = lastName?.trim()?.[0] || '';
    return `${f}${l}`.toUpperCase() || '?';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCurrentData = () => {
    if (activeTab === 'connections') {
      return connections.filter((c) => {
        const fullName = `${c.user.firstName} ${c.user.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
    }
    if (activeTab === 'pending') return pendingRequests;
    if (activeTab === 'suggestions') return suggestions;
    return [];
  };

  const getKey = (item) => {
    if (activeTab === 'connections') return item.connectionId;
    return item.id;
  };

  // 🎯 HELPER: Navigate to user profile
  const goToProfile = (userId) => {
    // ⚠️ CHANGE 'UserProfile' to your actual route name if it's different (e.g., 'ProfileDetail', 'User')
    navigation.navigate('UserProfile', { userId });
  };

  // --- Render Components ---
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
        <ArrowLeft size={20} color={COLORS.textPrimary || '#111827'} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <View style={styles.titleIconWrap}>
          <Users size={18} color={COLORS.primary || '#059669'} />
        </View>
        <View>
          <Text style={styles.title}>My Network</Text>
          <Text style={styles.subtitle}>Manage your professional connections</Text>
        </View>
      </View>

      <View style={styles.countBadge}>
        <Text style={styles.countBadgeText}>{connections.length}</Text>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {[
        { key: 'connections', label: 'Connections', icon: Users },
        { key: 'pending', label: 'Pending', icon: Clock },
        { key: 'suggestions', label: 'Suggestions', icon: Lightbulb },
      ].map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.key);
              setSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <Icon size={16} color={isActive ? '#fff' : (COLORS.textSecondary || '#4B5563')} />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            {tab.key === 'pending' && pendingRequests.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <Search size={18} color={COLORS.textTertiary || '#9CA3AF'} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search connections..."
        placeholderTextColor={COLORS.textTertiary || '#9CA3AF'}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
          <X size={16} color={COLORS.textTertiary || '#9CA3AF'} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        {activeTab === 'connections' && <Users size={32} color={COLORS.textTertiary || '#9CA3AF'} />}
        {activeTab === 'pending' && <Clock size={32} color={COLORS.textTertiary || '#9CA3AF'} />}
        {activeTab === 'suggestions' && <Lightbulb size={32} color={COLORS.textTertiary || '#9CA3AF'} />}
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'connections' && (searchQuery ? 'No matches found' : 'No connections yet')}
        {activeTab === 'pending' && 'No pending requests'}
        {activeTab === 'suggestions' && 'No suggestions right now'}
      </Text>
      <Text style={styles.emptyMessage}>
        {activeTab === 'connections' && 'Start building your network by exploring suggestions.'}
        {activeTab === 'pending' && 'Incoming connection requests will appear here.'}
        {activeTab === 'suggestions' && 'We will recommend people based on your profile.'}
      </Text>
      {activeTab === 'connections' && !searchQuery && (
        <TouchableOpacity style={styles.emptyButton} onPress={() => setActiveTab('suggestions')} activeOpacity={0.8}>
          <Lightbulb size={16} color="#fff" />
          <Text style={styles.emptyButtonText}>Find People</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    // 1. CONNECTIONS CARD
    if (activeTab === 'connections') {
      const user = item.user;
      return (
        <View style={styles.card}>
          {/* 🎯 FIX: Added onPress to navigate to profile */}
          <TouchableOpacity 
            style={styles.cardAvatarWrap} 
            activeOpacity={0.8}
            onPress={() => goToProfile(user.id)}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(user.firstName, user.lastName)}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.cardContent}>
            {/* 🎯 FIX: Wrapped name in TouchableOpacity to navigate to profile */}
            <TouchableOpacity onPress={() => goToProfile(user.id)} activeOpacity={0.7}>
              <Text style={styles.cardName}>{user.firstName} {user.lastName}</Text>
            </TouchableOpacity>
            
            {user.headline && <Text style={styles.cardHeadline} numberOfLines={1}>{user.headline}</Text>}
            <View style={styles.cardMeta}>
              <Clock size={12} color={COLORS.textTertiary || '#9CA3AF'} />
              <Text style={styles.cardMetaText}>Connected {formatDate(item.connectedAt)}</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionIconBtn} 
              onPress={() => navigation.navigate('Chat', { userId: user.id })}
              activeOpacity={0.7}
            >
              <Mail size={18} color={COLORS.primary || '#059669'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionIconBtnDanger} 
              onPress={() => removeConnection(item.connectionId)}
              disabled={actionLoading === item.connectionId + '-remove'}
              activeOpacity={0.7}
            >
              {actionLoading === item.connectionId + '-remove' ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <UserX size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 2. PENDING REQUESTS CARD
    if (activeTab === 'pending') {
      const sender = item.sender;
      return (
        <View style={styles.card}>
          {/* 🎯 FIX: Added onPress to navigate to profile */}
          <TouchableOpacity 
            style={styles.cardAvatarWrap} 
            activeOpacity={0.8}
            onPress={() => goToProfile(sender.id)}
          >
            {sender.avatar ? (
              <Image source={{ uri: sender.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(sender.firstName, sender.lastName)}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.cardContent}>
            {/* 🎯 FIX: Wrapped name in TouchableOpacity to navigate to profile */}
            <TouchableOpacity onPress={() => goToProfile(sender.id)} activeOpacity={0.7}>
              <Text style={styles.cardName}>{sender.firstName} {sender.lastName}</Text>
            </TouchableOpacity>
            
            {sender.headline && <Text style={styles.cardHeadline} numberOfLines={1}>{sender.headline}</Text>}
            <View style={styles.cardMeta}>
              <Clock size={12} color={COLORS.textTertiary || '#9CA3AF'} />
              <Text style={styles.cardMetaText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.cardActionsVertical}>
            <TouchableOpacity 
              style={styles.btnAccept}
              onPress={() => acceptRequest(item.id)}
              disabled={actionLoading === item.id + '-accept'}
              activeOpacity={0.8}
            >
              {actionLoading === item.id + '-accept' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check size={18} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.btnDecline}
              onPress={() => rejectRequest(item.id)}
              disabled={actionLoading === item.id + '-reject'}
              activeOpacity={0.8}
            >
              {actionLoading === item.id + '-reject' ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <X size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 3. SUGGESTIONS CARD
    if (activeTab === 'suggestions') {
      return (
        <View style={[styles.card, styles.suggestionCard]}>
          <View style={styles.suggestionHeader}>
            {/* 🎯 FIX: Added onPress to navigate to profile */}
            <TouchableOpacity 
              style={styles.cardAvatarWrap} 
              activeOpacity={0.8}
              onPress={() => goToProfile(item.id)}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatarLarge} />
              ) : (
                <View style={[styles.avatarPlaceholder, styles.avatarPlaceholderLarge]}>
                  <Text style={styles.avatarTextLarge}>{getInitials(item.firstName, item.lastName)}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.suggestionInfo}>
              {/* 🎯 FIX: Wrapped name in TouchableOpacity to navigate to profile */}
              <TouchableOpacity onPress={() => goToProfile(item.id)} activeOpacity={0.7}>
                <Text style={styles.cardName}>{item.firstName} {item.lastName}</Text>
              </TouchableOpacity>
              {item.headline && <Text style={styles.cardHeadline} numberOfLines={2}>{item.headline}</Text>}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.btnConnect}
            onPress={() => sendRequest(item.id)}
            disabled={actionLoading === item.id + '-send'}
            activeOpacity={0.8}
          >
            {actionLoading === item.id + '-send' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <UserPlus size={18} color="#fff" />
                <Text style={styles.btnConnectText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary || '#059669'} />
        <Text style={styles.loadingText}>Loading your network...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <View style={styles.errorIconWrap}>
          <AlertCircle size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()} activeOpacity={0.8}>
          <RefreshCw size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderTabs()}
      
      {activeTab === 'connections' && renderSearch()}

      <FlatList
        data={getCurrentData()}
        keyExtractor={getKey}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary || '#059669'} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  countBadge: { position: 'absolute', right: 20, top: 60, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 8, backgroundColor: '#fff' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: '#059669', borderColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', height: '100%' },
  clearSearch: { padding: 4 },
  listContent: { padding: 20, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  suggestionCard: { flexDirection: 'column', alignItems: 'center', padding: 20 },
  cardAvatarWrap: { marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  avatarLarge: { width: 64, height: 64, borderRadius: 16 },
  avatarPlaceholderLarge: { width: 64, height: 64, borderRadius: 16 },
  avatarTextLarge: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardHeadline: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 12, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  cardActionsVertical: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  actionIconBtnDanger: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  btnAccept: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  btnDecline: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
  suggestionInfo: { flex: 1 },
  btnConnect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', width: '100%', paddingVertical: 12, borderRadius: 12 },
  btnConnectText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptyMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default NetworkScreen;