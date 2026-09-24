import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

import {
  Briefcase,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Wrench,
  Globe,
} from 'lucide-react-native';

const PostJobScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    budget: '',
    budgetType: 'fixed',
    location: '',
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const budgetOptions = [
    { value: 'fixed', label: 'Fixed Price', desc: 'One-time payment' },
    { value: 'hourly', label: 'Hourly Rate', desc: 'Pay by the hour' },
    { value: 'retainer', label: 'Monthly Retainer', desc: 'Recurring monthly' },
  ];

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const pickImage = async () => {
    if (mediaFiles.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 images allowed');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are needed to upload images.');
      return;
    }

    // ✅ SAFE FALLBACK: Uses new API if available, falls back to string 'images' for older versions
    const mediaType = ImagePicker.MediaType 
      ? ImagePicker.MediaType.Images 
      : 'images';

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newFiles = result.assets.slice(0, 5 - mediaFiles.length).map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'image.jpg',
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchLinkPreview = async () => {
    if (!linkUrl.trim()) return;
    if (!linkUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLinkLoading(true);
    try {
      const response = await api.get(`/utils/link-preview?url=${encodeURIComponent(linkUrl)}`);
      setLinkPreview(response.data);
    } catch (err) {
      setLinkPreview({
        url: linkUrl,
        title: linkUrl,
        description: '',
        image: '',
      });
    } finally {
      setLinkLoading(false);
    }
  };

  const removeLink = () => {
    setLinkUrl('');
    setLinkPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    else if (formData.title.length > 200) newErrors.title = 'Title must be under 200 characters';

    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    else if (formData.description.length > 10000) newErrors.description = 'Description must be under 10000 characters';

    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Budget must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        skills: formData.skills
          ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        budget: formData.budget ? parseFloat(formData.budget) : null,
        budgetType: formData.budgetType,
        location: formData.location.trim() || null,
        media: mediaFiles.map((f) => f.uri), 
      };

      if (linkPreview) {
        payload.linkUrl = linkPreview.url;
        payload.linkTitle = linkPreview.title;
        payload.linkImage = linkPreview.image;
        payload.linkDesc = linkPreview.description;
      }

      await api.post('/jobs', payload);
      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.friendlyMessage || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Post a Job"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.headerIconWrap}>
              <Briefcase size={22} color={COLORS.primary || '#059669'} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Post a New Job</Text>
              <Text style={styles.headerSubtitle}>
                Describe your project clearly to attract the perfect freelancer.
              </Text>
            </View>
          </View>

          {/* Title */}
          <Card style={styles.section}>
            <View style={styles.labelRow}>
              <FileText size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
              <Text style={styles.labelText}>Job Title</Text>
              <Text style={styles.requiredText}>Required</Text>
            </View>
            <Input
              placeholder="e.g. Senior React Native Developer"
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              error={errors.title}
            />
            {errors.title && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={COLORS.error || '#EF4444'} />
                <Text style={styles.errorText}>{errors.title}</Text>
              </View>
            )}
            <Text style={styles.charCount}>{formData.title.length}/200</Text>
          </Card>

          {/* Description */}
          <Card style={styles.section}>
            <View style={styles.labelRow}>
              <FileText size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
              <Text style={styles.labelText}>Job Description</Text>
              <Text style={styles.requiredText}>Required</Text>
            </View>
            <Input
              placeholder="Describe the project, deliverables, and expectations..."
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              error={errors.description}
              multiline
              numberOfLines={6}
              style={styles.textArea}
            />
            {errors.description && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={COLORS.error || '#EF4444'} />
                <Text style={styles.errorText}>{errors.description}</Text>
              </View>
            )}
            <Text style={styles.charCount}>{formData.description.length}/10000</Text>
          </Card>

          {/* Skills */}
          <Card style={styles.section}>
            <View style={styles.labelRow}>
              <Wrench size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
              <Text style={styles.labelText}>Required Skills</Text>
            </View>
            <Input
              placeholder="e.g. React, Figma, Node.js"
              value={formData.skills}
              onChangeText={(value) => updateField('skills', value)}
            />
            <Text style={styles.helperText}>Separate multiple skills with commas</Text>
          </Card>

          {/* Budget & Type */}
          <Card style={styles.section}>
            <View style={styles.labelRow}>
              <DollarSign size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
              <Text style={styles.labelText}>Budget</Text>
            </View>

            <View style={styles.budgetOptionsRow}>
              {budgetOptions.map((opt) => {
                const isActive = formData.budgetType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.budgetOption,
                      isActive && styles.budgetOptionActive,
                    ]}
                    onPress={() => updateField('budgetType', opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.budgetOptionLabel, isActive && styles.budgetOptionLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.budgetOptionDesc, isActive && styles.budgetOptionDescActive]}>
                      {opt.desc}
                    </Text>
                    {isActive && (
                      <CheckCircle2 size={16} color={COLORS.primary || '#059669'} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.budgetInputWrap}>
              <Text style={styles.currencySymbol}>₦</Text>
              <Input
                placeholder="Enter amount"
                value={formData.budget}
                onChangeText={(value) => updateField('budget', value)}
                keyboardType="numeric"
                containerStyle={styles.budgetInputContainer}
                style={styles.budgetInputInner}
              />
            </View>
            {errors.budget && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={COLORS.error || '#EF4444'} />
                <Text style={styles.errorText}>{errors.budget}</Text>
              </View>
            )}
            <Text style={styles.helperText}>Leave empty for a negotiable budget</Text>
          </Card>

          {/* Location */}
          <Card style={styles.section}>
            <View style={styles.labelRow}>
              <MapPin size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
              <Text style={styles.labelText}>Location</Text>
            </View>
            <View style={styles.locationInputWrap}>
              <MapPin size={16} color={COLORS.textSecondary || '#64748B'} strokeWidth={2} style={styles.locationIcon} />
              <Input
                placeholder="e.g. Lagos, Nigeria or Remote"
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                containerStyle={styles.locationInputContainer}
                style={styles.locationInputInner}
              />
            </View>
          </Card>

          {/* Media Upload */}
          <Card style={styles.section}>
            <View style={styles.labelRow}>
              <ImageIcon size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
              <Text style={styles.labelText}>Attachments</Text>
            </View>

            <TouchableOpacity style={styles.uploadZone} onPress={pickImage} activeOpacity={0.7}>
              <View style={styles.uploadIconWrap}>
                <UploadCloud size={24} color={COLORS.primary || '#059669'} strokeWidth={2} />
              </View>
              <Text style={styles.uploadText}>Tap to select images</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG, GIF — up to 5 images</Text>
            </TouchableOpacity>

            {mediaFiles.length > 0 && (
              <View style={styles.mediaGrid}>
                {mediaFiles.map((media, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.mediaRemoveBtn}
                      onPress={() => removeMedia(index)}
                      activeOpacity={0.7}
                    >
                      <X size={14} color={COLORS.white} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Link Attachment */}
            <View style={styles.linkSection}>
              <View style={styles.labelRow}>
                <LinkIcon size={16} color={COLORS.primary || '#059669'} strokeWidth={2} />
                <Text style={styles.labelText}>Attach Link</Text>
              </View>

              {!linkPreview ? (
                <View style={styles.linkInputRow}>
                  <View style={styles.linkInputWrap}>
                    <Globe size={16} color={COLORS.textSecondary || '#64748B'} strokeWidth={2} style={styles.linkIcon} />
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChangeText={setLinkUrl}
                      keyboardType="url"
                      containerStyle={styles.linkInputContainer}
                      style={styles.linkInputInner}
                    />
                  </View>
                  <Button
                    title={linkLoading ? '...' : 'Add'}
                    onPress={fetchLinkPreview}
                    disabled={linkLoading || !linkUrl.trim()}
                    variant="outline"
                    size="medium"
                    fullWidth={false}
                    style={styles.linkAddBtn}
                  />
                </View>
              ) : (
                <View style={styles.linkPreviewCard}>
                  <TouchableOpacity style={styles.linkRemoveBtn} onPress={removeLink} activeOpacity={0.7}>
                    <X size={14} color={COLORS.textSecondary || '#64748B'} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <View style={styles.linkPreviewContent}>
                    {linkPreview.image ? (
                      <Image source={{ uri: linkPreview.image }} style={styles.linkPreviewImage} />
                    ) : (
                      <View style={styles.linkPreviewImagePlaceholder}>
                        <Globe size={20} color={COLORS.textSecondary || '#64748B'} strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.linkPreviewText}>
                      <Text style={styles.linkPreviewTitle} numberOfLines={1}>{linkPreview.title}</Text>
                      {linkPreview.description ? (
                        <Text style={styles.linkPreviewDesc} numberOfLines={2}>{linkPreview.description}</Text>
                      ) : null}
                      <Text style={styles.linkPreviewUrl} numberOfLines={1}>{linkPreview.url}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="large"
            style={styles.cancelBtn}
          />
          <Button
            title={submitting ? 'Posting...' : 'Post Job'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            variant="primary"
            size="large"
            style={styles.submitBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary || '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryLight || '#ECFDF5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary || '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary || '#64748B',
    marginTop: 4,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary || '#1E293B',
  },
  requiredText: {
    fontSize: 12,
    color: COLORS.error || '#EF4444',
    marginLeft: 'auto',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary || '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary || '#94A3B8',
    marginTop: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error || '#EF4444',
    fontWeight: '500',
  },
  budgetOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  budgetOption: {
    flex: 1,
    minWidth: '30%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E2E8F0',
    backgroundColor: COLORS.white || '#FFFFFF',
  },
  budgetOptionActive: {
    backgroundColor: COLORS.primaryLight || '#ECFDF5',
    borderColor: COLORS.primary || '#059669',
  },
  budgetOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary || '#1E293B',
    marginBottom: 4,
  },
  budgetOptionLabelActive: {
    color: COLORS.primary || '#059669',
  },
  budgetOptionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary || '#64748B',
    lineHeight: 14,
  },
  budgetOptionDescActive: {
    color: COLORS.primary || '#059669',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E2E8F0',
    borderRadius: 12,
    backgroundColor: COLORS.white || '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary || '#64748B',
    paddingLeft: 16,
    paddingRight: 8,
  },
  budgetInputContainer: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  budgetInputInner: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  locationInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E2E8F0',
    borderRadius: 12,
    backgroundColor: COLORS.white || '#FFFFFF',
    overflow: 'hidden',
  },
  locationIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  locationInputContainer: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  locationInputInner: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight || '#CBD5E1',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary || '#F8FAFC',
  },
  uploadIconWrap: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.primaryLight || '#ECFDF5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary || '#334155',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary || '#64748B',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  mediaItem: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100 || '#F1F5F9',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkSection: {
    marginTop: 28,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || '#F1F5F9',
  },
  linkInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E2E8F0',
    borderRadius: 12,
    backgroundColor: COLORS.white || '#FFFFFF',
    overflow: 'hidden',
  },
  linkIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  linkInputContainer: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  linkInputInner: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  linkAddBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  linkPreviewCard: {
    padding: 16,
    backgroundColor: COLORS.backgroundSecondary || '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E2E8F0',
  },
  linkRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E2E8F0',
    zIndex: 10,
  },
  linkPreviewContent: {
    flexDirection: 'row',
    gap: 14,
    paddingRight: 36,
  },
  linkPreviewImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.gray200 || '#E2E8F0',
  },
  linkPreviewImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.gray100 || '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkPreviewText: {
    flex: 1,
    justifyContent: 'center',
  },
  linkPreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary || '#0F172A',
    marginBottom: 4,
  },
  linkPreviewDesc: {
    fontSize: 12,
    color: COLORS.textSecondary || '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  linkPreviewUrl: {
    fontSize: 12,
    color: COLORS.primary || '#059669',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white || '#FFFFFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight || '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});

export default PostJobScreen;