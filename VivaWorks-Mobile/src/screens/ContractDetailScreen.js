import React, { useState, useEffect, useRef } from 'react';
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
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Briefcase,
  MessageSquare,
  Send,
  Check,
  XCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  RotateCcw,
  AlertTriangle,
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
  FileImage,
  File,
  ZoomIn,
  Package,
  Gavel,
  Scale,
  Star,
  Hourglass,
  Gift,
  ThumbsUp,
  Loader2,
} from 'lucide-react-native';

// ════════════════════════════════════════════════════════════════
// COLORS (Expanded to match web design, strictly solid)
// ════════════════════════════════════════════════════════════════
const C = {
  emerald50: '#ecfdf5', emerald100: '#d1fae5', emerald200: '#a7f3d0', emerald500: '#10b981', emerald600: '#059669', emerald700: '#047857', emerald900: '#064e3b',
  red50: '#fef2f2', red100: '#fee2e2', red200: '#fecaca', red500: '#ef4444', red600: '#dc2626', red700: '#b91c1c', red900: '#7f1d1d',
  slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1', slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155', slate900: '#0f172a',
  blue50: '#eff6ff', blue100: '#dbeafe', blue200: '#bfdbfe', blue400: '#60a5fa', blue500: '#3b82f6', blue600: '#2563eb', blue700: '#1d4ed8',
  amber50: '#fffbeb', amber100: '#fef3c7', amber200: '#fde68a', amber500: '#f59e0b', amber600: '#d97706', amber700: '#b45309', amber900: '#78350f',
  purple50: '#faf5ff', purple100: '#f3e8ff', purple200: '#e9d5ff', purple500: '#a855f7', purple600: '#9333ea', purple700: '#7e22ce', purple900: '#581c87',
  sky50: '#f0f9ff', sky100: '#e0f2fe', sky200: '#bae6fd', sky500: '#0ea5e9', sky600: '#0284c7', sky700: '#0369a1',
  orange50: '#fff7ed', orange100: '#ffedd5', orange500: '#f97316', orange600: '#ea580c', orange700: '#c2410c',
  pink50: '#fdf2f8', pink100: '#fce7f3', pink500: '#ec4899', pink600: '#db2777',
  rose500: '#f43f5e',
  white: '#ffffff',
  gray50: '#f9fafb', gray100: '#f3f4f6', gray200: '#e5e7eb', gray300: '#d1d5db', gray400: '#9ca3af', gray500: '#6b7280', gray700: '#374151', gray900: '#111827',
};

