import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Mic, Globe, UserCheck, Lock } from 'lucide-react-native';
import { api } from '../../utils/api'; // Adjust path if needed
// import useAudioRoomStore from '../../stores/audioRoomStore'; // Uncomment if needed

const visibilityOptions = [
  { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can join' },
  { value: 'followers_only', label: 'Followers', icon: UserCheck, desc: 'Only your followers' },
  { value: 'private', label: 'Private', icon: Lock, desc: 'Invite only' },
];

const AudioRoomCreator = ({ visible, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || title.trim().length < 3) {
      Alert.alert('Error', 'Title must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/vivarooms', {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      });
      
      Alert.alert('Success', 'VivaRoom created!');
      onCreated?.(res.data.room);
      
      // Reset form and close
      setTitle('');
      setDescription('');
      setVisibility('public');
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          {/* Transparent backdrop to close on tap outside */}
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.iconWrap}>
                  <Mic size={18} color="#059669" />
                </View>
                <Text style={styles.headerTitle}>Create VivaRoom</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Room Title <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What's the topic?"
                  maxLength={100}
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Description <Text style={styles.optional}>(optional)</Text>
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell people what you'll be discussing..."
                  maxLength={280}
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top" // Important for Android multiline
                />
                <Text style={styles.charCount}>{description.length}/280</Text>
              </View>

              {/* Visibility */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Who can join?</Text>
                <View style={styles.visibilityOptions}>
                  {visibilityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = visibility === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setVisibility(option.value)}
                        style={[
                          styles.visibilityOption,
                          isSelected && styles.visibilityOptionSelected,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Icon
                          size={18}
                          color={isSelected ? '#059669' : '#9CA3AF'}
                        />
                        <View style={styles.visibilityTextContainer}>
                          <Text
                            style={[
                              styles.visibilityLabel,
                              isSelected && styles.visibilityLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.visibilityDesc}>{option.desc}</Text>
                        </View>
                        <View
                          style={[
                            styles.radioButton,
                            isSelected && styles.radioButtonSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioButtonInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !title.trim()}
                style={[
                  styles.submitButton,
                  (loading || !title.trim()) && styles.submitButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Mic size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>Go Live</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // backdrop-blur-sm equivalent
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    backgroundColor: '#D1FAE5', // emerald-100
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  optional: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  visibilityOptions: {
    gap: 8,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  visibilityOptionSelected: {
    borderColor: '#10B981', // emerald-500
    backgroundColor: '#ECFDF5', // emerald-50
  },
  visibilityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  visibilityLabelSelected: {
    color: '#047857', // emerald-700
  },
  visibilityDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#10B981',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669', // emerald-600
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AudioRoomCreator;