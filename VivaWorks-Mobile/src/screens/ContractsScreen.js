import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

// Lucide React Native Icons
import {
  FileText,
  Clock,
  CreditCard,
  Search,
  RefreshCw,
  X,
  Ban,
  ShieldCheck,
} from 'lucide-react-native';

// ────────────────────────────────────────────────────────────────
// COLORS — matched to the web app's emerald/slate palette
// ────────────────────────────────────────────────────────────────
const C = {
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald600: '#059669',
  emerald700: '#047857',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber700: '#b45309',
  sky50: '#f0f9ff',
  sky100: '#e0f2fe',
  sky700: '#0369a1',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red600: '#dc2626',
  red700: '#b91c1c',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  white: '#ffffff',
};

const STATUS_STYLES = {
  pending_payment: { bg: C.amber50, fg: C.amber700, border: C.amber100 },
  active: { bg: C.emerald50, fg: C.emerald700, border: C.emerald100 },
  completed: { bg: C.slate100, fg: C.slate600, border: C.slate200 },
  cancelled: { bg: C.red50, fg: C.red700, border: C.red100 },
};

const ROLE_STYLES = {
  buyer: { bg: C.sky50, fg: C.sky700, border: C.sky100, label: 'Client' },
  freelancer: { bg: C.slate100, fg: C.slate600, border: C.slate200, label: 'Freelancer' },
};

