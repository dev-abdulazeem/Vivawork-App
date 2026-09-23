
// Requires (install if not already present):
//   npm install socket.io-client @react-native-async-storage/async-storage
//   npm install react-native-webrtc
//   npx expo install expo-image-picker expo-document-picker
//     (swap expo-image-picker for react-native-image-picker if this
//      project is on the bare workflow rather than Expo)
//
// Native setup needed once:
//   - Camera + microphone permissions (Info.plist / AndroidManifest,
//     or app.json "plugins" if using Expo config plugins)
//   - react-native-webrtc's own install steps (pod install on iOS)
//   - Incoming calls ring via device vibration (no audio asset
//     required) — swap in expo-av if you want an actual ringtone sound
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Linking,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import {
  ChevronLeft,
  MoreHorizontal,
  Send,
  Paperclip,
  Video,
  PhoneCall,
  HandCoins,
  Briefcase,
  Star,
  CheckCircle2,
  X,
  ListChecks,
  FileText,
  BadgeCheck,
} from 'lucide-react-native';

import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  C,
  Avatar,
  OfferCard,
  CallHistoryBubble,
  MessageBubble,
  IncomingCallOverlay,
  OutgoingCallOverlay,
  ActiveCallOverlay,
  formatDate,
} from '../components/ChatShared';

// Optional deps — imported defensively so the screen still renders
// (minus calling / attachments) if a package isn't installed yet.
let RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices, RTCView;
try {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
  RTCView = webrtc.RTCView;
} catch (e) {
  // react-native-webrtc not installed — calling buttons will show a notice.
}

let ImagePicker;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {}

