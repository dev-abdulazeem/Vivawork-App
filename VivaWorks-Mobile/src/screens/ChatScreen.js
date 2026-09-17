// src/screens/ChatScreen.js

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  File as FileIcon,
  Download,
  Check,
  CheckCheck,
  Briefcase,
  DollarSign,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ────────────────────────────────────────────────────────────────
// COLORS — same emerald/slate system used across the app
// ────────────────────────────────────────────────────────────────
const C = {
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  amber600: '#d97706',
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
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────
const getInitials = (firstName, lastName) => {
  const f = firstName?.trim()?.[0] || '';
  const l = lastName?.trim()?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (dateKey) => {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Groups an ascending array of messages into [{ dateKey, data: [...] }]
const groupByDate = (msgs) => {
  const groups = {};
  msgs.forEach((m) => {
    const key = new Date(m.createdAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups).map(([dateKey, data]) => ({ dateKey, data }));
};

// ────────────────────────────────────────────────────────────────
// AVATAR
// ────────────────────────────────────────────────────────────────
const Avatar = ({ uri, firstName, lastName, size = 36 }) => {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[styles.avatarImg, dim]} />;
  return (
    <View style={[styles.avatarFallback, dim]}>
      <Text style={[styles.avatarFallbackText, { fontSize: size * 0.38 }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// OFFER CARD (job offer sent inside a chat)
// ────────────────────────────────────────────────────────────────
const OfferCard = ({ offer, isMe, onAccept, onReject, processing }) => {
  if (!offer) return null;

  const statusStyles = {
    pending: { bg: C.amber600, label: 'Awaiting response' },
    accepted: { bg: C.emerald600, label: 'Accepted' },
    rejected: { bg: C.slate400, label: 'Declined' },
    cancelled: { bg: C.slate400, label: 'Cancelled' },
  };
  const status = statusStyles[offer.status] || statusStyles.pending;

  return (
    <View style={[styles.offerCard, isMe ? styles.offerCardMine : styles.offerCardTheirs]}>
      <View style={styles.offerHeaderRow}>
        <View style={[styles.offerIconCircle, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.emerald50 }]}>
          <Briefcase size={16} color={isMe ? C.white : C.emerald600} strokeWidth={2.2} />
        </View>
        <Text style={[styles.offerLabel, { color: isMe ? C.white : C.emerald700 }]}>JOB OFFER</Text>
      </View>

      <Text style={[styles.offerAmount, { color: isMe ? C.white : C.slate900 }]}>
        ₦{Number(offer.amount || 0).toLocaleString()}
      </Text>

      {!!offer.description && (
        <Text style={[styles.offerDesc, { color: isMe ? 'rgba(255,255,255,0.9)' : C.slate600 }]} numberOfLines={4}>
          {offer.description}
        </Text>
      )}

      <View style={styles.offerMetaRow}>
        {!!offer.durationDays && (
          <View style={styles.offerMetaPill}>
            <Clock size={11} color={isMe ? C.white : C.slate500} strokeWidth={2.2} />
            <Text style={[styles.offerMetaText, { color: isMe ? C.white : C.slate500 }]}>{offer.durationDays}d</Text>
          </View>
        )}
        {offer.revisions !== undefined && offer.revisions !== null && (
          <View style={styles.offerMetaPill}>
            <RotateCcw size={11} color={isMe ? C.white : C.slate500} strokeWidth={2.2} />
            <Text style={[styles.offerMetaText, { color: isMe ? C.white : C.slate500 }]}>{offer.revisions} rev</Text>
          </View>
        )}
      </View>

      <View style={[styles.offerStatusBadge, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : C.slate50 }]}>
        <Text style={[styles.offerStatusText, { color: isMe ? C.white : C.slate600 }]}>{status.label}</Text>
      </View>

      {offer.status === 'pending' && !isMe && (
        <View style={styles.offerActionRow}>
          <TouchableOpacity
            style={[styles.offerActionBtn, styles.offerActionBtnAccept]}
            onPress={onAccept}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <CheckCircle2 size={14} color={C.white} strokeWidth={2.2} />
                <Text style={styles.offerActionBtnAcceptText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.offerActionBtn, styles.offerActionBtnReject]}
            onPress={onReject}
            disabled={processing}
          >
            <XCircle size={14} color={C.slate500} strokeWidth={2.2} />
            <Text style={styles.offerActionBtnRejectText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ────────────────────────────────────────────────────────────────
const ChatScreen = ({ route, navigation }) => {
  const { userId, user: userParam } = route.params || {};
  const { user: me } = useAuth();

  const [otherUser, setOtherUser] = useState(userParam || null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [offerActionId, setOfferActionId] = useState(null);

  const flatListRef = useRef(null);

  const fetchOtherUser = useCallback(async () => {
    if (userParam) return;
    try {
      const res = await api.get(`/users/profile/${userId}`);
      setOtherUser(res.data.user);
    } catch (err) {
      console.error('Fetch user error:', err);
    }
  }, [userId, userParam]);

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/messages/conversation/${userId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
      if (err.response?.data?.code === 'BLOCKED') {
        Alert.alert('Unavailable', 'This conversation is unavailable.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setError(err.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigation]);

  useEffect(() => {
    if (!userId) return;
    fetchOtherUser();
    fetchMessages();
    api.patch(`/messages/read/${userId}`).catch(() => {});
    // TODO: wire up socket.io-client here for real-time message delivery,
    // typing indicators, and read receipts (see web's Messages.jsx for reference).
  }, [userId, fetchOtherUser, fetchMessages]);

  const scrollToBottom = () => {
    // list is inverted, so "bottom" of the chat is index 0
    requestAnimationFrame(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }));
  };

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || isSending || !userId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content,
      senderId: me?.id,
      receiverId: userId,
      type: 'text',
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: { id: me?.id, firstName: me?.firstName, lastName: me?.lastName, avatar: me?.avatar },
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    scrollToBottom();

    try {
      setIsSending(true);
      const res = await api.post('/messages', { receiverId: userId, content });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data.data : m)));
    } catch (err) {
      console.error('Send message error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Error', err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttach = () => {
    // TODO: hook up an image/document picker (e.g. expo-image-picker or
    // react-native-document-picker — whichever this project uses) to grab a
    // file, then POST it as multipart/form-data to `/messages/upload` with
    // fields `file` and `receiverId`, matching the web app's upload flow.
    Alert.alert('Attachments', 'File attachments need a picker library wired up here — let me know which one your project uses and I\'ll finish this.');
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert('Delete message', 'Are you sure you want to delete this message?', [
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

  const handleAcceptOffer = async (offerId) => {
    try {
      setOfferActionId(offerId);
      const res = await api.patch(`/messages/offers/${offerId}/accept`);
      setMessages((prev) =>
        prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'accepted' } } : m))
      );
      if (res.data.contract?.id) {
        navigation.navigate('ContractDetail', { contractId: res.data.contract.id });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept offer';
      if (err.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        Alert.alert('Insufficient balance', `${msg} (Need ₦${err.response.data.required?.toLocaleString()}, have ₦${err.response.data.current?.toLocaleString()})`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setOfferActionId(null);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      setOfferActionId(offerId);
      await api.patch(`/messages/offers/${offerId}/reject`);
      setMessages((prev) =>
        prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'rejected' } } : m))
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject offer');
    } finally {
      setOfferActionId(null);
    }
  };

  const showMenu = () => {
    Alert.alert(
      otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Options',
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
              Alert.alert('Error', 'Failed to archive conversation');
            }
          },
        },
        {
          text: 'Block Contact',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Block contact',
              `Block ${otherUser?.firstName || 'this user'}? They won't be able to message or call you.`,
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
                      Alert.alert('Error', 'Failed to block contact');
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

  const notImplementedCall = (type) => {
    Alert.alert(
      `${type === 'video' ? 'Video' : 'Voice'} call`,
      'Calling requires a WebRTC integration that hasn\'t been wired into this screen yet — let me know if you\'d like that built out.'
    );
  };

  // Grouped, ascending-by-date sections, then reversed for the inverted FlatList
  const groupedSections = useMemo(() => {
    const groups = groupByDate(messages);
    // Build a flat, inverted-friendly list: [...lastGroupMessagesReversed, lastGroupDateLabel, ...]
    const flat = [];
    groups.forEach(({ dateKey, data }) => {
      flat.push({ _type: 'date', id: `date-${dateKey}`, label: formatDateLabel(dateKey) });
      data.forEach((m) => flat.push({ _type: 'message', ...m }));
    });
    return flat.reverse();
  }, [messages]);

  const renderItem = ({ item, index }) => {
    if (item._type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{item.label}</Text>
        </View>
      );
    }

    const isMe = item.senderId === me?.id;
    const isOffer = item.type === 'offer' || !!item.offer;
    const isImage = item.type === 'image';
    const isFileMsg = item.type === 'pdf' || item.type === 'file';

    // Avatar shows next to the first message in a run from the other person
    const nextItem = groupedSections[index + 1]; // older message (since inverted+reversed)
    const showAvatar = !isMe && (!nextItem || nextItem._type !== 'message' || nextItem.senderId !== item.senderId);

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMine : styles.messageRowTheirs]}>
        {!isMe && (
          <View style={styles.avatarSlot}>
            {showAvatar && (
              <Avatar uri={item.sender?.avatar || otherUser?.avatar} firstName={item.sender?.firstName} lastName={item.sender?.lastName} size={28} />
            )}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={isMe ? 0.8 : 1}
          onLongPress={() => isMe && handleDeleteMessage(item.id)}
          style={styles.bubbleWrap}
        >
          {isOffer ? (
            <OfferCard
              offer={item.offer}
              isMe={isMe}
              processing={offerActionId === item.offer?.id}
              onAccept={() => handleAcceptOffer(item.offer.id)}
              onReject={() => handleRejectOffer(item.offer.id)}
            />
          ) : isImage ? (
            <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs, { padding: 6 }]}>
              <TouchableOpacity onPress={() => {}}>
                <Image source={{ uri: item.fileUrl }} style={styles.imageMessage} />
              </TouchableOpacity>
            </View>
          ) : isFileMsg ? (
            <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
              <View style={styles.fileRow}>
                <View style={[styles.fileIconCircle, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.slate100 }]}>
                  {item.type === 'pdf' ? (
                    <FileText size={16} color={isMe ? C.white : C.slate600} strokeWidth={2.2} />
                  ) : (
                    <FileIcon size={16} color={isMe ? C.white : C.slate600} strokeWidth={2.2} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: isMe ? C.white : C.slate900 }]} numberOfLines={1}>
                    {item.fileName || 'File'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Download size={11} color={isMe ? 'rgba(255,255,255,0.85)' : C.emerald600} strokeWidth={2.2} />
                    <Text style={[styles.fileDownloadText, { color: isMe ? 'rgba(255,255,255,0.85)' : C.emerald600 }]}>
                      Download
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                {item.content}
              </Text>
            </View>
          )}

          {!isOffer && (
            <View style={[styles.metaRow, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
              <Text style={styles.metaTime}>{formatTime(item.createdAt)}</Text>
              {isMe && (item.isRead ? (
                <CheckCheck size={12} color={C.emerald600} strokeWidth={2.2} />
              ) : (
                <Check size={12} color={C.slate300} strokeWidth={2.2} />
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ── Loading / error ──────────────────────────────────────────
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color={C.slate700} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUserBlock}
          onPress={() => navigation.navigate('Profile', { userId: otherUser?.id })}
          activeOpacity={0.7}
        >
          <Avatar uri={otherUser?.avatar} firstName={otherUser?.firstName} lastName={otherUser?.lastName} size={38} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Chat'}
              </Text>
              {otherUser?.isVerified && <BadgeCheck size={13} color={C.blue500} strokeWidth={2.4} />}
            </View>
            <Text style={styles.headerStatus}>Active</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => notImplementedCall('video')}>
            <Video size={19} color={C.slate600} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => notImplementedCall('audio')}>
            <Phone size={18} color={C.slate600} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={showMenu}>
            <MoreVertical size={19} color={C.slate600} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {error ? (
          <View style={styles.centerFill}>
            <View style={styles.errorIconCircle}>
              <AlertCircle size={26} color={C.red500} strokeWidth={2} />
            </View>
            <Text style={styles.errorTitle}>Couldn't load messages</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchMessages}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerFill}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Say hello to start the conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedSections}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
            <Paperclip size={20} color={C.slate500} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={`Message ${otherUser?.firstName || ''}...`}
              placeholderTextColor={C.slate400}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={5000}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <Send size={17} color={C.white} strokeWidth={2.2} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.slate100, backgroundColor: C.white,
  },
  headerBackBtn: { padding: 4, marginRight: 4 },
  headerUserBlock: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerName: { fontSize: 14.5, fontWeight: '800', color: C.slate900, flexShrink: 1 },
  headerStatus: { fontSize: 11, color: C.emerald600, fontWeight: '600', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { padding: 8 },

  avatarImg: { backgroundColor: C.slate200 },
  avatarFallback: { backgroundColor: C.emerald600, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: C.white, fontWeight: '800' },

  errorIconCircle: {
    width: 58, height: 58, borderRadius: 16, backgroundColor: C.red50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  errorTitle: { fontSize: 15, fontWeight: '800', color: C.slate900, marginBottom: 5 },
  errorSubtitle: { fontSize: 12.5, color: C.slate500, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: C.emerald600, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: C.white, fontWeight: '700', fontSize: 12.5 },

  emptyTitle: { fontSize: 14.5, fontWeight: '800', color: C.slate700, marginBottom: 4 },
  emptySubtitle: { fontSize: 12.5, color: C.slate400 },

  // Messages list
  messagesList: { paddingHorizontal: 12, paddingVertical: 12 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    fontSize: 10.5, fontWeight: '700', color: C.slate400, backgroundColor: C.slate50,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },

  messageRow: { flexDirection: 'row', marginBottom: 6, maxWidth: '100%' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowTheirs: { justifyContent: 'flex-start' },
  avatarSlot: { width: 28, marginRight: 6, alignSelf: 'flex-end' },

  bubbleWrap: { maxWidth: '78%' },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  bubbleMine: { backgroundColor: C.emerald600, borderTopRightRadius: 4 },
  bubbleTheirs: { backgroundColor: C.slate100, borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 19 },
  bubbleTextMine: { color: C.white },
  bubbleTextTheirs: { color: C.slate900 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, paddingHorizontal: 4 },
  metaTime: { fontSize: 10, color: C.slate400 },

  imageMessage: { width: 190, height: 190, borderRadius: 12, backgroundColor: C.slate200 },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIconCircle: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 13, fontWeight: '700' },
  fileDownloadText: { fontSize: 10.5, fontWeight: '600' },

  // Offer card
  offerCard: { borderRadius: 16, padding: 14, width: 250 },
  offerCardMine: { backgroundColor: C.emerald600 },
  offerCardTheirs: { backgroundColor: C.white, borderWidth: 1, borderColor: C.slate200 },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  offerIconCircle: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  offerLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  offerAmount: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  offerDesc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  offerMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  offerMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offerMetaText: { fontSize: 11, fontWeight: '600' },
  offerStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 4 },
  offerStatusText: { fontSize: 11, fontWeight: '700' },
  offerActionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  offerActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  offerActionBtnAccept: { backgroundColor: C.emerald600 },
  offerActionBtnAcceptText: { color: C.white, fontWeight: '800', fontSize: 11.5 },
  offerActionBtnReject: { backgroundColor: C.slate100 },
  offerActionBtnRejectText: { color: C.slate500, fontWeight: '700', fontSize: 11.5 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.slate100, backgroundColor: C.white,
  },
  attachBtn: { padding: 8 },
  inputWrap: {
    flex: 1, backgroundColor: C.slate50, borderRadius: 18, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4, maxHeight: 110, borderWidth: 1, borderColor: C.slate100,
  },
  input: { fontSize: 14, color: C.slate900, maxHeight: 90 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.emerald600, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: C.slate300 },
});

export default ChatScreen;