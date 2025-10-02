import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, ArrowLeft, Check } from 'lucide-react-native';
import { Pet } from '@/types';
import { StorageService } from '@/services/storage';
import { v4 as uuidv4 } from 'uuid';

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'];

export default function AddPetScreen() {
  const params = useLocalSearchParams();
  let existingPet: Pet | null = null;

  if (params.pet) {
    const parsedPet = JSON.parse(params.pet as string);
    existingPet = {
      ...parsedPet,
      createdAt: parsedPet.createdAt ? new Date(parsedPet.createdAt) : new Date(),
      updatedAt: parsedPet.updatedAt ? new Date(parsedPet.updatedAt) : new Date(),
    };
  }

  const [name, setName] = useState(existingPet?.name || '');
  const [type, setType] = useState(existingPet?.type || '');
  const [age, setAge] = useState(existingPet?.age?.toString() || '');
  const [imageUri, setImageUri] = useState(existingPet?.imageUri || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleWebFileInput = (event: any) => {
    const file = event.target?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Camera', onPress: takePhoto },
          { text: 'Gallery', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Pet name is required');
      return;
    }

    if (!type.trim()) {
      Alert.alert('Error', 'Pet type is required');
      return;
    }

    if (!age.trim() || isNaN(parseInt(age)) || parseInt(age) < 0) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    try {
      setLoading(true);

      const now = new Date();
      const petData: Pet = {
        id: existingPet?.id || uuidv4(),
        name: name.trim(),
        type: type.trim(),
        age: parseInt(age),
        imageUri: imageUri || undefined,
        createdAt: existingPet?.createdAt || now,
        updatedAt: now,
      };

      if (existingPet) {
        await StorageService.updatePet(existingPet.id, petData);
      } else {
        await StorageService.addPet(petData);
      }

      router.back();
    } catch (error) {
      console.error('Error saving pet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pet';
      Alert.alert('Error', `Failed to save pet: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {existingPet ? 'Edit Pet' : 'Add Pet'}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={loading}
        >
          <Check size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleWebFileInput}
          />
        )}

        <TouchableOpacity style={styles.imageSection} onPress={showImagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.petImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={32} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter pet name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet Type *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.typeSelector}
            >
              {PET_TYPES.map((petType) => (
                <TouchableOpacity
                  key={petType}
                  style={[
                    styles.typeButton,
                    type === petType && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType(petType)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === petType && styles.typeButtonTextSelected,
                    ]}
                  >
                    {petType}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              value={type}
              onChangeText={setType}
              placeholder="Or enter custom type"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (years) *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter age"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  petImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  typeSelector: {
    marginBottom: 12,
  },
  typeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
  },
});