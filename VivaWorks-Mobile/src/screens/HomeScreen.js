// src/screens/HomeScreen.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Header from '../components/Header';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Loading from '../components/Loading';

import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Plus,
  X,
  Send,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  FileText,
  MoreHorizontal,
  BadgeCheck,
  Play,
  Globe,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trash2,
  Volume2,
  VolumeX,
  Maximize,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POST_TYPES = {
  text: { icon: FileText, label: 'Text', color: '#059669' },
  image: { icon: ImageIcon, label: 'Image', color: '#059669' },
  video: { icon: Video, label: 'Video', color: '#059669' },
  link: { icon: LinkIcon, label: 'Link', color: '#059669' },
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
};

const getInitials = (firstName, lastName) => {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [postingComment, setPostingComment] = useState({});

  // Video player state
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoMuted, setVideoMuted] = useState(true);

  // Lightbox state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchFeed();
    fetchStories();
  }, []);

  const fetchFeed = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get(`/posts/feed?page=${pageNum}&limit=15`);
      const { posts: newPosts = [], pagination = {} } = response.data;

      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
      setTotalPages(pagination.pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err.response?.data?.message || 'Failed to load feed');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await api.get('/posts/stories');
      setStories(response.data.stories || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      setStories([]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(1, false), fetchStories()]);
    setRefreshing(false);
  }, []);

  const loadMore = () => {
    if (page < totalPages && !loadingMore && !isLoading) {
      fetchFeed(page + 1, true);
    }
  };

  // Like post
  const handleLike = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked;
    const newLikes = wasLiked ? (post.likes || 1) - 1 : (post.likes || 0) + 1;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked: !wasLiked, likes: newLikes } : p))
    );

    try {
      await api.post(`/posts/${postId}/like`);
    } catch (err) {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLiked: wasLiked, likes: post.likes || 0 } : p))
      );
    }
  };

  // Save post
  const handleSave = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasSaved = post.isSaved;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !wasSaved } : p))
    );

    try {
      await api.post(`/posts/${postId}/save`);
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: wasSaved } : p))
      );
    }
  };

  // Share post
  const handleShare = async (postId) => {
    try {
      await api.post(`/posts/${postId}/share`, {});
      Alert.alert('Success', 'Post shared successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to share post');
    }
  };

  // Comments
  const handleToggleComments = async (post) => {
    const willOpen = !expandedComments[post.id];
    setExpandedComments((prev) => ({ ...prev, [post.id]: willOpen }));

    if (willOpen && (!post.commentsList || post.commentsList.length === 0)) {
      try {
        const response = await api.get(`/posts/${post.id}/comments`);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, commentsList: response.data.comments || [] } : p
          )
        );
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handlePostComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setPostingComment((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await api.post(`/posts/${postId}/comments`, { content });
      const newComment = response.data.comment;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                commentsList: [...(p.commentsList || []), newComment],
                comments: (p.comments || 0) + 1,
              }
            : p
        )
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPostingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete post
  const handleDeletePost = (postId) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  // Create post
  const handleCreatePost = async () => {
    if (postType === 'text' && !newPostContent.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        content: newPostContent.trim(),
        type: postType,
        media: [],
      };

      const response = await api.post('/posts', postData);
      const newPost = response.data.post;

      setPosts((prev) => [newPost, ...prev]);
      setShowCreateModal(false);
      setNewPostContent('');
      setPostType('text');
      fetchStories();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track impressions
  useEffect(() => {
    if (!posts.length || !user?.id) return;

    const timer = setTimeout(() => {
      posts.forEach((post) => {
        if (post.userId !== user.id) {
          api.post(`/posts/${post.id}/impression`).catch(() => {});
        }
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [posts, user?.id]);

  const renderStories = () => (
    <View style={styles.storiesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ isCreateStory: true }, ...stories]}
        keyExtractor={(item, index) => item.userId || `create-${index}`}
        renderItem={({ item }) => {
          if (item.isCreateStory) {
            return (
              <TouchableOpacity
                style={styles.storyItem}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.createStoryAvatar}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
                  ) : (
                    <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder]}>
                      <Text style={styles.storyAvatarText}>
                        {getInitials(user?.firstName, user?.lastName)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.createStoryBadge}>
                    <Plus size={12} color="#fff" strokeWidth={3} />
                  </View>
                </View>
                <Text style={styles.storyName}>Your story</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
              <View style={styles.storyRing}>
                {item.user?.avatar ? (
                  <Image source={{ uri: item.user.avatar }} style={styles.storyAvatar} />
                ) : (
                  <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder]}>
                    <Text style={styles.storyAvatarText}>
                      {getInitials(item.user?.firstName, item.user?.lastName)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                {item.user?.firstName || 'User'}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.storiesContent}
      />
    </View>
  );

  const renderPostHeader = (post) => (
    <View style={styles.postHeader}>
      <TouchableOpacity
        style={styles.postHeaderLeft}
        onPress={() => navigation.navigate('Profile', { userId: post.user?.id })}
        activeOpacity={0.7}
      >
        {post.user?.avatar ? (
          <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
        ) : (
          <View style={[styles.postAvatar, styles.postAvatarPlaceholder]}>
            <Text style={styles.postAvatarText}>
              {getInitials(post.user?.firstName, post.user?.lastName)}
            </Text>
          </View>
        )}
        <View style={styles.postHeaderText}>
          <View style={styles.postAuthorRow}>
            <Text style={styles.postAuthor} numberOfLines={1}>
              {post.user?.firstName} {post.user?.lastName}
            </Text>
            {post.user?.isVerified && (
              <BadgeCheck size={16} color="#059669" fill="#059669" />
            )}
          </View>
          <Text style={styles.postMeta} numberOfLines={1}>
            {post.user?.headline || 'Member'} • {formatTimeAgo(post.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.postHeaderRight}>
        {post.userId === user?.id && (
          <TouchableOpacity
            onPress={() => handleDeletePost(post.id)}
            style={styles.postActionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.postActionBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MoreHorizontal size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPostContent = (post) => (
    <View style={styles.postContent}>
      {post.content && (
        <Text style={styles.postText}>{post.content}</Text>
      )}

      {post.type === 'image' && post.media && post.media.length > 0 && (
        <View style={[
          styles.mediaGrid,
          post.media.length === 1 && styles.mediaGridSingle,
        ]}>
          {post.media.slice(0, 4).map((url, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.mediaItem,
                post.media.length === 1 && styles.mediaItemSingle,
                post.media.length === 3 && idx === 0 && styles.mediaItemLarge,
              ]}
              onPress={() => {
                setLightboxImages(post.media);
                setLightboxIndex(idx);
                setLightboxVisible(true);
              }}
              activeOpacity={0.9}
            >
              <Image source={{ uri: url }} style={styles.mediaImage} />
              {post.media.length > 4 && idx === 3 && (
                <View style={styles.mediaOverlay}>
                  <Text style={styles.mediaOverlayText}>+{post.media.length - 4}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {post.type === 'video' && post.media && post.media.length > 0 && (
        <TouchableOpacity
          style={styles.videoContainer}
          onPress={() => setPlayingVideo(playingVideo === post.id ? null : post.id)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: post.media[0] }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
          {playingVideo !== post.id && (
            <View style={styles.videoPlayOverlay}>
              <View style={styles.videoPlayButton}>
                <Play size={32} color="#fff" fill="#fff" />
              </View>
            </View>
          )}
          <View style={styles.videoControls}>
            <TouchableOpacity
              onPress={() => setVideoMuted(!videoMuted)}
              style={styles.videoControlBtn}
            >
              {videoMuted ? (
                <VolumeX size={20} color="#fff" />
              ) : (
                <Volume2 size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {post.type === 'link' && (post.linkPreview || post.linkTitle) && (
        <TouchableOpacity style={styles.linkCard} activeOpacity={0.8}>
          {(post.linkPreview?.image || post.linkImage) && (
            <Image
              source={{ uri: post.linkPreview?.image || post.linkImage }}
              style={styles.linkImage}
            />
          )}
          <View style={styles.linkContent}>
            <Text style={styles.linkTitle} numberOfLines={2}>
              {post.linkPreview?.title || post.linkTitle}
            </Text>
            {(post.linkPreview?.description || post.linkDesc) && (
              <Text style={styles.linkDesc} numberOfLines={2}>
                {post.linkPreview?.description || post.linkDesc}
              </Text>
            )}
            <View style={styles.linkDomain}>
              <LinkIcon size={12} color="#059669" />
              <Text style={styles.linkDomainText}>
                {post.linkPreview?.domain || post.linkDomain}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPostActions = (post) => (
    <View style={styles.postActions}>
      <View style={styles.postActionsLeft}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
          activeOpacity={0.6}
        >
          <Heart
            size={22}
            color={post.isLiked ? '#EF4444' : '#6B7280'}
            fill={post.isLiked ? '#EF4444' : 'transparent'}
          />
          {post.likes > 0 && (
            <Text style={[styles.actionText, post.isLiked && styles.actionTextActive]}>
              {post.likes}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleComments(post)}
          activeOpacity={0.6}
        >
          <MessageCircle
            size={22}
            color={expandedComments[post.id] ? '#059669' : '#6B7280'}
          />
          {post.comments > 0 && (
            <Text style={styles.actionText}>{post.comments}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(post.id)}
          activeOpacity={0.6}
        >
          <Share2 size={22} color="#6B7280" />
          {post.shares > 0 && (
            <Text style={styles.actionText}>{post.shares}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleSave(post.id)}
        activeOpacity={0.6}
      >
        <Bookmark
          size={22}
          color={post.isSaved ? '#059669' : '#6B7280'}
          fill={post.isSaved ? '#059669' : 'transparent'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderComments = (post) => {
    if (!expandedComments[post.id]) return null;

    return (
      <View style={styles.commentsSection}>
        {post.commentsList?.length > 0 ? (
          post.commentsList.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              {comment.user?.avatar ? (
                <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
              ) : (
                <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                  <Text style={styles.commentAvatarText}>
                    {getInitials(comment.user?.firstName, comment.user?.lastName)}
                  </Text>
                </View>
              )}
              <View style={styles.commentContent}>
                <View style={styles.commentBubble}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.user?.firstName} {comment.user?.lastName}
                    </Text>
                    {comment.user?.isVerified && (
                      <BadgeCheck size={12} color="#059669" fill="#059669" />
                    )}
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
                <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noComments}>No comments yet. Be the first!</Text>
        )}

        <View style={styles.commentInput}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.commentInputAvatar} />
          ) : (
            <View style={[styles.commentInputAvatar, styles.commentAvatarPlaceholder]}>
              <Text style={styles.commentAvatarText}>
                {getInitials(user?.firstName, user?.lastName)}
              </Text>
            </View>
          )}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInputField}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              value={commentInputs[post.id] || ''}
              onChangeText={(text) =>
                setCommentInputs((prev) => ({ ...prev, [post.id]: text }))
              }
              multiline
            />
            <TouchableOpacity
              onPress={() => handlePostComment(post.id)}
              disabled={!commentInputs[post.id]?.trim() || postingComment[post.id]}
              style={[
                styles.commentSendBtn,
                (!commentInputs[post.id]?.trim() || postingComment[post.id]) && styles.commentSendBtnDisabled,
              ]}
            >
              {postingComment[post.id] ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPost = ({ item: post }) => (
    <View style={styles.postCard}>
      {renderPostHeader(post)}
      {renderPostContent(post)}
      {renderPostActions(post)}
      {renderComments(post)}
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.modalClose}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalUser}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.modalAvatar} />
            ) : (
              <View style={[styles.modalAvatar, styles.postAvatarPlaceholder]}>
                <Text style={styles.postAvatarText}>
                  {getInitials(user?.firstName, user?.lastName)}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.modalUserName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <View style={styles.modalVisibility}>
                <Globe size={12} color="#6B7280" />
                <Text style={styles.modalVisibilityText}>Public</Text>
              </View>
            </View>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            autoFocus
          />

          <View style={styles.modalPostTypes}>
            <Text style={styles.modalPostTypesLabel}>Add to your post</Text>
            <View style={styles.modalPostTypesRow}>
              {Object.entries(POST_TYPES).map(([type, config]) => {
                const Icon = config.icon;
                const isActive = postType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.postTypeBtn, isActive && styles.postTypeBtnActive]}
                    onPress={() => setPostType(type)}
                  >
                    <Icon size={20} color={isActive ? '#059669' : '#6B7280'} />
                    <Text style={[styles.postTypeText, isActive && styles.postTypeTextActive]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.modalSubmit,
              (!newPostContent.trim() || isSubmitting) && styles.modalSubmitDisabled,
            ]}
            onPress={handleCreatePost}
            disabled={!newPostContent.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalSubmitText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderLightbox = () => (
    <Modal
      visible={lightboxVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setLightboxVisible(false)}
    >
      <View style={styles.lightboxContainer}>
        <TouchableOpacity
          style={styles.lightboxClose}
          onPress={() => setLightboxVisible(false)}
        >
          <X size={28} color="#fff" />
        </TouchableOpacity>

        {lightboxIndex > 0 && (
          <TouchableOpacity
            style={[styles.lightboxNav, styles.lightboxPrev]}
            onPress={() => setLightboxIndex((i) => i - 1)}
          >
            <ChevronLeft size={32} color="#fff" />
          </TouchableOpacity>
        )}

        <Image
          source={{ uri: lightboxImages[lightboxIndex] }}
          style={styles.lightboxImage}
          resizeMode="contain"
        />

        {lightboxIndex < lightboxImages.length - 1 && (
          <TouchableOpacity
            style={[styles.lightboxNav, styles.lightboxNext]}
            onPress={() => setLightboxIndex((i) => i + 1)}
          >
            <ChevronRight size={32} color="#fff" />
          </TouchableOpacity>
        )}

        {lightboxImages.length > 1 && (
          <View style={styles.lightboxDots}>
            {lightboxImages.map((_, idx) => (
              <View
                key={idx}
                style={[styles.lightboxDot, idx === lightboxIndex && styles.lightboxDotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ImageIcon size={48} color="#D1D5DB" strokeWidth={1.5} />
      <Text style={styles.emptyStateTitle}>No posts yet</Text>
      <Text style={styles.emptyStateMessage}>
        When people share, you'll see their posts here.
      </Text>
      <Button
        title="Share your first post"
        onPress={() => setShowCreateModal(true)}
        variant="primary"
        size="medium"
        fullWidth={false}
        style={styles.emptyStateButton}
      />
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator color="#059669" />
        </View>
      );
    }
    if (posts.length > 0 && page >= totalPages) {
      return (
        <View style={styles.endOfFeed}>
          <Text style={styles.endOfFeedText}>You're all caught up</Text>
        </View>
      );
    }
    return null;
  };

  if (isLoading && posts.length === 0) {
    return <Loading.FullScreen text="Loading your feed..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Feed"
        rightIcon={
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Plus size={24} color="#059669" />
            </TouchableOpacity>
          </View>
        }
      />

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchFeed(1, false)}>
            <RefreshCw size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderStories}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {renderCreateModal()}
      {renderLightbox()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingBottom: 20,
  },

  // Stories
  storiesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  storiesContent: {
    paddingHorizontal: 12,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    backgroundColor: '#059669',
  },
  createStoryAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    backgroundColor: '#D1FAE5',
    position: 'relative',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyAvatarPlaceholder: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyName: {
    fontSize: 11,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Post Card
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Post Header
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postAvatarPlaceholder: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  postMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionBtn: {
    padding: 8,
    marginLeft: 4,
  },

  // Post Content
  postContent: {
    paddingHorizontal: 16,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    marginBottom: 12,
  },

  // Media Grid
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mediaGridSingle: {
    flexDirection: 'column',
  },
  mediaItem: {
    width: '49%',
    aspectRatio: 1,
    position: 'relative',
  },
  mediaItemSingle: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  mediaItemLarge: {
    width: '100%',
    aspectRatio: 2,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaOverlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Video
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
  },
  videoControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Link Card
  linkCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12,
  },
  linkImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  linkContent: {
    padding: 12,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  linkDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  linkDomain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  linkDomainText: {
    fontSize: 12,
    color: '#059669',
  },

  // Post Actions
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  postActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#EF4444',
  },

  // Comments
  commentsSection: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarPlaceholder: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentContent: {
    marginLeft: 10,
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 4,
  },
  noComments: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 16,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentInputField: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    marginTop: 8,
  },

  // Loading More
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfFeed: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfFeedText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    padding: 4,
  },
  modalUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalVisibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  modalVisibilityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalInput: {
    fontSize: 17,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalPostTypes: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modalPostTypesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  modalPostTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  postTypeBtnActive: {
    backgroundColor: '#ECFDF5',
  },
  postTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  postTypeTextActive: {
    color: '#059669',
  },
  modalSubmit: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Lightbox
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  lightboxNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    padding: 12,
    zIndex: 10,
  },
  lightboxPrev: {
    left: 8,
  },
  lightboxNext: {
    right: 8,
  },
  lightboxDots: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
  },
  lightboxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  lightboxDotActive: {
    backgroundColor: '#fff',
  },
});

export default HomeScreen;