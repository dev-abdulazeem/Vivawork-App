// src/screens/AudioRoomDetailScreen.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';
import Loading from '../components/Loading';

import {
  Mic,
  MicOff,
  Hand,
  LogOut,
  Crown,
  MessageSquare,
  Users,
  X,
  Send,
  Radio,
  Volume2,
  VolumeX,
  ChevronUp,
  UserMinus,
  MoreHorizontal,
} from 'lucide-react-native';

const getInitials = (firstName, lastName) => {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
};

const roleHierarchy = { host: 0, co_host: 1, speaker: 2, listener: 3 };

const getRoleLabel = (role) => {
  return role
    .replace('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getRoleColor = (role) => {
  switch (role) {
    case 'host': return '#EAB308';
    case 'co_host': return '#059669';
    case 'speaker': return '#3B82F6';
    default: return '#9CA3AF';
  }
};

const Avatar = ({ source, name, size = 40, style }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError || !source) {
    return (
      <View
        style={[
          styles.avatarPlaceholder,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      >
        <Text style={[styles.avatarPlaceholderText, { fontSize: size * 0.35 }]}>
          {getInitials(name?.firstName, name?.lastName) || '?'}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: source }}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      onError={() => setImgError(true)}
    />
  );
};

const AudioRoomDetailScreen = ({ route, navigation }) => {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [myRole, setMyRole] = useState('listener');
  const [isHost, setIsHost] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const res = await api.get(`/vivarooms/${roomId}`);
      const roomData = res.data.room;
      setRoom(roomData);
      setParticipants(roomData.participants || []);
      setMessages(roomData.messages || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load room details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      if (isJoined) {
        await api.post(`/vivarooms/${roomId}/leave`);
        setIsJoined(false);
        setMyRole('listener');
        setIsHost(false);
      } else {
        const res = await api.post(`/vivarooms/${roomId}/join`);
        setIsJoined(true);
        setMyRole(res.data.participant?.role || 'listener');
        setIsHost(res.data.participant?.role === 'host');
        fetchRoomDetails();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to join room');
    }
  };

  const handleToggleMute = async () => {
    try {
      const newMuted = !isMuted;
      await api.patch(`/vivarooms/${roomId}/mute`, { mute: newMuted });
      setIsMuted(newMuted);
    } catch {
      Alert.alert('Error', 'Failed to toggle mute');
    }
  };

  const handleToggleHand = async () => {
    try {
      const res = await api.patch(`/vivarooms/${roomId}/hand`);
      setHandRaised(res.data.handRaised);
    } catch {
      Alert.alert('Error', 'Failed to raise hand');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      const res = await api.post(`/vivarooms/${roomId}/messages`, {
        content: chatInput.trim(),
      });
      setMessages((prev) => [...prev, res.data.message]);
      setChatInput('');
    } catch {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleEndRoom = async () => {
    if (!isHost) return;
    try {
      await api.post(`/vivarooms/${roomId}/end`);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to end room');
    }
  };

  const handlePromote = async (participantId, newRole) => {
    try {
      await api.patch(`/vivarooms/${roomId}/participants/${participantId}/role`, {
        role: newRole,
      });
      fetchRoomDetails();
    } catch {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleMuteUser = async (participantId, mute) => {
    try {
      await api.patch(`/vivarooms/${roomId}/mute`, { participantId, mute });
      fetchRoomDetails();
    } catch {
      Alert.alert('Error', 'Failed to mute user');
    }
  };

  const speakers = participants.filter(
    (p) => p.role === 'host' || p.role === 'co_host' || p.role === 'speaker'
  );
  const listeners = participants.filter((p) => p.role === 'listener');
  const canManage = isHost || myRole === 'co_host';

  const sortedParticipants = [...participants].sort((a, b) => {
    const roleDiff = roleHierarchy[a.role] - roleHierarchy[b.role];
    if (roleDiff !== 0) return roleDiff;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  if (isLoading) {
    return <Loading.FullScreen text="Joining room..." />;
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Room" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Room not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Radio size={18} color="#059669" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {room.title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {room.host?.firstName} {room.host?.lastName} · {participants.length} listening
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowParticipants(!showParticipants)}
            style={[
              styles.headerBtn,
              showParticipants && styles.headerBtnActive,
            ]}
          >
            <Users size={18} color={showParticipants ? '#059669' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowChat(!showChat)}
            style={[styles.headerBtn, showChat && styles.headerBtnActive]}
          >
            <MessageSquare size={18} color={showChat ? '#059669' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleJoin} style={styles.headerBtn}>
            <LogOut size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Room Stage */}
        <ScrollView
          style={styles.stage}
          contentContainerStyle={styles.stageContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Speakers */}
          <Text style={styles.sectionLabel}>
            SPEAKERS · {speakers.length}
          </Text>
          <View style={styles.speakersGrid}>
            {speakers.map((participant) => (
              <View key={participant.id} style={styles.speakerItem}>
                <View style={styles.speakerAvatarWrap}>
                  <Avatar
                    source={participant.user?.avatar}
                    name={participant.user}
                    size={64}
                  />
                  {participant.role === 'host' && (
                    <View style={styles.crownBadge}>
                      <Crown size={12} color="#92400E" />
                    </View>
                  )}
                  {participant.isMuted && (
                    <View style={styles.mutedBadge}>
                      <MicOff size={10} color="#fff" />
                    </View>
                  )}
                  {participant.handRaised && (
                    <View style={styles.handBadge}>
                      <Hand size={10} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.speakerName} numberOfLines={1}>
                  {participant.user?.firstName}
                </Text>
                <Text
                  style={[
                    styles.speakerRole,
                    { color: getRoleColor(participant.role) },
                  ]}
                >
                  {getRoleLabel(participant.role)}
                </Text>
              </View>
            ))}
          </View>

          {/* Listeners */}
          {listeners.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                LISTENERS · {listeners.length}
              </Text>
              <View style={styles.listenersGrid}>
                {listeners.slice(0, 16).map((participant) => (
                  <View key={participant.id} style={styles.listenerItem}>
                    <View style={styles.listenerAvatarWrap}>
                      <Avatar
                        source={participant.user?.avatar}
                        name={participant.user}
                        size={44}
                        style={styles.listenerAvatar}
                      />
                      {participant.handRaised && (
                        <View style={styles.listenerHandBadge}>
                          <Hand size={8} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.listenerName} numberOfLines={1}>
                      {participant.user?.firstName}
                    </Text>
                  </View>
                ))}
                {listeners.length > 16 && (
                  <View style={styles.moreListeners}>
                    <Text style={styles.moreListenersText}>
                      +{listeners.length - 16}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {participants.length === 0 && (
            <View style={styles.emptyStage}>
              <Users size={48} color="#D1D5DB" />
              <Text style={styles.emptyStageText}>No one is in the room yet</Text>
            </View>
          )}
        </ScrollView>

        {/* Chat Panel */}
        {showChat && (
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderText}>Room Chat</Text>
              <TouchableOpacity
                onPress={() => setShowChat(false)}
                style={styles.chatCloseBtn}
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.chatMessages}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && (
                <View style={styles.emptyChat}>
                  <MessageSquare size={32} color="#D1D5DB" />
                  <Text style={styles.emptyChatText}>No messages yet</Text>
                </View>
              )}
              {messages.map((msg) => (
                <View key={msg.id} style={styles.chatMessage}>
                  <Avatar
                    source={msg.sender?.avatar}
                    name={msg.sender}
                    size={28}
                  />
                  <View style={styles.chatMessageContent}>
                    <Text style={styles.chatSenderName}>
                      {msg.sender?.firstName} {msg.sender?.lastName}
                    </Text>
                    <Text style={styles.chatMessageText}>{msg.content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Send a message..."
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!chatInput.trim()}
                style={[
                  styles.chatSendBtn,
                  !chatInput.trim() && styles.chatSendBtnDisabled,
                ]}
              >
                <Send size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <View style={styles.participantsPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderText}>
                Participants · {participants.length}
              </Text>
              <TouchableOpacity
                onPress={() => setShowParticipants(false)}
                style={styles.chatCloseBtn}
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {sortedParticipants.map((participant) => {
                const isSelf = participant.userId === participant.user?.id;
                const canManageThis =
                  canManage && participant.role !== 'host' && !isSelf;

                return (
                  <View key={participant.id} style={styles.participantRow}>
                    <View style={styles.participantLeft}>
                      <Avatar
                        source={participant.user?.avatar}
                        name={participant.user}
                        size={36}
                      />
                      <View style={styles.participantInfo}>
                        <View style={styles.participantNameRow}>
                          <Text style={styles.participantName} numberOfLines={1}>
                            {participant.user?.firstName} {participant.user?.lastName}
                          </Text>
                          {participant.role === 'host' && (
                            <Crown size={12} color="#EAB308" />
                          )}
                        </View>
                        <View style={styles.participantMetaRow}>
                          <Text
                            style={[
                              styles.participantRole,
                              { color: getRoleColor(participant.role) },
                            ]}
                          >
                            {getRoleLabel(participant.role)}
                          </Text>
                          {participant.handRaised && (
                            <Text style={styles.handRaisedText}>Raised</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.participantActions}>
                      {participant.isMuted ? (
                        <MicOff size={14} color="#EF4444" />
                      ) : (
                        <Mic size={14} color="#059669" />
                      )}
                      {canManageThis && (
                        <View style={styles.manageActions}>
                          {participant.role === 'listener' && (
                            <TouchableOpacity
                              onPress={() => handlePromote(participant.id, 'speaker')}
                              style={styles.manageBtn}
                            >
                              <ChevronUp size={14} color="#059669" />
                            </TouchableOpacity>
                          )}
                          {participant.role === 'speaker' && (
                            <TouchableOpacity
                              onPress={() => handlePromote(participant.id, 'listener')}
                              style={styles.manageBtn}
                            >
                              <UserMinus size={14} color="#6B7280" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() =>
                              handleMuteUser(participant.id, !participant.isMuted)
                            }
                            style={[
                              styles.manageBtn,
                              participant.isMuted
                                ? styles.manageBtnUnmute
                                : styles.manageBtnMute,
                            ]}
                          >
                            {participant.isMuted ? (
                              <Volume2 size={14} color="#059669" />
                            ) : (
                              <VolumeX size={14} color="#EF4444" />
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      {isJoined && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            onPress={handleToggleMute}
            style={[
              styles.controlBtn,
              isMuted ? styles.controlBtnMuted : styles.controlBtnActive,
            ]}
          >
            {isMuted ? (
              <MicOff size={22} color="#EF4444" />
            ) : (
              <Mic size={22} color="#059669" />
            )}
          </TouchableOpacity>

          {myRole === 'listener' && (
            <TouchableOpacity
              onPress={handleToggleHand}
              style={[
                styles.controlBtn,
                handRaised ? styles.controlBtnHandRaised : styles.controlBtnDefault,
              ]}
            >
              <Hand size={22} color={handRaised ? '#fff' : '#6B7280'} />
            </TouchableOpacity>
          )}

          {isHost ? (
            <TouchableOpacity
              onPress={handleEndRoom}
              style={styles.endRoomBtn}
            >
              <Text style={styles.endRoomBtnText}>End Room</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleJoin}
              style={styles.leaveBtn}
            >
              <Text style={styles.leaveBtnText}>Leave</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Join button when not joined */}
      {!isJoined && (
        <View style={styles.joinContainer}>
          <TouchableOpacity onPress={handleJoin} style={styles.joinMainBtn}>
            <Radio size={20} color="#fff" />
            <Text style={styles.joinMainBtnText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Avatar
  avatarPlaceholder: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnActive: {
    backgroundColor: '#ECFDF5',
  },

  // Main content
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  stage: {
    flex: 1,
  },
  stageContent: {
    padding: 20,
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },

  // Speakers
  speakersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  speakerItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 20,
  },
  speakerAvatarWrap: {
    position: 'relative',
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mutedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  handBadge: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  speakerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 80,
  },
  speakerRole: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // Listeners
  listenersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  listenerItem: {
    alignItems: 'center',
    width: 60,
  },
  listenerAvatarWrap: {
    position: 'relative',
  },
  listenerAvatar: {
    opacity: 0.8,
  },
  listenerHandBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  listenerName: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 60,
  },
  moreListeners: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreListenersText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Empty stage
  emptyStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStageText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },

  // Chat Panel
  chatPanel: {
    width: 280,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  chatCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatMessages: {
    flex: 1,
    padding: 12,
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  chatMessageContent: {
    flex: 1,
  },
  chatSenderName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  chatMessageText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginTop: 2,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  chatSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },

  // Participants Panel
  participantsPanel: {
    width: 280,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  participantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  participantRole: {
    fontSize: 11,
    fontWeight: '500',
  },
  handRaisedText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnMute: {
    backgroundColor: '#FEF2F2',
  },
  manageBtnUnmute: {
    backgroundColor: '#ECFDF5',
  },

  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  controlBtnMuted: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  controlBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  controlBtnDefault: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  controlBtnHandRaised: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  endRoomBtn: {
    paddingHorizontal: 28,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endRoomBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  leaveBtn: {
    paddingHorizontal: 28,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Join
  joinContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  joinMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  joinMainBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
  },
});

export default AudioRoomDetailScreen;