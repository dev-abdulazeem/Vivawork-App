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
  ScrollView,
  TextInput as TextInputComp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  SquarePen,
  Archive,
  ArchiveRestore,
  Ban,
  MessageSquare,
  BadgeCheck,
  Briefcase,
  Image as ImageIcon,
  FileText,
  Paperclip,
  PhoneCall,
  Video,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  RotateCcw,
  ListChecks,
  Eye,
  ArrowRight,
  UserCheck,
  Banknote,
  Shield,
  Send,
  ChevronLeft,
  Trash2,
  Check,
  HandCoins,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

// ════════════════════════════════════════════════════════════════
// COLORS - No gradients, clean system
// ════════════════════════════════════════════════════════════════
const C = {
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red500: '#ef4444',
  red600: '#dc2626',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0f172a',
  blue500: '#3b82f6',
  white: '#ffffff',
  amber500: '#f59e0b',
  gray700: '#374151',
};

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'blocked', label: 'Blocked' },
];

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

const cleanPreview = (text) => {
  if (!text) return '';
  try {
    return text.replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2190-\u21FF\u2B00-\u2BFF]+\s*/gu, '');
  } catch {
    return text.replace(/^(💼|📷|📄|📎|❌|📞)\s*/, '');
  }
};

const getPreviewIcon = (type) => {
  switch (type) {
    case 'offer':
      return Briefcase;
    case 'image':
      return ImageIcon;
    case 'pdf':
      return FileText;
    case 'file':
      return Paperclip;
    case 'call':
      return PhoneCall;
    default:
      return null;
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (firstName, lastName) => {
  const f = firstName?.trim()?.[0] || '';
  const l = lastName?.trim()?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
};

// ════════════════════════════════════════════════════════════════
// AVATAR COMPONENT
// ════════════════════════════════════════════════════════════════
const Avatar = ({ uri, firstName, lastName, size = 52 }) => {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri)
    return (
      <Image
        source={{ uri }}
        style={[styles.avatarImg, dim]}
      />
    );
  return (
    <View style={[styles.avatarFallback, dim, { backgroundColor: C.emerald600 }]}>
      <Text style={[styles.avatarFallbackText, { fontSize: size * 0.36 }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// OFFER CARD COMPONENT (from web)
// ════════════════════════════════════════════════════════════════
const OfferCard = ({ offer, isMe, onAccept, onReject, onCancel }) => {
  if (!offer) return null;

  const isInitiatedByMe = isMe;
  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';

  const statusConfig = {
    pending: {
      bg: C.emerald500,
      icon: Clock,
      text: 'Pending',
      color: C.white,
    },
    accepted: {
      bg: C.emerald500,
      icon: CheckCircle2,
      text: 'Accepted',
      color: C.white,
    },
    rejected: {
      bg: C.red50,
      icon: XCircle,
      text: 'Rejected',
      color: C.red500,
    },
    cancelled: {
      bg: C.slate100,
      icon: X,
      text: 'Cancelled',
      color: C.slate500,
    },
  };

  const status = statusConfig[offer.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <View style={[styles.offerCard, { backgroundColor: isMe ? C.emerald500 : C.white, borderWidth: isMe ? 0 : 1, borderColor: C.slate200 }]}>
      {/* Header */}
      <View style={[styles.offerHeader, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : C.slate50 }]}>
        <View style={[styles.offerIconWrap, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.emerald100 }]}>
          <Briefcase size={16} color={isMe ? C.white : C.emerald600} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.offerLabel, { color: isMe ? C.emerald100 : C.emerald600 }]}>JOB OFFER</Text>
          <Text style={[styles.offerType, { color: isMe ? C.emerald200 : C.slate400 }]}>
            {offer.type?.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.offerAmount}>
        <Text style={[styles.offerAmountLabel, { color: isMe ? C.emerald200 : C.slate400 }]}>Amount</Text>
        <Text style={[styles.offerAmountValue, { color: isMe ? C.white : C.slate900 }]}>
          ₦{offer.amount?.toLocaleString?.() || '0'}
        </Text>
      </View>

      {/* Duration & Revisions */}
      <View style={styles.offerGridRow}>
        {offer.durationDays && (
          <View style={[styles.offerGridItem, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.slate50 }]}>
            <Calendar size={14} color={isMe ? C.emerald200 : C.slate400} strokeWidth={2} />
            <View>
              <Text style={[styles.offerGridLabel, { color: isMe ? C.emerald300 : C.slate400 }]}>Duration</Text>
              <Text style={[styles.offerGridValue, { color: isMe ? C.white : C.slate700 }]}>{offer.durationDays}d</Text>
            </View>
          </View>
        )}
        {offer.revisions !== undefined && (
          <View style={[styles.offerGridItem, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.slate50 }]}>
            <RotateCcw size={14} color={isMe ? C.emerald200 : C.slate400} strokeWidth={2} />
            <View>
              <Text style={[styles.offerGridLabel, { color: isMe ? C.emerald300 : C.slate400 }]}>Revisions</Text>
              <Text style={[styles.offerGridValue, { color: isMe ? C.white : C.slate700 }]}>{offer.revisions}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Description */}
      {offer.description && (
        <View style={styles.offerDescription}>
          <Text style={[styles.offerDescLabel, { color: isMe ? C.emerald200 : C.slate400 }]}>Description</Text>
          <Text style={[styles.offerDescText, { color: isMe ? C.emerald50 : C.slate600 }]}>{offer.description}</Text>
        </View>
      )}

      {/* Deliverables */}
      {offer.deliverables && offer.deliverables.length > 0 && offer.deliverables[0] !== '' && (
        <View style={styles.offerDeliverables}>
          <Text style={[styles.offerDelLabel, { color: isMe ? C.emerald200 : C.slate400 }]}>Deliverables</Text>
          {offer.deliverables.map((d, i) => (
            <View key={i} style={styles.delItem}>
              <ListChecks size={13} color={isMe ? C.emerald300 : C.emerald500} strokeWidth={2} />
              <Text style={[styles.delText, { color: isMe ? C.emerald100 : C.slate600 }]}>{d}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <StatusIcon size={14} color={status.color} strokeWidth={2.2} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
      </View>

      {/* Action Buttons */}
      {isPending && !isInitiatedByMe && (
        <View style={styles.offerActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept?.(offer.id)}>
            <CheckCircle2 size={14} color={C.white} strokeWidth={2} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject?.(offer.id)}>
            <XCircle size={14} color={C.slate600} strokeWidth={2} />
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPending && isInitiatedByMe && (
        <View style={[styles.offerWaitingWrap, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.slate100 }]}>
          <Clock size={12} color={isMe ? C.emerald300 : C.slate400} strokeWidth={2} />
          <Text style={[styles.offerWaitingText, { color: isMe ? C.emerald200 : C.slate500 }]}>
            Awaiting response
          </Text>
          <TouchableOpacity style={[styles.cancelOfferBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.slate100 }]} onPress={() => onCancel?.(offer.id)}>
            <Text style={[styles.cancelOfferBtnText, { color: isMe ? C.white : C.slate600 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAccepted && (
        <View style={[styles.protectedWrap, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.emerald50 }]}>
          <Shield size={14} color={isMe ? C.white : C.emerald500} strokeWidth={2} />
          <Text style={[styles.protectedText, { color: isMe ? C.white : C.emerald600 }]}>Payment secured</Text>
        </View>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// CALL HISTORY MESSAGE (from web)
// ════════════════════════════════════════════════════════════════
const CallHistoryBubble = ({ msg, onCallBack }) => {
  const direction = msg.callDirection || 'outgoing';
  const isMissed = direction === 'missed';
  const duration = msg.callDuration || 0;

  const formatCallDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.callHistoryBubble, { backgroundColor: isMissed ? C.red50 : C.slate50, borderColor: isMissed ? C.red100 : C.slate200 }]}>
      <PhoneCall size={14} color={isMissed ? C.red500 : C.emerald500} strokeWidth={2} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.callHistoryText, { color: isMissed ? C.red600 : C.slate600 }]}>
          {isMissed ? 'Missed' : 'Call'} {msg.callType === 'video' ? 'video' : 'voice'} call
        </Text>
      </View>
      {duration > 0 && (
        <Text style={styles.callDurationText}>{formatCallDuration(duration)}</Text>
      )}
      <TouchableOpacity onPress={() => onCallBack?.(msg.callType)} style={styles.callBackBtn}>
        <PhoneCall size={14} color={C.emerald500} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE (Text, File, etc)
// ════════════════════════════════════════════════════════════════
const MessageBubble = ({ msg, isMe, onDelete }) => {
  const isFile = msg.fileUrl || msg.fileType;
  const isImage = msg.fileType?.startsWith('image/');

  return (
    <View style={{ marginVertical: 6, marginHorizontal: 12, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isMe ? C.emerald500 : C.white,
            borderWidth: isMe ? 0 : 1,
            borderColor: isMe ? 'transparent' : C.slate200,
            borderTopLeftRadius: isMe ? 12 : 4,
            borderTopRightRadius: isMe ? 4 : 12,
            maxWidth: '85%',
          },
        ]}
      >
        {isFile ? (
          isImage ? (
            <View>
              <Image
                source={{ uri: msg.fileUrl }}
                style={styles.msgImageFile}
              />
              <Text style={[styles.msgFileNameText, { color: isMe ? C.emerald100 : C.slate600 }]}>
                {msg.fileName}
              </Text>
            </View>
          ) : (
            <View style={styles.msgFileWrap}>
              <View
                style={[
                  styles.msgFileIconWrap,
                  { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.slate100 },
                ]}
              >
                <FileText size={16} color={isMe ? C.white : C.slate600} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.msgFileName, { color: isMe ? C.white : C.slate800 }]}>
                  {msg.fileName}
                </Text>
                <TouchableOpacity onPress={() => msg.fileUrl && alert('Opening file...')}>
                  <Text style={[styles.downloadLink, { color: isMe ? C.emerald200 : C.emerald600 }]}>
                    Download
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <Text style={[styles.msgText, { color: isMe ? C.white : C.slate800 }]}>{msg.content}</Text>
        )}
      </View>

      <View style={[styles.msgMeta, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.msgTime, { color: isMe ? C.emerald600 : C.slate400 }]}>
          {formatTime(msg.createdAt)}
        </Text>
        {isMe && (
          <View style={{ marginLeft: 4 }}>
            {msg.isRead ? (
              <Check size={12} color={C.emerald500} strokeWidth={3} />
            ) : (
              <Check size={12} color={C.emerald300} strokeWidth={3} />
            )}
          </View>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(msg.id)}
          style={styles.msgDeleteBtn}
        >
          <Trash2 size={13} color={C.red500} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// MESSAGES SCREEN - Conversation List
// ════════════════════════════════════════════════════════════════
const MessagesScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [blockedContacts, setBlockedContacts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [convRes, blockedRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/messages/blocked'),
      ]);
      setConversations(convRes.data.conversations || []);
      setArchivedConversations(convRes.data.archivedConversations || []);
      setBlockedContacts(blockedRes.data.blockedContacts || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const openChat = (otherUser) => {
    navigation.navigate('Chat', { userId: otherUser.id, user: otherUser });
  };

  const showChatOptions = (conv) => {
    Alert.alert(
      `${conv.user.firstName} ${conv.user.lastName}`,
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive Chat', onPress: () => handleArchive(conv.user.id) },
        { text: 'Block Contact', style: 'destructive', onPress: () => confirmBlock(conv.user) },
      ]
    );
  };

  const handleArchive = async (userId) => {
    try {
      setActionLoadingId(userId);
      await api.post(`/messages/archive/${userId}`);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to archive conversation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnarchive = async (userId) => {
    try {
      setActionLoadingId(userId);
      await api.delete(`/messages/archive/${userId}`);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to unarchive conversation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmBlock = (otherUser) => {
    Alert.alert(
      'Block contact',
      `Block ${otherUser.firstName} ${otherUser.lastName}? They won't be able to message or call you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(otherUser.id);
              await api.post(`/messages/block/${otherUser.id}`);
              fetchAll();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to block contact');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleUnblock = async (userId) => {
    try {
      setActionLoadingId(userId);
      await api.delete(`/messages/block/${userId}`);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to unblock contact');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const filteredArchived = useMemo(() => {
    if (!searchQuery) return archivedConversations;
    const q = searchQuery.toLowerCase();
    return archivedConversations.filter((c) =>
      `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(q)
    );
  }, [archivedConversations, searchQuery]);

  const filteredBlocked = useMemo(() => {
    if (!searchQuery) return blockedContacts;
    const q = searchQuery.toLowerCase();
    return blockedContacts.filter((b) =>
      `${b.blockedUser?.firstName || ''} ${b.blockedUser?.lastName || ''}`.toLowerCase().includes(q)
    );
  }, [blockedContacts, searchQuery]);

  // ─── Row Renderers ───────────────────────────────────────────
  const renderConversationRow = ({ item: conv }) => {
    const PreviewIcon = getPreviewIcon(conv.lastMessage?.type);
    const isUnread = conv.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.row, isUnread && styles.rowUnread]}
        activeOpacity={0.6}
        onPress={() => openChat(conv.user)}
        onLongPress={() => showChatOptions(conv)}
      >
        <View style={styles.avatarWrap}>
          <Avatar uri={conv.user.avatar} firstName={conv.user.firstName} lastName={conv.user.lastName} />
          {isUnread && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadDotText}>
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.rowTopLine}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, isUnread && styles.nameUnread]}
                numberOfLines={1}
              >
                {conv.user.firstName} {conv.user.lastName}
              </Text>
              {conv.user.isVerified && (
                <BadgeCheck size={12} color={C.blue500} strokeWidth={2.4} />
              )}
            </View>
            <Text style={styles.timeText}>{formatTimeAgo(conv.lastMessage?.createdAt)}</Text>
          </View>

          <View style={styles.previewRow}>
            {!!PreviewIcon && (
              <PreviewIcon
                size={12}
                color={isUnread ? C.emerald600 : C.slate400}
                strokeWidth={2.2}
              />
            )}
            <Text
              style={[styles.previewText, isUnread && styles.previewTextUnread]}
              numberOfLines={1}
            >
              {conv.lastMessage?.isFromMe ? 'You: ' : ''}
              {cleanPreview(conv.lastMessage?.preview)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => showChatOptions(conv)}
          style={{ paddingLeft: 6 }}
        >
          <MoreHorizontal size={16} color={C.slate300} strokeWidth={2} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderArchivedRow = ({ item: conv }) => {
    const isLoadingRow = actionLoadingId === conv.user.id;
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={() => openChat(conv.user)}>
        <Avatar uri={conv.user.avatar} firstName={conv.user.firstName} lastName={conv.user.lastName} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {conv.user.firstName} {conv.user.lastName}
          </Text>
          <Text style={styles.previewText} numberOfLines={1}>
            {cleanPreview(conv.lastMessage?.preview) || 'No messages'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.pillBtn}
          onPress={() => handleUnarchive(conv.user.id)}
          disabled={isLoadingRow}
        >
          {isLoadingRow ? (
            <ActivityIndicator size="small" color={C.emerald600} />
          ) : (
            <ArchiveRestore size={14} color={C.emerald700} strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderBlockedRow = ({ item: blocked }) => {
    const bu = blocked.blockedUser || {};
    const userId = bu.id || blocked.blockedId;
    const isLoadingRow = actionLoadingId === userId;

    return (
      <View style={styles.row}>
        <Avatar uri={bu.avatar} firstName={bu.firstName} lastName={bu.lastName} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {bu.firstName || 'Unknown'} {bu.lastName || 'User'}
          </Text>
          <Text style={styles.previewText}>
            {blocked.blockedAt ? `Blocked ${formatTimeAgo(blocked.blockedAt)}` : 'Blocked'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.pillBtn, styles.pillBtnOutline]}
          onPress={() => handleUnblock(userId)}
          disabled={isLoadingRow || !userId}
        >
          {isLoadingRow ? (
            <ActivityIndicator size="small" color={C.emerald600} />
          ) : (
            <Text style={styles.pillBtnOutlineText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Empty State ─────────────────────────────────────────────
  const renderEmpty = () => {
    if (isLoading) return null;

    const config = {
      active: {
        Icon: MessageSquare,
        title: searchQuery ? 'No conversations found' : 'No messages yet',
        subtitle: searchQuery ? 'Try a different search' : 'Start a conversation',
      },
      archived: {
        Icon: Archive,
        title: 'No archived conversations',
        subtitle: 'Your archived chats will appear here',
      },
      blocked: {
        Icon: Ban,
        title: 'No blocked contacts',
        subtitle: 'Blocked users will appear here',
      },
    }[activeTab];

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <config.Icon size={28} color={C.slate300} strokeWidth={1.7} />
        </View>
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
      </View>
    );
  };

  const dataForTab =
    activeTab === 'active'
      ? filteredConversations
      : activeTab === 'archived'
      ? filteredArchived
      : filteredBlocked;

  const renderItemForTab =
    activeTab === 'active'
      ? renderConversationRow
      : activeTab === 'archived'
      ? renderArchivedRow
      : renderBlockedRow;

  const keyExtractorForTab = (item) =>
    activeTab === 'blocked' ? String(item.id || item.blockedId) : item.user.id;

  // ─── Loading / Error ─────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Messages" />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.emerald600} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Messages" />
        <View style={styles.centerFill}>
          <View style={styles.errorIconCircle}>
            <AlertCircle size={28} color={C.red500} strokeWidth={2} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
            <RefreshCw size={13} color={C.white} strokeWidth={2.2} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Messages"
        rightIcon={
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SquarePen size={20} color={C.slate700} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={14} color={C.slate400} strokeWidth={2} />
        <TextInputComp
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={C.slate400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {!!searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={14} color={C.slate400} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const count =
            tab.key === 'active'
              ? conversations.length
              : tab.key === 'archived'
              ? archivedConversations.length
              : blockedContacts.length;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={dataForTab}
        renderItem={renderItemForTab}
        keyExtractor={keyExtractorForTab}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />
        }
        contentContainerStyle={dataForTab.length === 0 ? { flexGrow: 1 } : styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Error
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: C.red50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: { fontSize: 16, fontWeight: '800', color: C.slate900, marginBottom: 6 },
  errorSubtitle: {
    fontSize: 13,
    color: C.slate500,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.emerald600,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },
  retryBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.slate50,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: C.slate100,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.slate900 },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.slate50,
  },
  tabBtnActive: { backgroundColor: C.emerald50 },
  tabBtnText: { fontSize: 12.5, fontWeight: '700', color: C.slate500 },
  tabBtnTextActive: { color: C.emerald700 },
  tabCountBadge: {
    backgroundColor: C.slate200,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountBadgeActive: { backgroundColor: C.emerald600 },
  tabCountText: { fontSize: 10, fontWeight: '800', color: C.slate600 },
  tabCountTextActive: { color: C.white },

  // List
  listContent: { paddingBottom: 24 },
  separator: {
    height: 1,
    backgroundColor: C.slate100,
    marginLeft: 84,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowUnread: { backgroundColor: C.emerald50 },
  avatarWrap: { position: 'relative' },
  avatarImg: { backgroundColor: C.slate200 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: C.white, fontWeight: '800' },
  unreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.white,
  },
  unreadDotText: { color: C.white, fontSize: 9.5, fontWeight: '800' },

  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  name: { fontSize: 14.5, fontWeight: '600', color: C.slate700, flex: 1 },
  nameUnread: { fontWeight: '800', color: C.slate900 },
  timeText: { fontSize: 11, color: C.slate400 },

  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewText: { fontSize: 13, color: C.slate500, flex: 1 },
  previewTextUnread: { color: C.slate900, fontWeight: '600' },

  pillBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.emerald50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnOutline: {
    backgroundColor: C.emerald50,
    paddingHorizontal: 12,
    width: undefined,
    borderRadius: 10,
  },
  pillBtnOutlineText: { color: C.emerald700, fontWeight: '700', fontSize: 11.5 },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: C.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.slate900,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: C.slate400,
    textAlign: 'center',
  },

  // ═══════════════════════════════════════════════════════════
  // OFFER CARD STYLES (from web)
  // ═══════════════════════════════════════════════════════════
  offerCard: {
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 12,
    maxWidth: '85%',
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  offerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  offerType: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  offerAmount: { marginBottom: 10 },
  offerAmountLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  offerAmountValue: { fontSize: 24, fontWeight: '800' },
  offerGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  offerGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  offerGridLabel: { fontSize: 9, fontWeight: '700' },
  offerGridValue: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  offerDescription: { marginBottom: 12 },
  offerDescLabel: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  offerDescText: { fontSize: 12, lineHeight: 18 },
  offerDeliverables: { marginBottom: 12 },
  offerDelLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8 },
  delItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  delText: { fontSize: 11, flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: C.emerald500,
    borderRadius: 10,
  },
  acceptBtnText: { color: C.white, fontWeight: '700', fontSize: 12 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: C.slate100,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectBtnText: { color: C.slate600, fontWeight: '700', fontSize: 12 },
  offerWaitingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  offerWaitingText: { fontSize: 11, fontWeight: '700', flex: 1 },
  cancelOfferBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelOfferBtnText: { fontSize: 11, fontWeight: '700' },
  protectedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  protectedText: { fontSize: 11, fontWeight: '700' },

  // ═══════════════════════════════════════════════════════════
  // CALL HISTORY & MESSAGE STYLES
  // ═══════════════════════════════════════════════════════════
  callHistoryBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  callHistoryText: { fontSize: 12, fontWeight: '600', flex: 1 },
  callDurationText: { fontSize: 11, color: C.slate400, marginRight: 4 },
  callBackBtn: {
    padding: 6,
  },

  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  msgTime: { fontSize: 11 },
  msgDeleteBtn: {
    marginTop: 4,
    padding: 4,
  },

  msgImageFile: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 6,
  },
  msgFileNameText: { fontSize: 11, fontWeight: '600' },
  msgFileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  msgFileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgFileName: { fontSize: 12, fontWeight: '600', flex: 1 },
  downloadLink: { fontSize: 11, fontWeight: '700', marginTop: 3 },
});

export default MessagesScreen;