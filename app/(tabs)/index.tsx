import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Camera, Trash2, Heart } from 'lucide-react-native';
import { Pet } from '@/types';
import { StorageService } from '@/services/storage';
import { format } from 'date-fns';

export default function HomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPets = async () => {
    try {
      setLoading(true);
      const loadedPets = await StorageService.getPets();
      setPets(loadedPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert('Error', 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [])
  );

  const handleDeletePet = (pet: Pet) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet.name}? This will also delete all reminders for this pet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPets = await StorageService.deletePet(pet.id);
              setPets(updatedPets);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const renderPetCard = ({ item: pet }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => router.push({ pathname: '/pet-details', params: { pet: JSON.stringify(pet) } })}
    >
      <View style={styles.petImageContainer}>
        {pet.imageUri ? (
          <Image source={{ uri: pet.imageUri }} style={styles.petImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Camera size={32} color="#9CA3AF" />
          </View>
        )}
      </View>
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petDetails}>
          {pet.type} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
        </Text>
        <Text style={styles.petDate}>
          Added {format(pet.createdAt, 'MMM d, yyyy')}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePet(pet)}
      >
        <Trash2 size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Heart size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No pets yet!</Text>
      <Text style={styles.emptyDescription}>
        Add your first pet to start managing their care reminders
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading pets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-pet')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  petImageContainer: {
    marginRight: 16,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  petDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 100,
  },
});
