// src/screens/WalletScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const WalletScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/transactions'),
      ]);
      setWallet(walletRes.data);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  }, []);

  const formatAmount = (amount, type) => {
    const formatted = `₦${Math.abs(amount).toLocaleString()}`;
    return type === 'credit' ? `+${formatted}` : `-${formatted}`;
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return '💰';
      case 'withdrawal':
        return '🏦';
      case 'deposit':
        return '➕';
      case 'subscription':
        return '📋';
      case 'refund':
        return '↩️';
      default:
        return '💳';
    }
  };

  const getTransactionColor = (type) => {
    return type === 'credit' ? COLORS.success : COLORS.error;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'earnings') return tx.type === 'credit';
    if (activeTab === 'withdrawals') return tx.type === 'debit';
    return true;
  });

  const renderBalanceCard = () => (
    <Card style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>Available Balance</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceAmount}>
          ₦{(wallet?.balance || 0).toLocaleString()}
        </Text>
        <TouchableOpacity>
          <Text style={styles.eyeIcon}>👁️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceStats}>
        <View style={styles.balanceStat}>
          <Text style={styles.balanceStatLabel}>Pending</Text>
          <Text style={styles.balanceStatValue}>
            ₦{(wallet?.pendingBalance || 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.balanceStatDivider} />
        <View style={styles.balanceStat}>
          <Text style={styles.balanceStatLabel}>Total Earned</Text>
          <Text style={styles.balanceStatValue}>
            ₦{(wallet?.totalEarned || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Withdraw"
          onPress={() => {}}
          variant="secondary"
          size="medium"
          style={styles.actionButton}
        />
        <Button
          title="Add Funds"
          onPress={() => {}}
          variant="outline"
          size="medium"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text>{getTransactionIcon(item.type)}</Text>
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.transactionTitle} numberOfLines={1}>
          {item.description || item.title}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            { color: getTransactionColor(item.type) },
          ]}
        >
          {formatAmount(item.amount, item.type)}
        </Text>
        {item.status && (
          <Badge
            label={item.status}
            variant={item.status === 'completed' ? 'success' : 'warning'}
            size="small"
          />
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return <Loading.FullScreen text="Loading wallet..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Wallet" />

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id || item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {renderBalanceCard()}

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {['all', 'earnings', 'withdrawals'].map((tab) => (
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

            <Text style={styles.sectionTitle}>Transactions</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="💳"
            title="No transactions yet"
            message="Your transaction history will appear here"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  balanceCard: {
    margin: SIZES.md,
    backgroundColor: COLORS.primary,
  },
  balanceLabel: {
    ...FONTS.body2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  eyeIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceStats: {
    flexDirection: 'row',
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    ...FONTS.body3,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceStatValue: {
    ...FONTS.h6,
    color: COLORS.white,
    marginTop: 4,
  },
  balanceStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SIZES.md,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SIZES.lg,
    gap: SIZES.md,
  },
  actionButton: {
        flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  tab: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
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
  sectionTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  listContent: {
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radiusMd,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  transactionDate: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...FONTS.body1,
    fontWeight: '700',
    marginBottom: 4,
  },
});

export default WalletScreen;