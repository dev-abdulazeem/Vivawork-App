import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Ban,
  ChevronRight,
  Briefcase,
  User,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';

// Mock imports (Replace with your actual imports)
// import { useAuthStore } from '../stores/authStore'
// import { api } from '../utils/api'
const useAuthStore = () => ({ user: { id: '1', role: 'buyer' }, isAuthenticated: true });
const api = { get: async () => ({ data: { contracts: [] } }), patch: async () => ({ data: {} }), post: async () => ({ data: {} }) };

// ════════════════════════════════════════════════════════════════
// COLORS (Strictly solid, matching your palette)
// ════════════════════════════════════════════════════════════════
const C = {
  emerald50: '#ecfdf5', emerald100: '#d1fae5', emerald200: '#a7f3d0', emerald500: '#10b981', emerald600: '#059669', emerald700: '#047857', emerald800: '#065f46',
  red50: '#fef2f2', red100: '#fee2e2', red200: '#fecaca', red500: '#ef4444', red600: '#dc2626', red700: '#b91c1c',
  slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1', slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155', slate900: '#0f172a',
  blue50: '#eff6ff', blue100: '#dbeafe', blue200: '#bfdbfe', blue500: '#3b82f6', blue600: '#2563eb', blue700: '#1d4ed8',
  purple50: '#faf5ff', purple100: '#f3e8ff', purple500: '#a855f7', purple600: '#9333ea', purple700: '#7e22ce',
  amber50: '#fffbeb', amber100: '#fef3c7', amber200: '#fde68a', amber500: '#f59e0b', amber600: '#d97706', amber700: '#b45309',
  gray50: '#f9fafb', gray100: '#f3f4f6', gray200: '#e5e7eb', gray300: '#d1d5db', gray400: '#9ca3af', gray500: '#6b7280', gray600: '#4b5563', gray700: '#374151', gray900: '#111827',
  white: '#ffffff',
};

// ════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }) => {
  const config = {
    pending_payment: { bg: C.amber50, text: C.amber700, border: C.amber200, icon: Clock, label: 'Pending Payment' },
    active: { bg: C.emerald50, text: C.emerald700, border: C.emerald200, icon: ShieldCheck, label: 'Active' },
    completed: { bg: C.emerald50, text: C.emerald800, border: C.emerald200, icon: CheckCircle2, label: 'Completed' },
    cancelled: { bg: C.red50, text: C.red700, border: C.red200, icon: XCircle, label: 'Cancelled' },
  }[status] || { bg: C.gray50, text: C.gray600, border: C.gray200, icon: Clock, label: status };

  const Icon = config.icon;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Icon size={14} color={config.text} strokeWidth={2.5} />
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const RoleBadge = ({ isBuyer }) => (
  <View style={[styles.roleBadge, isBuyer ? styles.roleBadgeBuyer : styles.roleBadgeFreelancer]}>
    {isBuyer ? <Wallet size={12} color={C.blue600} strokeWidth={2} /> : <Briefcase size={12} color={C.purple600} strokeWidth={2} />}
    <Text style={[styles.roleBadgeText, isBuyer ? { color: C.blue700 } : { color: C.purple700 }]}>
      {isBuyer ? 'Client' : 'Freelancer'}
    </Text>
  </View>
);

