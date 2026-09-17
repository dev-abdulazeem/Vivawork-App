// src/screens/JobDetailScreen.js
//
// Combines the job details view AND proposal management (for job owners)
// into a single screen — mirrors web's JobDetail.jsx + JobProposals.jsx,
// merged into one clean mobile experience.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  User,
  Star,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Clock,
  MessageSquare,
  Award,
  Search,
  Send,
  Lock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

// ────────────────────────────────────────────────────────────────
// COLORS — same emerald/slate system used across the app
// ────────────────────────────────────────────────────────────────
const C = {
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald600: '#059669',
  emerald700: '#047857',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber600: '#d97706',
  amber700: '#b45309',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green600: '#16a34a',
  green700: '#15803d',
  sky50: '#f0f9ff',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red500: '#ef4444',
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

const JOB_STATUS_STYLE = {
  open: { bg: C.emerald50, fg: C.emerald700, border: C.emerald200 },
  in_progress: { bg: C.amber50, fg: C.amber700, border: C.amber100 },
  completed: { bg: C.sky50, fg: '#0369a1', border: '#e0f2fe' },
  cancelled: { bg: C.red50, fg: C.red700, border: C.red200 },
};

const PROPOSAL_STATUS_CONFIG = {
  pending: { bg: C.amber50, fg: C.amber700, border: C.amber100, dot: C.amber600, label: 'Pending', Icon: Clock },
  shortlisted: { bg: C.emerald50, fg: C.emerald700, border: C.emerald200, dot: C.emerald600, label: 'Shortlisted', Icon: Star },
  accepted: { bg: C.green50, fg: C.green700, border: C.green100, dot: C.green600, label: 'Hired', Icon: CheckCircle2 },
  rejected: { bg: C.slate100, fg: C.slate500, border: C.slate200, dot: C.slate400, label: 'Declined', Icon: XCircle },
};

const PROPOSAL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Hired' },
  { key: 'rejected', label: 'Declined' },
];

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────
const formatBudget = (budget, type) => {
  if (budget === null || budget === undefined) return 'Not specified';
  const suffix = type === 'hourly' ? '/hr' : type === 'retainer' ? '/mo' : '';
  return `₦${Number(budget).toLocaleString()}${suffix}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const relativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return formatDate(dateString);
};

const getInitials = (firstName, lastName) => {
  const f = firstName?.trim()?.[0] || '';
  const l = lastName?.trim()?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
};

// ────────────────────────────────────────────────────────────────
// SMALL PRESENTATIONAL PIECES
// ────────────────────────────────────────────────────────────────
const Avatar = ({ uri, firstName, lastName, size = 48 }) => {
  const dim = { width: size, height: size, borderRadius: size * 0.28 };
  if (uri) return <Image source={{ uri }} style={[styles.avatarImg, dim]} />;
  return (
    <View style={[styles.avatarFallback, dim]}>
      <Text style={[styles.avatarFallbackText, { fontSize: size * 0.36 }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
};

const StatChip = ({ Icon, label, value, tint }) => (
  <View style={[styles.statChip, { backgroundColor: tint.bg, borderColor: tint.border }]}>
    <View style={[styles.statChipIcon, { backgroundColor: C.white }]}>
      <Icon size={16} color={tint.fg} strokeWidth={2.2} />
    </View>
    <View>
      <Text style={[styles.statChipValue, { color: tint.fg }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  </View>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <View style={styles.card}>
    <View style={styles.sectionHeaderRow}>
      <Icon size={17} color={C.emerald600} strokeWidth={2.2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ────────────────────────────────────────────────────────────────
const JobDetailScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [hasProposed, setHasProposed] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: '',
    proposedBudget: '',
    proposedDuration: '',
  });

  const isFreelancer = user?.role === 'freelancer' || user?.isFreelancer === true;
  const isJobOwner = job?.buyerId?.toString() === user?.id?.toString();
  const canEdit = isJobOwner || user?.isAdmin;
  const canDelete = isJobOwner || user?.isAdmin;
  const canApply = isAuthenticated && isFreelancer && !isJobOwner && job?.status === 'open';

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/jobs/${jobId}`);
      const jobData = response.data.job;
      setJob(jobData);

      if (user && jobData.proposals) {
        const mine = jobData.proposals.find(
          (p) => p.freelancerId?.toString() === user.id?.toString()
        );
        setHasProposed(!!mine);
      }
    } catch (err) {
      console.error('Fetch job error:', err);
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  const fetchProposals = useCallback(async () => {
    try {
      setProposalsLoading(true);
      const response = await api.get(`/proposals/job/${jobId}`);
      setProposals(response.data.proposals || []);
    } catch (err) {
      console.error('Fetch proposals error:', err);
    } finally {
      setProposalsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (isJobOwner && job) fetchProposals();
  }, [isJobOwner, job, fetchProposals]);

  const handleProposalAction = async (proposalId, status) => {
    const verb = status === 'accepted' ? 'accept & hire' : status === 'rejected' ? 'decline' : 'shortlist';
    Alert.alert(
      `Confirm ${verb}`,
      `Are you sure you want to ${verb} this proposal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setActionLoading(proposalId);
              await api.patch(`/proposals/${proposalId}/status`, { status });
              fetchProposals();
              fetchJob();
            } catch (err) {
              console.error('Proposal action error:', err);
              Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (!proposalData.coverLetter.trim()) {
      Alert.alert('Cover letter required', 'Please write a short cover letter before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/proposals/job/${jobId}`, {
        coverLetter: proposalData.coverLetter,
        proposedRate: proposalData.proposedBudget ? parseFloat(proposalData.proposedBudget) : null,
        proposedBudget: proposalData.proposedBudget ? parseFloat(proposalData.proposedBudget) : null,
        duration: proposalData.proposedDuration ? `${proposalData.proposedDuration} days` : null,
        proposedDuration: proposalData.proposedDuration ? parseInt(proposalData.proposedDuration, 10) : null,
      });
      setHasProposed(true);
      setShowApplyModal(false);
      setProposalData({ coverLetter: '', proposedBudget: '', proposedDuration: '' });
      fetchJob();
      Alert.alert('Proposal submitted', 'Your proposal was sent successfully.');
    } catch (err) {
      console.error('Submit proposal error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete job', 'Are you sure you want to delete this job? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await api.delete(`/jobs/${jobId}`);
            navigation.navigate('Jobs');
          } catch (err) {
            console.error('Delete job error:', err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete job');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleMessage = (freelancerId) => {
    navigation.navigate('Chat', { userId: freelancerId });
  };

  const displayProposals = proposals.length > 0 ? proposals : job?.proposals || [];

  const counts = useMemo(() => {
    const list = displayProposals;
    return {
      all: list.length,
      pending: list.filter((p) => p.status === 'pending').length,
      shortlisted: list.filter((p) => p.status === 'shortlisted').length,
      accepted: list.filter((p) => p.status === 'accepted').length,
      rejected: list.filter((p) => p.status === 'rejected').length,
    };
  }, [displayProposals]);

  const filteredProposals = useMemo(() => {
    let list = displayProposals;
    if (activeFilter !== 'all') list = list.filter((p) => p.status === activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const name = `${p.freelancer?.firstName || ''} ${p.freelancer?.lastName || ''}`.toLowerCase();
        return name.includes(q) || p.coverLetter?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [displayProposals, activeFilter, searchQuery]);

  const myProposal = useMemo(() => {
    if (!job?.proposals || !user) return null;
    return job.proposals.find((p) => p.freelancerId?.toString() === user.id?.toString());
  }, [job, user]);

  // ── Loading / error states ──────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Job Details" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading job details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Job Details" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centerFill}>
          <View style={styles.errorIconCircle}>
            <AlertCircle size={30} color={C.red500} strokeWidth={2} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.errorRetryBtn} onPress={fetchJob}>
            <Text style={styles.errorRetryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) return null;

  const jobStatusStyle = JOB_STATUS_STYLE[job.status] || JOB_STATUS_STYLE.open;
  const showFooter = !isJobOwner;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Job Details"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={
          (canEdit || canDelete) && (
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {canEdit && (
                <TouchableOpacity onPress={() => navigation.navigate('PostJob', { jobId })}>
                  <Pencil size={20} color={C.slate600} strokeWidth={2} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <ActivityIndicator size="small" color={C.red600} />
                  ) : (
                    <Trash2 size={20} color={C.red600} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: showFooter ? 24 : 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={styles.badgeRow}>
            <View style={[styles.pillBadge, { backgroundColor: jobStatusStyle.bg, borderColor: jobStatusStyle.border }]}>
              <Text style={[styles.pillBadgeText, { color: jobStatusStyle.fg }]}>
                {job.status.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: C.emerald50, borderColor: C.emerald100 }]}>
              <Text style={[styles.pillBadgeText, { color: C.emerald700 }]}>
                {job.budgetType || 'fixed'}
              </Text>
            </View>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.postedRow}>
            <Calendar size={13} color={C.slate400} strokeWidth={2} />
            <Text style={styles.postedText}>Posted {formatDate(job.createdAt)}</Text>
          </View>
        </View>

        {/* Quick stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statRow}
        >
          <StatChip
            Icon={DollarSign}
            label="Budget"
            value={formatBudget(job.budget, job.budgetType)}
            tint={{ bg: C.emerald50, border: C.emerald100, fg: C.emerald700 }}
          />
          {!!job.location && (
            <StatChip
              Icon={MapPin}
              label="Location"
              value={job.location}
              tint={{ bg: C.slate50, border: C.slate100, fg: C.slate600 }}
            />
          )}
          <StatChip
            Icon={User}
            label="Proposals"
            value={String(displayProposals.length)}
            tint={{ bg: C.slate50, border: C.slate100, fg: C.slate600 }}
          />
        </ScrollView>

        {/* Description */}
        <SectionCard icon={FileText} title="Job Description">
          <Text style={styles.descriptionText}>{job.description}</Text>
        </SectionCard>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <SectionCard icon={Star} title="Skills Required">
            <View style={styles.chipWrap}>
              {job.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Media */}
        {job.media?.length > 0 && (
          <SectionCard icon={ImageIcon} title="Attachments">
            <View style={styles.mediaGrid}>
              {job.media.map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.mediaThumb} />
              ))}
            </View>
          </SectionCard>
        )}

        {/* Link preview */}
        {!!job.linkUrl && (
          <SectionCard icon={LinkIcon} title="Reference Link">
            <TouchableOpacity style={styles.linkPreview} activeOpacity={0.8}>
              {!!job.linkImage && (
                <Image source={{ uri: job.linkImage }} style={styles.linkPreviewImg} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.linkPreviewTitle} numberOfLines={1}>
                  {job.linkTitle || job.linkUrl}
                </Text>
                {!!job.linkDesc && (
                  <Text style={styles.linkPreviewDesc} numberOfLines={2}>
                    {job.linkDesc}
                  </Text>
                )}
                <View style={styles.linkPreviewUrlRow}>
                  <ExternalLink size={11} color={C.emerald600} strokeWidth={2.2} />
                  <Text style={styles.linkPreviewUrl} numberOfLines={1}>
                    {job.linkUrl}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* About client */}
        <SectionCard icon={User} title="About Client">
          <TouchableOpacity
            style={styles.clientRow}
            onPress={() => navigation.navigate('Profile', { userId: job.buyer?.id })}
            activeOpacity={0.8}
          >
            <Avatar uri={job.buyer?.avatar} firstName={job.buyer?.firstName} lastName={job.buyer?.lastName} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>
                {job.buyer?.firstName} {job.buyer?.lastName}
              </Text>
              {!!job.buyer?.headline && (
                <Text style={styles.clientHeadline} numberOfLines={1}>
                  {job.buyer.headline}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={C.slate300} strokeWidth={2} />
          </TouchableOpacity>
        </SectionCard>

        {/* Freelancer: my proposal status */}
        {!isJobOwner && hasProposed && myProposal && (
          <SectionCard icon={CheckCircle2} title="Your Proposal">
            <View style={styles.myProposalBanner}>
              <CheckCircle2 size={16} color={C.emerald600} strokeWidth={2.2} />
              <Text style={styles.myProposalBannerText}>You've applied to this job</Text>
            </View>

            <View style={styles.myProposalStatusRow}>
              {(() => {
                const cfg = PROPOSAL_STATUS_CONFIG[myProposal.status] || PROPOSAL_STATUS_CONFIG.pending;
                const StatusIcon = cfg.Icon;
                return (
                  <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <StatusIcon size={12} color={cfg.fg} strokeWidth={2.2} />
                    <Text style={[styles.statusPillText, { color: cfg.fg }]}>{cfg.label}</Text>
                  </View>
                );
              })()}
              <Text style={styles.myProposalDate}>Submitted {formatDate(myProposal.createdAt)}</Text>
            </View>

            <Text style={styles.coverLetterText}>{myProposal.coverLetter}</Text>

            <View style={styles.metaWrap}>
              {!!(myProposal.proposedBudget) && (
                <View style={[styles.metaPill, { backgroundColor: C.emerald50, borderColor: C.emerald100 }]}>
                  <DollarSign size={12} color={C.emerald700} strokeWidth={2.2} />
                  <Text style={[styles.metaPillText, { color: C.emerald700 }]}>
                    ₦{Number(myProposal.proposedBudget).toLocaleString()}
                  </Text>
                </View>
              )}
              {!!(myProposal.proposedDuration) && (
                <View style={styles.metaPillPlain}>
                  <Clock size={12} color={C.slate400} strokeWidth={2.2} />
                  <Text style={styles.metaPillPlainText}>{myProposal.proposedDuration} days</Text>
                </View>
              )}
            </View>
          </SectionCard>
        )}

        {/* Buyer: proposal management */}
        {isJobOwner && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <User size={17} color={C.emerald600} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Proposals ({displayProposals.length})</Text>
              {proposalsLoading && <ActivityIndicator size="small" color={C.slate400} style={{ marginLeft: 8 }} />}
            </View>

            {/* Stats row */}
            <View style={styles.proposalStatsRow}>
              <View style={[styles.proposalStatBox, { backgroundColor: C.amber50, borderColor: C.amber100 }]}>
                <Text style={[styles.proposalStatValue, { color: C.amber700 }]}>{counts.pending}</Text>
                <Text style={[styles.proposalStatLabel, { color: C.amber600 }]}>Pending</Text>
              </View>
              <View style={[styles.proposalStatBox, { backgroundColor: C.emerald50, borderColor: C.emerald100 }]}>
                <Text style={[styles.proposalStatValue, { color: C.emerald700 }]}>{counts.shortlisted}</Text>
                <Text style={[styles.proposalStatLabel, { color: C.emerald600 }]}>Shortlisted</Text>
              </View>
              <View style={[styles.proposalStatBox, { backgroundColor: C.green50, borderColor: C.green100 }]}>
                <Text style={[styles.proposalStatValue, { color: C.green700 }]}>{counts.accepted}</Text>
                <Text style={[styles.proposalStatLabel, { color: C.green600 }]}>Hired</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={15} color={C.slate400} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search freelancers…"
                placeholderTextColor={C.slate400}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PROPOSAL_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setActiveFilter(f.key)}
                    style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                      {f.label} · {counts[f.key]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Proposal list */}
            {filteredProposals.length === 0 ? (
              <View style={styles.emptyProposals}>
                <Briefcase size={30} color={C.slate300} strokeWidth={1.6} />
                <Text style={styles.emptyProposalsTitle}>
                  {searchQuery || activeFilter !== 'all' ? 'No matching proposals' : 'No proposals yet'}
                </Text>
                <Text style={styles.emptyProposalsSubtitle}>
                  {searchQuery || activeFilter !== 'all'
                    ? 'Try a different search or filter.'
                    : 'Freelancers will appear here once they apply.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12, marginTop: 4 }}>
                {filteredProposals.map((proposal) => {
                  const cfg = PROPOSAL_STATUS_CONFIG[proposal.status] || PROPOSAL_STATUS_CONFIG.pending;
                  const StatusIcon = cfg.Icon;
                  const isProcessing = actionLoading === proposal.id;
                  const budgetVal = proposal.proposedBudget || proposal.proposedRate;
                  const durationVal = proposal.proposedDuration || proposal.duration;

                  return (
                    <View
                      key={proposal.id}
                      style={[
                        styles.proposalCard,
                        proposal.status === 'accepted' && styles.proposalCardAccepted,
                        proposal.status === 'shortlisted' && styles.proposalCardShortlisted,
                      ]}
                    >
                      <View style={styles.proposalHeaderRow}>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', gap: 10, flex: 1 }}
                          onPress={() => navigation.navigate('Profile', { userId: proposal.freelancer?.id })}
                        >
                          <Avatar
                            uri={proposal.freelancer?.avatar}
                            firstName={proposal.freelancer?.firstName}
                            lastName={proposal.freelancer?.lastName}
                            size={46}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.proposalName} numberOfLines={1}>
                              {proposal.freelancer?.firstName} {proposal.freelancer?.lastName}
                            </Text>
                            {!!proposal.freelancer?.headline && (
                              <Text style={styles.proposalHeadline} numberOfLines={1}>
                                {proposal.freelancer.headline}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                          <StatusIcon size={11} color={cfg.fg} strokeWidth={2.2} />
                          <Text style={[styles.statusPillText, { color: cfg.fg }]}>{cfg.label}</Text>
                        </View>
                      </View>

                      <View style={styles.metaWrap}>
                        {!!budgetVal && (
                          <View style={[styles.metaPill, { backgroundColor: C.emerald50, borderColor: C.emerald100 }]}>
                            <DollarSign size={12} color={C.emerald700} strokeWidth={2.2} />
                            <Text style={[styles.metaPillText, { color: C.emerald700 }]}>
                              ₦{Number(budgetVal).toLocaleString()}
                            </Text>
                          </View>
                        )}
                        {!!durationVal && (
                          <View style={styles.metaPillPlain}>
                            <Clock size={12} color={C.slate400} strokeWidth={2.2} />
                            <Text style={styles.metaPillPlainText}>{durationVal} days</Text>
                          </View>
                        )}
                        <Text style={styles.proposalDate}>{relativeDate(proposal.createdAt)}</Text>
                      </View>

                      {proposal.freelancer?.skills?.length > 0 && (
                        <View style={[styles.chipWrap, { marginTop: 8 }]}>
                          {proposal.freelancer.skills.slice(0, 5).map((skill) => (
                            <View key={skill} style={styles.skillChipSmall}>
                              <Text style={styles.skillChipSmallText}>{skill}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.coverLetterBox}>
                        <Text style={styles.coverLetterText}>{proposal.coverLetter}</Text>
                      </View>

                      {/* Actions */}
                      {(proposal.status === 'pending' || proposal.status === 'shortlisted') && job.status === 'open' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnPrimary]}
                            disabled={isProcessing}
                            onPress={() => handleProposalAction(proposal.id, 'accepted')}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color={C.white} />
                            ) : (
                              <Check size={14} color={C.white} strokeWidth={2.4} />
                            )}
                            <Text style={styles.actionBtnPrimaryText}>Accept</Text>
                          </TouchableOpacity>

                          {proposal.status === 'pending' && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.actionBtnOutline]}
                              disabled={isProcessing}
                              onPress={() => handleProposalAction(proposal.id, 'shortlisted')}
                            >
                              <Star size={14} color={C.emerald700} strokeWidth={2.2} />
                              <Text style={styles.actionBtnOutlineText}>Shortlist</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnGhost]}
                            disabled={isProcessing}
                            onPress={() => handleProposalAction(proposal.id, 'rejected')}
                          >
                            <X size={14} color={C.slate500} strokeWidth={2.2} />
                            <Text style={styles.actionBtnGhostText}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {proposal.status === 'accepted' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnOutline]}
                            onPress={() => navigation.navigate('CreateContract', { jobId, proposalId: proposal.id })}
                          >
                            <Award size={14} color={C.emerald700} strokeWidth={2.2} />
                            <Text style={styles.actionBtnOutlineText}>Create Contract</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.messageLink}
                        onPress={() => handleMessage(proposal.freelancer?.id)}
                      >
                        <MessageSquare size={13} color={C.slate500} strokeWidth={2.2} />
                        <Text style={styles.messageLinkText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky footer for freelancers / guests */}
      {showFooter && (
        <View style={styles.footer}>
          {!isAuthenticated && (
            <TouchableOpacity style={styles.footerBtnPrimary} onPress={() => navigation.navigate('Login')}>
              <Lock size={16} color={C.white} strokeWidth={2.2} />
              <Text style={styles.footerBtnPrimaryText}>Login to Apply</Text>
            </TouchableOpacity>
          )}

          {isAuthenticated && !isFreelancer && (
            <View style={styles.footerNotice}>
              <Text style={styles.footerNoticeText}>Only freelancers can apply to jobs</Text>
            </View>
          )}

          {isAuthenticated && isFreelancer && hasProposed && (
            <View style={styles.footerAppliedRow}>
              <View style={styles.footerAppliedBadge}>
                <CheckCircle2 size={15} color={C.emerald700} strokeWidth={2.2} />
                <Text style={styles.footerAppliedText}>Applied</Text>
              </View>
              <Text style={styles.footerBudgetText}>{formatBudget(job.budget, job.budgetType)}</Text>
            </View>
          )}

          {isAuthenticated && isFreelancer && !hasProposed && job.status === 'open' && (
            <TouchableOpacity style={styles.footerBtnPrimary} onPress={() => setShowApplyModal(true)}>
              <Send size={16} color={C.white} strokeWidth={2.2} />
              <Text style={styles.footerBtnPrimaryText}>
                Apply Now · {formatBudget(job.budget, job.budgetType)}
              </Text>
            </TouchableOpacity>
          )}

          {isAuthenticated && isFreelancer && !hasProposed && job.status !== 'open' && (
            <View style={styles.footerNotice}>
              <Text style={styles.footerNoticeText}>This job is no longer accepting proposals</Text>
            </View>
          )}
        </View>
      )}

      {/* Apply modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApplyModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Submit Proposal</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Apply for: {job.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <X size={20} color={C.slate500} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>
                Cover Letter <Text style={{ color: C.red600 }}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Introduce yourself and explain why you're a great fit…"
                placeholderTextColor={C.slate400}
                value={proposalData.coverLetter}
                onChangeText={(v) => setProposalData((p) => ({ ...p, coverLetter: v }))}
                multiline
                numberOfLines={6}
                maxLength={2000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{proposalData.coverLetter.length}/2000</Text>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Budget (₦)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 50000"
                    placeholderTextColor={C.slate400}
                    keyboardType="numeric"
                    value={proposalData.proposedBudget}
                    onChangeText={(v) => setProposalData((p) => ({ ...p, proposedBudget: v }))}
                  />
                  <Text style={styles.inputHint}>Optional</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Duration (days)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14"
                    placeholderTextColor={C.slate400}
                    keyboardType="numeric"
                    value={proposalData.proposedDuration}
                    onChangeText={(v) => setProposalData((p) => ({ ...p, proposedDuration: v }))}
                  />
                  <Text style={styles.inputHint}>Optional</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleApply}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <Send size={16} color={C.white} strokeWidth={2.2} />
                )}
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Proposal'}</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.slate50 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, color: C.slate500, fontSize: 13, fontWeight: '500' },

  errorIconCircle: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: C.red50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  errorTitle: { fontSize: 17, fontWeight: '800', color: C.slate900, marginBottom: 6 },
  errorSubtitle: { fontSize: 13, color: C.slate500, textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  errorRetryBtn: { backgroundColor: C.emerald600, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  errorRetryBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // Title block
  titleBlock: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pillBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pillBadgeText: { fontSize: 10.5, fontWeight: '800', textTransform: 'capitalize' },
  jobTitle: { fontSize: 21, fontWeight: '800', color: C.slate900, lineHeight: 27, marginBottom: 8 },
  postedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postedText: { fontSize: 12, color: C.slate400 },

  // Stats
  statRow: { paddingHorizontal: 18, paddingVertical: 14, gap: 10 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginRight: 2,
  },
  statChipIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statChipValue: { fontSize: 13.5, fontWeight: '800' },
  statChipLabel: { fontSize: 10.5, color: C.slate500, fontWeight: '600' },

  // Card / section
  card: {
    backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.slate200,
    marginHorizontal: 18, marginBottom: 14, padding: 16,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.slate900 },
  descriptionText: { fontSize: 13.5, color: C.slate600, lineHeight: 21 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald100,
    borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6,
  },
  skillChipText: { fontSize: 12, fontWeight: '700', color: C.emerald700 },

  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaThumb: {
    width: '31%', aspectRatio: 1, borderRadius: 12, backgroundColor: C.slate100,
    borderWidth: 1, borderColor: C.slate100,
  },

  linkPreview: { flexDirection: 'row', gap: 12, backgroundColor: C.slate50, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.slate100 },
  linkPreviewImg: { width: 60, height: 60, borderRadius: 10 },
  linkPreviewTitle: { fontSize: 13.5, fontWeight: '800', color: C.slate900, marginBottom: 2 },
  linkPreviewDesc: { fontSize: 12, color: C.slate500, lineHeight: 16, marginBottom: 6 },
  linkPreviewUrlRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkPreviewUrl: { fontSize: 11, color: C.emerald600, flexShrink: 1 },

  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientName: { fontSize: 14.5, fontWeight: '800', color: C.slate900 },
  clientHeadline: { fontSize: 12, color: C.slate500, marginTop: 2 },

  avatarImg: { backgroundColor: C.slate200 },
  avatarFallback: { backgroundColor: C.emerald600, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: C.white, fontWeight: '800' },

  myProposalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: C.emerald100, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  myProposalBannerText: { fontSize: 12.5, fontWeight: '700', color: C.emerald700 },
  myProposalStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  myProposalDate: { fontSize: 11, color: C.slate400 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusPillText: { fontSize: 10.5, fontWeight: '800', textTransform: 'capitalize' },

  coverLetterText: { fontSize: 13, color: C.slate600, lineHeight: 19 },
  coverLetterBox: { backgroundColor: C.slate50, borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.slate100 },

  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  metaPillText: { fontSize: 11.5, fontWeight: '700' },
  metaPillPlain: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaPillPlainText: { fontSize: 11.5, color: C.slate400 },
  proposalDate: { fontSize: 11, color: C.slate400, marginLeft: 'auto' },

  // Buyer proposals section
  proposalStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  proposalStatBox: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  proposalStatValue: { fontSize: 17, fontWeight: '800' },
  proposalStatLabel: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.slate50,
    borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.slate900 },

  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200 },
  filterChipActive: { backgroundColor: C.emerald600, borderColor: C.emerald600 },
  filterChipText: { fontSize: 11.5, fontWeight: '700', color: C.slate600 },
  filterChipTextActive: { color: C.white },

  emptyProposals: { alignItems: 'center', paddingVertical: 30 },
  emptyProposalsTitle: { fontSize: 13.5, fontWeight: '800', color: C.slate700, marginTop: 10 },
  emptyProposalsSubtitle: { fontSize: 12, color: C.slate400, marginTop: 4, textAlign: 'center' },

  proposalCard: { borderWidth: 1, borderColor: C.slate200, borderRadius: 16, padding: 14, backgroundColor: C.white },
  proposalCardAccepted: { borderColor: C.green100, backgroundColor: '#fbfffc' },
  proposalCardShortlisted: { borderColor: C.emerald200 },
  proposalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  proposalName: { fontSize: 13.5, fontWeight: '800', color: C.slate900 },
  proposalHeadline: { fontSize: 11.5, color: C.slate400, marginTop: 1 },

  skillChipSmall: { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  skillChipSmallText: { fontSize: 10.5, fontWeight: '600', color: C.slate600 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, flex: 1, justifyContent: 'center' },
  actionBtnPrimary: { backgroundColor: C.emerald600 },
  actionBtnPrimaryText: { color: C.white, fontWeight: '800', fontSize: 11.5 },
  actionBtnOutline: { borderWidth: 1.5, borderColor: C.emerald100, backgroundColor: C.emerald50 },
  actionBtnOutlineText: { color: C.emerald700, fontWeight: '800', fontSize: 11.5 },
  actionBtnGhost: { borderWidth: 1, borderColor: C.slate200 },
  actionBtnGhostText: { color: C.slate500, fontWeight: '700', fontSize: 11.5 },

  messageLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' },
  messageLinkText: { fontSize: 11.5, fontWeight: '700', color: C.slate500 },

  // Footer
  footer: {
    borderTopWidth: 1, borderTopColor: C.slate200, backgroundColor: C.white,
    paddingHorizontal: 18, paddingVertical: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -3 } },
      android: { elevation: 8 },
    }),
  },
  footerBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.emerald600, borderRadius: 14, paddingVertical: 15,
  },
  footerBtnPrimaryText: { color: C.white, fontWeight: '800', fontSize: 14 },
  footerNotice: { backgroundColor: C.slate50, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.slate100 },
  footerNoticeText: { fontSize: 12.5, color: C.slate500, fontWeight: '600' },
  footerAppliedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerAppliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  footerAppliedText: { color: C.emerald700, fontWeight: '800', fontSize: 13 },
  footerBudgetText: { fontWeight: '800', color: C.slate700, fontSize: 14 },

  // Apply modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginBottom: 14 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.slate900 },
  modalSubtitle: { fontSize: 12, color: C.slate500, marginTop: 2 },

  inputLabel: { fontSize: 12, fontWeight: '800', color: C.slate700, marginBottom: 7 },
  inputHint: { fontSize: 10.5, color: C.slate400, marginTop: 4 },
  textArea: {
    borderWidth: 1, borderColor: C.slate200, backgroundColor: C.slate50, borderRadius: 14,
    padding: 13, fontSize: 13.5, color: C.slate900, minHeight: 130,
  },
  charCount: { fontSize: 10.5, color: C.slate400, textAlign: 'right', marginTop: 5 },
  textInput: {
    borderWidth: 1, borderColor: C.slate200, backgroundColor: C.slate50, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 13.5, color: C.slate900,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.emerald600, borderRadius: 14, paddingVertical: 15, marginTop: 20,
  },
  submitBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
});

export default JobDetailScreen;