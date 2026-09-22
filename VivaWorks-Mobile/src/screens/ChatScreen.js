
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MoreHorizontal,
  Send,
  Paperclip,
  Video,
  Phone,
  HandCoins,
  Briefcase,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Calendar,
  RotateCcw,
  ListChecks,
  X,
  PhoneCall,
  FileText,
  Image as ImageIcon,
  Eye,
  ArrowRight,
  UserCheck,
  Banknote,
  Archive,
  Ban,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ════════════════════════════════════════════════════════════════
// COLORS
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
  gray100: '#f3f4f6',
};

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
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
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

const getInitials = (firstName, lastName) => {
  const f = firstName?.trim()?.[0] || '';
  const l = lastName?.trim()?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
};

const formatCallDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ════════════════════════════════════════════════════════════════
// AVATAR
// ════════════════════════════════════════════════════════════════
const Avatar = ({ uri, firstName, lastName, size = 40 }) => {
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
// OFFER CARD
// ════════════════════════════════════════════════════════════════
const OfferCard = ({ offer, isMe, sender, onAccept, onReject, onCancel }) => {
  if (!offer) return null;

  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';

  const statusConfig = {
    pending: {
      icon: Clock,
      text: 'Pending',
      bgColor: C.emerald500,
      textColor: C.white,
    },
    accepted: {
      icon: CheckCircle2,
      text: 'Accepted',
      bgColor: C.emerald500,
      textColor: C.white,
    },
    rejected: {
      icon: XCircle,
      text: 'Rejected',
      bgColor: C.red50,
      textColor: C.red500,
    },
  };

  const status = statusConfig[offer.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <View
      style={[
        styles.offerCard,
        {
          backgroundColor: isMe ? C.emerald500 : C.white,
          borderWidth: isMe ? 0 : 1,
          borderColor: isMe ? 'transparent' : C.slate200,
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          maxWidth: '90%',
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.offerHeader,
          { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : C.slate50 },
        ]}
      >
        <View
          style={[
            styles.offerIconWrap,
            { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.emerald100 },
          ]}
        >
          <Briefcase size={16} color={isMe ? C.white : C.emerald600} strokeWidth={2.2} />
        </View>
        <View>
          <Text style={[styles.offerLabel, { color: isMe ? C.emerald100 : C.emerald600 }]}>
            JOB OFFER
          </Text>
          <Text style={[styles.offerType, { color: isMe ? C.emerald200 : C.slate400 }]}>
            {offer.type?.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.offerAmount}>
        <Text style={[styles.offerAmountLabel, { color: isMe ? C.emerald200 : C.slate400 }]}>
          Amount
        </Text>
        <Text style={[styles.offerAmountValue, { color: isMe ? C.white : C.slate900 }]}>
          ₦{offer.amount?.toLocaleString?.() || '0'}
        </Text>
      </View>

      {/* Details Grid */}
      <View style={styles.offerGrid}>
        {offer.durationDays && (
          <View
            style={[
              styles.offerGridItem,
              { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.slate50 },
            ]}
          >
            <Calendar size={13} color={isMe ? C.emerald200 : C.slate400} strokeWidth={2} />
            <View>
              <Text style={[styles.offerGridLabel, { color: isMe ? C.emerald300 : C.slate400 }]}>
                Duration
              </Text>
              <Text style={[styles.offerGridValue, { color: isMe ? C.white : C.slate700 }]}>
                {offer.durationDays}d
              </Text>
            </View>
          </View>
        )}
        {offer.revisions !== undefined && (
          <View
            style={[
              styles.offerGridItem,
              { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.slate50 },
            ]}
          >
            <RotateCcw size={13} color={isMe ? C.emerald200 : C.slate400} strokeWidth={2} />
            <View>
              <Text style={[styles.offerGridLabel, { color: isMe ? C.emerald300 : C.slate400 }]}>
                Revisions
              </Text>
              <Text style={[styles.offerGridValue, { color: isMe ? C.white : C.slate700 }]}>
                {offer.revisions}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Description */}
      {offer.description && (
        <View style={styles.offerDescription}>
          <Text style={[styles.offerDescLabel, { color: isMe ? C.emerald200 : C.slate400 }]}>
            Description
          </Text>
          <Text style={[styles.offerDescText, { color: isMe ? C.emerald50 : C.slate600 }]}>
            {offer.description}
          </Text>
        </View>
      )}

      {/* Deliverables */}
      {offer.deliverables && offer.deliverables.length > 0 && offer.deliverables[0] !== '' && (
        <View style={styles.offerDeliverables}>
          <Text style={[styles.offerDelLabel, { color: isMe ? C.emerald200 : C.slate400 }]}>
            Deliverables
          </Text>
          {offer.deliverables.map((d, i) => (
            <View key={i} style={styles.delItem}>
              <ListChecks size={12} color={isMe ? C.emerald300 : C.emerald500} strokeWidth={2} />
              <Text style={[styles.delText, { color: isMe ? C.emerald100 : C.slate600 }]}>{d}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
        <StatusIcon size={12} color={status.textColor} strokeWidth={2.2} />
        <Text style={[styles.statusText, { color: status.textColor }]}>{status.text}</Text>
      </View>

      {/* Action Buttons */}
      {isPending && !isMe && (
        <View style={styles.offerActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept?.(offer.id)}>
            <CheckCircle2 size={13} color={C.white} strokeWidth={2} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject?.(offer.id)}>
            <XCircle size={13} color={C.slate600} strokeWidth={2} />
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPending && isMe && (
        <TouchableOpacity
          style={[styles.cancelOfferBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.slate100 }]}
          onPress={() => onCancel?.(offer.id)}
        >
          <Text style={[styles.cancelOfferBtnText, { color: isMe ? C.white : C.slate600 }]}>
            Cancel Offer
          </Text>
        </TouchableOpacity>
      )}

      {isAccepted && (
        <View
          style={[
            styles.protectedWrap,
            { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : C.emerald50 },
          ]}
        >
          <Shield size={13} color={isMe ? C.white : C.emerald500} strokeWidth={2} />
          <Text style={[styles.protectedText, { color: isMe ? C.white : C.emerald600 }]}>
            Payment secured
          </Text>
        </View>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// CALL HISTORY BUBBLE
// ════════════════════════════════════════════════════════════════
const CallHistoryBubble = ({ msg, onCallBack }) => {
  const direction = msg.callDirection || 'outgoing';
  const isMissed = direction === 'missed';
  const duration = msg.callDuration || 0;

  return (
    <View
      style={[
        styles.callHistoryBubble,
        {
          backgroundColor: isMissed ? C.red50 : C.slate50,
          borderColor: isMissed ? C.red100 : C.slate200,
        },
      ]}
    >
      <PhoneCall size={13} color={isMissed ? C.red500 : C.emerald500} strokeWidth={2} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.callHistoryText, { color: isMissed ? C.red600 : C.slate600 }]}>
          {isMissed ? 'Missed' : 'Call'} {msg.callType === 'video' ? 'video' : 'voice'} call
        </Text>
      </View>
      {duration > 0 && (
        <Text style={styles.callDurationText}>{formatCallDuration(duration)}</Text>
      )}
      <TouchableOpacity onPress={() => onCallBack?.(msg.callType)} style={styles.callBackBtn}>
        <PhoneCall size={13} color={C.emerald500} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// TEXT MESSAGE BUBBLE
// ════════════════════════════════════════════════════════════════
const MessageBubble = ({ msg, isMe, onDelete }) => {
  const isFile = msg.fileUrl || msg.fileType;
  const isImage = msg.fileType?.startsWith('image/');

  return (
    <View
      style={{
        marginVertical: 4,
        marginHorizontal: 12,
        alignItems: isMe ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isMe ? C.emerald500 : C.white,
            borderWidth: isMe ? 0 : 1,
            borderColor: isMe ? 'transparent' : C.slate200,
            borderTopLeftRadius: isMe ? 12 : 3,
            borderTopRightRadius: isMe ? 3 : 12,
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
                <TouchableOpacity onPress={() => msg.fileUrl && alert('Downloading...')}>
                  <Text style={[styles.downloadLink, { color: isMe ? C.emerald200 : C.emerald600 }]}>
                    Download
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <Text style={[styles.msgText, { color: isMe ? C.white : C.slate800 }]}>
            {msg.content}
          </Text>
        )}
      </View>

      <View style={[styles.msgMeta, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.msgTime, { color: isMe ? C.emerald600 : C.slate400 }]}>
          {formatTime(msg.createdAt)}
        </Text>
        {isMe && (
          <View style={{ marginLeft: 4 }}>
            <Check size={10} color={msg.isRead ? C.emerald500 : C.emerald300} strokeWidth={3} />
          </View>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(msg.id)} style={styles.msgDeleteBtn}>
          <X size={12} color={C.red500} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// CHAT SCREEN
// ════════════════════════════════════════════════════════════════
const ChatScreen = ({ route, navigation }) => {
  const { user: currentUser } = useAuth();
  const { userId, user: otherUser } = route.params;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  const [offerData, setOfferData] = useState({
    amount: '',
    title: '',
    description: '',
    durationDays: '7',
    revisions: '3',
    deliverables: [''],
  });

  const flatListRef = useRef(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/messages/conversation/${userId}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText('');

    try {
      setIsSending(true);
      const response = await api.post('/messages', {
        receiverId: userId,
        content: content,
      });
      setMessages((prev) => [...prev, response.data.data]);
      scrollToBottom();
    } catch (err) {
      console.error('Send error:', err);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(content);
    } finally {
      setIsSending(false);
    }
  };

  // Send offer
  const sendOffer = async () => {
    if (!offerData.amount || !offerData.title) {
      Alert.alert('Error', 'Fill in amount and title');
      return;
    }

    try {
      setIsSending(true);
      const deliverables = offerData.deliverables.filter((d) => d.trim() !== '');
      const response = await api.post('/messages/offers', {
        receiverId: userId,
        amount: parseFloat(offerData.amount),
        title: offerData.title,
        description: offerData.description,
        type: 'direct_hire',
        durationDays: parseInt(offerData.durationDays) || 7,
        revisions: parseInt(offerData.revisions) || 3,
        deliverables: deliverables,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: response.data.offer.messageId,
          content: 'JOB OFFER',
          senderId: currentUser.id,
          createdAt: new Date().toISOString(),
          isRead: false,
          offer: response.data.offer,
          sender: {
            id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatar: currentUser.avatar,
          },
        },
      ]);

      setShowOfferModal(false);
      setOfferData({
        amount: '',
        title: '',
        description: '',
        durationDays: '7',
        revisions: '3',
        deliverables: [''],
      });
      scrollToBottom();
    } catch (err) {
      console.error('Send offer error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send offer');
    } finally {
      setIsSending(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    Alert.alert('Delete', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  // Accept offer
  const acceptOffer = async (offerId) => {
    try {
      setIsSending(true);
      await api.patch(`/messages/offers/${offerId}/accept`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.offer?.id === offerId
            ? { ...msg, offer: { ...msg.offer, status: 'accepted' } }
            : msg
        )
      );
      Alert.alert('Success', 'Offer accepted!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept offer');
    } finally {
      setIsSending(false);
    }
  };

  // Reject offer
  const rejectOffer = async (offerId) => {
    try {
      setIsSending(true);
      await api.patch(`/messages/offers/${offerId}/reject`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.offer?.id === offerId
            ? { ...msg, offer: { ...msg.offer, status: 'rejected' } }
            : msg
        )
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to reject offer');
    } finally {
      setIsSending(false);
    }
  };

  const handleChatMenu = () => {
    Alert.alert(
      `${otherUser.firstName} ${otherUser.lastName}`,
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive Chat',
          onPress: async () => {
            try {
              await api.post(`/messages/archive/${userId}`);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to archive');
            }
          },
        },
        {
          text: 'Block Contact',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Block',
              `Block ${otherUser.firstName}? They won't be able to message you.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Block',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.post(`/messages/block/${userId}`);
                      navigation.goBack();
                    } catch (err) {
                      Alert.alert('Error', 'Failed to block');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.emerald600} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <ChevronLeft size={24} color={C.slate700} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerName}>
            {otherUser.firstName} {otherUser.lastName}
          </Text>
          <Text style={styles.headerStatus}>Active now</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Phone size={18} color={C.emerald600} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Video size={18} color={C.emerald600} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={handleChatMenu}>
            <MoreHorizontal size={18} color={C.slate400} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item: msg }) => {
          const isMe = msg.senderId === currentUser?.id;
          const isOffer = !!msg.offer;
          const isCallHistory = msg.isCallHistory;

          return (
            <View key={msg.id}>
              {isCallHistory ? (
                <CallHistoryBubble msg={msg} />
              ) : isOffer ? (
                <OfferCard
                  offer={msg.offer}
                  isMe={isMe}
                  sender={msg.sender}
                  onAccept={acceptOffer}
                  onReject={rejectOffer}
                />
              ) : (
                <MessageBubble msg={msg} isMe={isMe} onDelete={deleteMessage} />
              )}
            </View>
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => scrollToBottom()}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputWrap}>
          <TouchableOpacity style={styles.attachBtn}>
            <Paperclip size={18} color={C.emerald600} strokeWidth={2.2} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={`Message ${otherUser.firstName}...`}
            placeholderTextColor={C.slate400}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxHeight={100}
          />

          <TouchableOpacity
            style={styles.offerBtn}
            onPress={() => setShowOfferModal(true)}
          >
            <HandCoins size={18} color={C.emerald600} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <Send size={16} color={C.white} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Offer Modal */}
      <Modal visible={showOfferModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Offer</Text>
            <TouchableOpacity onPress={() => setShowOfferModal(false)}>
              <X size={24} color={C.slate700} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount (₦)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="50,000"
                keyboardType="decimal-pad"
                value={offerData.amount}
                onChangeText={(v) => setOfferData({ ...offerData, amount: v })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Mobile App Development"
                value={offerData.title}
                onChangeText={(v) => setOfferData({ ...offerData, title: v })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 80 }]}
                placeholder="Describe the work..."
                multiline
                value={offerData.description}
                onChangeText={(v) => setOfferData({ ...offerData, description: v })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Duration (days)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="number-pad"
                  value={offerData.durationDays}
                  onChangeText={(v) => setOfferData({ ...offerData, durationDays: v })}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.formLabel}>Revisions</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="number-pad"
                  value={offerData.revisions}
                  onChangeText={(v) => setOfferData({ ...offerData, revisions: v })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={sendOffer}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <>
                  <HandCoins size={16} color={C.white} strokeWidth={2.2} />
                  <Text style={styles.submitBtnText}>Send Offer</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  headerBackBtn: { padding: 8, marginLeft: -8 },
  headerContent: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: C.slate900 },
  headerStatus: { fontSize: 11, color: C.emerald600, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.slate50,
  },

  // Messages
  messagesList: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 12 },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.slate100,
    backgroundColor: C.white,
  },
  attachBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  input: {
    flex: 1,
    backgroundColor: C.slate50,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.slate900,
    maxHeight: 100,
  },
  offerBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.slate200 },

  // Offer Card
  offerCard: {
    borderRadius: 14,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    marginBottom: 10,
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
  offerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  offerType: { fontSize: 8, fontWeight: '600', marginTop: 2 },
  offerAmount: { marginBottom: 10 },
  offerAmountLabel: { fontSize: 9, fontWeight: '700', marginBottom: 3 },
  offerAmountValue: { fontSize: 22, fontWeight: '800' },
  offerGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  offerGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  offerGridLabel: { fontSize: 8, fontWeight: '700' },
  offerGridValue: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  offerDescription: { marginBottom: 10 },
  offerDescLabel: { fontSize: 9, fontWeight: '700', marginBottom: 4 },
  offerDescText: { fontSize: 11, lineHeight: 16 },
  offerDeliverables: { marginBottom: 10 },
  offerDelLabel: { fontSize: 9, fontWeight: '700', marginBottom: 6 },
  delItem: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  delText: { fontSize: 10, flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  offerActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    backgroundColor: C.emerald500,
    borderRadius: 8,
  },
  acceptBtnText: { color: C.white, fontWeight: '700', fontSize: 11 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: C.slate100,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBtnText: { color: C.slate600, fontWeight: '700', fontSize: 11 },
  cancelOfferBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelOfferBtnText: { fontWeight: '700', fontSize: 11 },
  protectedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  protectedText: { fontSize: 10, fontWeight: '700' },

  // Call History
  callHistoryBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  callHistoryText: { fontSize: 11, fontWeight: '600', flex: 1 },
  callDurationText: { fontSize: 10, color: C.slate400, marginRight: 4 },
  callBackBtn: { padding: 4 },

  // Message Bubble
  messageBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  msgTime: { fontSize: 10 },
  msgDeleteBtn: { marginTop: 3, padding: 4 },
  msgImageFile: { width: '100%', height: 160, borderRadius: 8, marginBottom: 6 },
  msgFileNameText: { fontSize: 10, fontWeight: '600' },
  msgFileWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgFileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgFileName: { fontSize: 11, fontWeight: '600', flex: 1 },
  downloadLink: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  avatarImg: { backgroundColor: C.slate200 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: C.white, fontWeight: '800' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: C.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.slate900 },
  modalContent: { padding: 16, flex: 1 },
  formGroup: { marginBottom: 14 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '700', color: C.slate700, marginBottom: 6 },
  formInput: {
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.slate900,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.emerald500,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  submitBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
});

export default ChatScreen;