const STATUS_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'pending_payment', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₦${Number(amount).toLocaleString()}`;
  }
};

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) return `${count}${i.label} ago`;
  }
  return 'Just now';
};

const getInitials = (firstName, lastName) => {
  const f = firstName?.trim()?.[0] || '';
  const l = lastName?.trim()?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
};

// ────────────────────────────────────────────────────────────────
// SKELETON CARD
// ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <View style={[styles.card, { opacity: 0.6 }]}>
    <View style={styles.cardBody}>
      <View style={styles.avatarSkeleton} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.skeletonBlock, { width: '60%', height: 14 }]} />
        <View style={[styles.skeletonBlock, { width: '100%', height: 10 }]} />
        <View style={[styles.skeletonBlock, { width: '75%', height: 10 }]} />
      </View>
    </View>
  </View>
);

// ────────────────────────────────────────────────────────────────
// CONTRACT CARD
// ────────────────────────────────────────────────────────────────
const ContractCard = ({ contract, user, actionLoading, onComplete, onCancel, onPay, onPress }) => {
  const buyer = contract.buyerId === user?.id;
  const otherParty = buyer ? contract.freelancer : contract.buyer;
  const statusKey = contract.status || 'pending_payment';
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.pending_payment;
  const roleStyle = buyer ? ROLE_STYLES.buyer : ROLE_STYLES.freelancer;

  const payLoading = actionLoading === `${contract.id}-pay`;
  const completeLoading = actionLoading === `${contract.id}-complete`;
  const cancelLoading = actionLoading === `${contract.id}-cancel`;

  const canCancel = statusKey === 'pending_payment' || statusKey === 'active';

  let primary = { label: 'View Details', onPress, loading: false };
  if (buyer && statusKey === 'pending_payment') {
    primary = { label: payLoading ? 'Processing…' : 'Pay Now', onPress: () => onPay(contract.id), loading: payLoading };
  } else if (buyer && statusKey === 'active') {
    primary = { label: completeLoading ? 'Completing…' : 'Mark Complete', onPress: () => onComplete(contract.id), loading: completeLoading };
  }

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <View style={styles.cardBody}>
        {otherParty?.avatar ? (
          <Image source={{ uri: otherParty.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {getInitials(otherParty?.firstName, otherParty?.lastName)}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          {/* Tags row */}
          <View style={styles.tagsRow}>
            <View style={[styles.badgeOutline, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
              <Text style={[styles.badgeOutlineText, { color: roleStyle.fg }]}>{roleStyle.label}</Text>
            </View>
            <View style={[styles.badgeOutline, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.badgeOutlineText, { color: statusStyle.fg }]}>
                {statusKey.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {contract.job?.title || 'Untitled Contract'}
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, styles.metaPillEmerald]}>
              <Text style={[styles.metaPillText, { color: C.emerald700 }]}>
                {formatCurrency(contract.amount)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color={C.slate400} />
              <Text style={styles.metaText}>{timeAgo(contract.createdAt)}</Text>
            </View>
            {contract.payments?.length > 0 && (
              <View style={styles.metaItem}>
                <CreditCard size={12} color={C.slate400} />
                <Text style={styles.metaText}>
                  {contract.payments.length} payment{contract.payments.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.buyerName} numberOfLines={1}>
                {otherParty
                  ? `${otherParty.firstName || ''} ${otherParty.lastName || ''}`.trim() || 'Unknown User'
                  : 'Unknown User'}
              </Text>
              <Text style={styles.buyerHeadline}>{buyer ? 'Freelancer' : 'Client'}</Text>
            </View>

            {canCancel && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onCancel(contract.id);
                }}
                style={styles.cancelButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
                disabled={cancelLoading}
              >
                <Ban size={18} color={cancelLoading ? C.slate300 : C.slate400} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={(e) => {
                e.stopPropagation();
                primary.onPress();
              }}
              disabled={primary.loading}
            >
              <Text style={styles.ctaButtonText}>{primary.label}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ────────────────────────────────────────────────────────────────
const ContractsScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchContracts = useCallback(
    async (targetStatus = statusFilter) => {
      if (!refreshing) setIsLoading((prev) => prev && contracts.length === 0);
      setError(null);

      try {
        const params = {};
        if (targetStatus) params.status = targetStatus;

        const response = await api.get('/contracts/my-contracts', { params });
        setContracts(response.data.contracts || []);
      } catch (err) {
        console.error('Fetch contracts error:', err);
        setError(err.response?.data?.message || 'Failed to load contracts. Please try again.');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('Login');
      return;
    }
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    if (!searchQuery) return contracts;
    const q = searchQuery.toLowerCase();
    return contracts.filter((c) => {
      const otherParty = c.buyerId === user?.id ? c.freelancer : c.buyer;
      return (
        c.job?.title?.toLowerCase().includes(q) ||
        otherParty?.firstName?.toLowerCase().includes(q) ||
        otherParty?.lastName?.toLowerCase().includes(q)
      );
    });
  }, [contracts, searchQuery, user]);

  const handleComplete = (contractId) => {
    Alert.alert(
      'Mark Complete',
      'Mark this contract as completed? The freelancer will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              setActionLoading(`${contractId}-complete`);
              await api.patch(`/contracts/${contractId}/complete`);
              Alert.alert('Success', 'Contract marked as completed');
              fetchContracts();
            } catch (err) {
              console.error('Complete error:', err);
              Alert.alert('Error', err.response?.data?.message || 'Failed to complete contract');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = (contractId) => {
    Alert.alert(
      'Cancel Contract',
      'Are you sure? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(`${contractId}-cancel`);
              await api.patch(`/contracts/${contractId}/cancel`, { reason: undefined });
              Alert.alert('Success', 'Contract cancelled');
              fetchContracts();
            } catch (err) {
              console.error('Cancel error:', err);
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel contract');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handlePay = async (contractId) => {
    try {
      setActionLoading(`${contractId}-pay`);
      const response = await api.post(`/contracts/${contractId}/pay`);
      if (response.data.authorizationUrl) {
        await Linking.openURL(response.data.authorizationUrl);
      } else {
        Alert.alert('Success', 'Payment processed');
        fetchContracts();
      }
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Payment failed');
    } finally {
      setActionLoading(null);
    }
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <FileText size={32} color={C.slate300} />
        </View>
        <Text style={styles.emptyTitle}>No contracts found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? 'Try adjusting your search terms.'
            : statusFilter
            ? `No ${statusFilter.replace('_', ' ')} contracts found.`
            : "You don't have any contracts yet. Accept a proposal to get started."}
        </Text>
        {(statusFilter || searchQuery) && (
          <TouchableOpacity
            style={styles.emptyClearBtn}
            onPress={() => {
              setStatusFilter('');
              setSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <X size={14} color={C.emerald700} style={{ marginRight: 6 }} />
            <Text style={styles.emptyClearBtnText}>Clear all filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Contracts" />

      <FlatList
        data={isLoading ? [] : filteredContracts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ContractCard
            contract={item}
            user={user}
            actionLoading={actionLoading}
            onComplete={handleComplete}
            onCancel={handleCancel}
            onPay={handlePay}
            onPress={() => navigation.navigate('ContractDetail', { contractId: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Hero / heading */}
            <View style={styles.heroSection}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadgeIcon}>
                  <ShieldCheck size={14} color={C.emerald600} />
                </View>
                <Text style={styles.heroEyebrow}>CONTRACTS</Text>
              </View>

              <Text style={styles.heroTitle}>My Contracts</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroSubtitle}>
                  {isLoading ? 'Loading your contracts…' : 'Track and manage your project agreements'}
                </Text>
                <View style={styles.activePill}>
                  <FileText size={13} color={C.emerald700} />
                  <Text style={styles.activePillText}>{contracts.length} Total</Text>
                </View>
              </View>
            </View>

            {/* Search + refresh row */}
            <View style={styles.searchCard}>
              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <Search size={18} color={C.slate400} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by job title or name..."
                    placeholderTextColor={C.slate400}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {!!searchQuery && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={14} color={C.slate500} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => fetchContracts()}
                  style={styles.refreshBtn}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={C.emerald600} />
                  ) : (
                    <RefreshCw size={18} color={C.emerald600} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.chipWrap}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key || 'all'}
                    onPress={() => setStatusFilter(opt.key)}
                    style={[styles.filterChipBtn, statusFilter === opt.key && styles.filterChipBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, statusFilter === opt.key && styles.filterChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText} numberOfLines={2}>
                  {error}
                </Text>
                <TouchableOpacity style={styles.errorRetryBtn} onPress={() => fetchContracts()} activeOpacity={0.7}>
                  <Text style={styles.errorRetryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Results count */}
            {!isLoading && (
              <Text style={styles.resultsCount}>
                Showing <Text style={styles.resultsCountBold}>{filteredContracts.length}</Text> of{' '}
                <Text style={styles.resultsCountBold}>{contracts.length}</Text> contracts
                {!!searchQuery && <Text style={{ color: C.slate400 }}> for "{searchQuery}"</Text>}
              </Text>
            )}

            {isLoading && (
              <View>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.slate50 },
  listContent: { paddingBottom: 40, paddingHorizontal: 16 },

  // Hero
  heroSection: { paddingTop: 16, paddingBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  heroBadgeIcon: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: C.emerald50,
    alignItems: 'center', justifyContent: 'center',
  },
  heroEyebrow: { fontSize: 11, fontWeight: '800', color: C.emerald600, letterSpacing: 1 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: C.slate900, marginBottom: 8, letterSpacing: -0.5 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSubtitle: { fontSize: 14, color: C.slate500, flexShrink: 1, fontWeight: '500' },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald100,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  activePillText: { fontSize: 12, fontWeight: '700', color: C.emerald700 },

  // Search card
  searchCard: {
    backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200,
    padding: 12, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: C.slate900, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200,
    borderRadius: 12, paddingHorizontal: 12, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.slate900, fontWeight: '500' },
  clearIconBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: C.slate200,
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.slate200,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filterChipBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200,
  },
  filterChipBtnActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.slate600 },
  filterChipTextActive: { color: C.white },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.red50, borderWidth: 1, borderColor: C.red100,
    borderRadius: 12, padding: 14, marginBottom: 16, gap: 12,
  },
  errorText: { flex: 1, color: C.red600, fontSize: 13, fontWeight: '500' },
  errorRetryBtn: { backgroundColor: C.red100, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  errorRetryBtnText: { color: C.red700, fontWeight: '700', fontSize: 12 },

  resultsCount: { fontSize: 13, color: C.slate500, marginBottom: 12, fontWeight: '500' },
  resultsCountBold: { fontWeight: '700', color: C.slate900 },

  // Card
  card: {
    backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200,
    marginBottom: 12, padding: 16,
    ...Platform.select({
      ios: { shadowColor: C.slate900, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardBody: { flexDirection: 'row', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 12 },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: C.emerald600,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarFallbackText: { color: C.white, fontWeight: '800', fontSize: 15 },
  avatarSkeleton: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.slate200 },
  skeletonBlock: { backgroundColor: C.slate200, borderRadius: 6 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badgeOutline: {
    borderWidth: 1, borderColor: C.emerald100, backgroundColor: C.emerald50,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  badgeOutlineText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  title: { fontSize: 16, fontWeight: '800', color: C.slate900, marginBottom: 10, lineHeight: 22 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14, alignItems: 'center' },
  metaPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  metaPillEmerald: { backgroundColor: C.emerald50, borderColor: C.emerald100 },
  metaPillText: { fontSize: 12, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.slate500, fontWeight: '500' },

  footerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: 1, borderTopColor: C.slate100, paddingTop: 12,
  },
  buyerName: { fontSize: 13, fontWeight: '700', color: C.slate800 },
  buyerHeadline: { fontSize: 12, color: C.slate400, marginTop: 2 },
  cancelButton: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white,
  },
  ctaButton: {
    backgroundColor: C.emerald600, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaButtonText: { color: C.white, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  // Empty state
  emptyState: {
    backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200,
    paddingVertical: 56, paddingHorizontal: 24, alignItems: 'center', marginTop: 8,
  },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.slate50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.slate900, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: C.slate500, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyClearBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald200,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  emptyClearBtnText: { color: C.emerald700, fontWeight: '700', fontSize: 13 },
});

export default ContractsScreen;