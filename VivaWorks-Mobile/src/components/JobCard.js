// src/components/JobCard.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import Card from './Card';
import Badge from './Badge';
import Avatar from './Avatar';

const JobCard = ({
  job,
  onPress,
  onSave,
  onApply,
  saved = false,
  showActions = true,
  style,
}) => {
  const formatBudget = (budget) => {
    if (!budget) return 'Negotiable';
    if (typeof budget === 'object') {
      const { min, max, type } = budget;
      if (type === 'fixed') {
        return `₦${min?.toLocaleString()} - ₦${max?.toLocaleString()}`;
      }
      return `₦${min?.toLocaleString()} - ₦${max?.toLocaleString()} /hr`;
    }
    return `₦${budget.toLocaleString()}`;
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const jobDate = new Date(date);
    const diffInHours = Math.floor((now - jobDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <Card style={[styles.container, style]} onPress={onPress}>
      <View style={styles.header}>
        <Avatar
          source={job.client?.avatar}
          name={job.client?.name || job.client?.company}
          size="medium"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.clientName} numberOfLines={1}>
            {job.client?.name || job.client?.company || 'Unknown Client'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => onSave?.(job)}
        >
          <Text style={styles.saveIcon}>{saved ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badges}>
        {job.type && (
          <Badge
            label={job.type}
            variant="primary"
            size="small"
            style={styles.badge}
          />
        )}
        {job.experienceLevel && (
          <Badge
            label={job.experienceLevel}
            variant="default"
            size="small"
            style={styles.badge}
          />
        )}
        {job.isUrgent && (
          <Badge
            label="Urgent"
            variant="error"
            size="small"
            style={styles.badge}
          />
        )}
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {job.description}
      </Text>

      {job.skills && job.skills.length > 0 && (
        <View style={styles.skills}>
          {job.skills.slice(0, 4).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {job.skills.length > 4 && (
            <View style={styles.skillTag}>
              <Text style={styles.skillText}>+{job.skills.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.budgetContainer}>
          <Text style={styles.budget}>{formatBudget(job.budget)}</Text>
          <Text style={styles.postedTime}>
            {formatTimeAgo(job.createdAt)}
          </Text>
        </View>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.applyButton]}
              onPress={() => onApply?.(job)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {job.proposalsCount !== undefined && (
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {job.proposalsCount} proposals
          </Text>
          {job.hiresCount > 0 && (
            <Text style={styles.statsText}>
              • {job.hiresCount} hired
            </Text>
          )}
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
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  title: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  clientName: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  saveButton: {
    padding: SIZES.xs,
  },
  saveIcon: {
    fontSize: 20,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  badge: {
    marginRight: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  description: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.sm,
  },
  skillTag: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    marginRight: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  skillText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  budgetContainer: {
    flex: 1,
  },
  budget: {
    ...FONTS.h6,
    color: COLORS.primary,
    fontWeight: '700',
  },
  postedTime: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
  applyButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    marginTop: SIZES.sm,
  },
  statsText: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginRight: SIZES.sm,
  },
});

export default JobCard;