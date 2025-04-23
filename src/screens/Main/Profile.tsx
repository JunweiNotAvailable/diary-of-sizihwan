import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Animated,
  Platform,
  TouchableWithoutFeedback,
  Alert,
  Linking
} from 'react-native';
import { useAppState } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../utils/Constants';
import { AskIcon, FeatherPenIcon, InfoIcon, PersonIcon, PlusIcon, PrivacyPolicyIcon, SettingsIcon } from '../../utils/Svgs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Config } from '../../utils/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrettyButton, Popup } from '../../components';
import { ReviewModel, UserModel } from '../../utils/Interfaces';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { user, setUser } = useAppState();
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const reviews = await fetch(`${Config.api.url}/data?table=reviews&query=user_id:${user?.id}`);
      setReviews((await reviews.json()).data || []);
    })();
  }, [user]);

  // Close the modal
  const handleClose = () => {
    navigation.goBack();
  };

  // Handle picking and uploading a profile picture
  const handleProfilePicture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('profile.permissions.title', 'Permission Required'),
          t('profile.permissions.photoLibrary', 'We need access to your photo library to set a profile picture.')
        );
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Resize image
      let resized: any;
      if (!result.canceled) {
        resized = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 512, height: 512 } }], // adjust width as needed
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      await uploadProfilePicture(resized.uri);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        t('profile.error.title', 'Error'),
        t('profile.error.imagePicker', 'There was an error selecting the image.')
      );
    }
  };

  // Upload profile picture to server
  const uploadProfilePicture = async (imageUri: string) => {
    if (!user) return;

    try {
      setUploading(true);

      // Create form data
      const formData = new FormData();

      // Get file name from URI
      const uriParts = imageUri.split('/');
      const fileName = uriParts[uriParts.length - 1];

      // Add file to form data
      formData.append('file', {
        uri: imageUri,
        name: fileName,
        type: `image/${fileName.split('.').pop()}`
      } as any);

      // Delete existing profile picture if any
      if (user.picture) {
        await fetch(`${Config.api.url}/storage?key=${user.picture}`, {
          method: 'DELETE'
        });
      }

      // Upload new image
      const response = await fetch(`${Config.api.url}/storage/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to upload image');
      }

      // Update user data with new picture URL
      const updatedUser: UserModel = {
        ...user,
        picture: result.data.key
      };

      // Save updated user to backend
      const updateResponse = await fetch(`${Config.api.url}/data?table=users&id=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ picture: result.data.key })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update user data');
      }

      // Update local user state
      setUser(updatedUser);

      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.error('Error uploading profile picture:', error);
      Alert.alert(
        t('profile.error.title', 'Error'),
        t('profile.error.upload', 'There was an error uploading the image.')
      );
    }
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title', 'Profile')}</Text>
          <PrettyButton
            style={styles.closeButton}
            onPress={handleClose}
            contentStyle={{ gap: 0 }}
          >
            <View style={{ transform: [{ rotate: '45deg' }], width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <PlusIcon width={14} height={14} />
            </View>
          </PrettyButton>
        </View>

        {/* Profile content */}
        <ScrollView style={styles.scrollContent}>
          {/* Profile picture and name */}
          <View style={styles.profileImageContainer}>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{user?.name || ''}</Text>
              {/* Score */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>
                    {t('profile.score', '{{name}} 的回顧被引用了 {{count}} 次').replace('{{name}}', user?.name || '').replace('{{count}}', String(reviews.reduce((acc, review) => acc + (review.extra?.score || 0), 0) || 0))}
                  </Text>
                  <TouchableOpacity
                    style={styles.questionMarkButton}
                    onPress={() => setShowScoreInfo(true)}
                  >
                    <Text style={styles.questionMarkText}>!</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableWithoutFeedback onPress={handleProfilePicture}>
              {user?.picture ? (
                <Image
                  source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${user.picture}` }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <View style={{ width: 48, height: 48, marginTop: 8 }}>
                    <PersonIcon width={48} height={48} fill={Colors.primaryGray + '44'} />
                  </View>
                </View>
              )}
            </TouchableWithoutFeedback>
          </View>

          {/* Bio */}
          {user?.extra?.bio && <View style={styles.section}>
            <Text style={styles.paragraph}>{user?.extra?.bio || 'Some example texts...'}</Text>
          </View>}

          <View style={[styles.section, { flexDirection: 'row', gap: 10, marginTop: 20 }]}>
            {/* Reviews */}
            <PrettyButton
              style={styles.card}
              onPress={() => navigation.navigate('MyReviews')}
            >
              <Text style={styles.cardTitle}>{t('profile.myReviews.title', 'My Reviews')}</Text>
              <View style={styles.cardImage}>
                <FeatherPenIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            {/* Ask history */}
            <PrettyButton
              style={styles.card}
              onPress={() => navigation.navigate('AskHistory')}
            >
              <Text style={styles.cardTitle}>{t('profile.askHistory.title', 'My Questions')}</Text>
              <View style={styles.cardImage}>
                <AskIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            {/* Settings */}
            <PrettyButton
              style={styles.card}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.cardTitle}>{t('profile.settings.title', 'Settings')}</Text>
              <View style={styles.cardImage}>
                <SettingsIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            {/* About */}
            <PrettyButton
              style={styles.card}
              onPress={() => navigation.navigate('About')}
            >
              <Text style={styles.cardTitle}>{t('profile.about.title', 'About')}</Text>
              <View style={styles.cardImage}>
                <InfoIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
        </ScrollView>
      </View>

      {/* Score Info Popup */}
      <Popup
        visible={showScoreInfo}
        onClose={() => setShowScoreInfo(false)}
        title={t('profile.scoreInfo.title', 'How Scores Work')}
        content={t('profile.scoreInfo.content')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  modalContent: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#555',
    marginTop: -2,
  },
  scrollContent: {
    flex: 1,
    gap: 20,
  },
  profileImageContainer: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 24,
  },
  profilePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primaryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userInfoContainer: {
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 12,
    marginVertical: 2,
    color: Colors.primaryGray + '80',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreText: {
    fontSize: 14,
    color: Colors.primaryGray,
    lineHeight: 20,
  },
  questionMarkButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryGray + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  questionMarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryGray,
  },
  card: {
    marginVertical: 0,
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
    aspectRatio: 3 / 1,
    backgroundColor: Colors.secondaryGray,
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    width: '25%',
    aspectRatio: 1 / 1,
    right: 10,
    bottom: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryGray,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.primary,
  },
  sectionContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#777',
  },
  infoValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 