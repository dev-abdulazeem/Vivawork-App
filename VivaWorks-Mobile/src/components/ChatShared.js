import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Calendar,
  RotateCcw,
  ListChecks,
  Shield,
  Eye,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
} from 'lucide-react-native';

// ─── COLOR SYSTEM (flat, matches the web app's emerald palette) ───
export const C = {
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald300: '#6ee7b7',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red500: '#ef4444',
  red600: '#dc2626',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  blue500: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
  amber500: '#f59e0b',
};

// ─── HELPERS ────────────────────────────────────────────────────
export const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatDate(dateString);
};

export const formatCallDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getInitials = (firstName, lastName) => {
  const f = firstName?.trim()?.[0] || '';
  const l = lastName?.trim()?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
};

// Strips any stray emoji that may still arrive from older stored
// message content (e.g. legacy "call" previews), so nothing emoji-like
// ever renders in the UI.
export const stripEmoji = (text) => {
  if (!text) return '';
  try {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '')
      .trim();
  } catch {
    return text;
  }
};

// ─── AVATAR ─────────────────────────────────────────────────────
export const Avatar = ({ uri, firstName, lastName, size = 52 }) => {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[s.avatarImg, dim]} />;
  }
  return (
    <View style={[s.avatarFallback, dim]}>
      <Text style={[s.avatarFallbackText, { fontSize: size * 0.36 }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
};

// ─── OFFER / CONTRACT CARD ──────────────────────────────────────
// Clean, flat design — one accent color (emerald), no gradients.
export const OfferCard = ({
  offer,
  isMe,
  otherUserFirstName,
  senderFirstName,
  onAccept,
  onReject,
  onCancel,
  onViewContract,
}) => {
  if (!offer) return null;

  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';
  const isRejected = offer.status === 'rejected';
  const isCancelled = offer.status === 'cancelled';

  const statusConfig = {
    pending: { icon: Clock, label: 'Pending', tint: C.amber500, bg: C.slate50 },
    accepted: { icon: CheckCircle2, label: 'Accepted · Active', tint: C.emerald600, bg: C.emerald50 },
    rejected: { icon: XCircle, label: 'Declined', tint: C.red500, bg: C.red50 },
    cancelled: { icon: X, label: 'Cancelled', tint: C.slate500, bg: C.slate100 },
  };
  const status = statusConfig[offer.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const recipientLabel = isMe ? (otherUserFirstName || 'Freelancer') : 'You';
  const initiatorLabel = isMe ? 'You' : (senderFirstName || 'They');

  return (
    <View style={s.offerCard}>
      {/* Header */}
      <View style={s.offerHeader}>
        <View style={s.offerIconWrap}>
          <Briefcase size={16} color={C.emerald600} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.offerLabel}>JOB OFFER</Text>
          <Text style={s.offerType} numberOfLines={1}>
            {offer.type?.replace(/_/g, ' ').toUpperCase() || 'DIRECT HIRE'}
          </Text>
        </View>
      </View>

      <View style={s.offerBody}>
        {/* Amount */}
        <Text style={s.offerAmountLabel}>Offer Amount</Text>
        <Text style={s.offerAmountValue}>₦{offer.amount?.toLocaleString?.() || '0'}</Text>

        {/* Direction */}
        <View style={s.directionRow}>
          <Text style={s.directionText} numberOfLines={1}>
            {initiatorLabel} → {recipientLabel}
          </Text>
        </View>

        {/* Description */}
        {!!offer.description && (
          <View style={s.offerSection}>
            <Text style={s.offerSectionTitle}>Description</Text>
            <Text style={s.offerSectionText}>{offer.description}</Text>
          </View>
        )}

        {/* Duration / Revisions grid */}
        <View style={s.offerGrid}>
          {!!offer.durationDays && (
            <View style={s.offerGridItem}>
              <Calendar size={14} color={C.slate400} strokeWidth={2} />
              <View>
                <Text style={s.offerGridLabel}>Duration</Text>
                <Text style={s.offerGridValue}>{offer.durationDays}d</Text>
              </View>
            </View>
          )}
          {offer.revisions !== undefined && (
            <View style={s.offerGridItem}>
              <RotateCcw size={14} color={C.slate400} strokeWidth={2} />
              <View>
                <Text style={s.offerGridLabel}>Revisions</Text>
                <Text style={s.offerGridValue}>{offer.revisions}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Deliverables */}
        {!!offer.deliverables?.length && offer.deliverables[0] !== '' && (
          <View style={s.offerSection}>
            <Text style={s.offerSectionTitle}>Deliverables</Text>
            {offer.deliverables.map((d, i) => (
              <View key={i} style={s.delRow}>
                <ListChecks size={13} color={C.emerald500} strokeWidth={2} />
                <Text style={s.delText}>{d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Milestones */}
        {!!offer.milestones?.length && (
          <View style={s.offerSection}>
            <Text style={s.offerSectionTitle}>Milestones</Text>
            {offer.milestones.map((m, i) => (
              <View key={i} style={s.milestoneRow}>
                <View style={s.milestoneNumWrap}>
                  <Text style={s.milestoneNum}>{i + 1}</Text>
                </View>
                <Text style={s.milestoneTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={s.milestoneAmount}>₦{Number(m.amount || 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* View contract */}
        {!!offer.contractId && (
          <TouchableOpacity style={s.viewContractBtn} onPress={() => onViewContract?.(offer.contractId)}>
            <Eye size={14} color={C.emerald700} strokeWidth={2} />
            <Text style={s.viewContractText}>View Contract</Text>
          </TouchableOpacity>
        )}

        {/* Status badge */}
        <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
          <StatusIcon size={14} color={status.tint} strokeWidth={2.2} />
          <Text style={[s.statusText, { color: status.tint }]}>{status.label}</Text>
        </View>

        {/* Actions */}
        {isPending && !isMe && (
          <View style={s.offerActions}>
            <TouchableOpacity style={s.acceptBtn} onPress={() => onAccept?.(offer.id)}>
              <CheckCircle2 size={15} color={C.white} strokeWidth={2.2} />
              <Text style={s.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.declineBtn} onPress={() => onReject?.(offer.id)}>
              <XCircle size={15} color={C.slate600} strokeWidth={2.2} />
              <Text style={s.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPending && isMe && (
          <View style={s.waitingRow}>
            <View style={s.waitingPill}>
              <Clock size={12} color={C.slate400} strokeWidth={2} />
              <Text style={s.waitingText}>Awaiting response</Text>
            </View>
            <TouchableOpacity style={s.cancelBtn} onPress={() => onCancel?.(offer.id)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <View style={s.securedRow}>
            <Shield size={14} color={C.emerald600} strokeWidth={2} />
            <Text style={s.securedText}>Payment secured</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── CALL HISTORY BUBBLE ────────────────────────────────────────
export const CallHistoryBubble = ({ msg, onCallBack }) => {
  const direction = msg.callDirection || 'outgoing';
  const isMissed = direction === 'missed';
  const duration = msg.callDuration || 0;

  const Icon = isMissed ? PhoneMissed : direction === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  const tint = isMissed ? C.red500 : direction === 'incoming' ? C.emerald600 : C.blue500;

  const label = isMissed
    ? `Missed ${msg.callType === 'video' ? 'video' : 'voice'} call`
    : `${msg.callType === 'video' ? 'Video' : 'Voice'} call ${direction === 'incoming' ? 'received' : 'made'}`;

  return (
    <View style={s.callRowOuter}>
      <View style={[s.callHistoryBubble, isMissed && s.callHistoryBubbleMissed]}>
        <Icon size={14} color={tint} strokeWidth={2.2} />
        <Text style={[s.callHistoryText, isMissed && { color: C.red600 }]} numberOfLines={1}>
          {label}
        </Text>
        {duration > 0 && <Text style={s.callDurationText}>{formatCallDuration(duration)}</Text>}
        <Text style={s.callTimeText}>{formatTime(msg.createdAt)}</Text>
        <TouchableOpacity onPress={() => onCallBack?.(msg.callType || 'video')} style={s.callBackBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <PhoneCall size={13} color={C.emerald600} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── TEXT / FILE MESSAGE BUBBLE ─────────────────────────────────
export const MessageBubble = ({ msg, isMe, onDelete, onOpenFile, FileIconFor }) => {
  const isFile = !!(msg.fileUrl || msg.fileType);
  const isImage = msg.fileType?.startsWith('image/');

  return (
    <View style={[s.msgOuter, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          s.messageBubble,
          isMe ? s.messageBubbleMe : s.messageBubbleThem,
        ]}
      >
        {isFile ? (
          isImage ? (
            <View>
              <TouchableOpacity onPress={() => onOpenFile?.(msg.fileUrl)} activeOpacity={0.85}>
                <Image source={{ uri: msg.fileUrl }} style={s.msgImageFile} />
              </TouchableOpacity>
              {!!msg.fileName && (
                <Text style={[s.msgFileNameText, { color: isMe ? C.emerald100 : C.slate600 }]} numberOfLines={1}>
                  {msg.fileName}
                </Text>
              )}
              {msg.isUploading && <ActivityIndicatorInline color={isMe ? C.white : C.emerald600} />}
            </View>
          ) : (
            <View style={s.msgFileWrap}>
              <View style={[s.msgFileIconWrap, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : C.slate100 }]}>
                {FileIconFor ? FileIconFor(msg.fileType, isMe) : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.msgFileName, { color: isMe ? C.white : C.slate800 }]} numberOfLines={1}>
                  {msg.fileName}
                </Text>
                {!msg.isUploading && (
                  <TouchableOpacity onPress={() => onOpenFile?.(msg.fileUrl)}>
                    <Text style={[s.downloadLink, { color: isMe ? C.emerald100 : C.emerald600 }]}>Open file</Text>
                  </TouchableOpacity>
                )}
              </View>
              {msg.isUploading && <ActivityIndicatorInline color={isMe ? C.white : C.emerald600} />}
            </View>
          )
        ) : (
          <Text style={[s.msgText, { color: isMe ? C.white : C.slate800 }]}>{msg.content}</Text>
        )}
      </View>

      <View style={[s.msgMeta, { alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
        <Text style={s.msgTime}>{formatTime(msg.createdAt)}</Text>
        {isMe && (
          <Text style={[s.msgReadDot, { color: msg.isRead ? C.emerald600 : C.slate300 }]}>●</Text>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(msg.id)} style={s.msgDeleteBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Trash2Icon />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Small internal helpers kept local to this file.
const ActivityIndicatorInline = ({ color }) => (
  <View style={{ marginTop: 6 }}>
    <ActivityIndicator size="small" color={color} />
  </View>
);
const Trash2Icon = () => <Trash2 size={12} color={C.slate400} strokeWidth={2} />;

// ─── CALL OVERLAYS ───────────────────────────────────────────────
// Full-screen incoming / outgoing / active-call UI. Rendered by
// ChatScreen.js, driven entirely by the call state it owns.
export const IncomingCallOverlay = ({ call, onAccept, onDecline }) => {
  if (!call) return null;
  const isVideo = call.callType === 'video';
  return (
    <View style={s.overlayRoot}>
      <View style={s.overlayAvatarWrap}>
        <Avatar uri={call.callerAvatar} firstName={call.callerName?.split(' ')[0]} lastName={call.callerName?.split(' ')[1]} size={104} />
      </View>
      <Text style={s.overlayName}>{call.callerName}</Text>
      <View style={s.overlaySubRow}>
        {isVideo ? <VideoIcon /> : <PhoneCall size={16} color={C.emerald400} strokeWidth={2.2} />}
        <Text style={s.overlaySubText}>Incoming {isVideo ? 'video' : 'voice'} call…</Text>
      </View>
      <View style={s.overlayBtnRow}>
        <TouchableOpacity onPress={onDecline} style={[s.callCircleBtn, s.callCircleRed]}>
          <PhoneOffIcon />
        </TouchableOpacity>
        <TouchableOpacity onPress={onAccept} style={[s.callCircleBtn, s.callCircleGreen]}>
          {isVideo ? <VideoIcon light /> : <PhoneCall size={26} color={C.white} strokeWidth={2.2} />}
        </TouchableOpacity>
      </View>
      <View style={s.overlayLabelsRow}>
        <Text style={s.overlayLabelText}>Decline</Text>
        <Text style={s.overlayLabelText}>Accept</Text>
      </View>
    </View>
  );
};

export const OutgoingCallOverlay = ({ visible, calleeFirstName, calleeLastName, calleeAvatar, callType, onCancel }) => {
  if (!visible) return null;
  const isVideo = callType === 'video';
  return (
    <View style={s.overlayRoot}>
      <View style={s.overlayAvatarWrap}>
        <Avatar uri={calleeAvatar} firstName={calleeFirstName} lastName={calleeLastName} size={104} />
      </View>
      <Text style={s.overlayName}>{calleeFirstName} {calleeLastName}</Text>
      <View style={s.overlaySubRow}>
        {isVideo ? <VideoIcon /> : <PhoneCall size={16} color={C.emerald400} strokeWidth={2.2} />}
        <Text style={s.overlaySubText}>Calling…</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={[s.callCircleBtn, s.callCircleRed, { marginTop: 30 }]}>
        <PhoneOffIcon />
      </TouchableOpacity>
      <Text style={[s.overlayLabelText, { marginTop: 10 }]}>Cancel</Text>
    </View>
  );
};

export const ActiveCallOverlay = ({
  visible,
  callType,
  duration,
  localStreamURL,
  remoteStreamURL,
  otherFirstName,
  otherLastName,
  otherAvatar,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEnd,
  RTCViewComp,
}) => {
  if (!visible) return null;
  const isVideoCall = callType === 'video';

  return (
    <View style={s.activeCallRoot}>
      <View style={s.activeCallTopBar}>
        <Text style={s.activeCallDuration}>{formatCallDuration(duration)}</Text>
      </View>

      {isVideoCall && remoteStreamURL && RTCViewComp ? (
        <RTCViewComp streamURL={remoteStreamURL} style={s.remoteVideo} objectFit="cover" />
      ) : (
        <View style={s.activeCallCenter}>
          <Avatar uri={otherAvatar} firstName={otherFirstName} lastName={otherLastName} size={96} />
          <Text style={s.activeCallName}>{otherFirstName} {otherLastName}</Text>
          {isVideoCall && <Text style={s.activeCallConnecting}>Connecting…</Text>}
        </View>
      )}

      {isVideoCall && localStreamURL && RTCViewComp && (
        <View style={s.localVideoWrap}>
          <RTCViewComp streamURL={localStreamURL} style={s.localVideo} objectFit="cover" mirror zOrder={1} />
          {!isVideoEnabled && (
            <View style={s.localVideoOff}>
              <VideoOffIcon />
            </View>
          )}
        </View>
      )}

      <View style={s.activeCallControls}>
        <TouchableOpacity onPress={onToggleAudio} style={[s.controlBtn, !isAudioEnabled && s.controlBtnOff]}>
          {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
        </TouchableOpacity>
        {isVideoCall && (
          <TouchableOpacity onPress={onToggleVideo} style={[s.controlBtn, !isVideoEnabled && s.controlBtnOff]}>
            {isVideoEnabled ? <VideoIcon light /> : <VideoOffIcon />}
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onEnd} style={[s.controlBtn, s.controlBtnEnd]}>
          <PhoneOffIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Small icon wrappers (kept local so overlay JSX above stays terse).
const VideoIcon = ({ light }) => <Video size={16} color={light ? C.white : C.emerald400} strokeWidth={2.2} />;
const MicIcon = () => <Mic size={22} color={C.white} strokeWidth={2.2} />;
const MicOffIcon = () => <MicOff size={22} color={C.white} strokeWidth={2.2} />;
const VideoOffIcon = () => <VideoOff size={22} color={C.white} strokeWidth={2.2} />;
const PhoneOffIcon = () => <PhoneOff size={26} color={C.white} strokeWidth={2.2} />;

// ─── STYLES ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  avatarImg: { backgroundColor: C.slate200 },
  avatarFallback: {
    backgroundColor: C.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: C.white, fontWeight: '700' },

  // Offer card
  offerCard: {
    width: '86%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    overflow: 'hidden',
    marginVertical: 6,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.slate50,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  offerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: C.emerald600 },
  offerType: { fontSize: 10, fontWeight: '600', color: C.slate400, marginTop: 2 },
  offerBody: { padding: 14 },
  offerAmountLabel: { fontSize: 10.5, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.4 },
  offerAmountValue: { fontSize: 26, fontWeight: '800', color: C.slate900, marginTop: 2, marginBottom: 10 },
  directionRow: {
    backgroundColor: C.slate50,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  directionText: { fontSize: 12.5, fontWeight: '600', color: C.slate600 },
  offerSection: { marginBottom: 10 },
  offerSectionTitle: { fontSize: 10.5, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  offerSectionText: { fontSize: 13, lineHeight: 19, color: C.slate600 },
  offerGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  offerGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.slate50,
    borderRadius: 10,
    padding: 10,
  },
  offerGridLabel: { fontSize: 9.5, fontWeight: '700', color: C.slate400 },
  offerGridValue: { fontSize: 12.5, fontWeight: '700', color: C.slate700, marginTop: 1 },
  delRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 5 },
  delText: { fontSize: 12.5, color: C.slate600, flex: 1, lineHeight: 18 },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.slate50,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  milestoneNumWrap: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.emerald100,
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneNum: { fontSize: 10, fontWeight: '800', color: C.emerald700 },
  milestoneTitle: { flex: 1, fontSize: 12.5, color: C.slate700, fontWeight: '600' },
  milestoneAmount: { fontSize: 12, fontWeight: '700', color: C.slate500 },
  viewContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.emerald50,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  viewContractText: { fontSize: 12.5, fontWeight: '700', color: C.emerald700 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  offerActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.emerald600,
    borderRadius: 10,
    paddingVertical: 11,
  },
  acceptBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.slate100,
    borderRadius: 10,
    paddingVertical: 11,
  },
  declineBtnText: { color: C.slate600, fontWeight: '700', fontSize: 13 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitingPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.slate100,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  waitingText: { fontSize: 12, fontWeight: '600', color: C.slate500 },
  cancelBtn: {
    backgroundColor: C.slate100,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: C.slate600 },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.emerald50,
    borderRadius: 10,
    paddingVertical: 10,
  },
  securedText: { fontSize: 12.5, fontWeight: '700', color: C.emerald700 },

  // Call history
  callRowOuter: { alignItems: 'center', marginVertical: 8 },
  callHistoryBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '92%',
  },
  callHistoryBubbleMissed: { borderColor: C.red100, backgroundColor: C.red50 },
  callHistoryText: { fontSize: 12, fontWeight: '600', color: C.slate600 },
  callDurationText: { fontSize: 11, color: C.slate400 },
  callTimeText: { fontSize: 10.5, color: C.slate400 },
  callBackBtn: { marginLeft: 2, padding: 2 },

  // Message bubble
  msgOuter: { marginVertical: 5, marginHorizontal: 12, maxWidth: '85%' },
  messageBubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
  },
  messageBubbleMe: {
    backgroundColor: C.emerald600,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageBubbleThem: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  msgText: { fontSize: 14.5, lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, paddingHorizontal: 2 },
  msgTime: { fontSize: 10.5, color: C.slate400, fontWeight: '500' },
  msgReadDot: { fontSize: 8 },
  msgDeleteBtn: { position: 'absolute', top: -6, right: -6, padding: 4 },
  msgImageFile: { width: 190, height: 190, borderRadius: 10, backgroundColor: C.slate100 },
  msgFileNameText: { fontSize: 11, fontWeight: '600', marginTop: 5 },
  msgFileWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 170 },
  msgFileIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  msgFileName: { fontSize: 13, fontWeight: '600' },
  downloadLink: { fontSize: 11.5, fontWeight: '700', marginTop: 3 },

  // Incoming / outgoing call overlays
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayAvatarWrap: { marginBottom: 22 },
  overlayName: { fontSize: 22, fontWeight: '800', color: C.white, marginBottom: 8, textAlign: 'center', paddingHorizontal: 24 },
  overlaySubRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 40 },
  overlaySubText: { fontSize: 14.5, color: C.slate300, fontWeight: '500' },
  overlayBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 56 },
  overlayLabelsRow: { flexDirection: 'row', alignItems: 'center', gap: 56, marginTop: 10 },
  overlayLabelText: { fontSize: 12.5, color: C.slate400, fontWeight: '600', width: 64, textAlign: 'center' },
  callCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callCircleRed: { backgroundColor: C.red500 },
  callCircleGreen: { backgroundColor: C.emerald600 },

  // Active call
  activeCallRoot: { ...StyleSheet.absoluteFillObject, backgroundColor: C.slate900, zIndex: 90 },
  activeCallTopBar: { position: 'absolute', top: 54, alignSelf: 'center', zIndex: 5 },
  activeCallDuration: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeCallCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeCallName: { color: C.white, fontSize: 17, fontWeight: '700', marginTop: 14 },
  activeCallConnecting: { color: C.slate400, fontSize: 13, marginTop: 6 },
  remoteVideo: { flex: 1 },
  localVideoWrap: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 96,
    height: 128,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  localVideo: { width: '100%', height: '100%' },
  localVideoOff: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCallControls: {
    position: 'absolute',
    bottom: 46,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 18,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnOff: { backgroundColor: C.red500 },
  controlBtnEnd: { backgroundColor: C.red500 },
});