let DocumentPicker;
try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {}

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const ChatScreen = ({ route, navigation }) => {
  const { user: currentUser } = useAuth();
  const { userId, user: otherUserParam } = route.params;

  const [otherUser, setOtherUser] = useState(otherUserParam || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);

  // Offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    amount: '',
    title: '',
    description: '',
    type: 'direct_hire',
    durationDays: '7',
    revisions: '3',
    deliverables: [''],
  });
  const [milestones, setMilestones] = useState([]);
  const [sendingOffer, setSendingOffer] = useState(false);

  // Call state
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle | ringing | ongoing
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callDuration, setCallDuration] = useState(0);
  const [localStreamURL, setLocalStreamURL] = useState(null);
  const [remoteStreamURL, setRemoteStreamURL] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [currentCallRoom, setCurrentCallRoom] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callTimerRef = useRef(null);
  const ringtoneRef = useRef(null);
  const pendingOffersRef = useRef([]);

  // ─── FETCH MESSAGES ────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/messages/conversation/${userId}`);
      setMessages(response.data.messages || []);
      api.patch(`/messages/read/${userId}`).catch(() => {});
    } catch (err) {
      console.error('Fetch messages error:', err);
      if (err.response?.data?.code === 'BLOCKED') {
        Alert.alert('Unavailable', 'This conversation is unavailable');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // ─── SOCKET.IO ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    let newSocket;

    (async () => {
      const token = (await AsyncStorage.getItem('accessToken')) || '';
      newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { token },
      });

      newSocket.on('connect', () => {
        newSocket.emit('join-user-room', currentUser.id);
      });

      newSocket.on('new_message', (message) => {
        if (message.senderId === userId) {
          setMessages((prev) => [...prev, message]);
          api.patch(`/messages/read/${userId}`).catch(() => {});
          scrollToBottom();
        }
      });

      newSocket.on('messages_read', ({ by }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUser.id && m.receiverId === by ? { ...m, isRead: true } : m
          )
        );
      });

      newSocket.on('user_typing', (data) => {
        if (data.userId === userId) {
          setTypingUser(data.firstName);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      });

      // ── Calling ──
      newSocket.on('incoming-call', async (data) => {
        let callerName = data.callerName;
        let callerAvatar = data.callerAvatar;
        if (!callerName && data.callerId) {
          try {
            const res = await api.get(`/users/profile/${data.callerId}`);
            callerName = `${res.data.user.firstName} ${res.data.user.lastName}`;
            callerAvatar = res.data.user.avatar;
          } catch {
            callerName = 'Someone';
          }
        }
        setIncomingCall({ ...data, callerName: callerName || 'Someone', callerAvatar: callerAvatar || null });
        setCallStatus('ringing');
        playRingtone();
      });

      newSocket.on('call-accepted', () => {
        setCallStatus('ongoing');
        setIsInCall(true);
        callStartTimeRef.current = Date.now();
        startCallTimer();
        stopRingtone();
      });

      newSocket.on('call-declined', () => {
        stopRingtone();
        Alert.alert('Call declined');
        resetCallState();
      });

      newSocket.on('call-ended', (data) => {
        stopRingtone();
        handleCallEnd(data?.duration);
      });

      newSocket.on('webrtc-offer', async (data) => {
        if (!peerConnectionRef.current) {
          pendingOffersRef.current.push(data);
          return;
        }
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          newSocket.emit('webrtc-answer', { roomId: data.roomId, answer });
        } catch (err) {
          console.error('Offer handling error:', err);
        }
      });

      newSocket.on('webrtc-answer', async (data) => {
        if (!peerConnectionRef.current) return;
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Answer handling error:', err);
        }
      });

      newSocket.on('webrtc-ice-candidate', async (data) => {
        if (!peerConnectionRef.current) return;
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('ICE candidate error:', err);
        }
      });

      setSocket(newSocket);
    })();

    return () => {
      clearTimeout(typingTimeoutRef.current);
      newSocket?.disconnect();
      endLocalCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, userId]);

  // ─── RINGTONE ──────────────────────────────────────────────────
  // Uses device vibration for the incoming-call alert so this screen
  // works with zero extra assets. If you'd rather play an actual
  // ringtone sound, install expo-av, add your own audio file under
  // assets/, and swap this for an Audio.Sound.createAsync() call.
  const RING_PATTERN = [0, 700, 400];
  const playRingtone = () => {
    ringtoneRef.current = true;
    Vibration.vibrate(RING_PATTERN, true);
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      Vibration.cancel();
      ringtoneRef.current = null;
    }
  };

  // ─── CALL TIMER ────────────────────────────────────────────────
  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
  };
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // ─── WEBRTC ────────────────────────────────────────────────────
  const startWebRTC = async (roomId, isCaller) => {
    if (!RTCPeerConnection || !mediaDevices) {
      Alert.alert('Calling unavailable', 'react-native-webrtc is not installed in this project yet.');
      resetCallState();
      return;
    }
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStreamURL(stream.toURL());

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate });
        }
      };
      pc.ontrack = (event) => {
        if (event.streams?.[0]) setRemoteStreamURL(event.streams[0].toURL());
      };
      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed'].includes(pc.connectionState)) handleCallEnd();
      };

      peerConnectionRef.current = pc;

      if (!isCaller && pendingOffersRef.current.length > 0) {
        for (const pending of pendingOffersRef.current) {
          if (pending.roomId === roomId) {
            await pc.setRemoteDescription(new RTCSessionDescription(pending.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { roomId, answer });
          }
        }
        pendingOffersRef.current = [];
      }

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { roomId, offer });
      }

      socket.emit('join-call-room', roomId);
    } catch (err) {
      console.error('WebRTC error:', err);
      Alert.alert('Could not start call', 'Check camera/microphone permissions and try again.');
      resetCallState();
    }
  };

  const resetCallState = () => {
    stopCallTimer();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStreamURL(null);
    setRemoteStreamURL(null);
    setIsInCall(false);
    setCallStatus('idle');
    setIncomingCall(null);
    setCurrentCallRoom(null);
    setCurrentCallId(null);
    setCallDuration(0);
    callStartTimeRef.current = null;
    pendingOffersRef.current = [];
  };

  const endLocalCall = useCallback(async () => {
    const duration = callStartTimeRef.current ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : 0;
    const callId = currentCallId;
    resetCallState();
    stopRingtone();
    if (callId) {
      try {
        await api.patch(`/messages/call/${callId}/end`, { duration });
      } catch {}
    }
    socket?.emit('call-end', { roomId: currentCallRoom, callId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCallId, currentCallRoom, socket]);

  const handleCallEnd = async (serverDuration) => {
    const duration = serverDuration ?? (callStartTimeRef.current ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : 0);
    const wasOutgoing = incomingCall === null;
    resetCallState();
    stopRingtone();

    const historyMsg = {
      id: `call-${Date.now()}`,
      senderId: wasOutgoing ? currentUser.id : userId,
      createdAt: new Date().toISOString(),
      isRead: true,
      isCallHistory: true,
      callDuration: duration,
      callType,
      callDirection: wasOutgoing ? 'outgoing' : 'incoming',
    };
    setMessages((prev) => [...prev, historyMsg]);
    scrollToBottom();

    try {
      await api.post('/messages/call-history', {
        receiverId: userId,
        duration,
        callType,
        direction: wasOutgoing ? 'outgoing' : 'incoming',
      });
    } catch (err) {
      console.error('Save call history error:', err);
    }
  };

  const initiateCall = async (type = 'video') => {
    if (!socket) return;
    if (!RTCPeerConnection) {
      Alert.alert('Calling unavailable', 'react-native-webrtc is not installed in this project yet.');
      return;
    }
    setCallType(type);
    try {
      const response = await api.post('/messages/call/initiate', { receiverId: userId, callType: type });
      const { call } = response.data;
      setCurrentCallRoom(call.roomId);
      setCurrentCallId(call.id);
      setCallStatus('ringing');
      setIsInCall(true);
      await startWebRTC(call.roomId, true);
      socket.emit('call-initiate', {
        callId: call.id,
        roomId: call.roomId,
        callerId: currentUser.id,
        receiverId: userId,
        callType: type,
        callerName: `${currentUser.firstName} ${currentUser.lastName}`,
        callerAvatar: currentUser.avatar,
      });
    } catch (err) {
      console.error('Initiate call error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start call');
      resetCallState();
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall || !socket) return;
    setCallType(incomingCall.callType || 'video');
    setCurrentCallRoom(incomingCall.roomId);
    setCurrentCallId(incomingCall.callId);
    setCallStatus('ongoing');
    setIsInCall(true);
    callStartTimeRef.current = Date.now();
    startCallTimer();
    stopRingtone();
    await startWebRTC(incomingCall.roomId, false);
    socket.emit('call-accept', { roomId: incomingCall.roomId, receiverId: currentUser.id, callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const declineIncomingCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('call-decline', { roomId: incomingCall.roomId, callId: incomingCall.callId });

    setMessages((prev) => [
      ...prev,
      {
        id: `missed-${Date.now()}`,
        senderId: incomingCall.callerId,
        createdAt: new Date().toISOString(),
        isRead: true,
        isCallHistory: true,
        callDuration: 0,
        callType: incomingCall.callType,
        callDirection: 'missed',
      },
    ]);
    setIncomingCall(null);
    setCallStatus('idle');
    stopRingtone();
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
      socket?.emit('call-toggle-audio', { roomId: currentCallRoom, enabled: track.enabled });
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks?.()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
      socket?.emit('call-toggle-video', { roomId: currentCallRoom, enabled: track.enabled });
    }
  };

  // ─── TEXT MESSAGES ─────────────────────────────────────────────
  const handleInputChange = (text) => {
    setMessageText(text);
    if (socket && text.trim()) socket.emit('typing', { receiverId: userId });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    const content = messageText.trim();
    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        senderId: currentUser.id,
        receiverId: userId,
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ]);
    setMessageText('');
    scrollToBottom();
    socket?.emit('send_message', { receiverId: userId, content });

    try {
      setIsSending(true);
      const response = await api.post('/messages', { receiverId: userId, content });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...response.data.data, content } : m)));
    } catch (err) {
      console.error('Send error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = (messageId) => {
    Alert.alert('Delete message?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch {
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  const openFile = (url) => {
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open file'));
  };

  // ─── FILE UPLOAD ───────────────────────────────────────────────
  const pickAndSendFile = async () => {
    if (!ImagePicker && !DocumentPicker) {
      Alert.alert('Attachments unavailable', 'Install expo-image-picker / expo-document-picker to enable file sharing.');
      return;
    }
    Alert.alert('Attach', 'Choose a file type', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Photo', onPress: pickImage },
      { text: 'Document', onPress: pickDocument },
    ]);
  };

  const uploadPickedFile = async (fileAsset, isImage) => {
    const tempId = `file-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: currentUser.id,
        createdAt: new Date().toISOString(),
        isRead: false,
        fileUrl: fileAsset.uri,
        fileName: fileAsset.name || (isImage ? 'photo.jpg' : 'file'),
        fileType: fileAsset.mimeType || (isImage ? 'image/jpeg' : 'application/octet-stream'),
        isUploading: true,
      },
    ]);
    scrollToBottom();

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name || (isImage ? 'photo.jpg' : 'file'),
        type: fileAsset.mimeType || (isImage ? 'image/jpeg' : 'application/octet-stream'),
      });
      formData.append('receiverId', userId);

      const response = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...response.data.data, isUploading: false } : m)));
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload file');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploadingFile(false);
    }
  };

  const pickImage = async () => {
    if (!ImagePicker) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      uploadPickedFile({ uri: a.uri, name: a.fileName, mimeType: a.mimeType }, true);
    }
  };

  const pickDocument = async () => {
    if (!DocumentPicker) return;
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      uploadPickedFile({ uri: a.uri, name: a.name, mimeType: a.mimeType }, a.mimeType?.startsWith('image/'));
    }
  };

  // ─── OFFERS ────────────────────────────────────────────────────
  const addDeliverable = () => setOfferData((p) => ({ ...p, deliverables: [...p.deliverables, ''] }));
  const updateDeliverable = (i, v) =>
    setOfferData((p) => {
      const d = [...p.deliverables];
      d[i] = v;
      return { ...p, deliverables: d };
    });
  const removeDeliverable = (i) =>
    setOfferData((p) => ({ ...p, deliverables: p.deliverables.filter((_, idx) => idx !== i) }));

  const addMilestone = () => setMilestones((p) => [...p, { title: '', amount: '', dueDays: '' }]);
  const updateMilestone = (i, field, v) =>
    setMilestones((p) => {
      const m = [...p];
      m[i] = { ...m[i], [field]: v };
      return m;
    });
  const removeMilestone = (i) => setMilestones((p) => p.filter((_, idx) => idx !== i));

  const resetOfferForm = () => {
    setOfferData({ amount: '', title: '', description: '', type: 'direct_hire', durationDays: '7', revisions: '3', deliverables: [''] });
    setMilestones([]);
  };

  const sendOffer = async () => {
    const amount = parseFloat(offerData.amount);
    if (!amount || amount < 100) {
      Alert.alert('Invalid amount', 'Minimum offer amount is ₦100');
      return;
    }
    if (!offerData.title.trim()) {
      Alert.alert('Missing title', 'Please add a title for this offer');
      return;
    }
    const deliverablesList = offerData.deliverables.filter((d) => d.trim() !== '');

    try {
      setSendingOffer(true);
      const response = await api.post('/messages/offers', {
        receiverId: userId,
        amount,
        title: offerData.title,
        description: offerData.description,
        type: offerData.type,
        durationDays: parseInt(offerData.durationDays) || 7,
        revisions: parseInt(offerData.revisions) || 3,
        deliverables: deliverablesList,
        milestones: milestones.length > 0 ? milestones : undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: response.data.offer.messageId,
          senderId: currentUser.id,
          createdAt: new Date().toISOString(),
          isRead: false,
          offer: response.data.offer,
        },
      ]);
      setShowOfferModal(false);
      resetOfferForm();
      scrollToBottom();
    } catch (err) {
      console.error('Send offer error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  const acceptOffer = async (offerId) => {
    setMessages((prev) => prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'accepted' } } : m)));
    try {
      const response = await api.patch(`/messages/offers/${offerId}/accept`);
      setMessages((prev) =>
        prev.map((m) =>
          m.offer?.id === offerId
            ? { ...m, offer: { ...m.offer, status: 'accepted', contractId: response.data.contract?.id } }
            : m
        )
      );
      if (response.data.contract?.id) {
        setTimeout(() => navigation.navigate('ContractDetail', { contractId: response.data.contract.id }), 600);
      }
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'pending' } } : m)));
      const msg = err.response?.data?.message || 'Failed to accept offer';
      if (err.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        Alert.alert(
          'Insufficient balance',
          `${msg} (Need ₦${err.response.data.required?.toLocaleString()}, have ₦${err.response.data.current?.toLocaleString()})`
        );
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  const rejectOffer = async (offerId) => {
    setMessages((prev) => prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'rejected' } } : m)));
    try {
      await api.patch(`/messages/offers/${offerId}/reject`);
    } catch {
      setMessages((prev) => prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'pending' } } : m)));
      Alert.alert('Error', 'Failed to reject offer');
    }
  };

  const cancelOffer = (offerId) => {
    Alert.alert('Cancel offer?', 'The recipient will be notified.', [
      { text: 'Keep offer', style: 'cancel' },
      {
        text: 'Cancel offer',
        style: 'destructive',
        onPress: async () => {
          setMessages((prev) => prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'cancelled' } } : m)));
          try {
            await api.patch(`/messages/offers/${offerId}/cancel`);
          } catch {
            setMessages((prev) => prev.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: 'pending' } } : m)));
            Alert.alert('Error', 'Failed to cancel offer');
          }
        },
      },
    ]);
  };

  // ─── ARCHIVE / BLOCK ───────────────────────────────────────────
  const archiveConversation = async () => {
    try {
      await api.post(`/messages/archive/${userId}`);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to archive conversation');
    }
  };

  const blockContact = () => {
    Alert.alert('Block contact', `Block ${otherUser?.firstName}? They won't be able to message or call you.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/messages/block/${userId}`);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to block contact');
          }
        },
      },
    ]);
  };

  const handleChatMenu = () => {
    setShowChatMenu(false);
    Alert.alert(`${otherUser?.firstName} ${otherUser?.lastName}`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive Chat', onPress: archiveConversation },
      { text: 'Block Contact', style: 'destructive', onPress: blockContact },
    ]);
  };

  // ─── DATE GROUPING ─────────────────────────────────────────────
  const groupedData = React.useMemo(() => {
    const groups = [];
    let lastDateKey = null;
    messages.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (dateKey !== lastDateKey) {
        groups.push({ type: 'date', id: `date-${dateKey}`, label: formatDate(dateKey) });
        lastDateKey = dateKey;
      }
      groups.push({ type: 'message', id: String(msg.id), msg });
    });
    return groups;
  }, [messages]);

  const FileIconFor = (fileType, isMe) => <FileText size={16} color={isMe ? C.white : C.slate600} strokeWidth={2} />;

  // ─── RENDER ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.emerald600} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <IncomingCallOverlay call={incomingCall} onAccept={acceptIncomingCall} onDecline={declineIncomingCall} />
      <OutgoingCallOverlay
        visible={isInCall && callStatus === 'ringing' && !incomingCall}
        calleeFirstName={otherUser?.firstName}
        calleeLastName={otherUser?.lastName}
        calleeAvatar={otherUser?.avatar}
        callType={callType}
        onCancel={endLocalCall}
      />
      <ActiveCallOverlay
        visible={isInCall && callStatus === 'ongoing'}
        callType={callType}
        duration={callDuration}
        localStreamURL={localStreamURL}
        remoteStreamURL={remoteStreamURL}
        otherFirstName={otherUser?.firstName}
        otherLastName={otherUser?.lastName}
        otherAvatar={otherUser?.avatar}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEnd={endLocalCall}
        RTCViewComp={RTCView}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft size={24} color={C.slate700} strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerIdentity}
          onPress={() => navigation.navigate('Profile', { userId })}
          activeOpacity={0.7}
        >
          <Avatar uri={otherUser?.avatar} firstName={otherUser?.firstName} lastName={otherUser?.lastName} size={38} />
          <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUser?.firstName} {otherUser?.lastName}
              </Text>
              {otherUser?.isVerified && <BadgeCheck size={13} color={C.blue500} strokeWidth={2.4} />}
            </View>
            <Text style={styles.headerStatus} numberOfLines={1}>
              {typingUser ? `${typingUser} is typing…` : 'Active now'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => initiateCall('video')} disabled={isInCall}>
            <Video size={18} color={isInCall ? C.slate300 : C.emerald600} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => initiateCall('audio')} disabled={isInCall}>
            <PhoneCall size={17} color={isInCall ? C.slate300 : C.emerald600} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={handleChatMenu}>
            <MoreHorizontal size={18} color={C.slate500} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={groupedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>{item.label}</Text>
              </View>
            );
          }
          const msg = item.msg;
          const isMe = msg.senderId === currentUser?.id;

          if (msg.isCallHistory) {
            return <CallHistoryBubble msg={msg} onCallBack={(type) => initiateCall(type)} />;
          }
          if (msg.offer) {
            return (
              <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', paddingHorizontal: 12 }}>
                <OfferCard
                  offer={msg.offer}
                  isMe={isMe}
                  otherUserFirstName={otherUser?.firstName}
                  senderFirstName={isMe ? currentUser?.firstName : otherUser?.firstName}
                  onAccept={acceptOffer}
                  onReject={rejectOffer}
                  onCancel={cancelOffer}
                  onViewContract={(id) => navigation.navigate('ContractDetail', { contractId: id })}
                />
              </View>
            );
          }
          return <MessageBubble msg={msg} isMe={isMe} onDelete={deleteMessage} onOpenFile={openFile} FileIconFor={FileIconFor} />;
        }}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Say hello to start the conversation</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputWrap}>
          <TouchableOpacity style={styles.iconBtn} onPress={pickAndSendFile} disabled={uploadingFile}>
            {uploadingFile ? <ActivityIndicator size="small" color={C.slate400} /> : <Paperclip size={19} color={C.slate500} strokeWidth={2} />}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={`Message ${otherUser?.firstName || ''}…`}
            placeholderTextColor={C.slate400}
            value={messageText}
            onChangeText={handleInputChange}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowOfferModal(true)}>
            <HandCoins size={19} color={C.emerald600} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? <ActivityIndicator size="small" color={C.white} /> : <Send size={17} color={C.white} strokeWidth={2.4} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Offer modal */}
      <Modal visible={showOfferModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Send Offer</Text>
                <Text style={styles.modalSubtitle}>
                  To {otherUser?.firstName} {otherUser?.lastName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowOfferModal(false)} style={styles.modalCloseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={C.slate600} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 36 }}>
              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (₦)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="50,000"
                  keyboardType="decimal-pad"
                  value={offerData.amount}
                  onChangeText={(v) => setOfferData({ ...offerData, amount: v })}
                />
                <Text style={styles.formHint}>Minimum ₦100</Text>
              </View>

              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mobile App Development"
                  value={offerData.title}
                  onChangeText={(v) => setOfferData({ ...offerData, title: v })}
                />
              </View>

              {/* Duration / Revisions */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Duration (days)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="number-pad"
                    value={offerData.durationDays}
                    onChangeText={(v) => setOfferData({ ...offerData, durationDays: v })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Revisions</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="number-pad"
                    value={offerData.revisions}
                    onChangeText={(v) => setOfferData({ ...offerData, revisions: v })}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Describe the work…"
                  multiline
                  value={offerData.description}
                  onChangeText={(v) => setOfferData({ ...offerData, description: v })}
                />
              </View>

              {/* Deliverables */}
              <View style={styles.formGroup}>
                <View style={styles.formSectionHead}>
                  <Text style={styles.formLabel}>Deliverables</Text>
                  <TouchableOpacity onPress={addDeliverable}>
                    <Text style={styles.addLink}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {offerData.deliverables.map((item, index) => (
                  <View key={index} style={styles.deliverableRow}>
                    <ListChecks size={15} color={C.slate400} strokeWidth={2} />
                    <TextInput
                      style={styles.deliverableInput}
                      placeholder={`Deliverable ${index + 1}`}
                      value={item}
                      onChangeText={(v) => updateDeliverable(index, v)}
                    />
                    {offerData.deliverables.length > 1 && (
                      <TouchableOpacity onPress={() => removeDeliverable(index)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <X size={15} color={C.slate400} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Milestones */}
              <View style={styles.formGroup}>
                <View style={styles.formSectionHead}>
                  <Text style={styles.formLabel}>Milestones (optional)</Text>
                  <TouchableOpacity onPress={addMilestone}>
                    <Text style={styles.addLink}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {milestones.map((m, index) => (
                  <View key={index} style={styles.milestoneCard}>
                    <View style={styles.formSectionHead}>
                      <Text style={styles.milestoneCardLabel}>Milestone {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeMilestone(index)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <X size={14} color={C.slate400} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Title"
                      value={m.title}
                      onChangeText={(v) => updateMilestone(index, 'title', v)}
                    />
                    <View style={styles.formRow}>
                      <TextInput
                        style={[styles.formInput, { flex: 1 }]}
                        placeholder="Amount (₦)"
                        keyboardType="decimal-pad"
                        value={m.amount}
                        onChangeText={(v) => updateMilestone(index, 'amount', v)}
                      />
                      <TextInput
                        style={[styles.formInput, { flex: 1 }]}
                        placeholder="Due (days)"
                        keyboardType="number-pad"
                        value={m.dueDays}
                        onChangeText={(v) => updateMilestone(index, 'dueDays', v)}
                      />
                    </View>
                  </View>
                ))}
              </View>

              {/* Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeRow}>
                  {[
                    { value: 'direct_hire', label: 'Direct Hire', Icon: Briefcase },
                    { value: 'custom_job', label: 'Custom Job', Icon: Star },
                    { value: 'milestone', label: 'Milestone', Icon: CheckCircle2 },
                  ].map(({ value, label, Icon }) => {
                    const active = offerData.type === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.typeBtn, active && styles.typeBtnActive]}
                        onPress={() => setOfferData({ ...offerData, type: value })}
                      >
                        <Icon size={16} color={active ? C.emerald600 : C.slate400} strokeWidth={2} />
                        <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={[styles.submitBtn, sendingOffer && styles.submitBtnDisabled]} onPress={sendOffer} disabled={sendingOffer}>
                {sendingOffer ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <>
                    <HandCoins size={17} color={C.white} strokeWidth={2.2} />
                    <Text style={styles.submitBtnText}>Send Offer</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.white,
  },
  headerBackBtn: { padding: 6, marginRight: 4 },
  headerIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerName: { fontSize: 15, fontWeight: '700', color: C.slate900 },
  headerStatus: { fontSize: 11.5, color: C.emerald600, fontWeight: '600', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesList: { paddingVertical: 12, flexGrow: 1 },
  dateSeparator: { alignItems: 'center', marginVertical: 10 },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.slate400,
    backgroundColor: C.slate50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.slate700 },
  emptySubtitle: { fontSize: 12.5, color: C.slate400, marginTop: 4 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.slate100,
    backgroundColor: C.white,
  },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    backgroundColor: C.slate50,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14.5,
    color: C.slate900,
    maxHeight: 110,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.slate200 },

  // Offer modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)' },
  modalContainer: { flex: 1, marginTop: 60, backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.slate900 },
  modalSubtitle: { fontSize: 12, color: C.slate400, marginTop: 2 },
  modalCloseBtn: { padding: 6, backgroundColor: C.slate100, borderRadius: 999 },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },

  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  formLabel: { fontSize: 12.5, fontWeight: '700', color: C.slate700, marginBottom: 7 },
  formHint: { fontSize: 11, color: C.slate400, marginTop: 5 },
  formInput: {
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 14,
    color: C.slate900,
    height: 44,
    marginBottom: 10,
  },
  formTextArea: { height: 84, paddingTop: 10, textAlignVertical: 'top' },
  formSectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addLink: { fontSize: 12.5, fontWeight: '700', color: C.emerald600 },
  deliverableRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  deliverableInput: {
    flex: 1,
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13.5,
    color: C.slate900,
  },
  milestoneCard: { backgroundColor: C.slate50, borderRadius: 12, borderWidth: 1, borderColor: C.slate100, padding: 12, marginBottom: 10 },
  milestoneCardLabel: { fontSize: 11.5, fontWeight: '700', color: C.slate500 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
  },
  typeBtnActive: { borderColor: C.emerald300, backgroundColor: C.emerald50 },
  typeBtnText: { fontSize: 11.5, fontWeight: '600', color: C.slate500 },
  typeBtnTextActive: { color: C.emerald700 },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.emerald600,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: C.white, fontWeight: '700', fontSize: 14.5 },
});

export default ChatScreen;