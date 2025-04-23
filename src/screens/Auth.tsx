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
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserModel } from '../utils/Interfaces';
import { Colors, Schools } from '../utils/Constants';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../contexts/AppContext';
import { Config } from '../utils/Config';
import * as ImageManipulator from 'expo-image-manipulator';
import { Input, PrettyButton } from '../components';
import { PrettyLoadingIcon } from '../utils/Svgs';
// Key for storing the current user
const USER_STORAGE_KEY = Config.storage.user;

// Max image dimensions for uploads
const MAX_IMAGE_WIDTH = 640;
const MAX_IMAGE_HEIGHT = 480;

type AuthStep = 'SIGN_IN' | 'SCAN' | 'VERIFY_ID' | 'SIGN_UP';

const AuthScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { setUser } = useAppState();

  // Create a ref for the password input
  const passwordInputRef = useRef<TextInput>(null);
  // Create a ref for the camera
  const cameraRef = useRef<CameraView>(null);

  const [authStep, setAuthStep] = useState<AuthStep>('SIGN_IN');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [school, setSchool] = useState('nsysu');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Handle sign in
  const handleSignIn = async () => {
    // Simple validation
    if (!studentId.trim()) {
      Alert.alert('', t('auth.errors.enterStudentId'));
      return;
    }

    if (!password.trim()) {
      Alert.alert('', t('auth.errors.enterPassword'));
      return;
    }

    try {
      setIsLoading(true);
      // Get user data from API
      const response = await fetch(`${Config.api.url}/data?table=users&id=${studentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = (await response.json()).data;

      // Check password
      const res = await fetch(`${Config.api.url}/auth/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: studentId, password }) });
      const { success } = (await res.json());
      if (!success) {
        Alert.alert('', t('auth.errors.signInFailed'));
        setIsLoading(false);
        return;
      }
      // Set user in app state
      setUser({ ...userData, password: '' }); // Remove password from user data to avoid exposing it

      // Save user ID to AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, studentId);
      setIsLoading(false);
      navigation.replace('Main');
      console.log('Signing in with:', { studentId });
    } catch (error) {
      setIsLoading(false);
      Alert.alert('', t('auth.errors.signInFailed'));
      console.error('Sign in error:', error);
    }
  };

  // Handle scan button press
  const handleScan = async () => {
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert('', t('auth.errors.cameraPermission'));
        return;
      }
    }

    setAuthStep('SCAN');
    setCameraVisible(true);
  };

  // Handle process scan
  const handleProcessScan = async () => {
    try {
      setIsLoading(true);
      // Take a picture using the camera view
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture image');
      }

      setCameraVisible(false);

      // Resize the image
      const resizedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT } }],
        { base64: true, compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (!resizedImage || !resizedImage.base64) {
        throw new Error('Failed to process image');
      }

      // Get base64 data for the image
      const base64Data = `data:image/jpeg;base64,${resizedImage.base64}`;

      // Send the resized image to the server for processing
      const response = await fetch(`${Config.api.url}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: base64Data, school: Schools.nsysu.name })
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const result = await response.json();

      if (result.success && result.data && result.data.isValid) {
        // Set the student ID from the processed image
        setStudentId(result.data.id || '');
        setUsername('');
        setPassword('');
        setAuthStep('VERIFY_ID');
      } else {
        Alert.alert('', t('auth.errors.idCardScanFailed'));
        setStudentId('');
        setPassword('');
        setAuthStep('SIGN_IN');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error processing scan:', error);
      setIsLoading(false);
      Alert.alert('', t('auth.errors.idCardScanFailed'));
      setStudentId('');
      setPassword('');
      setAuthStep('SIGN_IN');
    }
  };

  // Handle re-scan button
  const handleRescan = () => {
    setAuthStep('SCAN');
    setCameraVisible(true);
  };

  // Check if user exists, proceed to sign in or sign up
  const handleVerifyAndProceed = async () => {
    try {
      setIsLoading(true);
      // Check if user exists in the database
      const response = await fetch(`${Config.api.url}/data?table=users&id=${studentId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // User exists, go to sign in
          setIsLoading(false);
          setPassword('');
          setAuthStep('SIGN_IN');

          // Focus on password input after a short delay to ensure the UI has updated
          setTimeout(() => {
            passwordInputRef.current?.focus();
          }, 100);

          return;
        }
      }

      // User doesn't exist, go to sign up
      setIsLoading(false);
      setUsername('');
      setPassword('');
      setAuthStep('SIGN_UP');
    } catch (error) {
      setIsLoading(false);
      console.error('Error checking user:', error);
      // For error handling, let's go to sign up
      setUsername('');
      setPassword('');
      setAuthStep('SIGN_UP');
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    // Simple validation
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

      // Create user data conforming to UserModel
      const hpRes = await fetch(`${Config.api.url}/auth/hash-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const hpData = await hpRes.json();
      const userData: UserModel = {
        id: studentId,
        name: username,
        password: hpData.data?.hashedPassword,
        extra: { school: school, bio: '' },
        email: '',
        picture: '',
        created_at: new Date().toISOString()
      };

      // Send data to API

      const response = await fetch(`${Config.api.url}/data?table=users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      // Set user in app state (but remove the password)
      setUser({ ...userData, password: '' });

      // Save user ID to AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, studentId);

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
        placeholder={t('auth.studentId')}
        value={studentId}
        onChangeText={setStudentId}
        autoCapitalize="none"
      />
      <Input
        ref={passwordInputRef}
        placeholder={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
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
          title={t('auth.scanIdCard')}
          type="secondary"
          onPress={handleScan}
          disabled={isLoading}
        />
      </View>
    </View>
  );

  // Render camera screen
  const renderScanCamera = () => (
    <View style={styles.cameraContainer}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <PrettyLoadingIcon width={28} height={28} stroke={Colors.primary} />
          <Text style={styles.loadingText}>{t('auth.processingImage')}</Text>
        </View>
      )}

      {cameraVisible && (
        <View style={styles.cameraContainer}>
          <Text style={styles.title}>{t('auth.scanIdCard')}</Text>
          <View style={styles.cameraOutline}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              autofocus='on'
            >
            </CameraView>
          </View>
          <View style={styles.buttonRow}>
            <PrettyButton
              style={{ flex: 1 }}
              title={t('general.goBack')}
              type="secondary"
              onPress={() => setAuthStep('SIGN_IN')}
              disabled={isLoading}
            />
            <PrettyButton
              style={{ flex: 1 }}
              title={isLoading ? <PrettyLoadingIcon width={20} height={20} stroke='#fff' /> : t('auth.scan')}
              onPress={handleProcessScan}
              disabled={isLoading}
            />
          </View>
        </View>
      )}
      {!cameraVisible && !isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>{t('auth.preparingCamera')}</Text>
        </View>
      )}
    </View>
  );

  // Render verify ID screen
  const renderVerifyId = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>{t('auth.verifyId')}</Text>
      <Text style={styles.subtitle}>{t('auth.isThisYourId')}</Text>
      <Text style={styles.idDisplay}>{studentId}</Text>
      <View style={styles.buttonRow}>
        <PrettyButton
          style={{ flex: 1 }}
          title={t('auth.reScan')}
          type="secondary"
          onPress={handleRescan}
          disabled={isLoading}
        />
        <PrettyButton
          style={{ flex: 1 }}
          title={isLoading ? <PrettyLoadingIcon width={20} height={20} stroke='#fff' /> : t('auth.continue')}
          onPress={handleVerifyAndProceed}
          disabled={isLoading}
        />
      </View>

    </View>
  );

  // Render sign up screen
  const renderSignUp = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>{t('auth.createAccount')}</Text>
      <View style={styles.readonlyInputContainer}>
        <Text style={styles.readonlyLabel}>{t('auth.studentId')}:</Text>
        <Text style={styles.readonlyValue}>{studentId}</Text>
      </View>
      <Input
        placeholder={t('auth.name')}
        value={username}
        onChangeText={setUsername}
      />
      <Input
        placeholder={t('auth.setupPassword')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonRow}>
        <PrettyButton
          style={{ flex: 1 }}
          type="secondary"
          title={t('auth.signIn')}
          onPress={() => setAuthStep('SIGN_IN')}
          disabled={isLoading}
        />
        <PrettyButton
          style={{ flex: 1 }}
          title={isLoading ? <PrettyLoadingIcon width={20} height={20} stroke='#fff' /> : t('auth.createAccount')}
          onPress={handleSignUp}
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
      case 'SCAN':
        return renderScanCamera();
      case 'VERIFY_ID':
        return renderVerifyId();
      case 'SIGN_UP':
        return renderSignUp();
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
    marginBottom: 10,
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
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cameraOutline: {
    borderRadius: 12,
    width: '100%',
    aspectRatio: 1.618,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    width: '100%',
    flex: 1,
    aspectRatio: 1.618,
  },
  cameraControls: {
    width: '100%',
    marginTop: 20,
  },
  cameraButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idDisplay: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#2c3e50',
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