// Mock API and Auth (Replace with your actual imports)
// import { useAuthStore } from '../stores/authStore'
// import { api } from '../utils/api'
const api = { get: async () => ({ data: {} }), post: async () => ({ data: {} }), patch: async () => ({ data: {} }) };
const useAuthStore = () => ({ user: { id: '1', firstName: 'John', lastName: 'Doe' } });

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(Number(bytes))) return 'Unknown';
  const numBytes = Number(bytes);
  if (numBytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(1024));
  return `${(numBytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const getInitials = (firstName, lastName) => {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
};

const isImageFile = (type, url) => {
  if (type?.startsWith('image/')) return true;
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
};

// ════════════════════════════════════════════════════════════════
// CONTRACT DETAIL SCREEN
// ════════════════════════════════════════════════════════════════
const ContractDetail = ({ route, navigation }) => {
  const contractId = route?.params?.contractId || '123';
  const { user } = useAuthStore();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Action states
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Delivery states
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [uploadingDelivery, setUploadingDelivery] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  // Modals
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [requestingRevision, setRequestingRevision] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState([]);
  const [filingDispute, setFilingDispute] = useState(false);

  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState('3');
  const [extensionReason, setExtensionReason] = useState('');
  const [requestingExtension, setRequestingExtension] = useState(false);
  const [pendingExtension, setPendingExtension] = useState(null);

  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [sendingTip, setSendingTip] = useState(false);
  const [hasTipped, setHasTipped] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  useEffect(() => {
    if (!contract?.deadline) return;
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadline = new Date(contract.deadline).getTime();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeLeft({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        expired: false,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [contract?.deadline]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await api.get(`/contracts/${contractId}`);
      // setContract(response.data.contract);
      
      // Mock data for demonstration
      setContract({
        id: 'CTR-88392',
        status: 'active',
        amount: 150000,
        escrowAmount: 150000,
        startDate: '2023-10-01T10:00:00Z',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 14,
        revisionsTotal: 3,
        revisionsUsed: 1,
        buyer: { id: '2', firstName: 'Alice', lastName: 'Smith', isVerified: true },
        freelancer: { id: '1', firstName: 'John', lastName: 'Doe', isVerified: true },
        buyerId: '2',
        freelancerId: '1',
        deliverables: [{ name: 'Initial Wireframes', completed: true }, { name: 'Final React Native Code', completed: false }],
      });
    } catch (err) {
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (type) => {
    // TODO: Integrate expo-document-picker or react-native-document-picker here
    Alert.alert('File Picker', 'Integrate expo-document-picker here to select files.');
  };

  const removeDeliveryFile = (index) => {
    setDeliveryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active': return { color: C.emerald100, textColor: C.emerald700, borderColor: C.emerald200, icon: Clock, label: 'Active' };
      case 'pending_payment': return { color: C.amber100, textColor: C.amber700, borderColor: C.amber200, icon: DollarSign, label: 'Pending Payment' };
      case 'completed': return { color: C.blue100, textColor: C.blue700, borderColor: C.blue200, icon: CheckCircle2, label: 'Completed' };
      case 'cancelled': return { color: C.red100, textColor: C.red700, borderColor: C.red200, icon: XCircle, label: 'Cancelled' };
      case 'disputed': return { color: C.purple100, textColor: C.purple700, borderColor: C.purple200, icon: AlertTriangle, label: 'Disputed' };
      case 'delivered': return { color: C.sky100, textColor: C.sky700, borderColor: C.sky200, icon: PackageOpen, label: 'Delivered' };
      case 'revision_requested': return { color: C.orange100, textColor: C.orange700, borderColor: C.orange200, icon: RotateCcw, label: 'Revision Requested' };
      default: return { color: C.gray100, textColor: C.gray700, borderColor: C.gray200, icon: Clock, label: status?.replace('_', ' ') || 'Unknown' };
    }
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
  const revisionsLeft = Math.max(0, (contract.revisionsTotal || 0) - (contract.revisionsUsed || 0));

  const canSubmitDelivery = isFreelancer && (contract.status === 'active' || contract.status === 'revision_requested');
  const canComplete = isBuyer && contract.status === 'delivered';
  const canRequestRevision = isBuyer && contract.status === 'delivered' && revisionsLeft > 0;
  const canCancel = ['active', 'revision_requested', 'pending_payment'].includes(contract.status);
  const canPay = isBuyer && contract.status === 'pending_payment';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <ArrowLeft size={24} color={C.slate700} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.headerBadges}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color, borderColor: statusConfig.borderColor }]}>
              <StatusIcon size={14} color={statusConfig.textColor} strokeWidth={2.5} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>{statusConfig.label}</Text>
            </View>
            {contract.escrowAmount > 0 && (
              <View style={[styles.statusBadge, { backgroundColor: C.emerald50, borderColor: C.emerald200 }]}>
                <ShieldCheck size={14} color={C.emerald600} strokeWidth={2.5} />
                <Text style={[styles.statusBadgeText, { color: C.emerald700 }]}>
                  {formatCurrency(contract.escrowAmount)} in escrow
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {contract.job?.title || 'Direct Hire Contract'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Created {formatDate(contract.createdAt)} · #{contract.id?.slice(-8)?.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Countdown Timer */}
        {contract.deadline && (contract.status === 'active' || contract.status === 'revision_requested') && (
          <View style={[styles.timerCard, { backgroundColor: timeLeft?.expired ? C.red50 : C.emerald50, borderColor: timeLeft?.expired ? C.red200 : C.emerald200 }]}>
            <View style={styles.timerHeader}>
              <Timer size={20} color={timeLeft?.expired ? C.red500 : C.emerald600} strokeWidth={2} />
              <Text style={[styles.timerTitle, { color: timeLeft?.expired ? C.red900 : C.emerald900 }]}>
                {timeLeft?.expired ? 'Deadline Exceeded' : 'Time Remaining'}
              </Text>
            </View>
            <View style={styles.timerGrid}>
              {[
                { value: timeLeft?.days || 0, label: 'Days' },
                { value: timeLeft?.hours || 0, label: 'Hours' },
                { value: timeLeft?.minutes || 0, label: 'Mins' },
                { value: timeLeft?.seconds || 0, label: 'Secs' },
              ].map((item, i) => (
                <View key={i} style={[styles.timerBox, { borderColor: timeLeft?.expired ? C.red200 : C.emerald200 }]}>
                  <Text style={[styles.timerValue, { color: timeLeft?.expired ? C.red600 : C.emerald700 }]}>
                    {String(item.value).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.timerLabel, { color: timeLeft?.expired ? C.red400 : C.emerald500 }]}>{item.label}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.timerFooter, { color: timeLeft?.expired ? C.red600 : C.emerald600 }]}>
              Deadline: {formatDateTime(contract.deadline)}
            </Text>
          </View>
        )}

        {/* Contract Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Briefcase size={20} color={C.emerald500} strokeWidth={2} />
            <Text style={styles.cardTitle}>Contract Details</Text>
          </View>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.emerald100 }]}>
                <DollarSign size={20} color={C.emerald600} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>{formatCurrency(contract.amount)}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.blue100 }]}>
                <CalendarDays size={20} color={C.blue600} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>{formatDate(contract.startDate)}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.purple100 }]}>
                <RotateCcw size={20} color={C.purple600} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Revisions</Text>
                <Text style={styles.detailValue}>{contract.revisionsUsed || 0} used · {revisionsLeft} left</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: C.sky100 }]}>
                <CalendarDays size={20} color={C.sky600} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{contract.duration || 0} days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Deliverables */}
        {contract.deliverables?.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ListChecks size={20} color={C.emerald500} strokeWidth={2} />
              <Text style={styles.cardTitle}>Deliverables</Text>
            </View>
            <View style={styles.deliverablesList}>
              {contract.deliverables.map((item, index) => (
                <View key={index} style={[styles.deliverableItem, { backgroundColor: item.completed ? C.emerald50 : C.slate50, borderColor: item.completed ? C.emerald200 : C.slate200 }]}>
                  {item.completed ? (
                    <CheckCircle2 size={20} color={C.emerald500} strokeWidth={2.5} />
                  ) : (
                    <View style={styles.uncheckedCircle} />
                  )}
                  <Text style={[styles.deliverableText, item.completed && styles.deliverableTextCompleted]}>
                    {item.name || item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delivery Upload (Freelancer) */}
        {canSubmitDelivery && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Upload size={20} color={C.emerald500} strokeWidth={2} />
              <Text style={styles.cardTitle}>Submit Work</Text>
            </View>
            
            <TouchableOpacity style={styles.uploadArea} onPress={() => handleFileSelect('delivery')}>
              <View style={[styles.uploadIconWrap, { backgroundColor: C.emerald100 }]}>
                <Upload size={24} color={C.emerald600} strokeWidth={2} />
              </View>
              <Text style={styles.uploadTitle}>Tap to upload files</Text>
              <Text style={styles.uploadSubtitle}>Images or PDFs up to 20MB each</Text>
            </TouchableOpacity>

            {deliveryFiles.length > 0 && (
              <View style={styles.fileList}>
                {deliveryFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    {file.preview ? (
                      <Image source={{ uri: file.preview }} style={styles.fileThumbnail} />
                    ) : (
                      <View style={[styles.fileIconWrap, { backgroundColor: C.slate100 }]}>
                        <FileText size={20} color={C.slate600} strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                      <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeDeliveryFile(index)} style={styles.removeFileBtn}>
                      <Trash2 size={16} color={C.red500} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Note</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe what you're delivering..."
                placeholderTextColor={C.slate400}
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, (uploadingDelivery || deliveryFiles.length === 0) && styles.disabledBtn]}
              disabled={uploadingDelivery || deliveryFiles.length === 0}
              onPress={() => Alert.alert('Success', 'Work submitted! (Mock)')}
            >
              {uploadingDelivery ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <>
                  <CheckCircle2 size={18} color={C.white} strokeWidth={2.5} />
                  <Text style={styles.primaryBtnText}>Submit Work</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Message */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MessageSquare size={20} color={C.emerald500} strokeWidth={2} />
            <Text style={styles.cardTitle}>Quick Message</Text>
          </View>
          <View style={styles.messageInputWrap}>
            <TextInput
              style={styles.messageInput}
              placeholder={`Message ${otherParty?.firstName || 'user'}...`}
              placeholderTextColor={C.slate400}
              value={messageInput}
              onChangeText={setMessageInput}
            />
            <TouchableOpacity 
              style={[styles.sendMsgBtn, !messageInput.trim() && styles.disabledBtn]}
              disabled={!messageInput.trim()}
              onPress={() => {
                Alert.alert('Sent', 'Message sent successfully!');
                setMessageInput('');
              }}
            >
              <Send size={18} color={C.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sidebar: Escrow Card */}
        <View style={[styles.escrowCard, { backgroundColor: C.emerald600 }]}>
          <View style={styles.escrowHeader}>
            <ShieldCheck size={20} color={C.emerald100} strokeWidth={2} />
            <Text style={styles.escrowTitle}>Escrow Protected</Text>
          </View>
          <Text style={styles.escrowAmount}>{formatCurrency(contract.escrowAmount)}</Text>
          <Text style={styles.escrowSubtitle}>held securely in escrow</Text>

          {canPay && (
            <TouchableOpacity style={styles.payBtn} onPress={() => Alert.alert('Payment', 'Redirecting to payment gateway...')}>
              <CreditCard size={16} color={C.emerald600} strokeWidth={2.5} />
              <Text style={styles.payBtnText}>Pay Now</Text>
            </TouchableOpacity>
          )}

          <View style={styles.escrowFeatures}>
            <View style={styles.escrowFeature}>
              <Check size={16} color={C.emerald100} strokeWidth={2.5} />
              <Text style={styles.escrowFeatureText}>Payment protected</Text>
            </View>
            <View style={styles.escrowFeature}>
              <Check size={16} color={C.emerald100} strokeWidth={2.5} />
              <Text style={styles.escrowFeatureText}>Released on completion</Text>
            </View>
          </View>
        </View>

        {/* Sidebar: Offer Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HandCoins size={18} color={C.emerald500} strokeWidth={2} />
            <Text style={styles.cardTitleSmall}>Offer Summary</Text>
          </View>
          <View style={styles.summaryList}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelWrap}>
                <DollarSign size={16} color={C.emerald500} strokeWidth={2} />
                <Text style={styles.summaryLabel}>Offer Amount</Text>
              </View>
              <Text style={styles.summaryValue}>{formatCurrency(contract.amount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelWrap}>
                <Clock size={16} color={C.blue500} strokeWidth={2} />
                <Text style={styles.summaryLabel}>Duration</Text>
              </View>
              <Text style={styles.summaryValue}>{contract.duration} days</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelWrap}>
                <RotateCcw size={16} color={C.purple500} strokeWidth={2} />
                <Text style={styles.summaryLabel}>Revisions</Text>
              </View>
              <Text style={styles.summaryValue}>{contract.revisionsUsed || 0} / {contract.revisionsTotal || 0}</Text>
            </View>
          </View>
        </View>

        {/* Sidebar: Users */}
        <View style={styles.card}>
          <Text style={styles.cardTitleSmall}>Buyer</Text>
          <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('Profile', { id: contract.buyer?.id })}>
            <View style={[styles.avatar, { backgroundColor: C.blue500 }]}>
              {contract.buyer?.avatar ? (
                <Image source={{ uri: contract.buyer.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(contract.buyer?.firstName, contract.buyer?.lastName)}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{contract.buyer?.firstName} {contract.buyer?.lastName}</Text>
                {contract.buyer?.isVerified && <BadgeCheck size={14} color={C.blue500} strokeWidth={2.5} />}
              </View>
              <Text style={styles.userRole}>Client</Text>
            </View>
            <ChevronRight size={18} color={C.slate300} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.cardTitleSmall}>Freelancer</Text>
          <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('Profile', { id: contract.freelancer?.id })}>
            <View style={[styles.avatar, { backgroundColor: C.emerald500 }]}>
              {contract.freelancer?.avatar ? (
                <Image source={{ uri: contract.freelancer.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(contract.freelancer?.firstName, contract.freelancer?.lastName)}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{contract.freelancer?.firstName} {contract.freelancer?.lastName}</Text>
                {contract.freelancer?.isVerified && <BadgeCheck size={14} color={C.blue500} strokeWidth={2.5} />}
              </View>
              <Text style={styles.userRole}>Contractor</Text>
            </View>
            <ChevronRight size={18} color={C.slate300} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for modals */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Bar (Sticky Bottom) */}
      <View style={styles.actionBar}>
        {canComplete && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.emerald500 }]} onPress={() => Alert.alert('Confirm', 'Mark as complete?')}>
            <CheckCircle2 size={18} color={C.white} strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>Confirm Delivery</Text>
          </TouchableOpacity>
        )}
        {canRequestRevision && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.white, borderColor: C.slate200 }]} onPress={() => setShowRevisionModal(true)}>
            <RotateCcw size={18} color={C.slate700} strokeWidth={2} />
            <Text style={[styles.actionBtnText, { color: C.slate700 }]}>Request Revision</Text>
          </TouchableOpacity>
        )}
        {canCancel && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.white, borderColor: C.red200 }]} onPress={() => Alert.alert('Cancel', 'Are you sure?')}>
            <XCircle size={18} color={C.red600} strokeWidth={2} />
            <Text style={[styles.actionBtnText, { color: C.red600 }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODALS (KeyboardAvoidingView prevents "too tall" / uncloseable issues) */}
      {/* ════════════════════════════════════════════════════════════════ */}

      {/* Revision Modal */}
      <Modal visible={showRevisionModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.orange100 }]}>
                  <RotateCcw size={20} color={C.orange600} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Request Revision</Text>
                  <Text style={styles.modalSubtitle}>{revisionsLeft} revision{revisionsLeft !== 1 ? 's' : ''} remaining</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowRevisionModal(false)} style={styles.modalCloseBtn}>
                <X size={22} color={C.slate500} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Feedback</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe what needs to be changed..."
                  placeholderTextColor={C.slate400}
                  value={revisionFeedback}
                  onChangeText={setRevisionFeedback}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowRevisionModal(false)}>
                  <Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: C.orange500 }]} 
                  disabled={!revisionFeedback.trim()}
                  onPress={() => {
                    Alert.alert('Success', 'Revision requested!');
                    setShowRevisionModal(false);
                    setRevisionFeedback('');
                  }}
                >
                  <RotateCcw size={18} color={C.white} strokeWidth={2} />
                  <Text style={styles.modalBtnText}>Request Revision</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Extension Modal */}
      <Modal visible={showExtensionModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.amber100 }]}>
                  <Hourglass size={20} color={C.amber600} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Request Extension</Text>
                  <Text style={styles.modalSubtitle}>Ask client for more time</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowExtensionModal(false)} style={styles.modalCloseBtn}>
                <X size={22} color={C.slate500} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Additional Days</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="number-pad"
                  value={extensionDays}
                  onChangeText={setExtensionDays}
                  placeholder="3"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Explain why you need more time..."
                  placeholderTextColor={C.slate400}
                  value={extensionReason}
                  onChangeText={setExtensionReason}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowExtensionModal(false)}>
                  <Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: C.amber500 }]} 
                  onPress={() => {
                    Alert.alert('Success', 'Extension requested!');
                    setShowExtensionModal(false);
                  }}
                >
                  <Hourglass size={18} color={C.white} strokeWidth={2} />
                  <Text style={styles.modalBtnText}>Request</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tip Modal */}
      <Modal visible={showTipModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: C.pink100 }]}>
                  <Gift size={20} color={C.pink600} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Send a Tip</Text>
                  <Text style={styles.modalSubtitle}>Optional appreciation for great work</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTipModal(false)} style={styles.modalCloseBtn}>
                <X size={22} color={C.slate500} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.infoBox, { backgroundColor: C.pink50, borderColor: C.pink100 }]}>
                <Text style={[styles.infoBoxText, { color: C.pink700 }]}>
                  Show your appreciation to <Text style={{ fontWeight: '700' }}>{contract.freelancer?.firstName}</Text> for their great work!
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₦)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="decimal-pad"
                  placeholder="Min ₦500"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Add a personal note..."
                  placeholderTextColor={C.slate400}
                  value={tipMessage}
                  onChangeText={setTipMessage}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.slate100 }]} onPress={() => setShowTipModal(false)}>
                  <Text style={[styles.modalBtnText, { color: C.slate700 }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: C.pink500 }]} 
                  disabled={!tipAmount || parseFloat(tipAmount) < 500}
                  onPress={() => {
                    Alert.alert('Success', 'Tip sent successfully!');
                    setShowTipModal(false);
                  }}
                >
                  <Gift size={18} color={C.white} strokeWidth={2} />
                  <Text style={styles.modalBtnText}>Send Tip</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} animationType="fade" transparent>
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity style={styles.imagePreviewClose} onPress={() => setPreviewImage(null)}>
            <X size={28} color={C.white} strokeWidth={2.5} />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

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
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.emerald500, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  headerBackBtn: { padding: 8, marginRight: 12, marginTop: 4 },
  headerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.slate900, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: C.slate500 },

  // Layout
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  cardTitleSmall: { fontSize: 13, fontWeight: '700', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Timer
  timerCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  timerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  timerTitle: { fontSize: 16, fontWeight: '800' },
  timerGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  timerBox: { flex: 1, backgroundColor: C.white, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  timerValue: { fontSize: 22, fontWeight: '800' },
  timerLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  timerFooter: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Details
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.slate50, borderRadius: 12, padding: 12, flex: 1, minWidth: '45%' },
  detailIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 12, color: C.slate500, fontWeight: '600' },
  detailValue: { fontSize: 15, color: C.slate900, fontWeight: '800', marginTop: 2 },

  // Deliverables
  deliverablesList: { gap: 10 },
  deliverableItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  uncheckedCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.slate300 },
  deliverableText: { fontSize: 14, color: C.slate700, fontWeight: '500', flex: 1 },
  deliverableTextCompleted: { textDecorationLine: 'line-through', color: C.slate400 },

  // Upload
  uploadArea: { borderWidth: 2, borderColor: C.slate200, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  uploadIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: C.slate700, marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: C.slate400 },
  fileList: { gap: 10, marginBottom: 16 },
  fileItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.slate50, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.slate200 },
  fileThumbnail: { width: 40, height: 40, borderRadius: 8 },
  fileIconWrap: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: C.slate900 },
  fileSize: { fontSize: 12, color: C.slate400, marginTop: 2 },
  removeFileBtn: { padding: 8 },

  // Inputs
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.slate700, marginBottom: 8 },
  formInput: { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.slate900 },
  textArea: { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.slate900, textAlignVertical: 'top' },

  // Buttons
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.emerald500, paddingVertical: 16, borderRadius: 12 },
  primaryBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  disabledBtn: { backgroundColor: C.slate200, opacity: 0.7 },

  // Message
  messageInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  messageInput: { flex: 1, backgroundColor: C.slate100, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.slate900 },
  sendMsgBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.emerald500, alignItems: 'center', justifyContent: 'center' },

  // Escrow
  escrowCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  escrowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  escrowTitle: { fontSize: 16, fontWeight: '800', color: C.white },
  escrowAmount: { fontSize: 28, fontWeight: '800', color: C.white, marginBottom: 4 },
  escrowSubtitle: { fontSize: 14, color: C.emerald100, marginBottom: 20 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.white, paddingVertical: 14, borderRadius: 12, marginBottom: 20 },
  payBtnText: { color: C.emerald600, fontWeight: '800', fontSize: 15 },
  escrowFeatures: { gap: 10 },
  escrowFeature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  escrowFeatureText: { fontSize: 14, color: C.emerald100, fontWeight: '500' },

  // Summary
  summaryList: { gap: 12 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.slate50, padding: 14, borderRadius: 12 },
  summaryLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 14, color: C.slate600, fontWeight: '500' },
  summaryValue: { fontSize: 15, color: C.slate900, fontWeight: '800' },

  // Users
  userItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: C.white, fontWeight: '800', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '700', color: C.slate900 },
  userRole: { fontSize: 13, color: C.slate500, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.slate100, marginVertical: 16 },

  // Action Bar
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.slate100, padding: 16, flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontWeight: '700', fontSize: 14 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.slate900 },
  modalSubtitle: { fontSize: 13, color: C.slate500, marginTop: 2 },
  modalCloseBtn: { padding: 8, backgroundColor: C.slate100, borderRadius: 20 },
  modalContent: { padding: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  modalBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  infoBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
  infoBoxText: { fontSize: 14, textAlign: 'center' },

  // Image Preview
  imagePreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  imagePreviewClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  previewImage: { width: '100%', height: '80%' },
});

export default ContractDetail;