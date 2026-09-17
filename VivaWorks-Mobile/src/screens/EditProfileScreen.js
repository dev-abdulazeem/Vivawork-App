// src/screens/EditProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Card from '../components/Card';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    hourlyRate: '',
    skills: [],
    portfolio: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        title: user.title || user.profession || '',
        bio: user.bio || '',
        location: user.location || '',
        hourlyRate: user.hourlyRate?.toString() || '',
        skills: user.skills || [],
        portfolio: user.portfolio || [],
      });
    }
  }, [user]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      updateField('skills', [...formData.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    updateField(
      'skills',
      formData.skills.filter((skill) => skill !== skillToRemove)
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.hourlyRate && isNaN(formData.hourlyRate)) {
      newErrors.hourlyRate = 'Please enter a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name,
        title: formData.title,
        bio: formData.bio,
        location: formData.location,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        skills: formData.skills,
      };

      const response = await api.put('/users/profile', updateData);
      updateUser(response.data);

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.friendlyMessage || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera') },
        { text: 'Gallery', onPress: () => console.log('Gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Edit Profile"
        showBack
        onBackPress={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <Card style={styles.photoCard}>
            <View style={styles.photoContainer}>
              <Avatar
                source={user?.avatar}
                name={formData.name}
                size="xlarge"
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Basic Info */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              error={errors.name}
              required
            />

            <Input
              label="Professional Title"
              placeholder="e.g. Full Stack Developer"
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
            />

            <Input
              label="Location"
              placeholder="e.g. Lagos, Nigeria"
              value={formData.location}
              onChangeText={(value) => updateField('location', value)}
            />

            <Input
              label="Hourly Rate (₦)"
              placeholder="e.g. 5000"
              value={formData.hourlyRate}
              onChangeText={(value) => updateField('hourlyRate', value)}
              error={errors.hourlyRate}
              keyboardType="numeric"
            />
          </Card>

          {/* Bio */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>About You</Text>

            <Input
              label="Bio"
              placeholder="Tell clients about yourself, your experience, and what you can help them with..."
              value={formData.bio}
              onChangeText={(value) => updateField('bio', value)}
              multiline
              numberOfLines={5}
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {formData.bio.length}/500
            </Text>
          </Card>

          {/* Skills */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>

            <View style={styles.skillInputRow}>
              <View style={styles.skillInputWrapper}>
                <Input
                  placeholder="Add a skill (e.g. React Native)"
                  value={skillInput}
                  onChangeText={setSkillInput}
                  onSubmitEditing={addSkill}
                />
              </View>
              <Button
                title="Add"
                onPress={addSkill}
                variant="outline"
                size="medium"
                fullWidth={false}
              />
            </View>

            <View style={styles.skillsContainer}>
              {formData.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <Text style={styles.skillRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {formData.skills.length === 0 && (
                <Text style={styles.emptySkills}>
                  Add skills to help clients find you
                </Text>
              )}
            </View>
          </Card>

          {/* Save Button */}
          <View style={styles.saveButtonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              variant="primary"
              size="large"
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  saveText: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.md,
  },
  photoCard: {
    marginBottom: SIZES.md,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  changePhotoButton: {
    marginTop: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusMd,
  },
  changePhotoText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  charCount: {
    ...FONTS.body3,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: -SIZES.sm,
  },
  skillInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  skillInputWrapper: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.sm,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  skillText: {
    ...FONTS.body2,
    color: COLORS.primary,
    marginRight: SIZES.xs,
  },
  skillRemove: {
    color: COLORS.primary,
    fontSize: 14,
  },
  emptySkills: {
    ...FONTS.body2,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  saveButtonContainer: {
    marginTop: SIZES.lg,
  },
  bottomPadding: {
    height: 40,
  },
});

export default EditProfileScreen;