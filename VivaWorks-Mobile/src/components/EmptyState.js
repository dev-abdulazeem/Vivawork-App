// src/components/EmptyState.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import Button from './Button';

const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  message = '',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {actionLabel && (
        <View style={styles.actions}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="medium"
            fullWidth={false}
          />
          {secondaryActionLabel && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              size="medium"
              fullWidth={false}
              style={styles.secondaryButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

// Predefined empty states for common scenarios
EmptyState.NoJobs = (props) => (
  <EmptyState
    icon="💼"
    title="No jobs found"
    message="Try adjusting your search or filters"
    {...props}
  />
);

EmptyState.NoMessages = (props) => (
  <EmptyState
    icon="💬"
    title="No messages yet"
    message="Start a conversation with someone"
    {...props}
  />
);

EmptyState.NoNotifications = (props) => (
  <EmptyState
    icon="🔔"
    title="All caught up!"
    message="You have no new notifications"
    {...props}
  />
);

EmptyState.NoResults = (props) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    message="Try different keywords or filters"
    {...props}
  />
);

EmptyState.NoNetwork = (props) => (
  <EmptyState
    icon="📡"
    title="No internet connection"
    message="Check your network settings and try again"
    {...props}
  />
);

EmptyState.Error = ({ onRetry, ...props }) => (
  <EmptyState
    icon="⚠️"
    title="Something went wrong"
    message="We're having trouble loading this content"
    actionLabel="Try Again"
    onAction={onRetry}
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
    minHeight: 200,
  },
  icon: {
    fontSize: 64,
    marginBottom: SIZES.md,
  },
  title: {
    ...FONTS.h5,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  message: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  secondaryButton: {
    marginLeft: SIZES.md,
  },
});

export default EmptyState;