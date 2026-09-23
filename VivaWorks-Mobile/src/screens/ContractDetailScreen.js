import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
  MessageSquare,
  Send,
  Check,
  XCircle,
  Upload,
  FileText,
  Download,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CalendarDays,
  ListChecks,
  ChevronRight,
  Trash2,
  X,
  Timer,
  PackageOpen,
  HandCoins,
  Flag,
  BadgeCheck,
  CreditCard,
  CalendarClock,
  Truck,
  File,
  ZoomIn,
  Gavel,
  Scale,
  Star,
  Hourglass,
  Gift,
} from 'lucide-react-native';

// ════════════════════════════════════════════════════════════════
// COLORS (Strictly solid, no gradients)
// ════════════════════════════════════════════════════════════════
const C = {
  emerald50: '#ecfdf5', emerald100: '#d1fae5', emerald200: '#a7f3d0', emerald500: '#10b981', emerald600: '#059669', emerald700: '#047857', emerald900: '#064e3b',
  red50: '#fef2f2', red100: '#fee2e2', red200: '#fecaca', red400: '#f87171', red500: '#ef4444', red600: '#dc2626', red700: '#b91c1c', red900: '#7f1d1d',
  slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1', slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155', slate800: '#1e293b', slate900: '#0f172a',
  blue50: '#eff6ff', blue100: '#dbeafe', blue200: '#bfdbfe', blue500: '#3b82f6', blue600: '#2563eb', blue700: '#1d4ed8',
  amber50: '#fffbeb', amber100: '#fef3c7', amber200: '#fde68a', amber500: '#f59e0b', amber600: '#d97706', amber700: '#b45309', amber900: '#78350f',
  purple50: '#faf5ff', purple100: '#f3e8ff', purple200: '#e9d5ff', purple500: '#a855f7', purple600: '#9333ea', purple700: '#7e22ce',
  sky50: '#f0f9ff', sky100: '#e0f2fe', sky200: '#bae6fd', sky600: '#0284c7', sky700: '#0369a1',
  orange50: '#fff7ed', orange100: '#ffedd5', orange200: '#fed7aa', orange500: '#f97316', orange600: '#ea580c', orange700: '#c2410c',
  pink50: '#fdf2f8', pink100: '#fce7f3', pink500: '#ec4899', pink600: '#db2777',
  white: '#ffffff',
  gray50: '#f9fafb', gray100: '#f3f4f6', gray200: '#e5e7eb', gray300: '#d1d5db', gray400: '#9ca3af', gray700: '#374151',
};

const STATUS_CONFIG = {
  active: { bg: C.emerald100, fg: C.emerald700, border: C.emerald200, icon: Clock, label: 'Active' },
  pending_payment: { bg: C.amber100, fg: C.amber700, border: C.amber200, icon: DollarSign, label: 'Pending Payment' },
  completed: { bg: C.blue100, fg: C.blue700, border: C.blue200, icon: CheckCircle2, label: 'Completed' },
  cancelled: { bg: C.red100, fg: C.red700, border: C.red200, icon: XCircle, label: 'Cancelled' },
  disputed: { bg: C.purple100, fg: C.purple700, border: C.purple200, icon: AlertTriangle, label: 'Disputed' },
  delivered: { bg: C.sky100, fg: C.sky700, border: C.sky200, icon: PackageOpen, label: 'Delivered' },
  revision_requested: { bg: C.orange100, fg: C.orange700, border: C.orange200, icon: RotateCcw, label: 'Revision Requested' },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || { bg: C.gray100, fg: C.gray700, border: C.gray200, icon: Clock, label: status?.replace('_', ' ') || 'Unknown' };

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount || 0);

const formatDate = (d) => (!d ? 'N/A' : new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }));

const formatDateTime = (d) =>
  !d ? 'N/A' : new Date(d).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatRelativeTime = (d) => {
  if (!d) return '';
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return formatDateTime(d);
};

const formatFileSize = (bytes) => {
  const n = Number(bytes);
  if (!n || isNaN(n)) return 'Unknown';
  if (n === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const getInitials = (f, l) => ((f?.[0] || '') + (l?.[0] || '')).toUpperCase() || '?';

const isImageFile = (type, url) => {
  if (type?.startsWith('image/')) return true;
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
};

const getFileExtension = (name) => (name ? name.split('.').pop()?.toUpperCase() : '');

const pickFiles = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return [];
    const assets = result.assets || [];
    return assets.map((a) => ({
      uri: a.uri,
      name: a.name || a.uri.split('/').pop(),
      type: a.mimeType || 'application/octet-stream',
      size: a.size,
      preview: (a.mimeType || '').startsWith('image/') ? a.uri : null,
    }));
  } catch (err) {
    console.error('File pick error:', err);
    return [];
  }
};

const appendFilesToFormData = (formData, files, fieldName) => {
  files.forEach((f) => {
    formData.append(fieldName, { uri: f.uri, name: f.name, type: f.type });
  });
};

// ════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <View style={[styles.toast, { backgroundColor: isError ? C.red600 : C.emerald600 }]}>
      {isError ? <XCircle size={16} color={C.white} /> : <CheckCircle2 size={16} color={C.white} />}
      <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// CONTRACT DETAIL SCREEN
