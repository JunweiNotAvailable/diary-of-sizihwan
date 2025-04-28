import { View, Text, SafeAreaView, StyleSheet, Platform, ScrollView, Switch, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors } from '../../../utils/Constants';
import { Input, PrettyButton } from '../../../components';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../../contexts/AppContext';
import { PlusIcon, PrettyLoadingIcon, ChevronDownIcon } from '../../../utils/Svgs';
import { Config } from '../../../utils/Config';
import { UserModel } from '../../../utils/Interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { user, setUser, locale } = useAppState();

  const [name, setName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Preferences
  const [showMyLocation, setShowMyLocation] = useState(false);

  // Setup fields
  useEffect(() => {
    setName(user?.name || '');
  }, [user]);
  
  // Load preferences
  useEffect(() => {
    (async () => {
      const showMyLocation = await AsyncStorage.getItem(Config.storage.showMyLocation);
      setShowMyLocation(showMyLocation !== 'false');
    })();
  }, []);

  const handleClose = () => {
    navigation.goBack();
  }

  const handleSave = async () => {
    if (!user) return;

    setIsSubmitting(true);
    const newUser: UserModel = { ...user, 
      name 
    };

    const { id, password, created_at, ...userData } = newUser;
    await fetch(`${Config.api.url}/data?table=users&id=${user?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    await AsyncStorage.setItem(Config.storage.showMyLocation, showMyLocation.toString());

    setUser(newUser);
    navigation.goBack();
    setIsSubmitting(false);
  }

  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(Config.storage.user);
    navigation.replace('Auth');
  }

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // Show confirmation alert
    Alert.alert(
      t('profile.settings.dangerZone.deleteAccount'),
      t('profile.settings.dangerZone.deleteAccountMessage'),
      [
        {
          text: t('general.cancel', 'Cancel'),
          style: 'cancel'
        },
        {
          text: t('general.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              // 1. Delete all posts by the user
              const deletePostsResponse = await fetch(`${Config.api.url}/data?table=reviews&query=user_id:${user.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (!deletePostsResponse.ok) {
                throw new Error('Failed to delete user posts');
              }
              
              // 2. Delete user account
              const deleteUserResponse = await fetch(`${Config.api.url}/data?table=users&id=${user.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (!deleteUserResponse.ok) {
                throw new Error('Failed to delete user account');
              }
              
              // 3. Clear local storage and logout
              await AsyncStorage.removeItem(Config.storage.user);
              await AsyncStorage.removeItem(Config.storage.showMyLocation);
              
              // 4. Navigate to authentication screen
              setUser(null);
              navigation.replace('Auth');
            } catch (error) {
              console.error('Error deleting account:', error);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <PrettyButton
            style={[styles.headerButton, { alignItems: 'flex-start' }]}
            onPress={handleClose}
          >
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronDownIcon width={20} height={20} />
            </View>
          </PrettyButton>
          <Text style={styles.headerTitle}>{t('profile.settings.title', 'Settings')}</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <PrettyButton
            style={{ paddingHorizontal: 20, height: 36, borderRadius: 12, borderColor: Colors.danger + 'aa' }}
            textStyle={{ fontSize: 14, color: Colors.danger + 'cc' }}
            type='secondary'
            title={t('auth.signOut', 'Sign Out')}
            onPress={handleLogout}
          />
          <PrettyButton
            style={{ paddingHorizontal: 20, height: 36, borderRadius: 12 }}
            textStyle={{ fontSize: 14 }}
            type='primary'
            disabled={isSubmitting}
            title={isSubmitting ? <PrettyLoadingIcon width={14} height={14} stroke={'#fff'} /> : t('general.save', 'Save')}
            onPress={handleSave}
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContent}>
          {/* Preferences */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>{t('profile.settings.preferences.title', 'Preferences')}</Text>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>{t('profile.settings.preferences.showMyLocation', 'Show My Location')}</Text>
              <Switch
                value={showMyLocation}
                trackColor={{ false: '#ddd', true: Colors.secondary }}
                thumbColor={showMyLocation ? Colors.primary : '#f4f3f4'}
                onValueChange={async () => {
                  setShowMyLocation(!showMyLocation);
                }}
              />
            </View>
          </View>
          {/* Account */}
          <View style={[styles.section, { marginTop: 40 }]}>
            <Text style={styles.sectionTitle}>{t('profile.settings.account', 'Account')}</Text>
            <Input
              value={name}
              label={t('profile.settings.username', 'Username')}
              onChangeText={(text) => setName(text)}
              placeholder={t('profile.settings.usernamePlaceholder', 'Enter your username')}
              containerStyle={{ marginBottom: 20 }}
            />
          </View>
          {/* Danger Zone */}
          <View style={[styles.section, { marginTop: 40 }]}>
            <Text style={styles.sectionTitle}>{t('profile.settings.dangerZone.title', 'Danger Zone')}</Text>
            <View style={{ alignSelf: 'flex-start' }}>
              <PrettyButton
                style={{ width: 'auto', paddingHorizontal: 20, height: 36, borderRadius: 12, borderColor: Colors.danger + 'aa' }}
                textStyle={{ fontSize: 14, color: Colors.danger + 'cc' }}
                type='secondary'
                title={isDeleting ? 
                  <PrettyLoadingIcon width={14} height={14} stroke={Colors.danger + 'cc'} /> : 
                  t('profile.settings.dangerZone.deleteAccount', 'Delete Account')
                }
                disabled={isDeleting}
                onPress={handleDeleteAccount}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
    width: '100%',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerButton: {
    padding: 0,
    margin: 0,
    backgroundColor: '#0000',
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#555',
    marginTop: -2,
  },
  buttonsRow: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    flex: 1,
    gap: 40,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabel: {
    fontSize: 14,
  },
  labelText: {
    fontSize: 14,
    color: '#555',
  },
});

export default SettingsScreen;