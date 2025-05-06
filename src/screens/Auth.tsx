import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserModel } from '../utils/Interfaces';
import { Colors, Schools } from '../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../contexts/AppContext';
import { Config } from '../utils/Config';
import { Input, PrettyButton } from '../components';
import { PrettyLoadingIcon } from '../utils/Svgs';
import { isNSYSUEmail } from '../utils/Functions';

// Key for storing the current user
const USER_STORAGE_KEY = Config.storage.user;

type AuthStep = 'SIGN_IN' | 'SIGN_UP' | 'VERIFY';

const AuthScreen = ({ navigation }: { navigation: any }) => {
  const { t, i18n } = useTranslation();
  const { setUser } = useAppState();

  // Create a ref for the password input
  const passwordInputRef = useRef<TextInput>(null);

  const [authStep, setAuthStep] = useState<AuthStep>('SIGN_IN');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle sign in
  const handleSignIn = async () => {
    // Simple validation
    if (!email.trim()) {
      Alert.alert('', t('auth.errors.enterEmail'));
      return;
    }

    if (!password.trim()) {
      Alert.alert('', t('auth.errors.enterPassword'));
      return;
    }

    try {
      setIsLoading(true);
      // Get user data from API
      const response = await fetch(`${Config.api.url}/data?table=users&id=${email}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = (await response.json()).data;

      // Check password
      const res = await fetch(`${Config.api.url}/auth/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: email, password }) });
      const { success } = (await res.json());
      if (!success) {
        Alert.alert('', t('auth.errors.signInFailed'));
        setIsLoading(false);
        return;
      }
      // Set user in app state
      setUser({ ...userData, password: '' }); // Remove password from user data to avoid exposing it

      // Save user ID to AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, email);
      setIsLoading(false);
      navigation.replace('Main');
      console.log('Signing in with:', { email });
    } catch (error) {
      setIsLoading(false);
      Alert.alert('', t('auth.errors.signInFailed'));
      console.error('Sign in error:', error);
    }
  };

  // Switch to sign up
  const handleGoToSignUp = () => {
    setPassword('');
    setVerificationCode('');
    setAuthStep('SIGN_UP');
  };

  // Switch to sign in
  const handleGoToSignIn = () => {
    setPassword('');
    setUsername('');
    setEmail('');
    setVerificationCode('');
    setAuthStep('SIGN_IN');
  };

  // Request verification code for email
  const handleRequestVerification = async () => {
    // Simple validation
    if (!email.trim()) {
      Alert.alert('', t('auth.errors.enterEmail'));
      return;
    }

    // School email validation (assuming it should end with a school domain)
    if (!isNSYSUEmail(email)) {
      Alert.alert('', t('auth.errors.invalidSchoolEmail'));
      return;
    }

    if (!username.trim()) {
      Alert.alert('', t('auth.errors.enterName'));
      return;
    }

    if (!password.trim()) {
      Alert.alert('', t('auth.errors.enterPassword'));
      return;
    }

    try {
      setIsLoading(true);

      // Send verification code to email
      const res = await fetch(`${Config.api.url}/auth/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name: username, language: i18n.language }) });
      const { success } = (await res.json());
      if (!success) {
        Alert.alert('', t('auth.errors.verificationRequestFailed'));
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      setAuthStep('VERIFY');
    } catch (error) {
      setIsLoading(false);
      Alert.alert('', t('auth.errors.verificationRequestFailed'));
      console.error('Verification request error:', error);
    }
  };

  // Handle verify step with verification code
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('', t('auth.errors.enterVerificationCode'));
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${Config.api.url}/auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: verificationCode }) });
      const { success } = (await res.json());
      if (!success) {
        Alert.alert('', t('auth.errors.verificationCodeFailed'));
        setIsLoading(false);
        return;
      }

      const hashedPasswordRes = await fetch(`${Config.api.url}/auth/hash-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const { hashedPassword } = (await hashedPasswordRes.json()).data;
      
      const newUser: UserModel = {
        id: email,
        name: username,
        email: email,
        password: hashedPassword,
        picture: '',
        created_at: new Date().toISOString()
      };
      await fetch(`${Config.api.url}/data?table=users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
      
      // Set user in app state (but remove the password)
      setUser(newUser);

      // Save user ID to AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, email);

      setIsLoading(false);
      navigation.replace('Main', { showTermOfUse: true });
    } catch (error) {
      setIsLoading(false);
      Alert.alert('', t('auth.errors.signUpFailed'));
      console.error('Sign up error:', error);
    }
  };

  // Render sign in screen
  const renderSignIn = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>{t('auth.signIn')}</Text>
      <Input
        placeholder={t('auth.schoolEmail')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <Input
        ref={passwordInputRef}
        placeholder={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={{ height: 10 }} />
      <View style={styles.buttonRow}>
        <PrettyButton
          disabled={isLoading}
          style={{ width: '100%' }}
          title={isLoading ? <PrettyLoadingIcon width={20} height={20} stroke='#fff' /> : t('auth.signIn')}
          onPress={handleSignIn}
        />
      </View>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>{t('auth.noAccount')}</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.buttonRow}>
        <PrettyButton
          style={{ width: '100%' }}
          title={t('auth.signUp')}
          type="secondary"
          onPress={handleGoToSignUp}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  // Render verification code screen
  const renderVerify = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>{t('auth.verifyEmail')}</Text>
      <Text style={styles.subtitle}>
        {t('auth.verificationCodeSent', { email: email })}
      </Text>
      <Input
        placeholder={t('auth.verificationCode')}
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
      />
      <View style={{ height: 10 }} />

      <View style={styles.buttonRow}>
        <PrettyButton
          style={{ flex: 1 }}
          title={t('general.goBack')}
          type="secondary"
          onPress={handleGoToSignUp}
          disabled={isLoading}
        />
        <PrettyButton
          style={{ flex: 1 }}
          title={isLoading ? <PrettyLoadingIcon width={20} height={20} stroke='#fff' /> : t('auth.verify')}
          onPress={handleVerifyCode}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  // Render sign up screen
  const renderSignUp = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>{t('auth.signUp')}</Text>
      <Input
        placeholder={t('auth.schoolEmail')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        placeholder={t('auth.name')}
        value={username}
        onChangeText={setUsername}
      />
      <Input
        placeholder={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={{ height: 10 }} />
      <View style={styles.buttonRow}>
        <PrettyButton
          style={{ flex: 1 }}
          type="secondary"
          title={t('auth.signIn')}
          onPress={handleGoToSignIn}
          disabled={isLoading}
        />
        <PrettyButton
          style={{ flex: 1 }}
          title={isLoading ? <PrettyLoadingIcon width={20} height={20} stroke='#fff' /> : t('auth.next')}
          onPress={handleRequestVerification}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  // Render the current step
  const renderCurrentStep = () => {
    switch (authStep) {
      case 'SIGN_IN':
        return renderSignIn();
      case 'SIGN_UP':
        return renderSignUp();
      case 'VERIFY':
        return renderVerify();
      default:
        return renderSignIn();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {renderCurrentStep()}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  separatorText: {
    marginHorizontal: 10,
    marginVertical: 20,
    color: '#999',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  readonlyInputContainer: {
    backgroundColor: '#efefef',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  readonlyLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  readonlyValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

export default AuthScreen;
