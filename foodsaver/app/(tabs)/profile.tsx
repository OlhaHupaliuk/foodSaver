import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LogOut, User, Mail, Phone, MapPin, Store, ExternalLink, Plus, X, Edit2, Camera } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { signOut, user, refreshUser } = useAuth();
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    photo: null as string | null,
  });
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    phone: '',
    address: '',
    googleMapsLink: '',
    description: '',
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (err) {
      console.log(err);
    }
  };

  const handleOpenMaps = () => {
    if (user?.restaurant?.googleMapsLink) {
      Linking.openURL(user.restaurant.googleMapsLink);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Помилка', 'Потрібен доступ до галереї для завантаження фото');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduced quality to decrease file size (0.5 = 50% quality)
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const sizeInMB = (base64.length * 3) / 4 / 1024 / 1024; // Approximate size in MB
      console.log('Image size:', sizeInMB.toFixed(2), 'MB');
      
      if (sizeInMB > 5) {
        Alert.alert('Помилка', 'Фото занадто велике. Будь ласка, виберіть менше фото.');
        return;
      }
      
      setProfileData({ ...profileData, photo: base64 });
    }
  };

  const handleOpenEditProfile = () => {
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || '',
      photo: user?.photo || null,
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Помилка', 'Введіть ім\'я');
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        name: profileData.name,
      };
      
      // Only include phone if it's provided or being cleared
      if (profileData.phone !== undefined) {
        updateData.phone = profileData.phone || '';
      }
      
      // Always include photo field if it's being changed
      // If photo is null and user had a photo, send empty string to remove it
      // If photo has a value, send it
      // If photo is null and user had no photo, don't send it (no change)
      if (profileData.photo !== null && profileData.photo !== undefined) {
        // New photo selected
        updateData.photo = profileData.photo;
        console.log('Sending photo update, length:', profileData.photo.length);
      } else if (profileData.photo === null && user?.photo) {
        // User wants to remove existing photo
        updateData.photo = '';
        console.log('Removing photo');
      }
      // If photo is null and user had no photo, don't include it in updateData

      console.log('Updating profile with:', Object.keys(updateData));
      const response = await api.auth.updateProfile(updateData);

      if (response.status === 'success') {
        await refreshUser();
        setShowEditProfile(false);
        Alert.alert('Успіх', 'Профіль оновлено');
      } else {
        Alert.alert('Помилка', response.message || 'Не вдалося оновити профіль');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося оновити профіль');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditRestaurant = () => {
    if (!user?.restaurant || typeof user.restaurant === 'string') return;
    
    setRestaurantData({
      name: user.restaurant.name || '',
      phone: user.restaurant.phone || '',
      address: user.restaurant.address || '',
      googleMapsLink: user.restaurant.googleMapsLink || '',
      description: user.restaurant.description || '',
    });
    setShowEditRestaurant(true);
  };

  const handleUpdateRestaurant = async () => {
    if (!validateRestaurantForm()) return;
    if (!user?.restaurant || typeof user.restaurant === 'string') return;

    try {
      setSaving(true);
      const response = await api.restaurants.update(user.restaurant.id, restaurantData);

      if (response.status === 'success') {
        await refreshUser();
        setShowEditRestaurant(false);
        Alert.alert('Успіх', 'Інформацію про ресторан оновлено');
      } else {
        Alert.alert('Помилка', response.message || 'Не вдалося оновити ресторан');
      }
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Не вдалося оновити ресторан');
    } finally {
      setSaving(false);
    }
  };

  const validateRestaurantForm = () => {
    if (!restaurantData.name.trim()) {
      Alert.alert('Помилка', 'Введіть назву ресторану');
      return false;
    }
    if (!restaurantData.phone.trim()) {
      Alert.alert('Помилка', 'Введіть номер телефону');
      return false;
    }
    if (!restaurantData.address.trim()) {
      Alert.alert('Помилка', 'Введіть адресу');
      return false;
    }
    if (!restaurantData.googleMapsLink.trim()) {
      Alert.alert('Помилка', 'Введіть посилання Google Maps');
      return false;
    }
    if (!restaurantData.googleMapsLink.includes('google.com/maps') && 
        !restaurantData.googleMapsLink.includes('goo.gl')) {
      Alert.alert('Помилка', 'Введіть коректне посилання Google Maps');
      return false;
    }
    return true;
  };

  const handleCreateRestaurant = async () => {
    if (!validateRestaurantForm()) return;

    try {
      setSaving(true);
      
      const response = await api.restaurants.create(restaurantData);

      if (response.status === 'success') {
        setRestaurantData({
          name: '',
          phone: '',
          address: '',
          googleMapsLink: '',
          description: '',
        });
        setShowCreateRestaurant(false);
        Alert.alert('Успіх', 'Ресторан успішно створено');
        router.push('/(tabs)/profile');
      }
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Не вдалося створити ресторан');
    } finally {
      setSaving(false);
    }
  };

  const hasRestaurant = user?.restaurant || user?.role === 'restaurant_owner';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Профіль</Text>
        <TouchableOpacity onPress={handleOpenEditProfile} style={styles.editButton}>
          <Edit2 size={20} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, hasRestaurant && styles.avatarRestaurant]}>
                {hasRestaurant ? (
                  <Store size={48} color="#10b981" />
                ) : (
                  <User size={48} color="#10b981" />
                )}
              </View>
            )}
            {hasRestaurant && (
              <Text style={styles.restaurantBadge}>Власник ресторану</Text>
            )}
          </View>

          <View style={styles.infoSection}>
            {/* Ім'я */}
            <View style={styles.infoRow}>
              <User size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ім'я</Text>
                <Text style={styles.infoValue}>{user?.name || ''}</Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.infoRow}>
              <Mail size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || ''}</Text>
              </View>
            </View>

            {/* Телефон */}
            {user?.phone && (
              <View style={styles.infoRow}>
                <Phone size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Телефон</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </View>
            )}

            {/* Інформація про ресторан */}
            {hasRestaurant && user?.restaurant && (
              <>
                <View style={styles.divider} />
                
                <View style={styles.restaurantSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Мій ресторан</Text>
                    <TouchableOpacity onPress={handleOpenEditRestaurant} style={styles.editIconButton}>
                      <Edit2 size={18} color="#10b981" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.infoRow}>
                    <Store size={20} color="#10b981" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Назва</Text>
                      <Text style={styles.infoValue}>{user.restaurant.name}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Phone size={20} color="#10b981" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Телефон</Text>
                      <Text style={styles.infoValue}>{user.restaurant.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <MapPin size={20} color="#10b981" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Адреса</Text>
                      <Text style={styles.infoValue}>{user.restaurant.address}</Text>
                    </View>
                  </View>

                  {user.restaurant.googleMapsLink && (
                    <TouchableOpacity 
                      style={styles.mapLinkButton}
                      onPress={handleOpenMaps}
                    >
                      <MapPin size={18} color="#10b981" />
                      <Text style={styles.mapLinkText}>Відкрити на Google Maps</Text>
                      <ExternalLink size={16} color="#10b981" />
                    </TouchableOpacity>
                  )}

                  {user.restaurant.description && (
                    <Text style={styles.description}>{user.restaurant.description}</Text>
                  )}
                </View>
              </>
            )}

            {/* Кнопка для створення ресторану */}
            {!hasRestaurant && (
              <TouchableOpacity 
                style={styles.createRestaurantButton}
                onPress={() => setShowCreateRestaurant(true)}
              >
                <Plus size={20} color="#10b981" />
                <Text style={styles.createRestaurantText}>Створити ресторан</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Кнопка виходу */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Вийти</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Модаль для створення ресторану */}
      <Modal 
        visible={showCreateRestaurant}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateRestaurant(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Створити ресторан</Text>
              <TouchableOpacity onPress={() => setShowCreateRestaurant(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.modalInput}
                placeholder="Назва ресторану *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.name}
                onChangeText={(text) => setRestaurantData({...restaurantData, name: text})}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Телефон *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.phone}
                onChangeText={(text) => setRestaurantData({...restaurantData, phone: text})}
                keyboardType="phone-pad"
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Адреса *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.address}
                onChangeText={(text) => setRestaurantData({...restaurantData, address: text})}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Google Maps посилання *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.googleMapsLink}
                onChangeText={(text) => setRestaurantData({...restaurantData, googleMapsLink: text})}
                autoCapitalize="none"
                editable={!saving}
              />

              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="Опис (необов'язково)"
                placeholderTextColor="#9ca3af"
                value={restaurantData.description}
                onChangeText={(text) => setRestaurantData({...restaurantData, description: text})}
                multiline
                numberOfLines={3}
                editable={!saving}
              />

              <TouchableOpacity 
                style={[styles.modalButton, saving && styles.modalButtonDisabled]}
                onPress={handleCreateRestaurant}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Створити ресторан</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowCreateRestaurant(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Модаль для редагування профілю */}
      <Modal 
        visible={showEditProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditProfile(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Редагувати профіль</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              {/* Photo Section */}
              <View style={styles.photoSection}>
                {profileData.photo ? (
                  <Image source={{ uri: profileData.photo }} style={styles.editAvatarImage} />
                ) : (
                  <View style={styles.editAvatar}>
                    <User size={48} color="#10b981" />
                  </View>
                )}
                <View style={styles.photoButtonsRow}>
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={handlePickImage}
                    disabled={saving}
                  >
                    <Camera size={20} color="#10b981" />
                    <Text style={styles.photoButtonText}>
                      {profileData.photo ? 'Змінити фото' : 'Додати фото'}
                    </Text>
                  </TouchableOpacity>
                  {profileData.photo && (
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => setProfileData({ ...profileData, photo: null })}
                      disabled={saving}
                    >
                      <X size={18} color="#ef4444" />
                      <Text style={styles.removePhotoButtonText}>Видалити</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Ім'я *"
                placeholderTextColor="#9ca3af"
                value={profileData.name}
                onChangeText={(text) => setProfileData({...profileData, name: text})}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Телефон"
                placeholderTextColor="#9ca3af"
                value={profileData.phone}
                onChangeText={(text) => setProfileData({...profileData, phone: text})}
                keyboardType="phone-pad"
                editable={!saving}
              />

              <TouchableOpacity 
                style={[styles.modalButton, saving && styles.modalButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Зберегти</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEditProfile(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Модаль для редагування ресторану */}
      <Modal 
        visible={showEditRestaurant}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditRestaurant(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Редагувати ресторан</Text>
              <TouchableOpacity onPress={() => setShowEditRestaurant(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.modalInput}
                placeholder="Назва ресторану *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.name}
                onChangeText={(text) => setRestaurantData({...restaurantData, name: text})}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Телефон *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.phone}
                onChangeText={(text) => setRestaurantData({...restaurantData, phone: text})}
                keyboardType="phone-pad"
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Адреса *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.address}
                onChangeText={(text) => setRestaurantData({...restaurantData, address: text})}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Google Maps посилання *"
                placeholderTextColor="#9ca3af"
                value={restaurantData.googleMapsLink}
                onChangeText={(text) => setRestaurantData({...restaurantData, googleMapsLink: text})}
                autoCapitalize="none"
                editable={!saving}
              />

              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="Опис (необов'язково)"
                placeholderTextColor="#9ca3af"
                value={restaurantData.description}
                onChangeText={(text) => setRestaurantData({...restaurantData, description: text})}
                multiline
                numberOfLines={3}
                editable={!saving}
              />

              <TouchableOpacity 
                style={[styles.modalButton, saving && styles.modalButtonDisabled]}
                onPress={handleUpdateRestaurant}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Оновити ресторан</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEditRestaurant(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarRestaurant: {
    backgroundColor: '#dbeafe',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
  },
  restaurantBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  restaurantSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  editIconButton: {
    padding: 4,
  },
  mapLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  mapLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  createRestaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    padding: 16,
    gap: 8,
  },
  createRestaurantText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '97%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancelButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removePhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
