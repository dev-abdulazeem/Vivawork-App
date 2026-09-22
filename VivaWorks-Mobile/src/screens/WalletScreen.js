// src/screens/WalletScreen.js

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';

import {
  AlertCircle,
  RefreshCw,
  X,
  Send,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Wallet,
  Search,
  ChevronDown,
  Shield,
  Banknote,
  RotateCcw,
  Lock,
} from 'lucide-react-native';

const LOW_BALANCE_THRESHOLD = 5000;

// Pulls a query param out of a redirect/deep-link URL without relying on the URL polyfill.
const extractQueryParam = (url, param) => {
  if (!url) return null;
  const match = url.match(new RegExp(`[?&]${param}=([^&#]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const WalletScreen = () => {
  const navigation = useNavigation();

  // Main state
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Withdrawal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [showBankList, setShowBankList] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState(null);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(null);
  const [otpLocked, setOtpLocked] = useState(false);

  // Top-up state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const processedRefs = useRef(new Set());

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/wallet');
      setWallet(response.data.wallet);
      setTransactions(response.data.wallet.transactions || []);
    } catch (err) {
      console.error('Fetch wallet error:', err);
      setError(err.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const response = await api.get('/wallet/transactions');
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Fetch transactions error:', err);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchBanks = useCallback(async () => {
    try {
      setBanksLoading(true);
      const response = await api.get('/wallet/banks');
      const rawBanks = response.data.banks || [];
      // Some backends return duplicate bank codes — dedupe defensively so list keys stay unique.
      const uniqueBanks = Array.from(new Map(rawBanks.map((bank) => [bank.code, bank])).values());
      setBanks(uniqueBanks);
    } catch (err) {
      console.error('Fetch banks error:', err);
      Alert.alert('Error', 'Failed to load banks');
    } finally {
      setBanksLoading(false);
    }
  }, []);

  const fetchSavedCards = useCallback(async () => {
    try {
      setCardsLoading(true);
      const response = await api.get('/wallet/cards');
      setSavedCards(response.data.cards || []);
    } catch (err) {
      console.error('Fetch cards error:', err);
    } finally {
      setCardsLoading(false);
    }
  }, []);

  const verifyTopUpPayment = useCallback(
    async (reference) => {
      if (!reference) return;
      if (processedRefs.current.has(reference)) return;
      if (verifyingPayment) return;

      processedRefs.current.add(reference);

      try {
        setVerifyingPayment(true);
        const response = await api.post('/wallet/verify-topup', { reference });
        Alert.alert('Success', `₦${response.data.amount?.toLocaleString()} added to your wallet!`);
        await fetchWallet();
      } catch (err) {
        console.error('Verify top-up error:', err);
        Alert.alert('Error', err.response?.data?.message || 'Payment verification failed');
      } finally {
        setVerifyingPayment(false);
      }
    },
    [fetchWallet, verifyingPayment]
  );

  const manualVerify = async (reference) => {
    if (!reference) {
      Alert.alert('Error', 'No reference to verify');
      return;
    }
    processedRefs.current.delete(reference);
    await verifyTopUpPayment(reference);
  };

  useEffect(() => {
    fetchWallet();
    fetchSavedCards();
  }, [fetchWallet, fetchSavedCards]);

  // Catches the app being reopened via the Paystack redirect (deep link) so a top-up
  // started from this screen gets verified automatically, same as the web query-param flow.
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const reference = extractQueryParam(url, 'reference') || extractQueryParam(url, 'trxref');
      if (reference) verifyTopUpPayment(reference);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, [verifyTopUpPayment]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  }, [fetchWallet]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);

    if (!amount || isNaN(amount) || amount < 100) {
      Alert.alert('Error', 'Minimum top-up is ₦100');
      return;
    }

    try {
      setTopUpLoading(true);
      const response = await api.post('/wallet/topup', { amount });

      if (response.data.authorizationUrl) {
        processedRefs.current.clear();
        setShowTopUpModal(false);
        await Linking.openURL(response.data.authorizationUrl);
      } else {
        Alert.alert('Error', 'Payment initialization failed');
      }
    } catch (err) {
      console.error('Top-up error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setTopUpLoading(false);
    }
  };

  const deleteCard = async (cardId) => {
    Alert.alert('Confirm', 'Remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/wallet/cards/${cardId}`);
            Alert.alert('Success', 'Card removed');
            fetchSavedCards();
          } catch (err) {
            Alert.alert('Error', 'Failed to remove card');
          }
        },
      },
    ]);
  };

  const verifyAccount = async () => {
    if (!withdrawData.accountNumber || !withdrawData.bankCode) {
      Alert.alert('Error', 'Enter account number and select bank');
      return;
    }
    try {
      setVerifyingAccount(true);
      const response = await api.post('/wallet/verify-account', {
        accountNumber: withdrawData.accountNumber,
        bankCode: withdrawData.bankCode,
      });
      setWithdrawData((prev) => ({ ...prev, accountName: response.data.accountName }));
      Alert.alert('Success', 'Account verified');
    } catch (err) {
      console.error('Verify error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to verify account');
    } finally {
      setVerifyingAccount(false);
    }
  };

  const requestOtp = async () => {
    if (!withdrawData.amount || !withdrawData.accountName) {
      Alert.alert('Error', 'Fill all fields and verify account');
      return;
    }
    const amount = parseFloat(withdrawData.amount);
    if (isNaN(amount) || amount < 1000) {
      Alert.alert('Error', 'Minimum withdrawal is ₦1,000');
      return;
    }
    if (wallet && amount > parseFloat(wallet.balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    try {
      setWithdrawLoading(true);
      const selectedBank = banks.find((b) => b.code === withdrawData.bankCode);
      await api.post('/wallet/withdrawal-otp', {
        amount,
        bankDetails: {
          accountNumber: withdrawData.accountNumber,
          accountName: withdrawData.accountName,
          bankCode: withdrawData.bankCode,
          bankName: selectedBank?.name || withdrawData.bankName,
        },
      });
      Alert.alert('Success', 'OTP sent to your email');
      setOtpAttemptsLeft(null);
      setOtpLocked(false);
      setWithdrawStep(2);
    } catch (err) {
      console.error('OTP request error:', err);
      const code = err.response?.data?.code;
      if (code === 'WITHDRAWAL_COOLDOWN') {
        Alert.alert('Error', err.response.data.message);
        setShowWithdrawModal(false);
        fetchWallet();
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  const confirmWithdrawal = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Enter 6-digit OTP');
      return;
    }
    try {
      setWithdrawLoading(true);
      const response = await api.post('/wallet/confirm-withdrawal', { code: otpCode });
      setWithdrawResult(response.data);
      setWithdrawStep(3);
      Alert.alert('Success', 'Withdrawal successful!');
      fetchWallet();
    } catch (err) {
      console.error('Withdrawal error:', err);
      const data = err.response?.data;
      if (data?.code === 'OTP_LOCKED') {
        setOtpLocked(true);
        Alert.alert('Error', data.message);
      } else if (typeof data?.attemptsLeft === 'number') {
        setOtpAttemptsLeft(data.attemptsLeft);
        Alert.alert('Error', `${data.message} (${data.attemptsLeft} attempt${data.attemptsLeft === 1 ? '' : 's'} left)`);
      } else {
        Alert.alert('Error', data?.message || 'Withdrawal failed');
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  const openWithdrawModal = () => {
    setShowWithdrawModal(true);
    setWithdrawStep(1);
    setWithdrawData({
      amount: '',
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
    });
    setOtpCode('');
    setWithdrawResult(null);
    setOtpAttemptsLeft(null);
    setOtpLocked(false);
    setShowBankList(false);
    setBankSearchQuery('');
    fetchBanks();
  };

  const openTopUpModal = () => {
    setShowTopUpModal(true);
    setTopUpAmount('');
  };

  const cooldownHoursLeft = useMemo(() => {
    if (!wallet?.withdrawalLockedUntil) return 0;
    const msLeft = new Date(wallet.withdrawalLockedUntil).getTime() - Date.now();
    return msLeft > 0 ? Math.ceil(msLeft / (60 * 60 * 1000)) : 0;
  }, [wallet?.withdrawalLockedUntil]);

  const withdrawalOnCooldown = cooldownHoursLeft > 0;

  const filteredBanks = useMemo(() => {
    const query = bankSearchQuery.trim().toLowerCase();
    if (!query) return banks;
    return banks.filter((bank) => bank.name.toLowerCase().includes(query));
  }, [banks, bankSearchQuery]);

  // Transaction helpers
  const getTransactionIcon = (type) => {
    const iconSize = 18;
    switch (type) {
      case 'credit':
      case 'deposit':
      case 'escrow_deposit':
        return <ArrowDownLeft size={iconSize} color="#059669" />;
      case 'debit':
      case 'withdrawal':
        return <ArrowUpRight size={iconSize} color="#ef4444" />;
      case 'escrow':
        return <Clock size={iconSize} color="#f59e0b" />;
      case 'release':
      case 'contract_payment':
        return <CheckCircle2 size={iconSize} color="#059669" />;
      case 'refund':
        return <RotateCcw size={iconSize} color="#8b5cf6" />;
      default:
        return <DollarSign size={iconSize} color="#9ca3af" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit':
      case 'deposit':
      case 'release':
      case 'contract_payment':
      case 'refund':
        return '#059669';
      case 'debit':
      case 'withdrawal':
      case 'escrow_deposit':
        return '#ef4444';
      case 'escrow':
        return '#f59e0b';
      default:
        return '#4b5563';
    }
  };

  const getTransactionBgColor = (type) => {
    switch (type) {
      case 'credit':
      case 'deposit':
      case 'release':
      case 'contract_payment':
      case 'refund':
        return '#ecfdf5';
      case 'debit':
      case 'withdrawal':
      case 'escrow_deposit':
        return '#fef2f2';
      case 'escrow':
        return '#fffbeb';
      default:
        return '#f9fafb';
    }
  };

  const formatAmount = (amount, type) => {
    const prefix =
      type === 'credit' || type === 'deposit' || type === 'release' || type === 'contract_payment' || type === 'refund'
        ? '+'
        : type === 'debit' || type === 'withdrawal' || type === 'escrow_deposit'
        ? '-'
        : '';
    return `${prefix}₦${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const isLowBalance = wallet && parseFloat(wallet.balance) < LOW_BALANCE_THRESHOLD;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWallet}>
          <RefreshCw size={16} color="#ffffff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="My Wallet" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {isLowBalance && (
          <View style={styles.warningBanner}>
            <View style={styles.warningContent}>
              <AlertCircle size={20} color="#d97706" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Low Balance Warning</Text>
                <Text style={styles.warningMessage}>
                  Your balance is below ₦{LOW_BALANCE_THRESHOLD.toLocaleString()}. Add money to continue hiring freelancers.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.warningButton} onPress={openTopUpModal}>
              <Plus size={14} color="#ffffff" />
              <Text style={styles.warningButtonText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        )}

        {withdrawalOnCooldown && (
          <View style={styles.cooldownBanner}>
            <Lock size={20} color="#6b7280" />
            <View style={styles.cooldownTextContainer}>
              <Text style={styles.cooldownTitle}>Withdrawals temporarily locked</Text>
              <Text style={styles.cooldownMessage}>
                For your security, only one withdrawal is allowed every 24 hours. You can withdraw again in about {cooldownHoursLeft}h.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceHeaderLeft}>
              <Wallet size={20} color="#a7f3d0" />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={styles.eyeButton}>
              {showBalance ? <Eye size={20} color="#a7f3d0" /> : <EyeOff size={20} color="#a7f3d0" />}
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount}>
            {showBalance ? `₦${(parseFloat(wallet?.balance) || 0).toLocaleString()}` : '₦••••••'}
          </Text>

          <View style={styles.walletTypeContainer}>
            <CreditCard size={14} color="#a7f3d0" />
            <Text style={styles.walletTypeText}>VivaWork Wallet</Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={openTopUpModal}>
              <Plus size={16} color="#059669" />
              <Text style={styles.primaryButtonText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                (!wallet?.balance || parseFloat(wallet.balance) < 1000 || withdrawalOnCooldown) && styles.disabledButton,
              ]}
              onPress={openWithdrawModal}
              disabled={!wallet?.balance || parseFloat(wallet.balance) < 1000 || withdrawalOnCooldown}
            >
              {withdrawalOnCooldown ? <Lock size={16} color="#ffffff" /> : <ArrowUpRight size={16} color="#ffffff" />}
              <Text style={styles.secondaryButtonText}>
                {withdrawalOnCooldown ? `Locked (${cooldownHoursLeft}h)` : 'Withdraw'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.refreshButton]} onPress={fetchWallet}>
              <RefreshCw size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
              <ArrowDownLeft size={16} color="#059669" />
            </View>
            <Text style={styles.statLabel}>Total In</Text>
            <Text style={styles.statValue}>₦{(parseFloat(wallet?.totalIn) || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
              <ArrowUpRight size={16} color="#ef4444" />
            </View>
            <Text style={styles.statLabel}>Total Out</Text>
            <Text style={styles.statValue}>₦{(parseFloat(wallet?.totalOut) || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fffbeb' }]}>
              <Clock size={16} color="#f59e0b" />
            </View>
            <Text style={styles.statLabel}>In Escrow</Text>
            <Text style={styles.statValue}>₦{(parseFloat(wallet?.escrowBalance) || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
              <CreditCard size={16} color="#059669" />
            </View>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>
              {(parseFloat(wallet?.transactionCount) || transactions.length).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Saved Cards</Text>
              <Text style={styles.sectionSubtitle}>Quick access for future top-ups</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openTopUpModal}>
              <Plus size={14} color="#ffffff" />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {savedCards.length === 0 ? (
            <View style={styles.emptyCards}>
              <View style={styles.emptyIconContainer}>
                <CreditCard size={24} color="#9ca3af" />
              </View>
              <Text style={styles.emptyText}>
                No saved cards yet. Cards are saved automatically after your first top-up.
              </Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {savedCards.map((card) => (
                <View key={card.id} style={styles.cardItem}>
                  <View style={styles.cardIconContainer}>
                    <CreditCard size={20} color="#059669" />
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardBrand}>
                      {card.brand} •••• {card.last4}
                    </Text>
                    <Text style={styles.cardExpiry}>
                      Expires {card.expiryMonth}/{card.expiryYear}
                      {card.isDefault && <Text style={styles.defaultBadge}> Default</Text>}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteCard(card.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <Text style={styles.sectionSubtitle}>Recent activity on your wallet</Text>
            </View>
            <TouchableOpacity onPress={fetchTransactions} disabled={txLoading} style={styles.refreshIconButton}>
              <RefreshCw size={16} color="#9ca3af" style={txLoading ? styles.spinning : null} />
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <View style={styles.emptyIconContainer}>
                <CreditCard size={28} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyText}>Your transaction history will appear here</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={[styles.transactionIcon, { backgroundColor: getTransactionBgColor(tx.type) }]}>
                    {getTransactionIcon(tx.type)}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                      {tx.description || tx.type}
                    </Text>
                    <Text style={styles.transactionDate}>{formatDate(tx.createdAt)}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: getTransactionColor(tx.type) }]}>
                      {formatAmount(tx.amount, tx.type)}
                    </Text>
                    <View style={styles.transactionStatusContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          tx.status === 'completed' && styles.statusCompleted,
                          (tx.status === 'pending' || tx.status === 'processing') && styles.statusPending,
                          tx.status === 'failed' && styles.statusFailed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            tx.status === 'completed' && styles.statusCompletedText,
                            (tx.status === 'pending' || tx.status === 'processing') && styles.statusPendingText,
                            tx.status === 'failed' && styles.statusFailedText,
                          ]}
                        >
                          {tx.status}
                        </Text>
                      </View>
                      {tx.status === 'pending' && tx.paystackRef && tx.type === 'deposit' && (
                        <TouchableOpacity
                          onPress={() => manualVerify(tx.paystackRef)}
                          disabled={verifyingPayment}
                          style={styles.verifyButton}
                        >
                          {verifyingPayment ? (
                            <ActivityIndicator size="small" color="#059669" />
                          ) : (
                            <>
                              <RotateCcw size={12} color="#059669" />
                              <Text style={styles.verifyText}>Verify</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {withdrawStep === 1 && 'Withdraw Funds'}
                {withdrawStep === 2 && 'Enter OTP'}
                {withdrawStep === 3 && 'Withdrawal Successful'}
              </Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)} style={styles.closeButton}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {withdrawStep === 1 && (
                <View style={styles.formContainer}>
                  <View style={styles.securityNotice}>
                    <Shield size={16} color="#6b7280" />
                    <Text style={styles.securityText}>
                      For security, you can only make one withdrawal every 24 hours, and it must go to a bank account name matching yours.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount (₦)</Text>
                    <TextInput
                      style={styles.input}
                      value={withdrawData.amount}
                      onChangeText={(text) => setWithdrawData((prev) => ({ ...prev, amount: text }))}
                      placeholder="Min ₦1,000"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputHint}>
                      Available: ₦{(parseFloat(wallet?.balance) || 0).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bank</Text>
                    <TouchableOpacity
                      style={[styles.bankSelector, showBankList && styles.bankSelectorActive]}
                      onPress={() => setShowBankList((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.bankSelectorLeft}>
                        {withdrawData.bankName ? (
                          <View style={styles.bankAvatarSmall}>
                            <Text style={styles.bankAvatarSmallText}>
                              {withdrawData.bankName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.bankSelectorText,
                            !withdrawData.bankName && styles.bankSelectorPlaceholder,
                          ]}
                          numberOfLines={1}
                        >
                          {withdrawData.bankName || 'Select bank'}
                        </Text>
                      </View>
                      <ChevronDown
                        size={18}
                        color="#9ca3af"
                        style={showBankList ? styles.chevronOpen : null}
                      />
                    </TouchableOpacity>

                    {showBankList && (
                      <View style={styles.bankListContainer}>
                        <View style={styles.bankSearchRow}>
                          <Search size={16} color="#9ca3af" />
                          <TextInput
                            style={styles.bankSearchInput}
                            value={bankSearchQuery}
                            onChangeText={setBankSearchQuery}
                            placeholder="Search banks..."
                            placeholderTextColor="#9ca3af"
                            autoFocus
                          />
                          {bankSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setBankSearchQuery('')} hitSlop={8}>
                              <X size={16} color="#9ca3af" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {banksLoading ? (
                          <View style={styles.bankListLoading}>
                            <ActivityIndicator size="small" color="#059669" />
                            <Text style={styles.pickerPlaceholder}>Loading banks...</Text>
                          </View>
                        ) : (
                          <ScrollView
                            style={styles.bankListScroll}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                          >
                            {filteredBanks.length === 0 ? (
                              <View style={styles.bankListEmptyContainer}>
                                <AlertCircle size={18} color="#9ca3af" />
                                <Text style={styles.bankListEmpty}>No banks found</Text>
                              </View>
                            ) : (
                              filteredBanks.map((bank) => {
                                const isSelected = withdrawData.bankCode === bank.code;
                                return (
                                  <TouchableOpacity
                                    key={bank.code}
                                    style={[styles.bankListItem, isSelected && styles.bankListItemSelected]}
                                    onPress={() => {
                                      setWithdrawData((prev) => ({
                                        ...prev,
                                        bankCode: bank.code,
                                        bankName: bank.name,
                                        accountName: '',
                                      }));
                                      setShowBankList(false);
                                      setBankSearchQuery('');
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.bankAvatar}>
                                      <Text style={styles.bankAvatarText}>
                                        {bank.name.charAt(0).toUpperCase()}
                                      </Text>
                                    </View>
                                    <Text
                                      style={[
                                        styles.bankListItemText,
                                        isSelected && styles.bankListItemTextSelected,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {bank.name}
                                    </Text>
                                    {isSelected && <CheckCircle2 size={18} color="#059669" />}
                                  </TouchableOpacity>
                                );
                              })
                            )}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Account Number</Text>
                    <View style={styles.accountInputRow}>
                      <TextInput
                        style={[styles.input, styles.accountInput]}
                        value={withdrawData.accountNumber}
                        onChangeText={(text) =>
                          setWithdrawData((prev) => ({
                            ...prev,
                            accountNumber: text.replace(/\D/g, '').slice(0, 10),
                            accountName: '',
                          }))
                        }
                        placeholder="10 digits"
                        keyboardType="numeric"
                        maxLength={10}
                      />
                      <TouchableOpacity
                        style={[
                          styles.verifyAccountButton,
                          (verifyingAccount || withdrawData.accountNumber.length !== 10 || !withdrawData.bankCode) &&
                            styles.disabledButton,
                        ]}
                        onPress={verifyAccount}
                        disabled={verifyingAccount || withdrawData.accountNumber.length !== 10 || !withdrawData.bankCode}
                      >
                        {verifyingAccount ? (
                          <ActivityIndicator size="small" color="#374151" />
                        ) : (
                          <Text style={styles.verifyAccountButtonText}>Verify</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {withdrawData.accountName && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={16} color="#059669" />
                      <View>
                        <Text style={styles.verifiedName}>{withdrawData.accountName}</Text>
                        <Text style={styles.verifiedLabel}>Account verified</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (withdrawLoading || !withdrawData.accountName || !withdrawData.amount) && styles.disabledButton,
                    ]}
                    onPress={requestOtp}
                    disabled={withdrawLoading || !withdrawData.accountName || !withdrawData.amount}
                  >
                    {withdrawLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Send size={16} color="#ffffff" />
                        <Text style={styles.submitButtonText}>Request OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {withdrawStep === 2 && (
                <View style={styles.formContainer}>
                  <View style={styles.otpHeader}>
                    <View style={styles.otpIconContainer}>
                      <Clock size={28} color="#059669" />
                    </View>
                    <Text style={styles.otpInstructions}>Enter the 6-digit OTP sent to your email</Text>
                  </View>

                  {otpLocked ? (
                    <View style={styles.otpLockedContainer}>
                      <Text style={styles.otpLockedText}>
                        Too many incorrect attempts. This OTP has been locked for your protection.
                      </Text>
                      <TouchableOpacity onPress={() => setWithdrawStep(1)}>
                        <Text style={styles.otpLockedLink}>Request a new OTP</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, styles.centeredLabel]}>OTP Code</Text>
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          value={otpCode}
                          onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          keyboardType="numeric"
                          maxLength={6}
                          autoFocus
                        />
                        {otpAttemptsLeft !== null && (
                          <Text style={styles.attemptsText}>
                            {otpAttemptsLeft} attempt{otpAttemptsLeft === 1 ? '' : 's'} remaining
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[styles.submitButton, (withdrawLoading || otpCode.length !== 6) && styles.disabledButton]}
                        onPress={confirmWithdrawal}
                        disabled={withdrawLoading || otpCode.length !== 6}
                      >
                        {withdrawLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} color="#ffffff" />
                            <Text style={styles.submitButtonText}>Confirm Withdrawal</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setWithdrawStep(1)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back to details</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {withdrawStep === 3 && withdrawResult && (
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <CheckCircle2 size={32} color="#059669" />
                  </View>
                  <Text style={styles.successTitle}>Withdrawal Successful!</Text>
                  <Text style={styles.successMessage}>
                    ₦{withdrawResult.amount?.toLocaleString()} has been sent to your bank account
                  </Text>

                  <View style={styles.successDetails}>
                    <View style={styles.successRow}>
                      <Text style={styles.successLabel}>Reference</Text>
                      <Text style={styles.successValue}>{withdrawResult.reference}</Text>
                    </View>
                    <View style={styles.successRow}>
                      <Text style={styles.successLabel}>Status</Text>
                      <Text style={[styles.successValue, { color: '#059669' }]}>{withdrawResult.status}</Text>
                    </View>
                    {withdrawResult.nextWithdrawalAvailableAt && (
                      <View style={styles.successRow}>
                        <Text style={styles.successLabel}>Next withdrawal available</Text>
                        <Text style={styles.successValue}>
                          {new Date(withdrawResult.nextWithdrawalAvailableAt).toLocaleString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity style={styles.submitButton} onPress={() => setShowWithdrawModal(false)}>
                    <Text style={styles.submitButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showTopUpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTopUpModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Money</Text>
                <Text style={styles.modalSubtitle}>Fund your wallet securely</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)} style={styles.closeButton}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.currentBalanceCard}>
                <View style={styles.currentBalanceIcon}>
                  <Wallet size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.currentBalanceLabel}>Current Balance</Text>
                  <Text style={styles.currentBalanceValue}>
                    ₦{(parseFloat(wallet?.balance) || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₦)</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₦</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.inputHint}>Minimum top-up: ₦100</Text>
              </View>

              <View style={styles.quickAmountsGrid}>
                {[1000, 5000, 10000, 50000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickAmountButton, topUpAmount === amt.toString() && styles.quickAmountSelected]}
                    onPress={() => setTopUpAmount(amt.toString())}
                  >
                    <Text style={[styles.quickAmountText, topUpAmount === amt.toString() && styles.quickAmountTextSelected]}>
                      ₦{amt.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.securityNotice}>
                <Shield size={16} color="#059669" />
                <Text style={[styles.securityText, { color: '#047857' }]}>
                  Secured by Paystack. Your card details are encrypted and never stored on our servers.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, (topUpLoading || !topUpAmount) && styles.disabledButton]}
                onPress={handleTopUp}
                disabled={topUpLoading || !topUpAmount}
              >
                {topUpLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Banknote size={16} color="#ffffff" />
                    <Text style={styles.submitButtonText}>
                      Pay ₦{topUpAmount ? parseFloat(topUpAmount).toLocaleString() : '0'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {savedCards.length > 0 && (
                <View style={styles.savedCardsSection}>
                  <Text style={styles.savedCardsTitle}>Your saved cards</Text>
                  {savedCards.map((card) => (
                    <View key={card.id} style={styles.savedCardItem}>
                      <CreditCard size={16} color="#059669" />
                      <View style={styles.savedCardDetails}>
                        <Text style={styles.savedCardBrand}>
                          {card.brand} •••• {card.last4}
                        </Text>
                        <Text style={styles.savedCardExpiry}>
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <Text style={styles.savedCardsNote}>
                    Enter an amount above and pay — Paystack will offer your saved card at checkout.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 14,
    color: '#b45309',
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  cooldownBanner: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cooldownTextContainer: {
    flex: 1,
  },
  cooldownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  cooldownMessage: {
    fontSize: 14,
    color: '#4b5563',
  },
  balanceCard: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    marginBottom: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a7f3d0',
  },
  eyeButton: {
    padding: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  walletTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  walletTypeText: {
    fontSize: 12,
    color: '#a7f3d0',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  primaryButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshIconButton: {
    padding: 8,
  },
  spinning: {
    opacity: 0.5,
  },
  emptyCards: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTransactions: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  cardsList: {
    padding: 16,
    paddingTop: 8,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  cardExpiry: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  defaultBadge: {
    color: '#059669',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  transactionsList: {
    padding: 16,
    paddingTop: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#ecfdf5',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusFailed: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusCompletedText: {
    color: '#059669',
  },
  statusPendingText: {
    color: '#d97706',
  },
  statusFailedText: {
    color: '#ef4444',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifyText: {
    fontSize: 10,
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  formContainer: {
    gap: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  centeredLabel: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputHint: {
    fontSize: 11,
    color: '#9ca3af',
  },
  pickerPlaceholder: {
    color: '#9ca3af',
    fontSize: 14,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  bankSelectorActive: {
    borderColor: '#059669',
  },
  bankSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  bankSelectorText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  bankSelectorPlaceholder: {
    color: '#9ca3af',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  bankAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankAvatarSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  bankListContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  bankSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  bankSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 2,
  },
  bankListScroll: {
    maxHeight: 240,
  },
  bankListLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  bankListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  bankListItemSelected: {
    backgroundColor: '#ecfdf5',
  },
  bankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  bankListItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  bankListItemTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  bankListEmptyContainer: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  bankListEmpty: {
    color: '#9ca3af',
    fontSize: 13,
  },
  accountInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  accountInput: {
    flex: 1,
  },
  verifyAccountButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  verifyAccountButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 12,
  },
  verifiedName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065f46',
  },
  verifiedLabel: {
    fontSize: 11,
    color: '#059669',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 13,
    color: '#6b7280',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  otpIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  otpInstructions: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  attemptsText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
  },
  otpLockedContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  otpLockedText: {
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
  },
  otpLockedLink: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  successMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  successValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  currentBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  currentBalanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentBalanceLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  currentBalanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  quickAmountSelected: {
    backgroundColor: '#059669',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  quickAmountTextSelected: {
    color: '#ffffff',
  },
  savedCardsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    gap: 12,
  },
  savedCardsTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  savedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  savedCardDetails: {
    flex: 1,
  },
  savedCardBrand: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  savedCardExpiry: {
    fontSize: 11,
    color: '#9ca3af',
  },
  savedCardsNote: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default WalletScreen;