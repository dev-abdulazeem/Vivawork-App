// src/components/VivaRoomSection.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Mic, Radio, Users } from 'lucide-react-native';
import api from '../utils/api';

const VivaRoomSection = ({ navigation }) => {
  const [liveCount, setLiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveRooms = useCallback(async () => {
    try {
      const response = await api.get('/vivarooms/live');
      const rooms = response.data.rooms || [];
      setLiveCount(rooms.length);
    } catch {
      setLiveCount(0);
    }
  }, []);

  useEffect(() => {
    fetchLiveRooms();
    const interval = setInterval(fetchLiveRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchLiveRooms]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('AudioRooms')}
      activeOpacity={0.8}
    >
      <View style={styles.leftContent}>
        <View style={styles.iconWrap}>
          <Mic size={22} color="#fff" strokeWidth={2} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>VivaRooms</Text>
          <Text style={styles.subtitle}>
            {liveCount > 0
              ? `${liveCount} live ${liveCount === 1 ? 'room' : 'rooms'}`
              : 'Start a conversation'}
          </Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        {liveCount > 0 && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
        <Users size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
});

export default VivaRoomSection;