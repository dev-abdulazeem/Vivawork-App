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
  X,
  PhoneCall,
  FileText,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ════════════════════════════════════════════════════════════════
// COLORS (Unchanged)
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

const formatCallDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        { borderColor: isMissed ? C.red100 : C.slate200, backgroundColor: isMissed ? C.red50 : C.slate50 },
      ]}
    >
      <View style={[styles.callIconWrap, { backgroundColor: isMissed ? C.red100 : C.emerald100 }]}>
        <PhoneCall size={16} color={isMissed ? C.red600 : C.emerald600} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.callHistoryText, { color: isMissed ? C.red600 : C.slate700 }]}>
          {isMissed ? 'Missed Call' : 'Call Ended'}
        </Text>
        <Text style={styles.callHistorySubtext}>
          {msg.callType === 'video' ? 'Video' : 'Voice'} call {duration > 0 ? `• ${formatCallDuration(duration)}` : ''}
        </Text>
      </View>
      {duration > 0 || !isMissed ? (
        <TouchableOpacity onPress={() => onCallBack?.(msg.callType)} style={styles.callBackBtn}>
          <PhoneCall size={16} color={C.emerald600} strokeWidth={2} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// OFFER CARD
// ════════════════════════════════════════════════════════════════
const OfferCard = ({ offer, isMe, onAccept, onReject, onCancel }) => {
  if (!offer) return null;

  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';

  const statusConfig = {
    pending: { icon: Clock, text: 'Pending Review', bgColor: C.slate100, textColor: C.slate600, iconColor: C.slate500 },
    accepted: { icon: CheckCircle2, text: 'Offer Accepted', bgColor: C.emerald50, textColor: C.emerald700, iconColor: C.emerald600 },
    rejected: { icon: XCircle, text: 'Offer Declined', bgColor: C.red50, textColor: C.red600, iconColor: C.red500 },
  };

  const status = statusConfig[offer.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const cardBg = isMe ? C.emerald50 : C.white;
  const cardBorder = isMe ? C.emerald100 : C.slate200;
  const iconBg = isMe ? C.emerald100 : C.slate100;
  const iconColor = isMe ? C.emerald600 : C.slate600;

  return (
    <View style={[styles.offerCard, { backgroundColor: cardBg, borderColor: cardBorder, alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
      <View style={styles.offerHeader}>
        <View style={[styles.offerIconWrap, { backgroundColor: iconBg }]}>
          <Briefcase size={18} color={iconColor} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.offerLabel, { color: C.slate500 }]}>
            {offer.type?.replace(/_/g, ' ').toUpperCase() || 'JOB OFFER'}
          </Text>
          <Text style={[styles.offerTitle, { color: C.slate900 }]}>
            {offer.title || 'Custom Offer'}
          </Text>
        </View>
      </View>

      <View style={styles.offerAmountWrap}>
        <Text style={[styles.offerAmountLabel, { color: C.slate400 }]}>Total Amount</Text>
        <Text style={[styles.offerAmountValue, { color: C.slate900 }]}>
          ₦{offer.amount?.toLocaleString?.() || '0'}
        </Text>
      </View>

      <View style={styles.offerGrid}>
        {offer.durationDays && (
          <View style={[styles.offerGridItem, { backgroundColor: isMe ? C.white : C.slate50 }]}>
            <Calendar size={14} color={C.slate400} strokeWidth={2} />
            <View>
              <Text style={styles.offerGridLabel}>Duration</Text>
              <Text style={styles.offerGridValue}>{offer.durationDays} Days</Text>
            </View>
          </View>
        )}
        {offer.revisions !== undefined && (
          <View style={[styles.offerGridItem, { backgroundColor: isMe ? C.white : C.slate50 }]}>
            <RotateCcw size={14} color={C.slate400} strokeWidth={2} />
            <View>
              <Text style={styles.offerGridLabel}>Revisions</Text>
              <Text style={styles.offerGridValue}>{offer.revisions} Included</Text>
            </View>
          </View>
        )}
      </View>

      {offer.description ? (
        <View style={styles.offerSection}>
          <Text style={styles.offerSectionTitle}>Description</Text>
          <Text style={styles.offerSectionText}>{offer.description}</Text>
        </View>
      ) : null}

      {offer.deliverables && offer.deliverables.length > 0 && offer.deliverables[0] !== '' ? (
        <View style={styles.offerSection}>
          <Text style={styles.offerSectionTitle}>Deliverables</Text>
          {offer.deliverables.map((d, i) => (
            <View key={i} style={styles.delItem}>
              <Check size={14} color={C.emerald500} strokeWidth={2.5} />
              <Text style={styles.delText}>{d}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
        <StatusIcon size={14} color={status.iconColor} strokeWidth={2} />
        <Text style={[styles.statusText, { color: status.textColor }]}>{status.text}</Text>
      </View>

      {isPending && !isMe && (
        <View style={styles.offerActions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject?.(offer.id)}>
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept?.(offer.id)}>
            <Check size={16} color={C.white} strokeWidth={2.5} />
            <Text style={styles.acceptBtnText}>Accept Offer</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPending && isMe && (
        <TouchableOpacity style={styles.cancelOfferBtn} onPress={() => onCancel?.(offer.id)}>
          <X size={14} color={C.red500} strokeWidth={2} />
          <Text style={styles.cancelOfferBtnText}>Cancel Offer</Text>
        </TouchableOpacity>
      )}

      {isAccepted && (
        <View style={[styles.protectedWrap, { backgroundColor: C.emerald50 }]}>
          <Shield size={14} color={C.emerald600} strokeWidth={2} />
          <Text style={[styles.protectedText, { color: C.emerald700 }]}>
            Payment secured in escrow
          </Text>
        </View>
      )}
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
    <View style={[styles.messageContainer, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isMe ? C.emerald500 : C.white,
            borderColor: isMe ? 'transparent' : C.slate200,
            borderTopLeftRadius: isMe ? 16 : 4,
            borderTopRightRadius: isMe ? 4 : 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
        ]}
      >
        {isFile ? (
          isImage ? (
            <View>
              <Image source={{ uri: msg.fileUrl }} style={styles.msgImageFile} />
              {msg.fileName && (
                <Text style={[styles.msgFileNameText, { color: isMe ? C.emerald100 : C.slate600 }]}>
                  {msg.fileName}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.msgFileWrap}>
              <View style={[styles.msgFileIconWrap, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.slate100 }]}>
                <FileText size={18} color={isMe ? C.white : C.slate600} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.msgFileName, { color: isMe ? C.white : C.slate800 }]} numberOfLines={1}>
                  {msg.fileName}
                </Text>
                <TouchableOpacity onPress={() => msg.fileUrl && Alert.alert('Download', 'Downloading file...')}>
                  <Text style={[styles.downloadLink, { color: isMe ? C.emerald100 : C.emerald600 }]}>
                    Download File
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
        <Text style={[styles.msgTime, { color: isMe ? C.emerald200 : C.slate400 }]}>
          {formatTime(msg.createdAt)}
        </Text>
        {isMe && (
          <View style={styles.msgReadReceipt}>
            <Check size={12} color={msg.isRead ? C.white : C.emerald200} strokeWidth={3} />
          </View>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(msg.id)} style={styles.msgDeleteBtn}>
          <X size={14} color={C.slate400} strokeWidth={2} />
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
  const [newDeliverable, setNewDeliverable] = useState('');
  
  const [offerData, setOfferData] = useState({
    amount: '',
    title: '',
    description: '',
    durationDays: '7',
    revisions: '3',
    deliverables: [],
  });

  const flatListRef = useRef(null);

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

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    const content = messageText.trim();
    setMessageText('');

    try {
      setIsSending(true);
      const response = await api.post('/messages', { receiverId: userId, content });
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

  const sendOffer = async () => {
    if (!offerData.amount || !offerData.title) {
      Alert.alert('Error', 'Please fill in the amount and title');
      return;
    }

    try {
      setIsSending(true);
      const response = await api.post('/messages/offers', {
        receiverId: userId,
        amount: parseFloat(offerData.amount),
        title: offerData.title,
        description: offerData.description,
        type: 'direct_hire',
        durationDays: parseInt(offerData.durationDays) || 7,
        revisions: parseInt(offerData.revisions) || 3,
        deliverables: offerData.deliverables,
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
        },
      ]);

      setShowOfferModal(false);
      setOfferData({ amount: '', title: '', description: '', durationDays: '7', revisions: '3', deliverables: [] });
      setNewDeliverable('');
      scrollToBottom();
    } catch (err) {
      console.error('Send offer error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send offer');
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
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

  const acceptOffer = async (offerId) => {
    try {
      setIsSending(true);
      await api.patch(`/messages/offers/${offerId}/accept`);
      setMessages((prev) =>
        prev.map((msg) => (msg.offer?.id === offerId ? { ...msg, offer: { ...msg.offer, status: 'accepted' } } : msg))
      );
      Alert.alert('Success', 'Offer accepted successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept offer');
    } finally {
      setIsSending(false);
    }
  };

  const rejectOffer = async (offerId) => {
    try {
      setIsSending(true);
      await api.patch(`/messages/offers/${offerId}/reject`);
      setMessages((prev) =>
        prev.map((msg) => (msg.offer?.id === offerId ? { ...msg, offer: { ...msg.offer, status: 'rejected' } } : msg))
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
            Alert.alert('Block Contact', `Block ${otherUser.firstName}? They won't be able to message you.`, [
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
            ]);
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
            <MoreHorizontal size={18} color={C.slate500} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

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
                  onAccept={acceptOffer}
                  onReject={rejectOffer}
                  onCancel={deleteMessage}
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ backgroundColor: C.white }}>
        <View style={styles.inputWrap}>
          <TouchableOpacity style={styles.iconBtn}>
            <Paperclip size={20} color={C.slate500} strokeWidth={2} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={`Message ${otherUser.firstName}...`}
            placeholderTextColor={C.slate400}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowOfferModal(true)}>
            <HandCoins size={20} color={C.emerald600} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <Send size={18} color={C.white} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Compact, Keyboard-Aware Offer Modal */}
      <Modal visible={showOfferModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Offer</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)} style={styles.modalCloseBtn}>
                <X size={22} color={C.slate700} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Offer Amount (₦)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 50000"
                  keyboardType="decimal-pad"
                  value={offerData.amount}
                  onChangeText={(v) => setOfferData({ ...offerData, amount: v })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Job Title</Text>
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
                  style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Describe the scope of work..."
                  multiline
                  value={offerData.description}
                  onChangeText={(v) => setOfferData({ ...offerData, description: v })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Duration (Days)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="number-pad"
                    placeholder="7"
                    value={offerData.durationDays}
                    onChangeText={(v) => setOfferData({ ...offerData, durationDays: v })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Revisions</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="number-pad"
                    placeholder="3"
                    value={offerData.revisions}
                    onChangeText={(v) => setOfferData({ ...offerData, revisions: v })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deliverables</Text>
                <View style={styles.deliverableInputRow}>
                  <TextInput
                    style={styles.deliverableInput}
                    placeholder="e.g. Source code"
                    value={newDeliverable}
                    onChangeText={setNewDeliverable}
                    onSubmitEditing={() => {
                      if (newDeliverable.trim()) {
                        setOfferData({ ...offerData, deliverables: [...offerData.deliverables, newDeliverable.trim()] });
                        setNewDeliverable('');
                      }
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.addDeliverableBtn}
                    onPress={() => {
                      if (newDeliverable.trim()) {
                        setOfferData({ ...offerData, deliverables: [...offerData.deliverables, newDeliverable.trim()] });
                        setNewDeliverable('');
                      }
                    }}
                  >
                    <Text style={styles.addDeliverableText}>Add</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.deliverablesList}>
                  {offerData.deliverables.map((d, i) => (
                    <View key={i} style={styles.deliverableChip}>
                      <Text style={styles.deliverableChipText} numberOfLines={1}>{d}</Text>
                      <TouchableOpacity 
                        onPress={() => {
                          const newDels = offerData.deliverables.filter((_, idx) => idx !== i);
                          setOfferData({ ...offerData, deliverables: newDels });
                        }}
                        style={styles.chipRemoveBtn}
                      >
                        <X size={14} color={C.red500} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSending && styles.submitBtnDisabled]}
                onPress={sendOffer}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <>
                    <Send size={18} color={C.white} strokeWidth={2.5} />
                    <Text style={styles.submitBtnText}>Send Offer</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.white,
  },
  headerBackBtn: { padding: 8, marginRight: 8 },
  headerContent: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: C.slate900, letterSpacing: 0.2 },
  headerStatus: { fontSize: 12, color: C.emerald600, marginTop: 2, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.slate50,
  },

  messagesList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  messageContainer: { marginVertical: 6, maxWidth: '85%' },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 4 },
  msgTime: { fontSize: 11, fontWeight: '500' },
  msgReadReceipt: { marginLeft: 2 },
  msgDeleteBtn: { marginTop: 4, padding: 4, alignSelf: 'flex-end' },

  msgImageFile: { width: 200, height: 200, borderRadius: 12, marginBottom: 8 },
  msgFileNameText: { fontSize: 12, fontWeight: '600' },
  msgFileWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 180 },
  msgFileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgFileName: { fontSize: 13, fontWeight: '600', flex: 1 },
  downloadLink: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.slate100,
    backgroundColor: C.white,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.slate50,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: C.slate50,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: C.slate900,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: C.slate200 },

  offerCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  offerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  offerTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  offerAmountWrap: { marginBottom: 16 },
  offerAmountLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  offerAmountValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  offerGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  offerGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  offerGridLabel: { fontSize: 11, fontWeight: '600', color: C.slate500 },
  offerGridValue: { fontSize: 13, fontWeight: '700', color: C.slate800, marginTop: 2 },
  offerSection: { marginBottom: 12 },
  offerSectionTitle: { fontSize: 12, fontWeight: '700', color: C.slate500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  offerSectionText: { fontSize: 14, lineHeight: 20, color: C.slate700 },
  delItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  delText: { fontSize: 13, color: C.slate700, flex: 1, lineHeight: 18 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  offerActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  acceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: C.emerald500,
    borderRadius: 12,
  },
  acceptBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.slate200,
  },
  rejectBtnText: { color: C.slate600, fontWeight: '700', fontSize: 14 },
  cancelOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: C.red50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.red100,
  },
  cancelOfferBtnText: { color: C.red600, fontWeight: '700', fontSize: 13 },
  protectedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  protectedText: { fontSize: 12, fontWeight: '700' },

  callHistoryBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  callIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callHistoryText: { fontSize: 13, fontWeight: '700' },
  callHistorySubtext: { fontSize: 12, color: C.slate500, marginTop: 2 },
  callBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.emerald50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles (Optimized for height and closeability)
  modalContainer: { 
    flex: 1, 
    backgroundColor: C.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.white,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.slate900 },
  modalCloseBtn: { 
    padding: 8, 
    backgroundColor: C.slate100,
    borderRadius: 20,
  },
  modalContent: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 20,
  },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  formLabel: { fontSize: 13, fontWeight: '700', color: C.slate700, marginBottom: 8, letterSpacing: 0.2 },
  formInput: {
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.slate900,
    height: 44,
  },
  
  // Compact Deliverables
  deliverableInputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  deliverableInput: {
    flex: 1,
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.slate900,
    height: 44,
  },
  addDeliverableBtn: {
    backgroundColor: C.emerald50,
    borderWidth: 1,
    borderColor: C.emerald200,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  addDeliverableText: { color: C.emerald700, fontWeight: '700', fontSize: 13 },
  deliverablesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deliverableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.slate100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  deliverableChipText: { fontSize: 12, fontWeight: '600', color: C.slate700, maxWidth: 200 },
  chipRemoveBtn: { padding: 2 },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.emerald600,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: C.emerald600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: C.slate300, shadowOpacity: 0 },
  submitBtnText: { color: C.white, fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});

export default ChatScreen;