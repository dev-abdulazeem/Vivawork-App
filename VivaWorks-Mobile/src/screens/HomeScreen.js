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
  Clipboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import VivaRoomSection from '../components/VivaRoomSection';

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
  Search,
  Copy,
  Check,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POST_TYPES = {
  text: { icon: FileText, label: 'Text' },
  image: { icon: ImageIcon, label: 'Image' },
  video: { icon: Video, label: 'Video' },
  link: { icon: LinkIcon, label: 'Link' },
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
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Feed State
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create Post State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments State
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [postingComment, setPostingComment] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});

  // Share State
  const [shareModalPost, setShareModalPost] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingToUser, setSendingToUser] = useState(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Video State
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoMuted, setVideoMuted] = useState(true);

  // Story Viewer State
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const storyTimerRef = useRef(null);

  // ─── FETCH DATA ───────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
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
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      const response = await api.get('/posts/stories');
      setStories(response.data.stories || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, false);
    fetchStories();
  }, [fetchFeed, fetchStories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(1, false), fetchStories()]);
    setRefreshing(false);
  }, [fetchFeed, fetchStories]);

  const loadMore = () => {
    if (page < totalPages && !loadingMore && !isLoading) {
      fetchFeed(page + 1, true);
    }
  };

  // ─── TRACK IMPRESSIONS ────────────────────────────────────────────────
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

  // ─── STORY VIEWER LOGIC ───────────────────────────────────────────────
  const openStory = (story) => {
    setSelectedStory(story);
    setStoryIndex(0);
    setStoryProgress(0);
  };

  const closeStory = () => {
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    setSelectedStory(null);
    setStoryIndex(0);
    setStoryProgress(0);
  };

  const goToNextStoryPost = useCallback(() => {
    if (!selectedStory) return;
    if (storyIndex < selectedStory.posts.length - 1) {
      setStoryIndex((i) => i + 1);
    } else {
      closeStory();
    }
  }, [selectedStory, storyIndex]);

  useEffect(() => {
    if (!selectedStory) return;
    setStoryProgress(0);
    const stepMs = 50;
    let elapsed = 0;
    storyTimerRef.current = setInterval(() => {
      elapsed += stepMs;
      const pct = (elapsed / 5000) * 100;
      setStoryProgress(Math.min(pct, 100));
      if (pct >= 100) {
        clearInterval(storyTimerRef.current);
        goToNextStoryPost();
      }
    }, stepMs);
    return () => clearInterval(storyTimerRef.current);
  }, [selectedStory, storyIndex, goToNextStoryPost]);

  // ─── POST ACTIONS ─────────────────────────────────────────────────────
  const handleLike = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const wasLiked = post.isLiked;
    const newLikes = wasLiked ? (post.likes || 1) - 1 : (post.likes || 0) + 1;

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isLiked: !wasLiked, likes: newLikes } : p)));
    try {
      await api.post(`/posts/${postId}/like`);
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isLiked: wasLiked, likes: post.likes || 0 } : p)));
    }
  };

  const handleSave = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const wasSaved = post.isSaved;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: !wasSaved } : p)));
    try {
      await api.post(`/posts/${postId}/save`);
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: wasSaved } : p)));
    }
  };

  const handleDelete = (postId) => {
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

  // ─── COMMENTS & REPLIES ───────────────────────────────────────────────
  const fetchComments = async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsList: response.data.comments || [] } : p))
      );
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleToggleComments = (post) => {
    const willOpen = !expandedComments[post.id];
    setExpandedComments((prev) => ({ ...prev, [post.id]: willOpen }));
    if (willOpen && (!post.commentsList || post.commentsList.length === 0)) {
      fetchComments(post.id);
    }
  };

  const handlePostComment = async (postId, parentId = null) => {
    const inputKey = parentId ? `${postId}_${parentId}` : postId;
    const content = (parentId ? replyInputs[inputKey] : commentInputs[postId])?.trim();
    if (!content) return;

    setPostingComment((prev) => ({ ...prev, [inputKey]: true }));
    try {
      const response = await api.post(`/posts/${postId}/comments`, { content, parentId });
      const newComment = response.data.comment;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          if (parentId) {
            const updatedComments = (p.commentsList || []).map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newComment],
                  _count: { ...c._count, replies: (c._count?.replies || 0) + 1 },
                };
              }
              return c;
            });
            return { ...p, commentsList: updatedComments };
          }
          return {
            ...p,
            commentsList: [...(p.commentsList || []), newComment],
            comments: (p.comments || 0) + 1,
          };
        })
      );

      if (parentId) {
        setReplyInputs((prev) => ({ ...prev, [inputKey]: '' }));
        setReplyingTo(null);
      } else {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
      fetchComments(postId);
    } catch (err) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPostingComment((prev) => ({ ...prev, [inputKey]: false }));
    }
  };

  // ─── SHARE & SEARCH ───────────────────────────────────────────────────
  const openShareModal = async (post) => {
    setShareModalPost(post);
    setShareLink('');
    setCopiedLink(false);
    setSearchQuery('');
    setSearchResults([]);
    setSendingToUser(null);
    try {
      const response = await api.post(`/posts/${post.id}/share`, {});
      setShareLink(response.data.shareLink);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate share link');
    }
  };

  const closeShareModal = () => {
    setShareModalPost(null);
    setShareLink('');
    setCopiedLink(false);
    setSearchQuery('');
    setSearchResults([]);
    setSendingToUser(null);
  };

  const copyShareLink = () => {
    // 🎯 Clean, professional domain (change to localhost or your actual domain as needed)
    Clipboard.setString(`https://vivaworks.com/share/${shareLink}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const searchUsers = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      const filtered = (response.data.users || []).filter((u) => u.id !== user?.id);
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timeout = setTimeout(() => searchUsers(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchUsers]);

  const sendPostToUser = async (recipientId) => {
    if (!shareModalPost || !recipientId) return;
    setSendingToUser(recipientId);
    try {
      await api.post(`/posts/${shareModalPost.id}/share`, { recipientId });
      Alert.alert('Success', 'Post sent!');
      closeShareModal();
    } catch (err) {
      Alert.alert('Error', 'Failed to send post');
    } finally {
      setSendingToUser(null);
    }
  };

  // ─── CREATE POST ──────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (postType === 'text' && !newPostContent.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }
    if (postType === 'link' && !linkUrl.trim()) {
      Alert.alert('Error', 'Please enter a link URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        content: newPostContent.trim(),
        type: postType,
        media: [], 
      };
      if (postType === 'link') {
        postData.linkUrl = linkUrl.trim();
        postData.linkPreview = linkPreview;
      }

      const response = await api.post('/posts', postData);
      const newPost = response.data.post;
      setPosts((prev) => [newPost, ...prev]);
      setShowCreateModal(false);
      setNewPostContent('');
      setLinkUrl('');
      setLinkPreview(null);
      setPostType('text');
      fetchStories();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Link preview debounce
  useEffect(() => {
    if (postType !== 'link' || !linkUrl) return;
    const timeout = setTimeout(async () => {
      try {
        const response = await api.post('/posts/link-preview', { url: linkUrl });
        setLinkPreview(response.data.preview);
      } catch {
        setLinkPreview(null);
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [linkUrl, postType]);

  // ─── RENDER HELPERS ───────────────────────────────────────────────────
  const renderAvatar = (uri, firstName, lastName, size = 40) => {
    if (uri) {
      return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
      <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{getInitials(firstName, lastName)}</Text>
      </View>
    );
  };

  const renderStoriesBar = () => (
    <View style={styles.storiesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ isCreate: true }, ...stories]}
        keyExtractor={(item, index) => item.userId || `create-${index}`}
        contentContainerStyle={styles.storiesContent}
        renderItem={({ item }) => {
          if (item.isCreate) {
            return (
              <TouchableOpacity style={styles.storyItem} onPress={() => setShowCreateModal(true)} activeOpacity={0.7}>
                <View style={styles.createStoryRing}>
                  {renderAvatar(user?.avatar, user?.firstName, user?.lastName, 56)}
                  <View style={styles.createStoryBadge}>
                    <Plus size={14} color="#fff" strokeWidth={3} />
                  </View>
                </View>
                <Text style={styles.storyName}>Your story</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity style={styles.storyItem} onPress={() => openStory(item)} activeOpacity={0.7}>
              <View style={styles.storyRing}>
                {renderAvatar(item.user?.avatar, item.user?.firstName, item.user?.lastName, 56)}
              </View>
              <Text style={styles.storyName} numberOfLines={1}>{item.user?.firstName || 'User'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderPost = ({ item: post }) => (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postHeaderLeft}
          onPress={() => navigation.navigate('UserProfile', { userId: post.user?.id })}
          activeOpacity={0.7}
        >
          {renderAvatar(post.user?.avatar, post.user?.firstName, post.user?.lastName, 44)}
          <View style={styles.postHeaderText}>
            <View style={styles.postAuthorRow}>
              <Text style={styles.postAuthor} numberOfLines={1}>
                {post.user?.firstName} {post.user?.lastName}
              </Text>
              {post.user?.isVerified && <BadgeCheck size={16} color="#059669" fill="#059669" />}
            </View>
            <Text style={styles.postMeta} numberOfLines={1}>
              {post.user?.headline || 'Member'} • {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.postHeaderRight}>
          {post.userId === user?.id && (
            <TouchableOpacity onPress={() => handleDelete(post.id)} style={styles.postActionBtn} hitSlop={10}>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.postActionBtn} hitSlop={10}>
            <MoreHorizontal size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.postContent}>
        {post.content && <Text style={styles.postText}>{post.content}</Text>}

        {post.type === 'image' && post.media?.length > 0 && (
          <View style={[styles.mediaGrid, post.media.length === 1 && styles.mediaGridSingle]}>
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
                  setLightboxOpen(true);
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

        {post.type === 'video' && post.media?.length > 0 && (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => setPlayingVideo(playingVideo === post.id ? null : post.id)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: post.media[0] }} style={styles.videoThumbnail} resizeMode="cover" />
            {playingVideo !== post.id && (
              <View style={styles.videoPlayOverlay}>
                <View style={styles.videoPlayButton}>
                  <Play size={32} color="#fff" fill="#fff" />
                </View>
              </View>
            )}
            <View style={styles.videoControls}>
              <TouchableOpacity onPress={() => setVideoMuted(!videoMuted)} style={styles.videoControlBtn}>
                {videoMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {post.type === 'link' && (post.linkPreview || post.linkTitle) && (
          <TouchableOpacity style={styles.linkCard} activeOpacity={0.8}>
            {(post.linkPreview?.image || post.linkImage) && (
              <Image source={{ uri: post.linkPreview?.image || post.linkImage }} style={styles.linkImage} />
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

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)} activeOpacity={0.6}>
            <Heart size={22} color={post.isLiked ? '#EF4444' : '#6B7280'} fill={post.isLiked ? '#EF4444' : 'transparent'} />
            {post.likes > 0 && <Text style={[styles.actionText, post.isLiked && styles.actionTextActive]}>{post.likes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleComments(post)} activeOpacity={0.6}>
            <MessageCircle size={22} color={expandedComments[post.id] ? '#059669' : '#6B7280'} />
            {post.comments > 0 && <Text style={styles.actionText}>{post.comments}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => openShareModal(post)} activeOpacity={0.6}>
            <Share2 size={22} color="#6B7280" />
            {post.shares > 0 && <Text style={styles.actionText}>{post.shares}</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(post.id)} activeOpacity={0.6}>
          <Bookmark size={22} color={post.isSaved ? '#059669' : '#6B7280'} fill={post.isSaved ? '#059669' : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {expandedComments[post.id] && (
        <View style={styles.commentsSection}>
          <View style={styles.commentsList}>
            {post.commentsList?.length > 0 ? (
              post.commentsList.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <TouchableOpacity
                    style={styles.commentAvatarWrap}
                    onPress={() => navigation.navigate('UserProfile', { userId: comment.user?.id })}
                  >
                    {renderAvatar(comment.user?.avatar, comment.user?.firstName, comment.user?.lastName, 32)}
                  </TouchableOpacity>
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {comment.user?.firstName} {comment.user?.lastName}
                        </Text>
                        {comment.user?.isVerified && <BadgeCheck size={12} color="#059669" fill="#059669" />}
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                      <TouchableOpacity style={styles.commentActionText}>
                        <Text style={styles.commentActionText}>Like</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.commentActionText}
                        onPress={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <Text style={styles.commentActionText}>Reply</Text>
                      </TouchableOpacity>
                      {comment._count?.replies > 0 && (
                        <Text style={styles.commentTime}>
                          {comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}
                        </Text>
                      )}
                    </View>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder={`Reply to ${comment.user?.firstName}...`}
                          placeholderTextColor="#9CA3AF"
                          value={replyInputs[`${post.id}_${comment.id}`] || ''}
                          onChangeText={(text) => setReplyInputs((prev) => ({ ...prev, [`${post.id}_${comment.id}`]: text }))}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() => handlePostComment(post.id, comment.id)}
                          disabled={!replyInputs[`${post.id}_${comment.id}`]?.trim() || postingComment[`${post.id}_${comment.id}`]}
                          style={styles.replySendBtn}
                        >
                          {postingComment[`${post.id}_${comment.id}`] ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Send size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View style={styles.repliesContainer}>
                        {comment.replies.map((reply) => (
                          <View key={reply.id} style={styles.replyItem}>
                            <TouchableOpacity
                              style={styles.commentAvatarWrap}
                              onPress={() => navigation.navigate('UserProfile', { userId: reply.user?.id })}
                            >
                              {renderAvatar(reply.user?.avatar, reply.user?.firstName, reply.user?.lastName, 24)}
                            </TouchableOpacity>
                            <View style={styles.commentContent}>
                              <View style={[styles.commentBubble, styles.replyBubble]}>
                                <View style={styles.commentHeader}>
                                  <Text style={styles.commentAuthor}>
                                    {reply.user?.firstName} {reply.user?.lastName}
                                  </Text>
                                  {reply.user?.isVerified && <BadgeCheck size={10} color="#059669" fill="#059669" />}
                                </View>
                                <Text style={styles.commentText}>{reply.content}</Text>
                              </View>
                              <Text style={styles.commentTime}>{formatTimeAgo(reply.createdAt)}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </View>

          {/* Main Comment Input */}
          <View style={styles.mainCommentInput}>
            {renderAvatar(user?.avatar, user?.firstName, user?.lastName, 32)}
            <View style={styles.commentInputBox}>
              <TextInput
                style={styles.commentInputField}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                value={commentInputs[post.id] || ''}
                onChangeText={(text) => setCommentInputs((prev) => ({ ...prev, [post.id]: text }))}
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
      )}
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
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 🎯 Clean Header: Removed the duplicate "+" button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            {renderStoriesBar()}
            <VivaRoomSection navigation={navigation} />
          </View>
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ImageIcon size={48} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No posts yet</Text>
            <Text style={styles.emptyStateMessage}>When people share, you'll see their posts here.</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowCreateModal(true)}>
              <Plus size={18} color="#fff" />
              <Text style={styles.emptyStateButtonText}>Share your first post</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* 🎯 Premium Floating Action Button: Perfectly anchored bottom-right */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)} activeOpacity={0.85}>
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ─── MODALS ─────────────────────────────────────────────────────── */}
      
      {/* 1. Story Viewer Modal */}
      <Modal visible={!!selectedStory} transparent animationType="fade" onRequestClose={closeStory}>
        <View style={styles.storyModalContainer}>
          <View style={styles.storyProgressContainer}>
            {selectedStory?.posts.map((_, idx) => (
              <View key={idx} style={styles.storyProgressBarBg}>
                <View
                  style={[
                    styles.storyProgressBarFill,
                    {
                      width: idx < storyIndex ? '100%' : idx === storyIndex ? `${storyProgress}%` : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.storyHeader}>
            <View style={styles.storyUserInfo}>
              {renderAvatar(selectedStory?.user?.avatar, selectedStory?.user?.firstName, selectedStory?.user?.lastName, 36)}
              <View>
                <Text style={styles.storyUserName}>
                  {selectedStory?.user?.firstName} {selectedStory?.user?.lastName}
                </Text>
                <Text style={styles.storyTime}>{formatTimeAgo(selectedStory?.posts[storyIndex]?.createdAt)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeStory} style={styles.storyCloseBtn}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.storyTapAreaLeft} onPress={() => storyIndex > 0 && setStoryIndex((i) => i - 1)} />
          <TouchableOpacity style={styles.storyTapAreaRight} onPress={goToNextStoryPost} />

          <View style={styles.storyContent}>
            {selectedStory?.posts[storyIndex]?.type === 'image' ? (
              <Image source={{ uri: selectedStory.posts[storyIndex].media[0] }} style={styles.storyMedia} resizeMode="contain" />
            ) : selectedStory?.posts[storyIndex]?.type === 'video' ? (
              <Image source={{ uri: selectedStory.posts[storyIndex].media[0] }} style={styles.storyMedia} resizeMode="contain" />
            ) : (
              <View style={styles.storyTextCard}>
                <Text style={styles.storyTextContent}>{selectedStory?.posts[storyIndex]?.content}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Create Post Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCreateModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalClose}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalUser}>
              {renderAvatar(user?.avatar, user?.firstName, user?.lastName, 44)}
              <View>
                <Text style={styles.modalUserName}>{user?.firstName} {user?.lastName}</Text>
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

            {postType === 'link' && (
              <View style={styles.linkInputContainer}>
                <LinkIcon size={18} color="#6B7280" style={styles.linkInputIcon} />
                <TextInput
                  style={styles.linkInput}
                  placeholder="Paste URL here..."
                  placeholderTextColor="#9CA3AF"
                  value={linkUrl}
                  onChangeText={setLinkUrl}
                  keyboardType="url"
                />
              </View>
            )}

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
                      onPress={() => {
                        setPostType(type);
                        setLinkUrl('');
                        setLinkPreview(null);
                      }}
                    >
                      <Icon size={18} color={isActive ? '#059669' : '#6B7280'} />
                      <Text style={[styles.postTypeText, isActive && styles.postTypeTextActive]}>{config.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalSubmit, (!newPostContent.trim() || isSubmitting) && styles.modalSubmitDisabled]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Post</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Share Modal */}
      <Modal visible={!!shareModalPost} transparent animationType="fade" onRequestClose={closeShareModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeShareModal} />
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Post</Text>
              <TouchableOpacity onPress={closeShareModal} style={styles.modalClose}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.shareSection}>
                <Text style={styles.shareSectionTitle}>Shareable Link</Text>
                <View style={styles.shareLinkBox}>
                  <Text style={styles.shareLinkText} numberOfLines={1}>
                    {shareLink ? `https://vivaworks.com/share/${shareLink}` : 'Generating...'}
                  </Text>
                  <TouchableOpacity onPress={copyShareLink} disabled={!shareLink} style={styles.copyBtn}>
                    {copiedLink ? <Check size={18} color="#059669" /> : <Copy size={18} color="#059669" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.shareSection}>
                <Text style={styles.shareSectionTitle}>Send to a Connection</Text>
                <View style={styles.searchBox}>
                  <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {isSearching && (
                  <View style={styles.searchingState}>
                    <ActivityIndicator color="#059669" />
                  </View>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map((result) => (
                      <TouchableOpacity
                        key={result.id}
                        style={styles.searchResultItem}
                        onPress={() => sendPostToUser(result.id)}
                        disabled={sendingToUser === result.id}
                      >
                        {renderAvatar(result.avatar, result.firstName, result.lastName, 36)}
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultName} numberOfLines={1}>
                            {result.firstName} {result.lastName}
                          </Text>
                          {result.headline && <Text style={styles.searchResultHeadline} numberOfLines={1}>{result.headline}</Text>}
                        </View>
                        {sendingToUser === result.id ? (
                          <ActivityIndicator size="small" color="#059669" />
                        ) : (
                          <Send size={18} color="#059669" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <Text style={styles.emptySearchText}>No users found</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 4. Lightbox Modal */}
      <Modal visible={lightboxOpen} transparent animationType="fade" onRequestClose={() => setLightboxOpen(false)}>
        <View style={styles.lightboxContainer}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxOpen(false)}>
            <X size={28} color="#fff" />
          </TouchableOpacity>

          {lightboxIndex > 0 && (
            <TouchableOpacity style={[styles.lightboxNav, styles.lightboxPrev]} onPress={() => setLightboxIndex((i) => i - 1)}>
              <ChevronLeft size={32} color="#fff" />
            </TouchableOpacity>
          )}

          <Image source={{ uri: lightboxImages[lightboxIndex] }} style={styles.lightboxImage} resizeMode="contain" />

          {lightboxIndex < lightboxImages.length - 1 && (
            <TouchableOpacity style={[styles.lightboxNav, styles.lightboxNext]} onPress={() => setLightboxIndex((i) => i + 1)}>
              <ChevronRight size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {lightboxImages.length > 1 && (
            <View style={styles.lightboxDots}>
              {lightboxImages.map((_, idx) => (
                <View key={idx} style={[styles.lightboxDot, idx === lightboxIndex && styles.lightboxDotActive]} />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // 🎯 Centered for a cleaner look
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },

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
  errorText: { flex: 1, fontSize: 14, color: '#EF4444', fontWeight: '500' },

  // List
  listContent: { paddingBottom: 100 }, // 🎯 Extra padding so FAB doesn't cover the last post
  loadingMore: { paddingVertical: 20, alignItems: 'center' },
  endOfFeed: { paddingVertical: 20, alignItems: 'center' },
  endOfFeedText: { fontSize: 14, color: '#9CA3AF' },

  // Stories
  storiesContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 16 },
  storiesContent: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 72 },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 2, backgroundColor: '#059669' },
  createStoryRing: { width: 64, height: 64, borderRadius: 32, padding: 2, backgroundColor: '#D1FAE5', position: 'relative' },
  createStoryBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  storyName: { fontSize: 11, color: '#374151', marginTop: 8, textAlign: 'center', fontWeight: '500' },

  // Post Card
  postCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  postHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  postHeaderText: { marginLeft: 12, flex: 1 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postAuthor: { fontSize: 15, fontWeight: '600', color: '#111827' },
  postMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  postHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  postActionBtn: { padding: 8, marginLeft: 4 },

  // Post Content
  postContent: { paddingHorizontal: 16 },
  postText: { fontSize: 15, lineHeight: 22, color: '#1F2937', marginBottom: 12 },
  
  // Media
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  mediaGridSingle: { flexDirection: 'column' },
  mediaItem: { width: '49%', aspectRatio: 1, position: 'relative' },
  mediaItemSingle: { width: '100%', aspectRatio: 16 / 9 },
  mediaItemLarge: { width: '100%', aspectRatio: 2 },
  mediaImage: { width: '100%', height: '100%' },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  mediaOverlayText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

  // Video
  videoContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative', aspectRatio: 16 / 9, backgroundColor: '#000' },
  videoThumbnail: { width: '100%', height: '100%' },
  videoPlayOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  videoPlayButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  videoControls: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row' },
  videoControlBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  // Link
  linkCard: { borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 12 },
  linkImage: { width: '100%', height: 160, backgroundColor: '#F3F4F6' },
  linkContent: { padding: 12 },
  linkTitle: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  linkDesc: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  linkDomain: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  linkDomainText: { fontSize: 12, color: '#059669' },

  // Actions
  postActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  postActionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  actionTextActive: { color: '#EF4444' },

  // Comments
  commentsSection: { backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  commentsList: { padding: 16 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatarWrap: { marginRight: 10 },
  commentContent: { flex: 1 },
  commentBubble: { backgroundColor: '#fff', borderRadius: 16, borderTopLeftRadius: 4, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  replyBubble: { backgroundColor: '#F3F4F6', borderTopLeftRadius: 16 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#111827' },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, marginLeft: 4 },
  commentTime: { fontSize: 11, color: '#9CA3AF' },
  commentActionText: { fontSize: 12, fontWeight: '600', color: '#059669' },
  noComments: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 16 },

  // Reply
  replyInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  replyInput: { flex: 1, fontSize: 13, color: '#111827', maxHeight: 60 },
  replySendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  repliesContainer: { marginTop: 12, marginLeft: 4, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E5E7EB' },
  replyItem: { flexDirection: 'row', marginBottom: 12 },

  // Main Comment Input
  mainCommentInput: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  commentInputBox: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, borderWidth: 1, borderColor: '#E5E7EB' },
  commentInputField: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827', maxHeight: 100 },
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  commentSendBtnDisabled: { backgroundColor: '#D1D5DB' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptyStateMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyStateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyStateButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // 🎯 Premium Floating Action Button
  fab: {
    position: 'absolute', 
    right: 24, 
    bottom: 24, 
    width: 60, 
    height: 60, 
    borderRadius: 30,
    backgroundColor: '#059669', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#059669', // 🎯 Colored shadow for a premium glow effect
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 10, 
    zIndex: 100,
  },

  // Story Modal
  storyModalContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  storyProgressContainer: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', gap: 4, zIndex: 10 },
  storyProgressBarBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  storyProgressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  storyHeader: { position: 'absolute', top: 70, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  storyUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyUserName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  storyTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  storyCloseBtn: { padding: 8 },
  storyTapAreaLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 5 },
  storyTapAreaRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%', zIndex: 5 },
  storyContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  storyMedia: { width: '100%', maxHeight: '70%', borderRadius: 12 },
  storyTextCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  storyTextContent: { fontSize: 18, color: '#111827', lineHeight: 26, textAlign: 'center' },

  // Generic Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalClose: { padding: 4 },
  modalUser: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalUserName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  modalVisibility: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  modalVisibilityText: { fontSize: 12, color: '#6B7280' },
  modalInput: { fontSize: 17, color: '#111827', minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  
  // Link Input in Modal
  linkInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  linkInputIcon: { marginRight: 8 },
  linkInput: { flex: 1, fontSize: 15, color: '#111827' },

  modalPostTypes: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 20 },
  modalPostTypesLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  modalPostTypesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  postTypeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  postTypeBtnActive: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#059669' },
  postTypeText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  postTypeTextActive: { color: '#059669' },
  modalSubmit: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalSubmitDisabled: { backgroundColor: '#D1D5DB' },
  modalSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Share Modal Specifics
  shareSection: { marginBottom: 20 },
  shareSectionTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 10 },
  shareLinkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  shareLinkText: { flex: 1, fontSize: 13, color: '#6B7280', marginRight: 12 },
  copyBtn: { padding: 8 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  searchingState: { paddingVertical: 20, alignItems: 'center' },
  searchResults: { marginTop: 12 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  searchResultHeadline: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptySearchText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 20 },

  // Lightbox
  lightboxContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  lightboxClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  lightboxImage: { width: SCREEN_WIDTH, height: '80%' },
  lightboxNav: { position: 'absolute', top: '50%', marginTop: -24, padding: 12, zIndex: 10 },
  lightboxPrev: { left: 8 },
  lightboxNext: { right: 8 },
  lightboxDots: { position: 'absolute', bottom: 40, flexDirection: 'row', gap: 8 },
  lightboxDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  lightboxDotActive: { backgroundColor: '#fff' },

  // Avatar Placeholder
  avatarPlaceholder: { backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
});

export default HomeScreen;