const ContractCard = ({ contract, user, actionLoading, onComplete, onCancel, onPay, navigation }) => {
  const isBuyer = contract.buyerId === user?.id;
  const otherParty = isBuyer ? contract.freelancer : contract.buyer;

  const formatAmount = (amount) => {
    if (amount == null) return 'N/A';
    return `₦${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.card}>
      {/* Top: Badges & Title */}
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <RoleBadge isBuyer={isBuyer} />
          <StatusBadge status={contract.status} />
        </View>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {contract.job?.title || 'Untitled Contract'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Middle: Party & Details */}
      <View style={styles.cardBody}>
        <View style={styles.partyInfo}>
          <View style={styles.avatar}>
            {otherParty?.avatar ? (
              <Image source={{ uri: otherParty.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {otherParty ? `${otherParty.firstName?.[0] || ''}${otherParty.lastName?.[0] || ''}`.toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <View style={styles.partyText}>
            <Text style={styles.partyName}>
              {otherParty ? `${otherParty.firstName || ''} ${otherParty.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User'}
            </Text>
            <Text style={styles.partyRole}>{isBuyer ? 'Freelancer' : 'Client'}</Text>
          </View>
        </View>

        <View style={styles.contractDetails}>
          <View style={styles.detailRow}>
            <DollarSign size={16} color={C.emerald500} strokeWidth={2} />
            <Text style={styles.detailValue}>{formatAmount(contract.amount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={16} color={C.gray400} strokeWidth={2} />
            <Text style={styles.detailText}>{formatDate(contract.createdAt)}</Text>
          </View>
          {contract.payments?.length > 0 && (
            <View style={styles.detailRow}>
              <CreditCard size={16} color={C.gray400} strokeWidth={2} />
              <Text style={styles.detailText}>{contract.payments.length} payment{contract.payments.length !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom: Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.viewDetailsBtn} 
          onPress={() => navigation.navigate('ContractDetail', { contractId: contract.id })}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <ChevronRight size={16} color={C.emerald600} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.actionButtonsCol}>
          {isBuyer && contract.status === 'pending_payment' && (
            <TouchableOpacity 
              style={styles.actionBtnPrimary} 
              onPress={() => onPay(contract.id)}
              disabled={actionLoading === `${contract.id}-pay`}
            >
              {actionLoading === `${contract.id}-pay` ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <>
                  <CreditCard size={16} color={C.white} strokeWidth={2} />
                  <Text style={styles.actionBtnPrimaryText}>Pay Now</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isBuyer && contract.status === 'active' && (
            <TouchableOpacity 
              style={styles.actionBtnPrimary} 
              onPress={() => onComplete(contract.id)}
              disabled={actionLoading === `${contract.id}-complete`}
            >
              {actionLoading === `${contract.id}-complete` ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <>
                  <CheckCircle2 size={16} color={C.white} strokeWidth={2} />
                  <Text style={styles.actionBtnPrimaryText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(contract.status === 'pending_payment' || contract.status === 'active') && (
            <TouchableOpacity 
              style={styles.actionBtnDanger} 
              onPress={() => onCancel(contract.id)}
              disabled={actionLoading === `${contract.id}-cancel`}
            >
              {actionLoading === `${contract.id}-cancel` ? (
                <ActivityIndicator size="small" color={C.red600} />
              ) : (
                <>
                  <Ban size={16} color={C.red600} strokeWidth={2} />
                  <Text style={styles.actionBtnDangerText}>Cancel Contract</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════

const Contracts = ({ navigation }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('Login');
      return;
    }
    fetchContracts();
  }, [isAuthenticated, activeFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const response = await api.get('/contracts/my-contracts', { params });
      setContracts(response.data.contracts || []);
    } catch (err) {
      console.error('Fetch contracts error:', err);
      setError(err.response?.data?.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (contractId) => {
    Alert.alert(
      'Complete Contract',
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
      'Are you sure you want to cancel this contract? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(`${contractId}-cancel`);
              // Note: If you need a text input for the reason, replace this Alert with a custom Modal
              await api.patch(`/contracts/${contractId}/cancel`, { reason: 'Cancelled via mobile app' });
              Alert.alert('Success', 'Contract cancelled');
              fetchContracts();
            } catch (err) {
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
        // Use Linking.openURL for React Native
        const { Linking } = require('react-native');
        Linking.openURL(response.data.authorizationUrl);
      } else {
        Alert.alert('Success', 'Payment processed');
        fetchContracts();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Payment failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending_payment', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading your contracts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <View style={[styles.errorIconWrap, { backgroundColor: C.red50 }]}>
            <AlertCircle size={32} color={C.red500} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchContracts}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <ArrowLeft size={24} color={C.slate500} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Contracts</Text>
          <Text style={styles.headerSubtitle}>Track and manage all your project agreements</Text>
        </View>
        <View style={styles.headerCount}>
          <FileText size={16} color={C.emerald500} strokeWidth={2} />
          <Text style={styles.headerCountText}>{contracts.length}</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterBtn, activeFilter === filter.key && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[styles.filterBtnText, activeFilter === filter.key && styles.filterBtnTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <FileText size={32} color={C.gray300} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No contracts found</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? "You don't have any contracts yet. Accept a proposal to get started!"
              : `No ${activeFilter.replace('_', ' ')} contracts found.`}
          </Text>
          {activeFilter === 'all' && user?.role === 'buyer' && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Jobs')}>
              <Text style={styles.emptyBtnText}>View Available Jobs</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ContractCard
              contract={item}
              user={user}
              actionLoading={actionLoading}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onPay={handlePay}
              navigation={navigation}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gray50 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: C.slate500, fontSize: 14 },
  errorIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: C.slate900, marginBottom: 8 },
  errorText: { fontSize: 15, color: C.slate500, textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: C.emerald600, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  headerBackBtn: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.slate900 },
  headerSubtitle: { fontSize: 14, color: C.slate500, marginTop: 4 },
  headerCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.gray50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.gray100 },
  headerCountText: { fontSize: 14, fontWeight: '700', color: C.slate700 },

  // Filters
  filterScroll: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, backgroundColor: C.white },
  filterBtnActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  filterBtnText: { fontSize: 14, fontWeight: '600', color: C.slate600 },
  filterBtnTextActive: { color: C.white },

  // List
  listContent: { padding: 20, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.gray100,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { gap: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  roleBadgeBuyer: { backgroundColor: C.blue50, borderColor: C.blue200 },
  roleBadgeFreelancer: { backgroundColor: C.purple50, borderColor: C.purple200 },
  roleBadgeText: { fontSize: 12, fontWeight: '600' },
  jobTitle: { fontSize: 17, fontWeight: '700', color: C.slate900, lineHeight: 24 },
  divider: { height: 1, backgroundColor: C.gray100, marginVertical: 16 },
  
  // Card Body
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  partyInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.emerald50, borderWidth: 2, borderColor: C.emerald100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44 },
  avatarText: { fontSize: 14, fontWeight: '700', color: C.emerald700 },
  partyText: { flex: 1 },
  partyName: { fontSize: 15, fontWeight: '700', color: C.slate900 },
  partyRole: { fontSize: 13, color: C.slate400, marginTop: 2 },
  contractDetails: { alignItems: 'flex-end', gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailValue: { fontSize: 15, fontWeight: '700', color: C.slate900 },
  detailText: { fontSize: 13, color: C.slate500 },

  // Card Actions
  cardActions: { gap: 12 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.emerald200, backgroundColor: C.emerald50 },
  viewDetailsText: { fontSize: 14, fontWeight: '700', color: C.emerald700 },
  actionButtonsCol: { gap: 10 },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.emerald600, paddingVertical: 12, borderRadius: 10 },
  actionBtnPrimaryText: { color: C.white, fontWeight: '700', fontSize: 14 },
  actionBtnDanger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.red50, borderWidth: 1, borderColor: C.red200, paddingVertical: 12, borderRadius: 10 },
  actionBtnDangerText: { color: C.red600, fontWeight: '700', fontSize: 14 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.gray100, marginHorizontal: 20, marginTop: 20 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.gray100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.slate900, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.slate500, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn: { backgroundColor: C.emerald600, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
});

export default Contracts;