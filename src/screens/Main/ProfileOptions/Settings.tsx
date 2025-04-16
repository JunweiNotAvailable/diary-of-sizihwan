import { View, Text, SafeAreaView, StyleSheet, Platform, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors } from '../../../utils/Constants';
import { Input, PrettyButton } from '../../../components';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../../contexts/AppContext';
import { PlusIcon, PrettyLoadingIcon } from '../../../utils/Svgs';
import { Config } from '../../../utils/Config';
import { UserModel } from '../../../utils/Interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { user, setUser, locale } = useAppState();

  const [name, setName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup fields
  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

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

    setUser(newUser);
    navigation.goBack();
    setIsSubmitting(false);
  }

  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(Config.storage.user);
    navigation.replace('Auth');
  }

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.settings.title', 'Settings')}</Text>
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
          {/* Account */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>{t('profile.settings.account', 'Account')}</Text>
            <Input
              value={name}
              label={t('profile.settings.username', 'Username')}
              onChangeText={(text) => setName(text)}
              placeholder={t('profile.settings.usernamePlaceholder', 'Enter your username')}
              containerStyle={{ marginBottom: 20 }}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
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
  buttonsRow: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    flex: 1,
    gap: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
});

export default SettingsScreen;