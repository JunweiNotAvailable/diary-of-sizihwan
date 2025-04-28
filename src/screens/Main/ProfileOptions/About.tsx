import { View, Text, StyleSheet, SafeAreaView, Platform, ScrollView, Linking } from 'react-native'
import React, { useState } from 'react'
import { Config } from '../../../utils/Config';
import { ContactUsIcon, PlusIcon, PrivacyPolicyIcon, TermOfUseIcon, ChevronDownIcon } from '../../../utils/Svgs';
import { Colors } from '../../../utils/Constants';
import { Popup, PrettyButton } from '../../../components';
import { t } from 'i18next';

const AboutScreen = ({ navigation }: { navigation: any }) => {

  const [showTermOfUse, setShowTermOfUse] = useState(false);

  // Term of Use content using translation key
  const termOfUseContent = t('profile.termOfUse.content', `Terms of Use\n\nLast Updated: ${new Date().toLocaleDateString()}\n\n1. Acceptance of Terms\n\nBy accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. User Accounts\n\nWhen you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account.\n\n3. User Content\n\nYou retain all rights to any content you submit, post, or display on or through the service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such content.\n\n4. Prohibited Activities\n\nYou agree not to engage in any of the following activities:\n- Post or transmit content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable\n- Impersonate any person or entity\n- Interfere with or disrupt the services or servers\n- Attempt to gain unauthorized access to any part of the service\n\n5. Termination\n\nWe may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.\n\n6. Disclaimer\n\nYour use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis.\n\n7. Changes to Terms\n\nWe reserve the right to modify these terms from time to time at our sole discretion. Therefore, you should review these terms periodically.\n\n8. Contact Information\n\nIf you have any questions about these Terms, please contact us.`);

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <PrettyButton
            style={[styles.headerButton, { alignItems: 'flex-start' }]}
            onPress={() => navigation.goBack()}
          >
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronDownIcon width={20} height={20} />
            </View>
          </PrettyButton>
          <Text style={styles.headerTitle}>{t('profile.about.title', 'About')}</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Profile content */}
        <ScrollView style={styles.scrollContent}>

          <View style={[styles.section, { flexDirection: 'row', gap: 10, marginTop: 20 }]}>
            <PrettyButton
              style={styles.card}
              onPress={() => navigation.navigate('ContactUs')}
            >
              <Text style={styles.cardTitle}>{t('profile.contactUs.title', 'Contact Us')}</Text>
              <View style={styles.cardImage}>
                <ContactUsIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            <PrettyButton
              style={styles.card}
              onPress={() => setShowTermOfUse(true)}
            >
              <Text style={styles.cardTitle}>{t('profile.termOfUse.title', 'Term of Use')}</Text>
              <View style={styles.cardImage}>
                <TermOfUseIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
          <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
            <PrettyButton
              style={styles.card}
              onPress={() => Linking.openURL(Config.privacyPolicyUrl)}
            >
              <Text style={styles.cardTitle}>{t('profile.privacyPolicy.title', 'Privacy Policy')}</Text>
              <View style={styles.cardImage}>
                <PrivacyPolicyIcon width={'100%'} height={'100%'} fill={Colors.primaryLightGray} />
              </View>
            </PrettyButton>
          </View>
        </ScrollView>

        {/* Term of Use Popup */}
        <Popup
          visible={showTermOfUse}
          onClose={() => setShowTermOfUse(false)}
          title={t('profile.termOfUse.title', 'Terms of Use')}
          content={termOfUseContent}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    borderBottomColor: '#eee',
    width: '100%',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerButton: {
    padding: 0,
    margin: 0,
    backgroundColor: '#0000',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
});

export default AboutScreen;