// ════════════════════════════════════════════════════════════════
const ContractDetailScreen = ({ route, navigation }) => {
  const { contractId } = route?.params || {};
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Action states
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Delivery
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [uploadingDelivery, setUploadingDelivery] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  // Revision
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [requestingRevision, setRequestingRevision] = useState(false);

  // Dispute
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState([]);
  const [filingDispute, setFilingDispute] = useState(false);
  const [disputeReplies, setDisputeReplies] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [disputeWindowTime, setDisputeWindowTime] = useState(null);

  // Extension
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState('3');
  const [extensionReason, setExtensionReason] = useState('');
  const [requestingExtension, setRequestingExtension] = useState(false);
  const [pendingExtension, setPendingExtension] = useState(null);
  const [processingExtension, setProcessingExtension] = useState(false);

  // Tip
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [sendingTip, setSendingTip] = useState(false);
  const [hasTipped, setHasTipped] = useState(false);

  // Review
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchContract();
    checkIfReviewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  // Deadline countdown (Auto-cancel logic REMOVED as requested)
  useEffect(() => {
    if (!contract?.deadline) return;
    const tick = () => {
      const diff = new Date(contract.deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        expired: false,
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [contract?.deadline]);

  // Dispute window countdown
  useEffect(() => {
    if (!contract?.disputeWindowEndsAt) return;
    const tick = () => {
      const diff = new Date(contract.disputeWindowEndsAt).getTime() - Date.now();
      if (diff <= 0) {
        setDisputeWindowTime({ expired: true, days: 0, hours: 0 });
        return;
      }
      setDisputeWindowTime({ expired: false, days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000) });
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [contract?.disputeWindowEndsAt]);

  const checkIfReviewed = async () => {
    try {
      const res = await api.get(`/reviews/contract/${contractId}`);
      setHasReviewed(res.data.hasReviewed);
    } catch {
      setHasReviewed(false);
    }
  };

  const fetchContract = async () => {
    try {
      setLoading(true);
      setPendingExtension(null);
      const response = await api.get(`/contracts/${contractId}`);
      const c = response.data.contract;
      setContract(c);

      try {
        const extRes = await api.get(`/contracts/${contractId}/extension/pending`);
        setPendingExtension(extRes.data.extension || extRes.data);
      } catch {
        const fallback = c?.extension || c?.pendingExtension || (c?.extensions?.length > 0 ? c.extensions[c.extensions.length - 1] : null);
        setPendingExtension(fallback || null);
      }

      if (c?.status === 'completed') {
        try {
          const tipRes = await api.get(`/wallet/tip-status?contractId=${contractId}`);
          setHasTipped(tipRes.data.hasTipped);
        } catch {
          setHasTipped(false);
        }
      }

      if (c?.dispute?.id) {
        try {
          const disputeRes = await api.get(`/disputes/${c.dispute.id}`);
          setDisputeReplies(disputeRes.data.dispute?.replies || []);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExtension = async () => {
    const days = parseInt(extensionDays, 10);
    if (!days || days < 1) {
      showToast('error', 'Please enter valid extension days');
      return;
    }
    try {
      setRequestingExtension(true);
      await api.post(`/contracts/${contractId}/extension`, { days, reason: extensionReason.trim() });
      showToast('success', 'Extension request sent to client');
      setShowExtensionModal(false);
      setExtensionDays('3');
      setExtensionReason('');
      fetchContract();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to request extension');
    } finally {
      setRequestingExtension(false);
    }
  };

  const handleApproveExtension = async (action) => {
    if (processingExtension) return;
    try {
      setProcessingExtension(true);
      await api.patch(`/contracts/${contractId}/extension/respond`, { action });
      showToast('success', action === 'approve' ? 'Extension approved' : 'Extension rejected');
      fetchContract();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to process extension');
    } finally {
      setProcessingExtension(false);
    }
  };

  const handleSendTip = async () => {
    const amount = parseFloat(tipAmount);
    if (!amount || amount < 500) {
      showToast('error', 'Minimum tip is ₦500');
      return;
    }
    try {
      setSendingTip(true);
      await api.post('/wallet/tip', { contractId, amount, message: tipMessage.trim() });
      showToast('success', `₦${amount.toLocaleString()} tip sent successfully!`);
      setShowTipModal(false);
      setTipAmount('');
      setTipMessage('');
      setHasTipped(true);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to send tip');
    } finally {
      setSendingTip(false);
    }
  };

  const handleComplete = () => {
    Alert.alert('Confirm Delivery', 'Payment will be released to the freelancer. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setCompleting(true);
            await api.patch(`/contracts/${contractId}/confirm`);
            showToast('success', 'Contract completed! Payment released to freelancer.');
            fetchContract();
          } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to complete contract');
          } finally {
            setCompleting(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Contract', 'This action cannot be undone. Continue?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(true);
            await api.patch(`/contracts/${contractId}/cancel`);
            showToast('success', 'Contract cancelled');
            fetchContract();
          } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to cancel contract');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      showToast('error', 'Please provide feedback for the revision');
      return;
    }
    try {
      setRequestingRevision(true);
      await api.patch(`/contracts/${contractId}/revision`, { feedback: revisionFeedback.trim() });
      showToast('success', 'Revision requested');
      setShowRevisionModal(false);
      setRevisionFeedback('');
      fetchContract();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to request revision');
    } finally {
      setRequestingRevision(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating < 1) {
      showToast('error', 'Please select a rating');
      return;
    }
    try {
      setSubmittingReview(true);
      await api.post(`/reviews/contract/${contractId}`, { rating: reviewRating, comment: reviewComment.trim() });
      showToast('success', 'Review submitted successfully!');
      setHasReviewed(true);
      setReviewRating(0);
      setReviewComment('');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDisputeFileSelect = async () => {
    const files = await pickFiles();
    if (files.length) setDisputeEvidence((prev) => [...prev, ...files]);
  };
  const removeDisputeFile = (i) => setDisputeEvidence((prev) => prev.filter((_, idx) => idx !== i));

  const handleFileDispute = async () => {
    if (!disputeReason.trim() || disputeReason.trim().length < 10) {
      showToast('error', 'Please provide a detailed reason (at least 10 characters)');
      return;
    }
    try {
      setFilingDispute(true);
      const formData = new FormData();
      formData.append('reason', disputeReason.trim());
      appendFilesToFormData(formData, disputeEvidence, 'evidence');
      await api.post(`/contracts/${contractId}/dispute`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Dispute filed successfully. Admin will review.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeEvidence([]);
      fetchContract();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to file dispute');
    } finally {
      setFilingDispute(false);
    }
  };

  const handleReplyFileSelect = async () => {
    const files = await pickFiles();
    if (files.length) setReplyFiles((prev) => [...prev, ...files]);
  };
  const removeReplyFile = (i) => setReplyFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleAddReply = async () => {
    if (!replyContent.trim() && replyFiles.length === 0) {
      showToast('error', 'Please add a message or upload evidence');
      return;
    }
    try {
      setSubmittingReply(true);
      const formData = new FormData();
      if (replyContent.trim()) formData.append('content', replyContent.trim());
      appendFilesToFormData(formData, replyFiles, 'files');
      await api.post(`/disputes/${contract.dispute.id}/reply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Reply submitted');
      setReplyContent('');
      setReplyFiles([]);
      setShowReplyModal(false);
      const disputeRes = await api.get(`/disputes/${contract.dispute.id}`);
      setDisputeReplies(disputeRes.data.dispute?.replies || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleFileSelect = async () => {
    const files = await pickFiles();
    if (files.length) setDeliveryFiles((prev) => [...prev, ...files]);
  };
  const removeDeliveryFile = (i) => setDeliveryFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmitDelivery = async () => {
    if (deliveryFiles.length === 0) {
      showToast('error', 'Please upload at least one delivery file');
      return;
    }
    try {
      setUploadingDelivery(true);
      const formData = new FormData();
      appendFilesToFormData(formData, deliveryFiles, 'files');
      formData.append('note', deliveryNote.trim());
      await api.post(`/contracts/${contractId}/deliver`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('success', 'Work submitted successfully!');
      setDeliveryFiles([]);
      setDeliveryNote('');
      fetchContract();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit delivery');
    } finally {
      setUploadingDelivery(false);
    }
  };

  const handlePay = async () => {
    try {
      setPaying(true);
      const response = await api.post(`/contracts/${contractId}/pay`);
      if (response.data.authorizationUrl) {
        await Linking.openURL(response.data.authorizationUrl);
      } else {
        showToast('success', 'Payment processed');
        fetchContract();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !contract) return;
    const otherUserId = contract.buyerId === user?.id ? contract.freelancerId : contract.buyerId;
    try {
      setSendingMessage(true);
      await api.post('/messages', { receiverId: otherUserId, content: messageInput.trim() });
      setMessageInput('');
      showToast('success', 'Message sent');
    } catch {
      showToast('error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDownload = (url) => {
    if (!url) {
      showToast('error', 'File not available');
      return;
    }
    Linking.openURL(url).catch(() => showToast('error', 'Failed to open file'));
  };

  const getExpectedDeliveryDate = () => {
    if (!contract?.startDate || (!contract?.duration && !contract?.proposal?.proposedDuration)) return null;
    const start = new Date(contract.startDate);
    const expected = new Date(start);
    expected.setDate(start.getDate() + parseInt(contract.duration || contract.proposal?.proposedDuration || 0, 10));
    return expected;
  };

  const getDeliveryCountdown = () => {
    const expected = getExpectedDeliveryDate();
    if (!expected) return null;
    const diff = expected - new Date();
    if (diff <= 0) return { expired: true, days: 0 };
    return { expired: false, days: Math.ceil(diff / 86400000) };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading contract...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !contract) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <View style={[styles.errorIconWrap, { backgroundColor: C.red50 }]}>
            <AlertCircle size={32} color={C.red500} />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || 'Contract not found'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={16} color={C.white} />
            <Text style={styles.backBtnText}>Back to Contracts</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isBuyer = contract.buyerId === user?.id;
  const isFreelancer = contract.freelancerId === user?.id;
  const otherParty = isBuyer ? contract.freelancer : contract.buyer;
  const statusConfig = getStatusConfig(contract.status);
  const StatusIcon = statusConfig.icon;

  const revisionsUsed = contract.revisionsUsed || 0;
  const revisionsTotal = contract.revisionsTotal || 0;
  const revisionsLeft = Math.max(0, revisionsTotal - revisionsUsed);

  const deliverables = contract.deliverables || [];
  const milestones = contract.milestones || [];
  const deliveries = contract.deliveries || [];

  const canSubmitDelivery = isFreelancer && (contract.status === 'active' || contract.status === 'revision_requested');
  const canComplete = isBuyer && contract.status === 'delivered';
  const canRequestRevision = isBuyer && contract.status === 'delivered' && revisionsLeft > 0;
  const canCancel = ['active', 'revision_requested', 'pending_payment'].includes(contract.status);
  const canPay = isBuyer && contract.status === 'pending_payment';
  const isInDisputeWindow = contract.status === 'completed' && contract.disputeWindowEndsAt && new Date(contract.disputeWindowEndsAt) > new Date();
  const canFileDispute =
    (isBuyer || isFreelancer) &&
    (['active', 'delivered', 'revision_requested', 'completed'].includes(contract.status) || isInDisputeWindow) &&
    !contract.dispute;
  const canReview = isBuyer && contract.status === 'completed' && !hasReviewed;
  const canRequestExtension = isFreelancer && (contract.status === 'active' || contract.status === 'revision_requested');
  const canSendTip = isBuyer && contract.status === 'completed' && !hasTipped;

  const offerAmount = contract.proposal?.amount || contract.amount || 0;
  const offerDuration = contract.duration || contract.proposal?.proposedDuration || contract.proposal?.duration || 0;
  const offerRevisions = contract.proposal?.revisions || contract.revisionsTotal || 0;

  const deliveryCountdown = getDeliveryCountdown();
  const expectedDeliveryDate = getExpectedDeliveryDate();

  const chipActions = [];
  if (canComplete) chipActions.push({ key: 'complete', label: completing ? 'Completing…' : 'Confirm Delivery', icon: CheckCircle2, onPress: handleComplete, bg: C.emerald600, fg: C.white, loading: completing });
  if (canRequestRevision) chipActions.push({ key: 'revision', label: 'Request Revision', icon: RotateCcw, onPress: () => setShowRevisionModal(true), bg: C.white, fg: C.slate700, border: C.slate200 });
  if (canFileDispute) chipActions.push({ key: 'dispute', label: 'File Dispute', icon: Gavel, onPress: () => setShowDisputeModal(true), bg: C.white, fg: C.purple600, border: C.purple200 });
  if (canRequestExtension) chipActions.push({ key: 'extension', label: 'Request Extension', icon: Hourglass, onPress: () => setShowExtensionModal(true), bg: C.white, fg: C.amber600, border: C.amber200 });
  if (canSendTip) chipActions.push({ key: 'tip', label: 'Send Tip', icon: Gift, onPress: () => setShowTipModal(true), bg: C.pink500, fg: C.white });
  if (canCancel) chipActions.push({ key: 'cancel', label: cancelling ? 'Cancelling…' : 'Cancel', icon: XCircle, onPress: handleCancel, bg: C.white, fg: C.red600, border: C.red200, loading: cancelling });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={C.slate700} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.headerBadges}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
              <StatusIcon size={13} color={statusConfig.fg} strokeWidth={2.5} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.fg }]}>{statusConfig.label}</Text>
            </View>
            {contract.escrowAmount > 0 && (
              <View style={[styles.statusBadge, { backgroundColor: C.emerald50, borderColor: C.emerald200 }]}>
                <ShieldCheck size={13} color={C.emerald600} strokeWidth={2.5} />
                <Text style={[styles.statusBadgeText, { color: C.emerald700 }]}>{formatCurrency(contract.escrowAmount)}</Text>
              </View>
            )}
            {timeLeft && !timeLeft.expired && ['active', 'revision_requested'].includes(contract.status) && (
              <View style={[styles.statusBadge, { backgroundColor: C.amber50, borderColor: C.amber200 }]}>
                <Timer size={13} color={C.amber600} strokeWidth={2.5} />
                <Text style={[styles.statusBadgeText, { color: C.amber700 }]}>{timeLeft.days}d {timeLeft.hours}h left</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{contract.job?.title || 'Direct Hire Contract'}</Text>
          <Text style={styles.headerSubtitle}>
            Created {formatDate(contract.createdAt)} · #{contract.id?.toString().slice(-8)?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Action chips */}
      {chipActions.length > 0 && (
        <View style={styles.chipBar}>
          <View style={styles.chipBarContent}>
            {chipActions.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[styles.actionChip, { backgroundColor: a.bg, borderColor: a.border || a.bg }]}
                onPress={a.onPress}
                disabled={a.loading}
                activeOpacity={0.8}
              >
                {a.loading ? <ActivityIndicator size="small" color={a.fg} /> : <a.icon size={15} color={a.fg} strokeWidth={2.2} />}
                <Text style={[styles.actionChipText, { color: a.fg }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Extension alert */}
        {pendingExtension?.status && (
          <View style={[styles.alertCard, {
            backgroundColor: pendingExtension.status.toLowerCase() === 'pending' ? C.amber50 : pendingExtension.status.toLowerCase() === 'approved' ? C.emerald50 : C.red50,
            borderColor: pendingExtension.status.toLowerCase() === 'pending' ? C.amber200 : pendingExtension.status.toLowerCase() === 'approved' ? C.emerald200 : C.red200,
          }]}>
            <View style={styles.alertRow}>
              <View style={[styles.alertIconWrap, { backgroundColor: pendingExtension.status.toLowerCase() === 'pending' ? C.amber100 : pendingExtension.status.toLowerCase() === 'approved' ? C.emerald100 : C.red100 }]}>
                <Hourglass size={18} color={pendingExtension.status.toLowerCase() === 'pending' ? C.amber600 : pendingExtension.status.toLowerCase() === 'approved' ? C.emerald600 : C.red600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {pendingExtension.status.toLowerCase() === 'pending' ? 'Extension Request' : pendingExtension.status.toLowerCase() === 'approved' ? 'Extension Approved' : 'Extension Rejected'}
                </Text>
                <Text style={styles.alertText}>
                  {isFreelancer
                    ? `You requested a ${pendingExtension.days || '?'} day extension${pendingExtension.reason ? `: "${pendingExtension.reason}"` : ''}`
                    : `${contract.freelancer?.firstName || 'Freelancer'} requested a ${pendingExtension.days || '?'} day extension${pendingExtension.reason ? `: "${pendingExtension.reason}"` : ''}`}
                </Text>
                {isBuyer && pendingExtension.status.toLowerCase() === 'pending' && (
                  <View style={styles.alertActions}>
                    <TouchableOpacity style={styles.alertApproveBtn} onPress={() => handleApproveExtension('approve')} disabled={processingExtension}>
                      {processingExtension ? <ActivityIndicator size="small" color={C.white} /> : <Text style={styles.alertApproveBtnText}>Approve</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.alertRejectBtn} onPress={() => handleApproveExtension('reject')} disabled={processingExtension}>
                      <Text style={styles.alertRejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Dispute alert */}
        {contract.status === 'disputed' && (
          <View style={[styles.alertCard, { backgroundColor: C.purple50, borderColor: C.purple200 }]}>
            <View style={styles.alertRow}>
              <View style={[styles.alertIconWrap, { backgroundColor: C.purple100 }]}>
                <Scale size={18} color={C.purple600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Under Dispute Review</Text>
                <Text style={styles.alertText}>An admin is investigating this contract and will make a fair decision.</Text>
                {!!contract.disputeReason && (
                  <View style={styles.disputeReasonBox}>
                    <Text style={styles.disputeReasonLabel}>DISPUTE REASON</Text>
                    <Text style={styles.disputeReasonText}>{contract.disputeReason}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Dispute thread */}
        {contract.status === 'disputed' && disputeReplies.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MessageSquare size={18} color={C.purple600} strokeWidth={2} />
              <Text style={styles.cardTitle}>Dispute Thread</Text>
            </View>
            {disputeReplies.map((reply, i) => (
              <View key={i} style={[styles.replyItem, reply.senderId === user?.id ? { backgroundColor: C.purple50, borderColor: C.purple200 } : { backgroundColor: C.slate50, borderColor: C.slate200 }]}>
                <Text style={styles.replyAuthor}>
                  {reply.sender?.firstName} {reply.sender?.lastName}{reply.senderId === user?.id ? ' (You)' : ''}
                </Text>
                <Text style={styles.replyTime}>{formatDateTime(reply.createdAt)}</Text>
                {!!reply.content && <Text style={styles.replyContent}>{reply.content}</Text>}
              </View>
            ))}
            {(isBuyer || isFreelancer) && contract.dispute?.status !== 'resolved' && (
              <TouchableOpacity style={styles.dashedBtn} onPress={() => setShowReplyModal(true)} activeOpacity={0.7}>
                <Upload size={16} color={C.purple600} />
                <Text style={styles.dashedBtnText}>Add Reply with Evidence</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Countdown timer */}
        {contract.deadline && ['active', 'revision_requested'].includes(contract.status) && (
          <View style={[styles.timerCard, { backgroundColor: timeLeft?.expired ? C.red50 : C.emerald50, borderColor: timeLeft?.expired ? C.red200 : C.emerald200 }]}>
            <View style={styles.timerHeader}>
              <Timer size={20} color={timeLeft?.expired ? C.red500 : C.emerald600} strokeWidth={2} />
              <Text style={[styles.timerTitle, { color: timeLeft?.expired ? C.red900 : C.emerald900 }]}>
                {timeLeft?.expired ? 'Deadline Exceeded' : 'Time Remaining'}
              </Text>
            </View>
            <View style={styles.timerGrid}>
              {[{ v: timeLeft?.days || 0, l: 'Days' }, { v: timeLeft?.hours || 0, l: 'Hours' }, { v: timeLeft?.minutes || 0, l: 'Mins' }, { v: timeLeft?.seconds || 0, l: 'Secs' }].map((item, i) => (
                <View key={i} style={[styles.timerBox, { borderColor: timeLeft?.expired ? C.red200 : C.emerald200 }]}>
                  <Text style={[styles.timerValue, { color: timeLeft?.expired ? C.red600 : C.emerald700 }]}>{String(item.v).padStart(2, '0')}</Text>
                  <Text style={[styles.timerLabel, { color: timeLeft?.expired ? C.red400 : C.emerald500 }]}>{item.l}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.timerFooter, { color: timeLeft?.expired ? C.red600 : C.emerald600 }]}>Deadline: {formatDateTime(contract.deadline)}</Text>
          </View>
        )}

        {/* Escrow card */}
        <View style={styles.escrowCard}>
          <View style={styles.escrowHeader}>
            <ShieldCheck size={20} color={C.emerald100} strokeWidth={2} />
            <Text style={styles.escrowTitle}>Escrow Protected</Text>
          </View>
          <Text style={styles.escrowAmount}>{formatCurrency(contract.escrowAmount)}</Text>
          <Text style={styles.escrowSubtitle}>held securely in escrow</Text>

          {isInDisputeWindow && (
            <View style={styles.disputeWindowBox}>
              <Scale size={14} color={C.white} />
              <Text style={styles.disputeWindowText}>Dispute window: {disputeWindowTime?.days || 0}d {disputeWindowTime?.hours || 0}h left</Text>
            </View>
          )}

          {canPay && (
            <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={paying} activeOpacity={0.85}>
              {paying ? <ActivityIndicator size="small" color={C.emerald600} /> : <CreditCard size={16} color={C.emerald600} strokeWidth={2.5} />}
              <Text style={styles.payBtnText}>{paying ? 'Processing…' : 'Pay Now'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.escrowFeatures}>
            <View style={styles.escrowFeature}><Check size={15} color={C.emerald100} strokeWidth={2.5} /><Text style={styles.escrowFeatureText}>Payment protected</Text></View>
            <View style={styles.escrowFeature}><Check size={15} color={C.emerald100} strokeWidth={2.5} /><Text style={styles.escrowFeatureText}>Released on completion</Text></View>
          </View>
        </View>

        {/* Contract details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Briefcase size={18} color={C.emerald500} strokeWidth={2} />
            <Text style={styles.cardTitle}>Contract Details</Text>
          </View>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.emerald100 }]}><DollarSign size={18} color={C.emerald600} strokeWidth={2} /></View>
              <View><Text style={styles.detailLabel}>Amount</Text><Text style={styles.detailValue}>{formatCurrency(contract.amount)}</Text></View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.blue100 }]}><CalendarDays size={18} color={C.blue600} strokeWidth={2} /></View>
              <View><Text style={styles.detailLabel}>Start Date</Text><Text style={styles.detailValue}>{formatDate(contract.startDate)}</Text></View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.purple100 }]}><RotateCcw size={18} color={C.purple600} strokeWidth={2} /></View>
              <View><Text style={styles.detailLabel}>Revisions</Text><Text style={styles.detailValue}>{revisionsUsed} used · {revisionsLeft} left</Text></View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.sky100 }]}><CalendarDays size={18} color={C.sky600} strokeWidth={2} /></View>
              <View><Text style={styles.detailLabel}>Duration</Text><Text style={styles.detailValue}>{offerDuration} days</Text></View>
            </View>
          </View>
        </View>

        {/* Expected delivery */}
        {expectedDeliveryDate && ['active', 'revision_requested', 'pending_payment'].includes(contract.status) && (
          <View style={[styles.card, deliveryCountdown?.expired && { borderColor: C.red200, backgroundColor: C.red50 }]}>
            <View style={styles.cardHeader}>
              <Truck size={18} color={deliveryCountdown?.expired ? C.red600 : C.blue600} strokeWidth={2} />
              <Text style={styles.cardTitle}>Expected Delivery</Text>
            </View>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={[styles.detailIconWrap, { backgroundColor: deliveryCountdown?.expired ? C.red100 : C.blue100 }]}>
                  <CalendarClock size={18} color={deliveryCountdown?.expired ? C.red600 : C.blue600} strokeWidth={2} />
                </View>
                <View><Text style={styles.detailLabel}>Expected By</Text><Text style={styles.detailValue}>{formatDate(expectedDeliveryDate)}</Text></View>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailIconWrap, { backgroundColor: deliveryCountdown?.expired ? C.red100 : C.blue100 }]}>
                  <Clock size={18} color={deliveryCountdown?.expired ? C.red600 : C.blue600} strokeWidth={2} />
                </View>
                <View><Text style={styles.detailLabel}>Days Left</Text><Text style={styles.detailValue}>{deliveryCountdown?.days ?? 0}{deliveryCountdown?.expired ? ' (Overdue)' : ''}</Text></View>
              </View>
            </View>
          </View>
        )}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}><ListChecks size={18} color={C.emerald500} strokeWidth={2} /><Text style={styles.cardTitle}>Deliverables</Text></View>
            <View style={{ gap: 10 }}>
              {deliverables.map((item, i) => (
                <View key={i} style={[styles.deliverableItem, { backgroundColor: item.completed ? C.emerald50 : C.slate50, borderColor: item.completed ? C.emerald200 : C.slate200 }]}>
                  {item.completed ? <CheckCircle2 size={18} color={C.emerald500} strokeWidth={2.5} /> : <View style={styles.uncheckedCircle} />}
                  <Text style={[styles.deliverableText, item.completed && styles.deliverableTextCompleted]}>{item.name || item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}><Flag size={18} color={C.emerald500} strokeWidth={2} /><Text style={styles.cardTitle}>Milestones</Text></View>
            <View style={{ gap: 10 }}>
              {milestones.map((m, i) => (
                <View key={i} style={styles.milestoneItem}>
                  <View style={[styles.milestoneNum, m.completed && { backgroundColor: C.emerald500 }]}>
                    {m.completed ? <Check size={14} color={C.white} /> : <Text style={styles.milestoneNumText}>{i + 1}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.milestoneName, m.completed && styles.deliverableTextCompleted]}>{m.name || m.title}</Text>
                      {!!m.amount && <Text style={styles.milestoneAmount}>{formatCurrency(m.amount)}</Text>}
                    </View>
                    {!!m.description && <Text style={styles.milestoneDesc}>{m.description}</Text>}
                    {!!m.dueDate && <Text style={styles.milestoneDue}>Due: {formatDate(m.dueDate)}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delivery upload (freelancer) */}
        {canSubmitDelivery && (
          <View style={styles.card}>
            <View style={styles.cardHeader}><Upload size={18} color={C.emerald500} strokeWidth={2} /><Text style={styles.cardTitle}>Submit Work</Text></View>
            <TouchableOpacity style={styles.uploadArea} onPress={handleFileSelect} activeOpacity={0.7}>
              <View style={styles.uploadIconWrap}><Upload size={22} color={C.emerald600} strokeWidth={2} /></View>
              <Text style={styles.uploadTitle}>Tap to upload files</Text>
              <Text style={styles.uploadSubtitle}>Images or PDFs up to 20MB each</Text>
            </TouchableOpacity>

            {deliveryFiles.length > 0 && (
              <View style={{ gap: 10, marginTop: 14 }}>
                {deliveryFiles.map((file, i) => (
                  <View key={i} style={styles.fileItem}>
                    {file.preview ? <Image source={{ uri: file.preview }} style={styles.fileThumbnail} /> : <View style={styles.fileIconWrap}><FileText size={18} color={C.slate600} strokeWidth={2} /></View>}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                      <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeDeliveryFile(i)} style={{ padding: 8 }}>
                      <Trash2 size={16} color={C.red500} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Note</Text>
              <TextInput style={styles.textArea} placeholder="Describe what you're delivering..." placeholderTextColor={C.slate400} value={deliveryNote} onChangeText={setDeliveryNote} multiline numberOfLines={3} />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, (uploadingDelivery || deliveryFiles.length === 0) && styles.disabledBtn]} disabled={uploadingDelivery || deliveryFiles.length === 0} onPress={handleSubmitDelivery} activeOpacity={0.85}>
              {uploadingDelivery ? <ActivityIndicator size="small" color={C.white} /> : <><CheckCircle2 size={18} color={C.white} strokeWidth={2.5} /><Text style={styles.primaryBtnText}>Submit Work</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery history */}
        {deliveries.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}><PackageOpen size={18} color={C.emerald500} strokeWidth={2} /><Text style={styles.cardTitle}>Deliveries ({deliveries.length})</Text></View>
            <View style={{ gap: 14 }}>
              {deliveries.map((delivery, index) => {
                const imageFiles = (delivery.files || []).filter((f) => isImageFile(f.type, f.url));
                const docFiles = (delivery.files || []).filter((f) => !isImageFile(f.type, f.url));
                return (
                  <View key={index} style={styles.deliveryBlock}>
                    <View style={styles.deliveryHeaderRow}>
                      <Text style={styles.deliveryHeaderTitle}>Delivery #{index + 1}</Text>
                      <Text style={styles.deliveryHeaderTime}>{formatRelativeTime(delivery.createdAt)}</Text>
                    </View>
                    {!!delivery.note && <Text style={styles.deliveryNote}>{delivery.note}</Text>}

                    {imageFiles.length > 0 && (
                      <View style={styles.imageGrid}>
                        {imageFiles.map((f, fi) => (
                          <TouchableOpacity key={fi} style={styles.imageGridItem} onPress={() => setPreviewImage(f.url)} activeOpacity={0.85}>
                            <Image source={{ uri: f.url }} style={styles.imageGridImg} />
                            <View style={styles.imageGridZoom}><ZoomIn size={14} color={C.white} /></View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {docFiles.length > 0 && (
                      <View style={{ gap: 8, marginTop: imageFiles.length ? 10 : 0 }}>
                        {docFiles.map((f, fi) => (
                          <TouchableOpacity key={fi} style={styles.fileItem} onPress={() => handleDownload(f.url)} activeOpacity={0.7}>
                            <View style={styles.fileIconWrap}><File size={18} color={C.blue500} strokeWidth={2} /></View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.fileName} numberOfLines={1}>{f.name || 'Document'}</Text>
                              <Text style={styles.fileSize}>{getFileExtension(f.name)} · {formatFileSize(f.size)}</Text>
                            </View>
                            <Download size={16} color={C.slate400} strokeWidth={2} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {isBuyer && delivery.status === 'pending' && contract.status === 'delivered' && index === deliveries.length - 1 && (
                      <View style={styles.deliveryActionsRow}>
                        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleComplete} disabled={completing} activeOpacity={0.85}>
                          {completing ? <ActivityIndicator size="small" color={C.white} /> : <><CheckCircle2 size={16} color={C.white} strokeWidth={2.5} /><Text style={styles.primaryBtnText}>Approve</Text></>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowRevisionModal(true)} disabled={revisionsLeft <= 0} activeOpacity={0.85}>
                          <RotateCcw size={16} color={C.slate700} strokeWidth={2} />
                          <Text style={styles.secondaryBtnText}>Revision</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Review */}
        {canReview && (
          <View style={styles.card}>
            <View style={styles.cardHeader}><Star size={18} color={C.amber500} strokeWidth={2} /><Text style={styles.cardTitle}>Rate Freelancer</Text></View>
            <Text style={styles.reviewPrompt}>How was your experience with {contract.freelancer?.firstName || 'the freelancer'}?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} activeOpacity={0.7}>
                  <Star size={30} color={star <= reviewRating ? C.amber500 : C.slate300} fill={star <= reviewRating ? C.amber500 : 'transparent'} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Comment (optional)</Text>
              <TextInput style={styles.textArea} placeholder="Share your experience..." placeholderTextColor={C.slate400} value={reviewComment} onChangeText={setReviewComment} multiline numberOfLines={3} />
            </View>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.amber500 }, (submittingReview || reviewRating < 1) && styles.disabledBtn]} disabled={submittingReview || reviewRating < 1} onPress={handleSubmitReview} activeOpacity={0.85}>
              {submittingReview ? <ActivityIndicator size="small" color={C.white} /> : <><Star size={16} color={C.white} strokeWidth={2.5} /><Text style={styles.primaryBtnText}>Submit Review</Text></>}
            </TouchableOpacity>
          </View>
        )}
        {isBuyer && contract.status === 'completed' && hasReviewed && (
          <View style={[styles.alertCard, { backgroundColor: C.emerald50, borderColor: C.emerald200, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <CheckCircle2 size={22} color={C.emerald500} />
            <View><Text style={styles.alertTitle}>Review Submitted</Text><Text style={styles.alertText}>Thank you for your feedback!</Text></View>
          </View>
        )}

        {/* Offer summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><HandCoins size={16} color={C.emerald500} strokeWidth={2} /><Text style={styles.cardTitleSmall}>Offer Summary</Text></View>
          <View style={{ gap: 10 }}>
            <View style={styles.summaryItem}><View style={styles.summaryLabelWrap}><DollarSign size={15} color={C.emerald500} /><Text style={styles.summaryLabel}>Offer Amount</Text></View><Text style={styles.summaryValue}>{formatCurrency(offerAmount)}</Text></View>
            <View style={styles.summaryItem}><View style={styles.summaryLabelWrap}><Clock size={15} color={C.blue500} /><Text style={styles.summaryLabel}>Duration</Text></View><Text style={styles.summaryValue}>{offerDuration} days</Text></View>
            <View style={styles.summaryItem}><View style={styles.summaryLabelWrap}><RotateCcw size={15} color={C.purple500} /><Text style={styles.summaryLabel}>Revisions</Text></View><Text style={styles.summaryValue}>{revisionsUsed} / {offerRevisions}</Text></View>
          </View>
        </View>

        {/* Buyer / Freelancer */}
        <View style={styles.card}>
          <Text style={styles.cardTitleSmall}>Buyer</Text>
          <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('Profile', { id: contract.buyer?.id })} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: C.blue500 }]}>
              {contract.buyer?.avatar ? <Image source={{ uri: contract.buyer.avatar }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{getInitials(contract.buyer?.firstName, contract.buyer?.lastName)}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{contract.buyer?.firstName} {contract.buyer?.lastName}</Text>
                {contract.buyer?.isVerified && <BadgeCheck size={13} color={C.blue500} strokeWidth={2.5} />}
              </View>
              <Text style={styles.userRole}>Client</Text>
            </View>
            <ChevronRight size={18} color={C.slate300} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.cardTitleSmall}>Freelancer</Text>
          <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('Profile', { id: contract.freelancer?.id })} activeOpacity={0.7}>
            <View style={[styles.avatar, { backgroundColor: C.emerald500 }]}>
              {contract.freelancer?.avatar ? <Image source={{ uri: contract.freelancer.avatar }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{getInitials(contract.freelancer?.firstName, contract.freelancer?.lastName)}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{contract.freelancer?.firstName} {contract.freelancer?.lastName}</Text>
                {contract.freelancer?.isVerified && <BadgeCheck size={13} color={C.blue500} strokeWidth={2.5} />}
              </View>
              <Text style={styles.userRole}>Contractor</Text>
            </View>
            <ChevronRight size={18} color={C.slate300} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Guide */}
        <View style={[styles.card, { backgroundColor: C.emerald50, borderColor: C.emerald100 }]}>
          <View style={styles.cardHeader}><Flag size={16} color={C.emerald700} strokeWidth={2} /><Text style={[styles.cardTitleSmall, { color: C.emerald900 }]}>{isBuyer ? 'Buyer Guide' : 'Freelancer Guide'}</Text></View>
          <View style={{ gap: 8 }}>
            {(isBuyer
              ? ['Review delivery and confirm when satisfied', `Request revisions if changes are needed (${revisionsLeft} left)`, 'Payment held briefly after confirmation for dispute protection']
              : ['Upload deliverables before the deadline', 'Wait for buyer review and confirmation', 'Payment releases to your wallet on approval']
            ).map((line, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Check size={15} color={C.emerald700} style={{ marginTop: 2 }} />
                <Text style={styles.guideText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitleSmall}>Timeline</Text>
          <View style={{ gap: 12 }}>
            <View style={styles.timelineItem}><View style={[styles.timelineDot, { backgroundColor: C.emerald500 }]} /><View><Text style={styles.timelineLabel}>Contract Created</Text><Text style={styles.timelineTime}>{formatDateTime(contract.createdAt)}</Text></View></View>
            {!!contract.startDate && <View style={styles.timelineItem}><View style={[styles.timelineDot, { backgroundColor: C.emerald500 }]} /><View><Text style={styles.timelineLabel}>Started</Text><Text style={styles.timelineTime}>{formatDateTime(contract.startDate)}</Text></View></View>}
            {!!contract.deliveredAt && <View style={styles.timelineItem}><View style={[styles.timelineDot, { backgroundColor: C.sky600 }]} /><View><Text style={styles.timelineLabel}>Delivered</Text><Text style={styles.timelineTime}>{formatDateTime(contract.deliveredAt)}</Text></View></View>}
            {!!contract.endDate && <View style={styles.timelineItem}><View style={[styles.timelineDot, { backgroundColor: C.blue600 }]} /><View><Text style={styles.timelineLabel}>Completed</Text><Text style={styles.timelineTime}>{formatDateTime(contract.endDate)}</Text></View></View>}
          </View>
        </View>

        {/* Quick message */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><MessageSquare size={18} color={C.emerald500} strokeWidth={2} /><Text style={styles.cardTitle}>Quick Message</Text></View>
          <View style={styles.messageInputWrap}>
            <TextInput style={styles.messageInput} placeholder={`Message ${otherParty?.firstName || 'user'}...`} placeholderTextColor={C.slate400} value={messageInput} onChangeText={setMessageInput} />
            <TouchableOpacity style={[styles.sendMsgBtn, !messageInput.trim() && styles.disabledBtn]} disabled={!messageInput.trim() || sendingMessage} onPress={sendMessage} activeOpacity={0.8}>
              {sendingMessage ? <ActivityIndicator size="small" color={C.white} /> : <Send size={18} color={C.white} strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Revision Modal */}
      <Modal visible={showRevisionModal} animationType="slide" transparent onRequestClose={() => setShowRevisionModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.orange100 }]}><RotateCcw size={20} color={C.orange600} strokeWidth={2} /></View>
                <View><Text style={styles.modalTitle}>Request Revision</Text><Text style={styles.modalSubtitle}>{revisionsLeft} revision{revisionsLeft !== 1 ? 's' : ''} remaining</Text></View>
              </View>
              <TouchableOpacity onPress={() => setShowRevisionModal(false)} style={styles.modalCloseBtn}><X size={20} color={C.slate500} strokeWidth={2.5} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Feedback</Text>
                <TextInput style={styles.textArea} placeholder="Describe what needs to be changed..." placeholderTextColor={C.slate400} value={revisionFeedback} onChangeText={setRevisionFeedback} multiline numberOfLines={4} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowRevisionModal(false)}><Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.orange500 }]} disabled={requestingRevision || !revisionFeedback.trim()} onPress={handleRequestRevision}>
                  {requestingRevision ? <ActivityIndicator size="small" color={C.white} /> : <><RotateCcw size={18} color={C.white} strokeWidth={2} /><Text style={styles.modalBtnText}>Request Revision</Text></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Extension Modal */}
      <Modal visible={showExtensionModal} animationType="slide" transparent onRequestClose={() => setShowExtensionModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.amber100 }]}><Hourglass size={20} color={C.amber600} strokeWidth={2} /></View>
                <View><Text style={styles.modalTitle}>Request Extension</Text><Text style={styles.modalSubtitle}>Ask client for more time</Text></View>
              </View>
              <TouchableOpacity onPress={() => setShowExtensionModal(false)} style={styles.modalCloseBtn}><X size={20} color={C.slate500} strokeWidth={2.5} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Additional Days</Text>
                <TextInput style={styles.formInput} keyboardType="number-pad" value={extensionDays} onChangeText={setExtensionDays} placeholder="3" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason (optional)</Text>
                <TextInput style={styles.textArea} placeholder="Explain why you need more time..." placeholderTextColor={C.slate400} value={extensionReason} onChangeText={setExtensionReason} multiline numberOfLines={3} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowExtensionModal(false)}><Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.amber500 }]} disabled={requestingExtension} onPress={handleRequestExtension}>
                  {requestingExtension ? <ActivityIndicator size="small" color={C.white} /> : <><Hourglass size={18} color={C.white} strokeWidth={2} /><Text style={styles.modalBtnText}>Request</Text></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tip Modal */}
      <Modal visible={showTipModal} animationType="slide" transparent onRequestClose={() => setShowTipModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.pink100 }]}><Gift size={20} color={C.pink600} strokeWidth={2} /></View>
                <View><Text style={styles.modalTitle}>Send a Tip</Text><Text style={styles.modalSubtitle}>Optional appreciation for great work</Text></View>
              </View>
              <TouchableOpacity onPress={() => setShowTipModal(false)} style={styles.modalCloseBtn}><X size={20} color={C.slate500} strokeWidth={2.5} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.infoBox, { backgroundColor: C.pink50, borderColor: C.pink100 }]}>
                <Text style={[styles.infoBoxText, { color: C.pink600 }]}>
                  Show appreciation to <Text style={{ fontWeight: '700' }}>{contract.freelancer?.firstName}</Text> for their great work!
                </Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₦)</Text>
                <TextInput style={styles.formInput} keyboardType="decimal-pad" placeholder="Min ₦500" placeholderTextColor={C.slate400} value={tipAmount} onChangeText={setTipAmount} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message (optional)</Text>
                <TextInput style={styles.textArea} placeholder="Add a personal note..." placeholderTextColor={C.slate400} value={tipMessage} onChangeText={setTipMessage} multiline numberOfLines={2} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowTipModal(false)}><Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.pink500 }]} disabled={sendingTip || !tipAmount || parseFloat(tipAmount) < 500} onPress={handleSendTip}>
                  {sendingTip ? <ActivityIndicator size="small" color={C.white} /> : <><Gift size={18} color={C.white} strokeWidth={2} /><Text style={styles.modalBtnText}>Send Tip</Text></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={showDisputeModal} animationType="slide" transparent onRequestClose={() => setShowDisputeModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.purple100 }]}><Gavel size={20} color={C.purple600} strokeWidth={2} /></View>
                <View><Text style={styles.modalTitle}>File a Dispute</Text><Text style={styles.modalSubtitle}>Admin will review and decide</Text></View>
              </View>
              <TouchableOpacity onPress={() => setShowDisputeModal(false)} style={styles.modalCloseBtn}><X size={20} color={C.slate500} strokeWidth={2.5} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.infoBox, { backgroundColor: C.purple50, borderColor: C.purple200 }]}>
                <Text style={[styles.infoBoxText, { color: C.purple700 }]}>
                  Filing a dispute freezes the contract and escrow while an admin investigates.
                </Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Dispute</Text>
                <TextInput style={styles.textArea} placeholder="Explain why you are filing this dispute..." placeholderTextColor={C.slate400} value={disputeReason} onChangeText={setDisputeReason} multiline numberOfLines={4} />
                <Text style={styles.helperText}>Minimum 10 characters</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Evidence (optional)</Text>
                <TouchableOpacity style={styles.dashedBtn} onPress={handleDisputeFileSelect} activeOpacity={0.7}>
                  <Upload size={16} color={C.purple600} /><Text style={styles.dashedBtnText}>Upload evidence files</Text>
                </TouchableOpacity>
                {disputeEvidence.map((f, i) => (
                  <View key={i} style={styles.fileItem}>
                    {f.preview ? <Image source={{ uri: f.preview }} style={styles.fileThumbnail} /> : <View style={styles.fileIconWrap}><File size={16} color={C.blue500} /></View>}
                    <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                    <TouchableOpacity onPress={() => removeDisputeFile(i)}><Trash2 size={15} color={C.red500} /></TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowDisputeModal(false)}><Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.purple600 }]} disabled={filingDispute || disputeReason.trim().length < 10} onPress={handleFileDispute}>
                  {filingDispute ? <ActivityIndicator size="small" color={C.white} /> : <><Gavel size={18} color={C.white} strokeWidth={2} /><Text style={styles.modalBtnText}>File Dispute</Text></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reply Modal */}
      <Modal visible={showReplyModal} animationType="slide" transparent onRequestClose={() => setShowReplyModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.purple100 }]}><MessageSquare size={20} color={C.purple600} strokeWidth={2} /></View>
                <View><Text style={styles.modalTitle}>Add Reply</Text><Text style={styles.modalSubtitle}>Respond with evidence</Text></View>
              </View>
              <TouchableOpacity onPress={() => setShowReplyModal(false)} style={styles.modalCloseBtn}><X size={20} color={C.slate500} strokeWidth={2.5} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput style={styles.textArea} placeholder="Type your response..." placeholderTextColor={C.slate400} value={replyContent} onChangeText={setReplyContent} multiline numberOfLines={4} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Evidence (optional)</Text>
                <TouchableOpacity style={styles.dashedBtn} onPress={handleReplyFileSelect} activeOpacity={0.7}>
                  <Upload size={16} color={C.purple600} /><Text style={styles.dashedBtnText}>Upload files</Text>
                </TouchableOpacity>
                {replyFiles.map((f, i) => (
                  <View key={i} style={styles.fileItem}>
                    {f.preview ? <Image source={{ uri: f.preview }} style={styles.fileThumbnail} /> : <View style={styles.fileIconWrap}><File size={16} color={C.blue500} /></View>}
                    <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                    <TouchableOpacity onPress={() => removeReplyFile(i)}><Trash2 size={15} color={C.red500} /></TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowReplyModal(false)}><Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.purple600 }]} disabled={submittingReply || (!replyContent.trim() && replyFiles.length === 0)} onPress={handleAddReply}>
                  {submittingReply ? <ActivityIndicator size="small" color={C.white} /> : <><Send size={18} color={C.white} strokeWidth={2} /><Text style={styles.modalBtnText}>Submit Reply</Text></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image preview */}
      <Modal visible={!!previewImage} animationType="fade" transparent onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity style={styles.imagePreviewClose} onPress={() => setPreviewImage(null)}><X size={26} color={C.white} strokeWidth={2.5} /></TouchableOpacity>
          {previewImage && <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />}
          {previewImage && (
            <TouchableOpacity style={styles.imagePreviewDownload} onPress={() => handleDownload(previewImage)}>
              <Download size={16} color={C.slate900} /><Text style={styles.imagePreviewDownloadText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ════════════════════════════════════════════════════════════════
// IMPROVED STYLES
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.slate50 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: C.slate500, fontSize: 14 },
  errorIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: C.slate900, marginBottom: 8 },
  errorText: { fontSize: 15, color: C.slate500, textAlign: 'center', marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.emerald600, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  toast: { position: 'absolute', top: 8, left: 16, right: 16, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  toastText: { color: C.white, fontSize: 13, fontWeight: '600', flex: 1 },

  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingHorizontal: 16, 
    paddingVertical: 11, 
    backgroundColor: C.white, 
    borderBottomWidth: 1, 
    borderBottomColor: C.slate100 
  },
  headerBackBtn: { padding: 6, marginRight: 10, marginTop: 1 },
  headerBadges: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 5, 
    marginBottom: 6 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    borderRadius: 18, 
    borderWidth: 1,
    backgroundColor: C.white,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: C.slate900, 
    marginBottom: 2 
  },
  headerSubtitle: { 
    fontSize: 11.5, 
    color: C.slate400 
  },

  chipBar: { 
    backgroundColor: C.white, 
    borderBottomWidth: 1, 
    borderBottomColor: C.slate100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipBarContent: { 
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 10, 
    borderWidth: 1.5,
    minHeight: 40,
  },
  actionChipText: { 
    fontSize: 12, 
    fontWeight: '700',
    textAlign: 'center',
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 12 },
  
  card: { 
    backgroundColor: C.white, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: C.slate200, 
    padding: 16, 
    marginBottom: 12 
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 12 
  },
  cardTitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: C.slate900 
  },
  cardTitleSmall: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: C.slate600, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 10 
  },

  alertCard: { 
    borderRadius: 14, 
    borderWidth: 1, 
    padding: 14, 
    marginBottom: 12 
  },
  alertRow: { flexDirection: 'row', gap: 12 },
  alertIconWrap: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTitle: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: C.slate900, 
    marginBottom: 3 
  },
  alertText: { 
    fontSize: 12, 
    color: C.slate600, 
    lineHeight: 17 
  },
  alertActions: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 10 
  },
  alertApproveBtn: { 
    backgroundColor: C.emerald500, 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  alertApproveBtnText: { 
    color: C.white, 
    fontWeight: '700', 
    fontSize: 12 
  },
  alertRejectBtn: { 
    backgroundColor: C.white, 
    borderWidth: 1.5, 
    borderColor: C.slate200, 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  alertRejectBtnText: { 
    color: C.slate700, 
    fontWeight: '700', 
    fontSize: 12 
  },
  disputeReasonBox: { 
    backgroundColor: C.white, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: C.purple200, 
    padding: 10, 
    marginTop: 8 
  },
  disputeReasonLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: C.purple600, 
    letterSpacing: 0.5, 
    marginBottom: 4 
  },
  disputeReasonText: { 
    fontSize: 12.5, 
    color: C.slate700 
  },

  replyItem: { 
    padding: 11, 
    borderRadius: 10, 
    borderWidth: 1, 
    marginBottom: 8 
  },
  replyAuthor: { 
    fontSize: 12.5, 
    fontWeight: '700', 
    color: C.slate900 
  },
  replyTime: { 
    fontSize: 10.5, 
    color: C.slate400, 
    marginTop: 1, 
    marginBottom: 5 
  },
  replyContent: { 
    fontSize: 12.5, 
    color: C.slate700, 
    lineHeight: 17 
  },

  dashedBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    borderWidth: 1.5, 
    borderStyle: 'dashed', 
    borderColor: C.purple200, 
    borderRadius: 10, 
    paddingVertical: 11, 
    marginTop: 6 
  },
  dashedBtnText: { 
    color: C.purple600, 
    fontWeight: '600', 
    fontSize: 12 
  },

  timerCard: { 
    borderRadius: 14, 
    borderWidth: 1.5, 
    padding: 16, 
    marginBottom: 12,
  },
  timerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 12 
  },
  timerTitle: { 
    fontSize: 14, 
    fontWeight: '800',
  },
  timerGrid: { 
    flexDirection: 'row', 
    gap: 6, 
    marginBottom: 10 
  },
  timerBox: { 
    flex: 1, 
    backgroundColor: C.white, 
    borderRadius: 9, 
    paddingVertical: 8, 
    paddingHorizontal: 4,
    alignItems: 'center', 
    borderWidth: 1.5,
  },
  timerValue: { 
    fontSize: 17, 
    fontWeight: '800',
    lineHeight: 20,
  },
  timerLabel: { 
    fontSize: 8.5, 
    fontWeight: '600', 
    marginTop: 2 
  },
  timerFooter: { 
    fontSize: 11, 
    fontWeight: '600', 
    textAlign: 'center' 
  },

  escrowCard: { 
    borderRadius: 14, 
    padding: 18, 
    marginBottom: 12, 
    backgroundColor: C.emerald600,
    borderWidth: 0,
  },
  escrowHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 8 
  },
  escrowTitle: { 
    fontSize: 13.5, 
    fontWeight: '800', 
    color: C.white 
  },
  escrowAmount: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: C.white, 
    marginBottom: 2 
  },
  escrowSubtitle: { 
    fontSize: 12.5, 
    color: C.emerald100, 
    marginBottom: 14 
  },
  disputeWindowBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: C.purple700, 
    padding: 11, 
    borderRadius: 10, 
    marginBottom: 14 
  },
  disputeWindowText: { 
    fontSize: 11.5, 
    color: C.white, 
    fontWeight: '600' 
  },
  payBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: C.white, 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginBottom: 14,
  },
  payBtnText: { 
    color: C.emerald600, 
    fontWeight: '800', 
    fontSize: 13 
  },
  escrowFeatures: { 
    gap: 6,
  },
  escrowFeature: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  escrowFeatureText: { 
    fontSize: 12, 
    color: C.emerald100, 
    fontWeight: '500' 
  },

  detailsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 9 
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: C.slate50, 
    borderRadius: 10, 
    padding: 12, 
    flex: 1, 
    minWidth: '45%' 
  },
  detailIconWrap: { 
    width: 34, 
    height: 34, 
    borderRadius: 9, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailLabel: { 
    fontSize: 11, 
    color: C.slate500, 
    fontWeight: '600' 
  },
  detailValue: { 
    fontSize: 13.5, 
    color: C.slate900, 
    fontWeight: '800', 
    marginTop: 2 
  },

  deliverableItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  uncheckedCircle: { 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: C.slate300,
    flexShrink: 0,
  },
  deliverableText: { 
    fontSize: 13, 
    color: C.slate700, 
    fontWeight: '500', 
    flex: 1 
  },
  deliverableTextCompleted: { 
    textDecorationLine: 'line-through', 
    color: C.slate400 
  },

  milestoneItem: { 
    flexDirection: 'row', 
    gap: 12, 
    padding: 12, 
    backgroundColor: C.slate50, 
    borderRadius: 10 
  },
  milestoneNum: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: C.slate200, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },
  milestoneNumText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: C.slate500 
  },
  milestoneName: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.slate900 
  },
  milestoneAmount: { 
    fontSize: 12.5, 
    fontWeight: '700', 
    color: C.emerald600 
  },
  milestoneDesc: { 
    fontSize: 12, 
    color: C.slate500, 
    marginTop: 3 
  },
  milestoneDue: { 
    fontSize: 11, 
    color: C.slate400, 
    marginTop: 3 
  },

  uploadArea: { 
    borderWidth: 2, 
    borderColor: C.slate200, 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center' 
  },
  uploadIconWrap: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: C.emerald100, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  uploadTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.slate700, 
    marginBottom: 2 
  },
  uploadSubtitle: { 
    fontSize: 11, 
    color: C.slate400 
  },

  fileItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: C.slate50, 
    padding: 10, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: C.slate200 
  },
  fileThumbnail: { 
    width: 34, 
    height: 34, 
    borderRadius: 7,
    flexShrink: 0,
  },
  fileIconWrap: { 
    width: 34, 
    height: 34, 
    borderRadius: 7, 
    backgroundColor: C.slate100, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileName: { 
    fontSize: 12.5, 
    fontWeight: '600', 
    color: C.slate900, 
    flex: 1 
  },
  fileSize: { 
    fontSize: 10.5, 
    color: C.slate400, 
    marginTop: 1 
  },

  inputGroup: { marginTop: 12 },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: C.slate700, 
    marginBottom: 6 
  },
  formInput: { 
    backgroundColor: C.slate50, 
    borderWidth: 1, 
    borderColor: C.slate200, 
    borderRadius: 10, 
    paddingHorizontal: 13, 
    paddingVertical: 11, 
    fontSize: 14, 
    color: C.slate900 
  },
  textArea: { 
    backgroundColor: C.slate50, 
    borderWidth: 1, 
    borderColor: C.slate200, 
    borderRadius: 10, 
    paddingHorizontal: 13, 
    paddingVertical: 11, 
    fontSize: 14, 
    color: C.slate900, 
    textAlignVertical: 'top' 
  },
  helperText: { 
    fontSize: 10.5, 
    color: C.slate400, 
    marginTop: 4 
  },

  primaryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: C.emerald500, 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginTop: 12 
  },
  primaryBtnText: { 
    color: C.white, 
    fontWeight: '700', 
    fontSize: 13 
  },
  secondaryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingHorizontal: 13, 
    paddingVertical: 12, 
    borderRadius: 10, 
    borderWidth: 1.5, 
    borderColor: C.slate200,
    backgroundColor: C.slate50,
  },
  secondaryBtnText: { 
    color: C.slate700, 
    fontWeight: '700', 
    fontSize: 12.5 
  },
  disabledBtn: { opacity: 0.5 },

  messageInputWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  messageInput: { 
    flex: 1, 
    backgroundColor: C.slate100, 
    borderRadius: 22, 
    paddingHorizontal: 15, 
    paddingVertical: 11, 
    fontSize: 14, 
    color: C.slate900 
  },
  sendMsgBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: C.emerald500, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },

  reviewPrompt: { 
    fontSize: 12.5, 
    color: C.slate500, 
    marginBottom: 11 
  },
  starRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 12,
    justifyContent: 'center',
  },

  summaryItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: C.slate50, 
    padding: 11, 
    borderRadius: 10 
  },
  summaryLabelWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  summaryLabel: { 
    fontSize: 12.5, 
    color: C.slate600, 
    fontWeight: '500' 
  },
  summaryValue: { 
    fontSize: 13, 
    color: C.slate900, 
    fontWeight: '800' 
  },

  userItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 11, 
    paddingVertical: 2 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  avatarText: { 
    color: C.white, 
    fontWeight: '800', 
    fontSize: 14 
  },
  userName: { 
    fontSize: 13.5, 
    fontWeight: '700', 
    color: C.slate900 
  },
  userRole: { 
    fontSize: 11.5, 
    color: C.slate500, 
    marginTop: 1 
  },
  divider: { 
    height: 1, 
    backgroundColor: C.slate100, 
    marginVertical: 12 
  },

  guideText: { 
    fontSize: 12.5, 
    color: C.emerald800, 
    flex: 1, 
    lineHeight: 17 
  },

  timelineItem: { 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'flex-start' 
  },
  timelineDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginTop: 5,
    flexShrink: 0,
  },
  timelineLabel: { 
    fontSize: 12.5, 
    fontWeight: '600', 
    color: C.slate900 
  },
  timelineTime: { 
    fontSize: 11, 
    color: C.slate400, 
    marginTop: 1 
  },

  deliveryBlock: { 
    borderWidth: 1, 
    borderColor: C.slate200, 
    borderRadius: 12, 
    padding: 13, 
    backgroundColor: C.slate50 
  },
  deliveryHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 6 
  },
  deliveryHeaderTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.slate900 
  },
  deliveryHeaderTime: { 
    fontSize: 11, 
    color: C.slate400 
  },
  deliveryNote: { 
    fontSize: 12.5, 
    color: C.slate600, 
    marginBottom: 9, 
    lineHeight: 17 
  },
  deliveryActionsRow: { 
    flexDirection: 'row', 
    gap: 9, 
    marginTop: 11 
  },

  imageGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 7 
  },
  imageGridItem: { 
    width: '31%', 
    aspectRatio: 1, 
    borderRadius: 9, 
    overflow: 'hidden', 
    backgroundColor: C.slate200 
  },
  imageGridImg: { 
    width: '100%', 
    height: '100%' 
  },
  imageGridZoom: { 
    position: 'absolute', 
    bottom: 4, 
    right: 4, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 5, 
    padding: 4 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    backgroundColor: C.white, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '88%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 18, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: C.slate100 
  },
  modalIconWrap: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: C.slate900 
  },
  modalSubtitle: { 
    fontSize: 12, 
    color: C.slate500, 
    marginTop: 2 
  },
  modalCloseBtn: { 
    padding: 6, 
    backgroundColor: C.slate100, 
    borderRadius: 16 
  },
  modalContent: { padding: 18 },
  modalActions: { 
    flexDirection: 'row', 
    gap: 11, 
    marginTop: 18, 
    marginBottom: 28 
  },
  modalBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 13, 
    borderRadius: 10 
  },
  modalBtnText: { 
    color: C.white, 
    fontWeight: '700', 
    fontSize: 13 
  },
  infoBox: { 
    padding: 13, 
    borderRadius: 10, 
    borderWidth: 1, 
    alignItems: 'center' 
  },
  infoBoxText: { 
    fontSize: 12.5, 
    textAlign: 'center', 
    lineHeight: 17 
  },

  imagePreviewOverlay: { 
    flex: 1, 
    backgroundColor: C.slate900, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  imagePreviewClose: { 
    position: 'absolute', 
    top: 56, 
    right: 20, 
    zIndex: 10, 
    padding: 8, 
    backgroundColor: C.slate700, 
    borderRadius: 18 
  },
  previewImage: { 
    width: '100%', 
    height: '75%' 
  },
  imagePreviewDownload: { 
    position: 'absolute', 
    bottom: 40, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: C.white, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  imagePreviewDownloadText: { 
    color: C.slate900, 
    fontWeight: '700', 
    fontSize: 12.5 
  },
});

export default ContractDetailScreen;