import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { C, Avatar, formatTimeAgo, stripEmoji } from '../components/ChatShared';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'blocked', label: 'Blocked' },
];

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
    const unsubscribe = navigation.addListener('focus', fetchAll);
    return unsubscribe;
  }, [fetchAll, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const openChat = (otherUser) => {
    navigation.navigate('Chat', { userId: otherUser.id, user: otherUser });
  };

  const showChatOptions = (conv) => {
    Alert.alert(`${conv.user.firstName} ${conv.user.lastName}`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive Chat', onPress: () => handleArchive(conv.user.id) },
      { text: 'Block Contact', style: 'destructive', onPress: () => confirmBlock(conv.user) },
    ]);
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
    return conversations.filter((c) => `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const filteredArchived = useMemo(() => {
    if (!searchQuery) return archivedConversations;
    const q = searchQuery.toLowerCase();
    return archivedConversations.filter((c) => `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(q));
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
    const previewText = stripEmoji(conv.lastMessage?.preview);

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
              <Text style={styles.unreadDotText}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.rowTopLine}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                {conv.user.firstName} {conv.user.lastName}
              </Text>
              {conv.user.isVerified && <BadgeCheck size={12} color={C.blue500} strokeWidth={2.4} />}
            </View>
            <Text style={styles.timeText}>{formatTimeAgo(conv.lastMessage?.createdAt)}</Text>
          </View>

          <View style={styles.previewRow}>
            {!!PreviewIcon && <PreviewIcon size={12} color={isUnread ? C.emerald600 : C.slate400} strokeWidth={2.2} />}
            <Text style={[styles.previewText, isUnread && styles.previewTextUnread]} numberOfLines={1}>
              {conv.lastMessage?.isFromMe ? 'You: ' : ''}
              {conv.lastMessage?.type === 'offer'
                ? `₦${conv.lastMessage?.offer?.amount?.toLocaleString?.() || ''}`
                : previewText}
            </Text>
          </View>
        </View>

        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => showChatOptions(conv)} style={{ paddingLeft: 6 }}>
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {conv.user.firstName} {conv.user.lastName}
          </Text>
          <Text style={styles.previewText} numberOfLines={1}>
            {stripEmoji(conv.lastMessage?.preview) || 'No messages'}
          </Text>
        </View>
        <TouchableOpacity style={styles.pillBtn} onPress={() => handleUnarchive(conv.user.id)} disabled={isLoadingRow}>
          {isLoadingRow ? <ActivityIndicator size="small" color={C.emerald600} /> : <ArchiveRestore size={14} color={C.emerald700} strokeWidth={2.2} />}
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {bu.firstName || 'Unknown'} {bu.lastName || 'User'}
          </Text>
          <Text style={styles.previewText}>{blocked.blockedAt ? `Blocked ${formatTimeAgo(blocked.blockedAt)}` : 'Blocked'}</Text>
        </View>
        <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline]} onPress={() => handleUnblock(userId)} disabled={isLoadingRow || !userId}>
          {isLoadingRow ? <ActivityIndicator size="small" color={C.emerald600} /> : <Text style={styles.pillBtnOutlineText}>Unblock</Text>}
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
      archived: { Icon: Archive, title: 'No archived conversations', subtitle: 'Your archived chats will appear here' },
      blocked: { Icon: Ban, title: 'No blocked contacts', subtitle: 'Blocked users will appear here' },
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

  const dataForTab = activeTab === 'active' ? filteredConversations : activeTab === 'archived' ? filteredArchived : filteredBlocked;
  const renderItemForTab = activeTab === 'active' ? renderConversationRow : activeTab === 'archived' ? renderArchivedRow : renderBlockedRow;
  const keyExtractorForTab = (item) => (activeTab === 'blocked' ? String(item.id || item.blockedId) : item.user.id);

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
          <TouchableOpacity onPress={() => navigation.navigate('Search')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <SquarePen size={20} color={C.slate700} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={14} color={C.slate400} strokeWidth={2} />
        <TextInput
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
          const count = tab.key === 'active' ? conversations.length : tab.key === 'archived' ? archivedConversations.length : blockedContacts.length;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>{count}</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
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
  errorSubtitle: { fontSize: 13, color: C.slate500, textAlign: 'center', paddingHorizontal: 40, marginBottom: 18 },
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
  tabCountBadge: { backgroundColor: C.slate200, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountBadgeActive: { backgroundColor: C.emerald600 },
  tabCountText: { fontSize: 10, fontWeight: '800', color: C.slate600 },
  tabCountTextActive: { color: C.white },

  listContent: { paddingBottom: 24 },
  separator: { height: 1, backgroundColor: C.slate100, marginLeft: 84 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowUnread: { backgroundColor: C.emerald50 },
  avatarWrap: { position: 'relative' },
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

  rowTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  name: { fontSize: 14.5, fontWeight: '600', color: C.slate700, flexShrink: 1 },
  nameUnread: { fontWeight: '800', color: C.slate900 },
  timeText: { fontSize: 11, color: C.slate400 },

  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewText: { fontSize: 13, color: C.slate500, flex: 1 },
  previewTextUnread: { color: C.slate900, fontWeight: '600' },

  pillBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.emerald50, alignItems: 'center', justifyContent: 'center' },
  pillBtnOutline: { backgroundColor: C.emerald50, paddingHorizontal: 12, width: undefined, borderRadius: 10 },
  pillBtnOutlineText: { color: C.emerald700, fontWeight: '700', fontSize: 11.5 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: C.slate900, marginBottom: 4 },
  emptySubtitle: { fontSize: 12.5, color: C.slate400, textAlign: 'center' },
});

export default MessagesScreen;