// src/screens/PostJobScreen.js

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import api from '../utils/api';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

const PostJobScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    budgetType: 'fixed',
    type: 'remote',
    experienceLevel: 'intermediate',
    skills: [],
    requirements: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const jobTypes = [
    { key: 'remote', label: 'Remote', icon: '🏠' },
    { key: 'onsite', label: 'On-site', icon: '🏢' },
    { key: 'hybrid', label: 'Hybrid', icon: '🔄' },
  ];

  const experienceLevels = [
    { key: 'entry', label: 'Entry Level' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'expert', label: 'Expert' },
  ];

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

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (!formData.budgetMin || !formData.budgetMax) {
      newErrors.budget = 'Budget range is required';
    }

    if (formData.skills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        budget: {
          type: formData.budgetType,
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax),
        },
        type: formData.type,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills,
        requirements: formData.requirements
          .split('\n')
          .filter((req) => req.trim()),
      };

      await api.post('/jobs', jobData);
      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.friendlyMessage || 'Failed to post job');
    } finally {
      setIsLoading(false);
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
          {/* Job Title */}
          <Card style={styles.section}>
            <Input
              label="Job Title"
              placeholder="e.g. Full Stack Developer Needed"
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              error={errors.title}
              required
            />
          </Card>

          {/* Job Type */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Job Type</Text>
            <View style={styles.optionsRow}>
              {jobTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.optionChip,
                    formData.type === type.key && styles.optionChipActive,
                  ]}
                  onPress={() => updateField('type', type.key)}
                >
                  <Text style={styles.optionIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      formData.type === type.key && styles.optionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Description */}
          <Card style={styles.section}>
            <Input
              label="Job Description"
              placeholder="Describe the job in detail..."
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              error={errors.description}
              multiline
              numberOfLines={6}
              required
            />
          </Card>

          {/* Budget */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            
            <View style={styles.budgetTypeRow}>
              <TouchableOpacity
                style={[
                  styles.budgetTypeChip,
                  formData.budgetType === 'fixed' && styles.budgetTypeActive,
                ]}
                onPress={() => updateField('budgetType', 'fixed')}
              >
                <Text
                  style={[
                    styles.budgetTypeText,
                    formData.budgetType === 'fixed' && styles.budgetTypeTextActive,
                  ]}
                >
                  Fixed Price
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.budgetTypeChip,
                  formData.budgetType === 'hourly' && styles.budgetTypeActive,
                ]}
                onPress={() => updateField('budgetType', 'hourly')}
              >
                <Text
                  style={[
                    styles.budgetTypeText,
                    formData.budgetType === 'hourly' && styles.budgetTypeTextActive,
                  ]}
                >
                  Hourly Rate
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.budgetInputs}>
              <View style={styles.budgetInputWrapper}>
                <Input
                  label="Minimum (₦)"
                  placeholder="50,000"
                  value={formData.budgetMin}
                  onChangeText={(value) => updateField('budgetMin', value)}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.budgetDash}>-</Text>
              <View style={styles.budgetInputWrapper}>
                <Input
                  label="Maximum (₦)"
                  placeholder="150,000"
                  value={formData.budgetMax}
                  onChangeText={(value) => updateField('budgetMax', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {errors.budget && <Text style={styles.errorText}>{errors.budget}</Text>}
          </Card>

          {/* Experience Level */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Experience Level</Text>
            <View style={styles.optionsRow}>
              {experienceLevels.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.levelChip,
                    formData.experienceLevel === level.key && styles.levelChipActive,
                  ]}
                  onPress={() => updateField('experienceLevel', level.key)}
                >
                  <Text
                    style={[
                      styles.levelText,
                      formData.experienceLevel === level.key && styles.levelTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Skills */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillInputRow}>
              <View style={styles.skillInputWrapper}>
                <Input
                  placeholder="Add a skill (e.g. React)"
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
            {errors.skills && <Text style={styles.errorText}>{errors.skills}</Text>}
            
            <View style={styles.skillsContainer}>
              {formData.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <Text style={styles.skillRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Card>

          {/* Requirements */}
          <Card style={styles.section}>
            <Input
              label="Requirements (one per line)"
              placeholder="e.g. 3+ years experience&#10;Proficient in React Native&#10;Good communication skills"
              value={formData.requirements}
              onChangeText={(value) => updateField('requirements', value)}
              multiline
              numberOfLines={4}
            />
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title="Post Job"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.md,
  },
  section: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    ...FONTS.h6,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  optionIcon: {
    fontSize: 18,
    marginRight: SIZES.xs,
  },
  optionText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  budgetTypeRow: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  budgetTypeChip: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    marginRight: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  budgetTypeActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  budgetTypeText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  budgetTypeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  budgetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInputWrapper: {
    flex: 1,
  },
  budgetDash: {
    ...FONTS.h5,
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.sm,
  },
  levelChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  levelText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  levelTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
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
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});

export default PostJobScreen;