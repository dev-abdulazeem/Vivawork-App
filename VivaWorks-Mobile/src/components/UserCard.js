// src/components/UserCard.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Card from './Card';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';

const UserCard = ({
  user,
  onPress,
  onConnect,
  onMessage,
  isConnected = false,
  showActions = true,
  style,
}) => {
  const formatRating = (rating) => {
    if (!rating) return 'New';
    return rating.toFixed(1);
  };

  const formatRate = (rate) => {
    if (!rate) return 'Rate negotiable';
    return `₦${rate.toLocaleString()}/hr`;
  };

  return (
    <Card style={[styles.container, style]} onPress={onPress}>
      <View style={styles.header}>
        <Avatar
          source={user.avatar}
          name={user.name}
          size="large"
          showOnlineStatus
          isOnline={user.isOnline}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {user.title || user.profession || 'Freelancer'}
          </Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {formatRating(user.rating)}</Text>
            {user.reviewsCount > 0 && (
              <Text style={styles.reviews}>({user.reviewsCount} reviews)</Text>
            )}
          </View>

          {user.location && (
            <Text style={styles.location}>📍 {user.location}</Text>
          )}
        </View>
      </View>

      {user.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {user.bio}
        </Text>
      )}

      {user.skills && user.skills.length > 0 && (
        <View style={styles.skills}>
          {user.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {user.skills.length > 3 && (
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>+{user.skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {user.completedJobs || 0}
          </Text>
          <Text style={styles.statLabel}>Jobs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {user.successRate ? `${user.successRate}%` : '-'}
          </Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatRate(user.hourlyRate)}</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>

      {user.isVerified && (
        <Badge
          label="✓ Verified"
          variant="success"
          size="small"
          style={styles.verifiedBadge}
        />
      )}

      {showActions && (
        <View style={styles.actions}>
          <Button
            title={isConnected ? 'Connected' : 'Connect'}
            onPress={() => onConnect?.(user)}
            variant={isConnected ? 'outline' : 'primary'}
            size="small"
            style={styles.actionButton}
            fullWidth={false}
          />
          <Button
            title="Message"
            onPress={() => onMessage?.(user)}
            variant="outline"
            size="small"
            style={styles.actionButton}
            fullWidth={false}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  name: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
  },
  title: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  rating: {
    ...FONTS.body2,
    color: COLORS.warning,
    fontWeight: '600',
  },
  reviews: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginLeft: SIZES.xs,
  },
  location: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  bio: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
    lineHeight: 20,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.sm,
  },
  skillTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    marginRight: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  skillText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  statLabel: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderLight,
  },
  verifiedBadge: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
  },
  actions: {
    flexDirection: 'row',
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default UserCard;