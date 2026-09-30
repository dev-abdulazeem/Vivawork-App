import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  TextInput, Image, Modal, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';

import {
  Search, SlidersHorizontal, X, RefreshCw, Star, Briefcase, Clock, Users, Check
} from 'lucide-react-native';

const C = {
  emerald50: '#ecfdf5', emerald100: '#d1fae5', emerald200: '#a7f3d0',
  emerald600: '#059669', emerald700: '#047857', sky50: '#f0f9ff',
  sky100: '#e0f2fe', sky700: '#0369a1', slate50: '#f8fafc', slate100: '#f1f5f9',
  slate200: '#e2e8f0', slate300: '#cbd5e1', slate400: '#94a3b8', slate500: '#64748b',
  slate600: '#475569', slate700: '#334155', slate800: '#1e293b', slate900: '#0f172a', white: '#ffffff',
};

const formatCurrency = (amount) => {
  if (!amount) return 'Negotiable';
  return `₦${Number(amount).toLocaleString()}/hr`;
};

const getInitials = (firstName, lastName) => `${firstName?.trim()?.[0] || ''}${lastName?.trim()?.[0] || ''}`.toUpperCase() || '?';

const FreelancerCard = ({ item, navigation }) => {
  const matchScore = item.match_score;
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{getInitials(item.firstName, item.lastName)}</Text></View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.tagsRow}>
            {typeof matchScore === 'number' && (
              <View style={styles.matchBadge}>
                <Check size={12} color={C.white} />
                <Text style={styles.matchBadgeText}>{Math.round(matchScore * 100)}% Match</Text>
              </View>
            )}
            {item.isAvailable && (
              <View style={[styles.badgeOutline, { backgroundColor: C.sky50, borderColor: C.sky100 }]}>
                <Text style={[styles.badgeOutlineText, { color: C.sky700 }]}>Available</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.headline} numberOfLines={1}>{item.headline || 'Freelancer'}</Text>

          {item.skills?.length > 0 && (
            <View style={styles.skillsRow}>
              {item.skills.slice(0, 4).map((skill, idx) => (
                <View key={`${skill}-${idx}`} style={styles.skillChip}><Text style={styles.skillChipText}>{skill}</Text></View>
              ))}
            </View>
          )}

          <View style={styles.metaRow}>
            {item.rating && (
              <View style={styles.metaItem}><Star size={14} color="#f59e0b" fill="#f59e0b" /><Text style={styles.metaText}>{item.rating.toFixed(1)}</Text></View>
            )}
            {item.hourlyRate && (
              <View style={styles.metaPill}><Text style={styles.metaPillText}>{formatCurrency(item.hourlyRate)}</Text></View>
            )}
            <View style={styles.metaItem}><Briefcase size={14} color={C.slate400} /><Text style={styles.metaText}>{item.completedJobsCount || 0} Jobs</Text></View>
            <View style={styles.metaItem}><Clock size={14} color={C.slate400} /><Text style={styles.metaText}>{item.responseRate || 90}% Resp.</Text></View>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Profile', { userId: item.id })} activeOpacity={0.7}>
              <Text style={styles.outlineBtnText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PostJob', { inviteId: item.id })} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Invite to Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const FindFreelancerScreen = ({ navigation }) => {
  const [freelancers, setFreelancers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [filters, setFilters] = useState({ skills: '', minRating: '', maxRate: '', isAvailable: '' });
  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const fetchFreelancers = useCallback(async (targetPage = 1, { append = false } = {}) => {
    if (append) setIsFetchingMore(true);
    else if (!refreshing) setIsLoading(targetPage === 1 && freelancers.length === 0);

    try {
      const params = new URLSearchParams();
      params.append('page', String(targetPage));
      params.append('limit', String(limit));
      if (searchQuery) params.append('query', searchQuery);
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.maxRate) params.append('maxRate', filters.maxRate);
      if (filters.isAvailable) params.append('isAvailable', filters.isAvailable);

      const response = await api.get(`/freelancers/search?${params.toString()}`);
      const data = response.data?.freelancers || [];
      
      setFreelancers((prev) => (append ? [...prev, ...data] : data));
      setTotal(response.data?.total || data.length);
      setPage(targetPage);
    } catch (err) {
      console.error('Fetch freelancers error:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters, freelancers.length, refreshing, limit]);

  useEffect(() => { fetchFreelancers(1); }, [fetchFreelancers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFreelancers(1);
  }, [fetchFreelancers]);

  const onLoadMore = () => {
    if (isFetchingMore || freelancers.length >= total) return;
    fetchFreelancers(page + 1, { append: true });
  };

  const clearFilters = () => {
    setFilters({ skills: '', minRating: '', maxRate: '', isAvailable: '' });
  };

  const renderFiltersModal = () => (
    <Modal visible={filtersVisible} animationType="slide" transparent onRequestClose={() => setFiltersVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><X size={24} color={C.slate500} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.filterLabel}>Skills</Text>
            <TextInput style={styles.textInput} placeholder="e.g. react, node.js" placeholderTextColor={C.slate400} value={filters.skills} onChangeText={(v) => setFilters((f) => ({ ...f, skills: v }))} />
            
            <Text style={styles.filterLabel}>Min Rating</Text>
            <View style={styles.chipWrap}>
              {['', '4.5', '4.0', '3.5'].map((r) => (
                <TouchableOpacity key={r} onPress={() => setFilters((f) => ({ ...f, minRating: r }))} style={[styles.filterChipBtn, filters.minRating === r && styles.filterChipBtnActive]} activeOpacity={0.7}>
                  <Text style={[styles.filterChipText, filters.minRating === r && styles.filterChipTextActive]}>{r ? `${r}+ Stars` : 'Any'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Max Hourly Rate (₦)</Text>
            <TextInput style={styles.textInput} placeholder="e.g. 10000" placeholderTextColor={C.slate400} keyboardType="numeric" value={filters.maxRate} onChangeText={(v) => setFilters((f) => ({ ...f, maxRate: v }))} />

            <Text style={styles.filterLabel}>Availability</Text>
            <View style={styles.chipWrap}>
              {[{ key: '', label: 'Any' }, { key: 'true', label: 'Available Now' }].map((opt) => (
                <TouchableOpacity key={opt.key} onPress={() => setFilters((f) => ({ ...f, isAvailable: opt.key }))} style={[styles.filterChipBtn, filters.isAvailable === opt.key && styles.filterChipBtnActive]} activeOpacity={0.7}>
                  <Text style={[styles.filterChipText, filters.isAvailable === opt.key && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooterRow}>
            <TouchableOpacity style={styles.modalClearBtn} onPress={clearFilters} activeOpacity={0.7}><Text style={styles.modalClearBtnText}>Clear all</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setFiltersVisible(false)} activeOpacity={0.85}><Text style={styles.modalApplyBtnText}>Show results</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Find Freelancer" showBackButton onBack={() => navigation.goBack()} />
      
      <FlatList
        data={isLoading ? [] : freelancers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FreelancerCard item={item} navigation={navigation} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
        onEndReachedThreshold={0.4}
        onEndReached={onLoadMore}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Find Top Talent</Text>
            <Text style={styles.headerSubtitle}>
              {isLoading ? 'Searching talent pool...' : `${total} freelancers found`}
            </Text>
            
            <View style={styles.searchCard}>
              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <Search size={18} color={C.slate400} />
                  <TextInput style={styles.searchInput} placeholder="Search skills, e.g. web developer..." placeholderTextColor={C.slate400} value={searchQuery} onChangeText={setSearchQuery} />
                  {!!searchQuery && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><X size={14} color={C.slate500} /></TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity onPress={() => setFiltersVisible(true)} style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]} activeOpacity={0.7}>
                  <SlidersHorizontal size={18} color={activeFilterCount > 0 ? C.emerald700 : C.slate700} />
                  <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>Filters</Text>
                  {activeFilterCount > 0 && <View style={styles.filterCountBadge}><Text style={styles.filterCountBadgeText}>{activeFilterCount}</Text></View>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => fetchFreelancers(1)} style={styles.refreshBtn} disabled={isLoading} activeOpacity={0.7}>
                  {isLoading ? <ActivityIndicator size="small" color={C.emerald600} /> : <RefreshCw size={18} color={C.emerald600} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListFooterComponent={isFetchingMore ? <View style={{ paddingVertical: 24, alignItems: 'center' }}><ActivityIndicator size="small" color={C.emerald600} /></View> : null}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}><Users size={32} color={C.slate300} /></View>
              <Text style={styles.emptyTitle}>No freelancers found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search terms or filters to find more talent.</Text>
              {(activeFilterCount > 0 || searchQuery) && (
                <TouchableOpacity style={styles.emptyClearBtn} onPress={() => { clearFilters(); setSearchQuery(''); }} activeOpacity={0.7}>
                  <X size={14} color={C.emerald700} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyClearBtnText}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
      {renderFiltersModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.slate50 },
  listContent: { paddingBottom: 40, paddingHorizontal: 16 },
  headerSection: { paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: C.slate900, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: C.slate500, fontWeight: '500', marginBottom: 16 },
  searchCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, padding: 12, ...Platform.select({ ios: { shadowColor: C.slate900, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, fontSize: 14, color: C.slate900, fontWeight: '500' },
  clearIconBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.slate200, alignItems: 'center', justifyContent: 'center' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white, paddingHorizontal: 14, height: 46, borderRadius: 12 },
  filterBtnActive: { backgroundColor: C.emerald50, borderColor: C.emerald200 },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: C.slate700 },
  filterBtnTextActive: { color: C.emerald700 },
  filterCountBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.emerald600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  filterCountBadgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
  refreshBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  
  card: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, marginBottom: 12, padding: 16, ...Platform.select({ ios: { shadowColor: C.slate900, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  cardBody: { flexDirection: 'row', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 14 },
  avatarFallback: { width: 56, height: 56, borderRadius: 14, backgroundColor: C.emerald600, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: C.white, fontWeight: '800', fontSize: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.emerald600, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  matchBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  badgeOutline: { borderWidth: 1, borderColor: C.sky100, backgroundColor: C.sky50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOutlineText: { fontSize: 10, fontWeight: '800', color: C.sky700 },
  name: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  headline: { fontSize: 13, color: C.slate500, marginBottom: 8 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip: { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  skillChipText: { fontSize: 11, fontWeight: '600', color: C.slate600 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.slate500, fontWeight: '600' },
  metaPill: { backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  metaPillText: { fontSize: 12, fontWeight: '700', color: C.emerald700 },
  footerRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.slate100, paddingTop: 12 },
  outlineBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.slate200 },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: C.slate700 },
  primaryBtn: { flex: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: C.emerald600 },
  primaryBtnText: { fontSize: 13, fontWeight: '800', color: C.white },

  emptyState: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, paddingVertical: 56, paddingHorizontal: 24, alignItems: 'center', marginTop: 8 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.slate900, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: C.slate500, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyClearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald200, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyClearBtnText: { color: C.emerald700, fontWeight: '700', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.slate900 },
  filterLabel: { fontSize: 12, fontWeight: '800', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },
  textInput: { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.slate900, fontWeight: '500' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChipBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200 },
  filterChipBtnActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.slate600 },
  filterChipTextActive: { color: C.white },
  modalFooterRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalClearBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.slate200 },
  modalClearBtnText: { fontWeight: '700', color: C.slate600, fontSize: 14 },
  modalApplyBtn: { flex: 2, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: C.emerald600 },
  modalApplyBtnText: { fontWeight: '800', color: C.white, fontSize: 14 },
});

export default FindFreelancerScreen;