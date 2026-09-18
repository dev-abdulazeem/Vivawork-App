// src/screens/AudioRoomsScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import Header from '../components/Header';
import Loading from '../components/Loading';

import {
  Mic,
  Radio,
  Users,
  Globe,
  Lock,
  UserCheck,
  Plus,
  Crown,
  ArrowLeft,
} from 'lucide-react-native';

const visibilityIcons = {
  public: Globe,
  followers_only: UserCheck,
  private: Lock,
};

const visibilityLabels = {
  public: 'Public',
  followers_only: 'Followers',
  private: 'Private',
};

const getInitials = (firstName, lastName) => {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
};

const AudioRoomsScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get('/vivarooms/live');
      const newRooms = res.data.rooms || [];
      setRooms((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newRooms)) return newRooms;
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => fetchRooms(true), 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  const renderRoomCard = ({ item: room }) => {
    const liveCount = room.participants?.filter((p) => !p.leftAt).length || 0;
    const speakerCount =
      room.participants?.filter(
        (p) => !p.leftAt && (p.role === 'host' || p.role === 'co_host' || p.role === 'speaker')
      ).length || 0;

    const activeSpeakers =
      room.participants
        ?.filter((p) => !p.leftAt && (p.role === 'host' || p.role === 'speaker'))
        .slice(0, 4) || [];

    const VisibilityIcon = visibilityIcons[room.visibility] || Globe;

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => navigation.navigate('AudioRoomDetail', { roomId: room.id })}
        activeOpacity={0.8}
      >
        {/* Top row: Live badge + visibility */}
        <View style={styles.cardTopRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <View style={styles.visibilityBadge}>
            <VisibilityIcon size={11} color="#9CA3AF" />
            <Text style={styles.visibilityText}>
              {visibilityLabels[room.visibility]}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.roomTitle} numberOfLines={1}>
          {room.title}
        </Text>

        {/* Description */}
        {room.description ? (
          <Text style={styles.roomDescription} numberOfLines={2}>
            {room.description}
          </Text>
        ) : null}

        {/* Host */}
        <View style={styles.hostRow}>
          {room.host?.avatar ? (
            <Image source={{ uri: room.host.avatar }} style={styles.hostAvatar} />
          ) : (
            <View style={[styles.hostAvatar, styles.hostAvatarPlaceholder]}>
              <Text style={styles.hostAvatarText}>
                {getInitials(room.host?.firstName, room.host?.lastName)}
              </Text>
            </View>
          )}
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>
              {room.host?.firstName} {room.host?.lastName}
            </Text>
            <Text style={styles.hostLabel}>Host</Text>
          </View>
        </View>

        {/* Speakers row */}
        <View style={styles.speakersRow}>
          <View style={styles.speakerAvatars}>
            {activeSpeakers.map((p) => (
              <View key={p.id} style={styles.speakerAvatarWrap}>
                {p.user?.avatar ? (
                  <Image source={{ uri: p.user.avatar }} style={styles.speakerAvatar} />
                ) : (
                  <View style={[styles.speakerAvatar, styles.speakerAvatarPlaceholder]}>
                    <Text style={styles.speakerAvatarText}>
                      {getInitials(p.user?.firstName, p.user?.lastName)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {speakerCount > 4 && (
              <View style={[styles.speakerAvatar, styles.moreSpeakersBadge]}>
                <Text style={styles.moreSpeakersText}>+{speakerCount - 4}</Text>
              </View>
            )}
          </View>
          {speakerCount > 0 && (
            <View style={styles.speakerCount}>
              <Mic size={11} color="#059669" />
              <Text style={styles.speakerCountText}>
                {speakerCount} {speakerCount === 1 ? 'speaker' : 'speakers'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom row: listeners + join */}
        <View style={styles.cardBottomRow}>
          <View style={styles.listenersCount}>
            <Users size={14} color="#6B7280" />
            <Text style={styles.listenersText}>
              {liveCount} {liveCount === 1 ? 'listening' : 'listening'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => navigation.navigate('AudioRoomDetail', { roomId: room.id })}
            activeOpacity={0.7}
          >
            <Radio size={14} color="#fff" />
            <Text style={styles.joinButtonText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading.FullScreen text="Loading rooms..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Live VivaRooms"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={rooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
          />
        }
        contentContainerStyle={[
          styles.listContent,
          rooms.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Radio size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No live rooms</Text>
            <Text style={styles.emptyMessage}>Start the first conversation!</Text>
          </View>
        }
      />

      {/* FAB to create room */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateVivaRoom')}
        activeOpacity={0.8}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // Room Card
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },

  // Host
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  hostAvatarPlaceholder: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  hostInfo: {
    marginLeft: 10,
    flex: 1,
  },
  hostName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  hostLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Speakers
  speakersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  speakerAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerAvatarWrap: {
    marginLeft: -6,
  },
  speakerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  speakerAvatarPlaceholder: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moreSpeakersBadge: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  moreSpeakersText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  speakerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speakerCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Bottom row
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  listenersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  listenersText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AudioRoomsScreen;