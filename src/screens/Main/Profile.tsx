import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Animated,
  Platform
} from 'react-native';
import { useAppState } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../utils/Constants';
import { AskIcon, FeatherPenIcon, PersonIcon, PlusIcon, SettingsIcon } from '../../utils/Svgs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Config } from '../../utils/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrettyButton } from '../../components';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { user, setUser } = useAppState();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(Config.storage.user);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close the modal
  const handleClose = () => {
    navigation.goBack();
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
              <PlusIcon width={14} height={14} fill={Colors.primary} />
            </View>
          </PrettyButton>
        </View>

        {/* Profile content */}
        <ScrollView style={styles.scrollContent}>
          {/* Profile picture and name */}
          <View style={styles.profileImageContainer}>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{user?.name || ''}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.userInfo}>{user?.id || ''}</Text>
              </View>
            </View>
            {user?.picture ? (
              <Image
                source={{ uri: user.picture }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <View style={{ width: 48, height: 48, marginTop: 8 }}>
                  <PersonIcon width={48} height={48} fill={Colors.primaryGray + '44'} />
                </View>
              </View>
            )}
          </View>

          {/* Bio */}
          {user?.extra?.bio && <View style={styles.section}>
            <Text style={styles.paragraph}>{user?.extra?.bio}</Text>
          </View>}

          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            {/* Reviews */}
            <PrettyButton
              style={styles.card}
              onPress={() => { }}
            >
              <Text style={styles.cardTitle}>{t('profile.reviews', 'My Reviews')}</Text>
              <View style={styles.cardImage}>
                <FeatherPenIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            {/* Ask history */}
            <PrettyButton
              style={styles.card}
              onPress={() => { }}
            >
              <Text style={styles.cardTitle}>{t('profile.askHistory', 'My Questions')}</Text>
              <View style={styles.cardImage}>
                <AskIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            {/* Settings */}
            <PrettyButton
              style={styles.card}
              onPress={() => { }}
            >
              <Text style={styles.cardTitle}>{t('profile.settings', 'Settings')}</Text>
              <View style={styles.cardImage}>
                <SettingsIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>

        </ScrollView>
      </View>
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
    color: Colors.primary,
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
    borderRadius: 50,
    marginBottom: 12,
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
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: Colors.primaryGray + '80',
    marginTop: 4,
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