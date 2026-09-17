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
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';

// Lucide React Native Icons
import {
  Briefcase,
  Flame,
  MapPin,
  Clock,
  Users,
  Bookmark,
  X,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Plus,
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
  open: { bg: C.emerald50, fg: C.emerald700, border: C.emerald100 },
  in_progress: { bg: C.sky50, fg: C.sky700, border: C.sky100 },
  completed: { bg: C.slate100, fg: C.slate600, border: C.slate200 },
  cancelled: { bg: C.red50, fg: C.red700, border: C.red100 },
};

const STATUS_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Negotiable';
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
// JOB CARD
// ────────────────────────────────────────────────────────────────
const JobItemCard = ({ job, isSaved, onToggleSave, onPress }) => {
  const statusKey = job.status || 'open';
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.open;
  const proposalsCount = job.proposals?.length || 0;

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <View style={styles.cardBody}>
        {job.buyer?.avatar ? (
          <Image source={{ uri: job.buyer.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {getInitials(job.buyer?.firstName, job.buyer?.lastName)}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          {/* Tags row */}
          <View style={styles.tagsRow}>
            <View style={styles.badgeOutline}>
              <Text style={styles.badgeOutlineText}>
                {(job.budgetType || 'fixed').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badgeOutline, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.badgeOutlineText, { color: statusStyle.fg }]}>
                {statusKey.replace('_', ' ')}
              </Text>
            </View>
            {proposalsCount > 5 && (
              <View style={[styles.badgeOutline, { backgroundColor: C.amber50, borderColor: C.amber100 }]}>
                <View style={styles.popularBadgeContent}>
                  <Flame size={12} color={C.amber700} fill={C.amber700} />
                  <Text style={[styles.badgeOutlineText, { color: C.amber700 }]}>Popular</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {job.description}
          </Text>

          {job.skills?.length > 0 && (
            <View style={styles.skillsRow}>
              {job.skills.slice(0, 4).map((skill, idx) => (
                <View key={`${skill}-${idx}`} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
              {job.skills.length > 4 && (
                <View style={styles.skillChip}>
                  <Text style={styles.skillChipText}>+{job.skills.length - 4}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, job.budget !== null ? styles.metaPillEmerald : styles.metaPillSlate]}>
              <Text style={[styles.metaPillText, job.budget !== null ? { color: C.emerald700 } : { color: C.slate500 }]}>
                {formatCurrency(job.budget)}
                {job.budget !== null && job.budgetType === 'hourly' ? '/hr' : ''}
                {job.budget !== null && job.budgetType === 'retainer' ? '/mo' : ''}
              </Text>
            </View>
            {!!job.location && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={C.slate400} />
                <Text style={styles.metaText}>{job.location}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Clock size={12} color={C.slate400} />
              <Text style={styles.metaText}>{timeAgo(job.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={12} color={C.slate400} />
              <Text style={styles.metaText}>{proposalsCount}</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.buyerName} numberOfLines={1}>
                {job.buyer?.firstName} {job.buyer?.lastName}
              </Text>
              {!!job.buyer?.headline && (
                <Text style={styles.buyerHeadline} numberOfLines={1}>
                  {job.buyer.headline}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              style={[styles.saveButton, isSaved && styles.saveButtonActive]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Bookmark 
                size={20} 
                color={isSaved ? C.emerald600 : C.slate400} 
                fill={isSaved ? C.emerald600 : 'none'} 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>View & Apply</Text>
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
const JobsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [filters, setFilters] = useState({
    status: '',
    skill: '',
    minBudget: '',
    maxBudget: '',
    location: '',
  });

  const [skillOptions, setSkillOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const fetchJobs = useCallback(
    async (targetPage = 1, { append = false } = {}) => {
      if (append) setIsFetchingMore(true);
      else if (!refreshing) setIsLoading(targetPage === 1 && jobs.length === 0);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('page', String(targetPage));
        params.append('limit', String(limit));
        if (filters.status) params.append('status', filters.status);
        if (filters.skill) params.append('skill', filters.skill);
        if (filters.minBudget) params.append('minBudget', filters.minBudget);
        if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
        if (filters.location) params.append('location', filters.location);

        const response = await api.get(`/jobs?${params.toString()}`);
        const fetchedJobs = response.data?.jobs || [];
        const pagination = response.data?.pagination || {};

        setJobs((prev) => (append ? [...prev, ...fetchedJobs] : fetchedJobs));
        setTotalPages(pagination.pages || 1);
        setTotal(pagination.total || fetchedJobs.length);
        setPage(pagination.page || targetPage);

        const allSkills = new Set(skillOptions);
        const allLocations = new Set(locationOptions);
        fetchedJobs.forEach((job) => {
          job.skills?.forEach((s) => allSkills.add(s));
          if (job.location) allLocations.add(job.location);
        });
        setSkillOptions([...allSkills]);
        setLocationOptions([...allLocations]);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err.response?.data?.message || 'Failed to load jobs. Please try again.');
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters]
  );

  useEffect(() => {
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs(1);
  }, [fetchJobs]);

  const onLoadMore = () => {
    if (isFetchingMore || page >= totalPages) return;
    fetchJobs(page + 1, { append: true });
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job.skills?.some((s) => s.toLowerCase().includes(q)) ||
        job.buyer?.firstName?.toLowerCase().includes(q) ||
        job.buyer?.lastName?.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const toggleSaveJob = (jobId) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ status: '', skill: '', minBudget: '', maxBudget: '', location: '' });
  };

  // ── Filters bottom sheet ──────────────────────────────────────
  const renderFiltersModal = () => (
    <Modal visible={filtersVisible} animationType="slide" transparent onRequestClose={() => setFiltersVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={C.slate500} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.chipWrap}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key || 'all'}
                  onPress={() => setFilters((f) => ({ ...f, status: opt.key }))}
                  style={[styles.filterChipBtn, filters.status === opt.key && styles.filterChipBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, filters.status === opt.key && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {skillOptions.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Skill</Text>
                <View style={styles.chipWrap}>
                  <TouchableOpacity
                    onPress={() => setFilters((f) => ({ ...f, skill: '' }))}
                    style={[styles.filterChipBtn, filters.skill === '' && styles.filterChipBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, filters.skill === '' && styles.filterChipTextActive]}>Any</Text>
                  </TouchableOpacity>
                  {skillOptions.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setFilters((f) => ({ ...f, skill: s }))}
                      style={[styles.filterChipBtn, filters.skill === s && styles.filterChipBtnActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, filters.skill === s && styles.filterChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {locationOptions.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Location</Text>
                <View style={styles.chipWrap}>
                  <TouchableOpacity
                    onPress={() => setFilters((f) => ({ ...f, location: '' }))}
                    style={[styles.filterChipBtn, filters.location === '' && styles.filterChipBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, filters.location === '' && styles.filterChipTextActive]}>Any</Text>
                  </TouchableOpacity>
                  {locationOptions.map((l) => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => setFilters((f) => ({ ...f, location: l }))}
                      style={[styles.filterChipBtn, filters.location === l && styles.filterChipBtnActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, filters.location === l && styles.filterChipTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.filterLabel}>Budget (₦)</Text>
            <View style={styles.budgetRow}>
              <TextInput
                style={styles.budgetInput}
                placeholder="Min"
                placeholderTextColor={C.slate400}
                keyboardType="numeric"
                value={filters.minBudget}
                onChangeText={(v) => setFilters((f) => ({ ...f, minBudget: v }))}
              />
              <TextInput
                style={styles.budgetInput}
                placeholder="Max"
                placeholderTextColor={C.slate400}
                keyboardType="numeric"
                value={filters.maxBudget}
                onChangeText={(v) => setFilters((f) => ({ ...f, maxBudget: v }))}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooterRow}>
            <TouchableOpacity style={styles.modalClearBtn} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.modalClearBtnText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setFiltersVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalApplyBtnText}>Show results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Empty state ────────────────────────────────────────────────
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Search size={32} color={C.slate300} />
        </View>
        <Text style={styles.emptyTitle}>No jobs found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'Try adjusting your search terms.' : 'No jobs match your filters. Try broadening your search.'}
        </Text>
        {(activeFilterCount > 0 || searchQuery) && (
          <TouchableOpacity
            style={styles.emptyClearBtn}
            onPress={() => {
              clearFilters();
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
      <Header title="Jobs" />

      <FlatList
        data={isLoading ? [] : filteredJobs}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => (
          <JobItemCard
            job={item}
            isSaved={savedJobs.has(item._id || item.id)}
            onToggleSave={() => toggleSaveJob(item._id || item.id)}
            onPress={() => navigation.navigate('JobDetail', { jobId: item._id || item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
        onEndReachedThreshold={0.4}
        onEndReached={onLoadMore}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Hero / heading */}
            <View style={styles.heroSection}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadgeIcon}>
                  <Briefcase size={14} color={C.emerald600} />
                </View>
                <Text style={styles.heroEyebrow}>JOB BOARD</Text>
              </View>
              <Text style={styles.heroTitle}>Find Your Next Project</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroSubtitle}>
                  {isLoading ? 'Loading opportunities…' : `${total.toLocaleString()} jobs waiting for you`}
                </Text>
                <View style={styles.activePill}>
                  <Flame size={14} color={C.emerald700} fill={C.emerald700} />
                  <Text style={styles.activePillText}>{total} Active</Text>
                </View>
              </View>
            </View>

            {/* Search + filter row */}
            <View style={styles.searchCard}>
              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <Search size={18} color={C.slate400} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search jobs, skills, or keywords..."
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
                  onPress={() => setFiltersVisible(true)}
                  style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                  activeOpacity={0.7}
                >
                  <SlidersHorizontal size={18} color={activeFilterCount > 0 ? C.emerald700 : C.slate700} />
                  <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>
                    Filters
                  </Text>
                  {activeFilterCount > 0 && (
                    <View style={styles.filterCountBadge}>
                      <Text style={styles.filterCountBadgeText}>{activeFilterCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => fetchJobs(1)} 
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
            </View>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText} numberOfLines={2}>
                  {error}
                </Text>
                <TouchableOpacity style={styles.errorRetryBtn} onPress={() => fetchJobs(1)} activeOpacity={0.7}>
                  <Text style={styles.errorRetryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Results count */}
            {!isLoading && (
              <Text style={styles.resultsCount}>
                Showing <Text style={styles.resultsCountBold}>{filteredJobs.length}</Text> of{' '}
                <Text style={styles.resultsCountBold}>{total}</Text> jobs
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
        ListFooterComponent={
          isFetchingMore ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={C.emerald600} />
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('PostJob')}
      >
        <Plus size={28} color={C.white} strokeWidth={2.5} />
      </TouchableOpacity>

      {renderFiltersModal()}
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.slate50 },
  listContent: { paddingBottom: 120, paddingHorizontal: 16 },

  // Hero
  heroSection: { paddingTop: 16, paddingBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
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
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white,
    paddingHorizontal: 14, height: 46, borderRadius: 12,
  },
  filterBtnActive: { backgroundColor: C.emerald50, borderColor: C.emerald200 },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: C.slate700 },
  filterBtnTextActive: { color: C.emerald700 },
  filterCountBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.emerald600,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  filterCountBadgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
  refreshBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.slate200,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
  },

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
  badgeOutlineText: { fontSize: 10, fontWeight: '800', color: C.emerald700, textTransform: 'uppercase', letterSpacing: 0.5 },
  popularBadgeContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  title: { fontSize: 16, fontWeight: '800', color: C.slate900, marginBottom: 4, lineHeight: 22 },
  description: { fontSize: 14, color: C.slate500, lineHeight: 20, marginBottom: 10 },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip: {
    backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  skillChipText: { fontSize: 11, fontWeight: '600', color: C.slate600 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14, alignItems: 'center' },
  metaPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  metaPillEmerald: { backgroundColor: C.emerald50, borderColor: C.emerald100 },
  metaPillSlate: { backgroundColor: C.slate50, borderColor: C.slate100 },
  metaPillText: { fontSize: 12, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.slate500, fontWeight: '500' },

  footerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: 1, borderTopColor: C.slate100, paddingTop: 12,
  },
  buyerName: { fontSize: 13, fontWeight: '700', color: C.slate800 },
  buyerHeadline: { fontSize: 12, color: C.slate400, marginTop: 2 },
  saveButton: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white,
  },
  saveButtonActive: { backgroundColor: C.emerald50, borderColor: C.emerald200 },
  applyButton: {
    flex: 1, backgroundColor: C.emerald600, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  applyButtonText: { color: C.white, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

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

  // FAB
  fab: {
    position: 'absolute', bottom: 32, right: 20, width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.emerald600, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: C.emerald700, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
    }),
  },

  // Filters modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.slate900 },
  filterLabel: { fontSize: 12, fontWeight: '800', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChipBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200,
  },
  filterChipBtnActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.slate600 },
  filterChipTextActive: { color: C.white },
  budgetRow: { flexDirection: 'row', gap: 12 },
  budgetInput: {
    flex: 1, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.slate900, fontWeight: '500',
  },
  modalFooterRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalClearBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.slate200,
  },
  modalClearBtnText: { fontWeight: '700', color: C.slate600, fontSize: 14 },
  modalApplyBtn: { flex: 2, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: C.emerald600 },
  modalApplyBtnText: { fontWeight: '800', color: C.white, fontSize: 14 },
});

export default JobsScreen;