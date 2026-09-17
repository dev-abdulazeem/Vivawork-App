// src/screens/AudioRoomDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Loading from '../components/Loading';

const AudioRoomDetailScreen = ({ route, navigation }) => {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await api.get(`/audio-rooms/${roomId}`);
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room:', error);
      Alert.alert('Error', 'Failed to load room details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      if (isJoined) {
        await api.post(`/audio-rooms/${roomId}/leave`);
        setIsJoined(false);
      } else {
        await api.post(`/audio-rooms/${roomId}/join`);
        setIsJoined(true);
      }
    } catch (error) {
      console.error('Error joining/leaving room:', error);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleRaiseHand = () => {
    Alert.alert('Hand Raised', 'The host will be notified that you want to speak');
  };

  const renderSpeakers = () => (
    <View style={styles.speakersSection}>
      <Text style={styles.sectionTitle}>Speakers ({room?.speakers?.length || 0})</Text>
      <View style={styles.speakersGrid}>
        {room?.speakers?.map((speaker, index) => (
          <View key={index} style={styles.speakerItem}>
            <View style={styles.speakerAvatarContainer}>
              <Avatar
                source={speaker.avatar}
                name={speaker.name}
                size="large"
              />
              {speaker.isSpeaking && <View style={styles.speakingIndicator} />}
            </View>
            <Text style={styles.speakerName} numberOfLines={1}>
              {speaker.name}
            </Text>
            <Text style={styles.speakerRole}>
              {speaker.isHost ? 'Host' : 'Speaker'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderListeners = () => (
    <View style={styles.listenersSection}>
      <Text style={styles.sectionTitle}>
        Listeners ({room?.listeners?.length || 0})
      </Text>
      <View style={styles.listenersGrid}>
        {room?.listeners?.slice(0, 12).map((listener, index) => (
          <View key={index} style={styles.listenerItem}>
            <Avatar
              source={listener.avatar}
              name={listener.name}
              size="medium"
            />
          </View>
        ))}
        {room?.listeners?.length > 12 && (
          <View style={styles.moreListeners}>
            <Text style={styles.moreListenersText}>
              +{room.listeners.length - 12}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderChat = () => (
    <View style={styles.chatSection}>
      <Text style={styles.sectionTitle}>Chat</Text>
      {room?.messages?.length > 0 ? (
        room.messages.map((message, index) => (
          <View key={index} style={styles.chatMessage}>
            <Avatar
              source={message.user?.avatar}
              name={message.user?.name}
              size="small"
            />
            <View style={styles.chatContent}>
              <Text style={styles.chatUserName}>{message.user?.name}</Text>
              <Text style={styles.chatText}>{message.text}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyChat}>No messages yet</Text>
      )}
    </View>
  );

  const renderAbout = () => (
    <View style={styles.aboutSection}>
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.aboutText}>
        {room?.description || 'No description available'}
      </Text>

      <View style={styles.aboutStats}>
        <View style={styles.aboutStat}>
          <Text style={styles.aboutStatValue}>{room?.members?.length || 0}</Text>
          <Text style={styles.aboutStatLabel}>Members</Text>
        </View>
        <View style={styles.aboutStat}>
          <Text style={styles.aboutStatValue}>
            {new Date(room?.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.aboutStatLabel}>Created</Text>
        </View>
      </View>

      {room?.tags && (
        <View style={styles.tagsContainer}>
          {room.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return <Loading.FullScreen text="Loading room..." />;
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
      <Header
        title={room.title}
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Room Info */}
        <View style={styles.roomInfo}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.roomTitle}>{room.title}</Text>
          <Text style={styles.roomHost}>Hosted by {room.host?.name}</Text>
        </View>

        {renderSpeakers()}
        {renderListeners()}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['chat', 'about', 'members'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'about' && renderAbout()}
        {activeTab === 'members' && (
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>All Members</Text>
            {room?.members?.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <Avatar
                  source={member.avatar}
                  name={member.name}
                  size="medium"
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>
                    {member.isHost ? 'Host' : member.isSpeaker ? 'Speaker' : 'Listener'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {isJoined ? (
          <>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleMuteToggle}
            >
              <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              <Text style={styles.controlLabel}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleRaiseHand}
            >
              <Text style={styles.controlIcon}>✋</Text>
              <Text style={styles.controlLabel}>Raise Hand</Text>
            </TouchableOpacity>

            <Button
              title="Leave"
              onPress={handleJoin}
              variant="danger"
              size="medium"
              style={styles.leaveButton}
            />
          </>
        ) : (
          <Button
            title="Join Room"
            onPress={handleJoin}
            variant="primary"
            size="large"
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  moreIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  roomInfo: {
    alignItems: 'center',
    padding: SIZES.lg,
    backgroundColor: COLORS.primary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.md,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginRight: 4,
  },
  liveText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '700',
  },
  roomTitle: {
    ...FONTS.h4,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  roomHost: {
    ...FONTS.body1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  speakersSection: {
    paddingTop: SIZES.lg,
  },
  speakersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: SIZES.md,
  },
  speakerItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: SIZES.lg,
  },
  speakerAvatarContainer: {
    position: 'relative',
    marginBottom: SIZES.sm,
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  speakerName: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  speakerRole: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  listenersSection: {
    paddingTop: SIZES.lg,
  },
  listenersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.md,
  },
  listenerItem: {
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  moreListeners: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreListenersText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginTop: SIZES.lg,
  },
  tab: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  chatSection: {
    paddingTop: SIZES.md,
  },
  chatMessage: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  chatContent: {
    flex: 1,
    marginLeft: SIZES.sm,
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  chatUserName: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  chatText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  emptyChat: {
    ...FONTS.body2,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: SIZES.xl,
  },
  aboutSection: {
    paddingTop: SIZES.md,
  },
  aboutText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
  },
  aboutStats: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
  },
  aboutStat: {
    marginRight: SIZES.xl,
  },
  aboutStatValue: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  aboutStatLabel: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.md,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  tagText: {
    ...FONTS.body2,
    color: COLORS.primary,
  },
  membersSection: {
    paddingTop: SIZES.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  memberInfo: {
    marginLeft: SIZES.md,
  },
  memberName: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  memberRole: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  bottomPadding: {
    height: 100,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  controlButton: {
    alignItems: 'center',
    padding: SIZES.sm,
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  controlLabel: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  leaveButton: {
    paddingHorizontal: SIZES.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
});

export default AudioRoomDetailScreen;