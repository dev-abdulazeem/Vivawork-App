// src/screens/AudioRoomsScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const AudioRoomsScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [liveRooms, setLiveRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('forYou');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const [roomsRes, liveRes] = await Promise.all([
        api.get('/audio-rooms'),
        api.get('/audio-rooms/live'),
      ]);
      setRooms(roomsRes.data || []);
      setLiveRooms(liveRes.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, []);

  const renderLiveRoom = ({ item }) => (
    <Card style={styles.liveRoomCard} onPress={() => navigation.navigate('AudioRoomDetail', { roomId: item._id })}>
      <View style={styles.liveRoomHeader}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.liveRoomMembers}>{item.members?.length || 0} listening</Text>
      </View>

      <Text style={styles.liveRoomTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.liveRoomSpeakers}>
        {item.speakers?.slice(0, 4).map((speaker, index) => (
          <Avatar
            key={index}
            source={speaker.avatar}
            name={speaker.name}
            size="small"
            style={{ marginLeft: index > 0 ? -10 : 0 }}
          />
        ))}
        {item.speakers?.length > 4 && (
          <View style={styles.moreSpeakers}>
            <Text style={styles.moreSpeakersText}>+{item.speakers.length - 4}</Text>
          </View>
        )}
      </View>

      <Button
        title="Join"
        onPress={() => navigation.navigate('AudioRoomDetail', { roomId: item._id })}
        variant="primary"
        size="small"
        fullWidth={false}
      />
    </Card>
  );

  const renderRoom = ({ item }) => (
    <Card style={styles.roomCard} onPress={() => navigation.navigate('AudioRoomDetail', { roomId: item._id })}>
      <View style={styles.roomHeader}>
        <Avatar
          source={item.host?.avatar}
          name={item.host?.name}
          size="medium"
        />
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.roomHost}>
            {item.host?.name} • {item.members?.length || 0} members
          </Text>
        </View>
        {item.isLive ? (
          <Badge label="Live" variant="error" size="small" dot />
        ) : (
          <Badge label="Scheduled" variant="default" size="small" />
        )}
      </View>

      {item.description && (
        <Text style={styles.roomDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.roomTags}>
        {item.tags?.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.roomTag}>
            <Text style={styles.roomTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  if (isLoading) {
    return <Loading.FullScreen text="Loading rooms..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Audio Rooms"
        rightIcon={
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.createIcon}>＋</Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['forYou', 'following', 'trending'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'forYou' ? 'For You' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item._id || item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Live Now Section */}
            {liveRooms.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🔴 Live Now</Text>
                </View>
                <FlatList
                  horizontal
                  data={liveRooms}
                  renderItem={renderLiveRoom}
                  keyExtractor={(item) => `live-${item._id || item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.liveRoomsList}
                />
              </View>
            )}

            {/* Trending Rooms */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Rooms</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎙️"
            title="No rooms yet"
            message="Be the first to create an audio room!"
            actionLabel="Create Room"
            onAction={() => {}}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {}}
      >
        <Text style={styles.fabIcon}>🎙️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  createIcon: {
    fontSize: 28,
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
  },
  seeAll: {
    ...FONTS.body2,
    color: COLORS.primary,
  },
  liveRoomsList: {
    paddingHorizontal: SIZES.md,
  },
  liveRoomCard: {
    width: 280,
    marginRight: SIZES.md,
    backgroundColor: COLORS.primary,
  },
  liveRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
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
  liveRoomMembers: {
    ...FONTS.body3,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  liveRoomTitle: {
    ...FONTS.h6,
    color: COLORS.white,
    marginBottom: SIZES.md,
    lineHeight: 24,
  },
  liveRoomSpeakers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  moreSpeakers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  moreSpeakersText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
  },
  roomCard: {
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  roomInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  roomTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
  },
  roomHost: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roomDescription: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SIZES.sm,
  },
  roomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roomTag: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    marginRight: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  roomTagText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: SIZES.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
});

export default AudioRoomsScreen;