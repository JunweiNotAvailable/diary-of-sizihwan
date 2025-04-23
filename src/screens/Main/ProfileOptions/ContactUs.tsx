import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, Alert, KeyboardAvoidingView } from 'react-native'
import React, { useState } from 'react'
import { Colors } from '../../../utils/Constants';
import { Input, PrettyButton } from '../../../components';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PrettyLoadingIcon } from '../../../utils/Svgs';
import { useAppState } from '../../../contexts/AppContext';
import { Config } from '../../../utils/Config';

const ContactUs = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { user } = useAppState();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    navigation.goBack();
  }

  const handleSend = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t('general.error'), t('profile.contactUs.nameRequired'));
      return;
    }

    if (!email.trim()) {
      Alert.alert(t('general.error'), t('profile.contactUs.emailRequired'));
      return;
    }

    if (!subject.trim()) {
      Alert.alert(t('general.error'), t('profile.contactUs.subjectRequired'));
      return;
    }

    if (!message.trim()) {
      Alert.alert(t('general.error'), t('profile.contactUs.messageRequired'));
      return;
    }

    setIsSubmitting(true);

    // Send message
    await fetch(`${Config.api.url}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'junwnotavailable@gmail.com',
        subject: subject,
        message: `${message}\n\nFrom: ${name} (${email})`,
      }),
    });

    setIsSubmitting(false);
    Alert.alert(
      t('profile.contactUs.messageSent'),
      t('profile.contactUs.messageSentDesc'),
      [
        {
          text: t('general.ok'),
          onPress: () => navigation.goBack()
        }
      ]
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('profile.contactUs.title')}</Text>
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

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
            <Text style={styles.description}>
              {t('profile.contactUs.description')}
            </Text>

            <View style={styles.form}>
              <Input
                label={t('profile.contactUs.name')}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.contactUs.namePlaceholder')}
                containerStyle={styles.inputContainer}
              />

              <Input
                label={t('profile.contactUs.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.contactUs.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
              />

              <Input
                label={t('profile.contactUs.subject')}
                value={subject}
                onChangeText={setSubject}
                placeholder={t('profile.contactUs.subjectPlaceholder')}
                containerStyle={styles.inputContainer}
              />

              <Input
                label={t('profile.contactUs.message')}
                value={message}
                onChangeText={setMessage}
                placeholder={t('profile.contactUs.messagePlaceholder')}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                containerStyle={styles.inputContainer}
                style={{ height: 120, paddingTop: 12, fontSize: 16 }}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrettyButton
              style={styles.sendButton}
              textStyle={styles.sendButtonText}
              type="primary"
              title={isSubmitting ? <PrettyLoadingIcon width={20} height={20} stroke="#fff" /> : t('profile.contactUs.send')}
              disabled={isSubmitting}
              onPress={handleSend}
            />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryGray,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sendButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactUs;