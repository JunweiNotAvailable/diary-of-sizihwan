import React, { useEffect } from 'react';
import MapView from 'react-native-maps';
import { 
	StyleSheet, 
	View, 
	TouchableOpacity, 
	Text, 
	Pressable,
	Platform,
	ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { Config } from '../utils/Config';

const USER_STORAGE_KEY = Config.storage.user;

const MainScreen = ({ navigation }: { navigation: any }) => {
	const { user, setUser } = useAppState() || {};
	const { t } = useTranslation();
	const [loading, setLoading] = React.useState(false);

	// Load user data on component mount if not already loaded
	useEffect(() => {
		const loadUserData = async () => {
			try {
				if (!user) {
					setLoading(true);
					const userId = await AsyncStorage.getItem(USER_STORAGE_KEY);
					
					if (userId) {
						// Fetch user data from API
						const response = await fetch(`${Config.api.url}/data?table=users&id=${userId}`);
						
						if (response.ok) {
							const result = await response.json();
							if (result && result.data) {
								setUser(result.data);
							} else {
								// No user data, go to auth
								navigation.replace('Auth');
							}
						} else {
							// API error, go to auth
							navigation.replace('Auth');
						}
					} else {
						// No stored user ID, go to auth
						navigation.replace('Auth');
					}
					setLoading(false);
				}
			} catch (error) {
				console.error('Error loading user data:', error);
				setLoading(false);
				navigation.replace('Auth');
			}
		};

		loadUserData();
	}, []);

	const handleLogout = async () => {
		try {
			setLoading(true);
			// Clear user data
			await AsyncStorage.removeItem(USER_STORAGE_KEY);
			
			// Clear user state
			setUser?.(null);
			
			setLoading(false);
			// Navigate back to Auth screen
			navigation.replace('Auth');
		} catch (error) {
			setLoading(false);
			console.error('Logout error:', error);
		}
	};

	// Pretty Button component for consistent styling
	const PrettyButton = ({ 
		onPress, 
		title, 
		type = 'primary',
		icon = null 
	}: { 
		onPress: () => void; 
		title: string;
		type?: 'primary' | 'secondary' | 'danger';
		icon?: React.ReactNode;
	}) => {
		const getStylesByType = () => {
			switch (type) {
				case 'danger':
					return {
						button: styles.dangerButton,
						pressedButton: styles.dangerButtonPressed,
						text: styles.dangerButtonText,
						ripple: 'rgba(255, 255, 255, 0.2)'
					};
				case 'secondary':
					return {
						button: styles.secondaryButton,
						pressedButton: styles.secondaryButtonPressed,
						text: styles.secondaryButtonText,
						ripple: 'rgba(52, 152, 219, 0.2)'
					};
				default:
					return {
						button: styles.primaryButton,
						pressedButton: styles.primaryButtonPressed,
						text: styles.primaryButtonText,
						ripple: 'rgba(255, 255, 255, 0.2)'
					};
			}
		};

		const typeStyles = getStylesByType();

		return (
			<Pressable
				style={({ pressed }) => [
					styles.buttonBase,
					typeStyles.button,
					pressed && typeStyles.pressedButton
				]}
				onPress={onPress}
				disabled={loading}
				android_ripple={{ color: typeStyles.ripple }}
			>
				<View style={styles.buttonContent}>
					{icon}
					<Text style={[styles.buttonText, typeStyles.text]}>
						{title}
					</Text>
				</View>
			</Pressable>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#3498db" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<MapView style={StyleSheet.absoluteFill} />
			
			{/* Logout button */}
			<View style={styles.logoutContainer}>
				<PrettyButton
					title={t('main.logout')}
					type="danger"
					onPress={handleLogout}
				/>
			</View>

			{/* Student info display */}
			{user && (
				<View style={styles.userInfoContainer}>
					<Text style={styles.userInfoText}>
						{t('main.loggedInAs', { id: user.id })}
					</Text>
					{user.name && user.name !== user.id && (
						<Text style={styles.userInfoText}>
							{t('main.name', { name: user.name })}
						</Text>
					)}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	logoutContainer: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 50 : 40,
		right: 20,
		zIndex: 999,
	},
	buttonBase: {
		minWidth: 100,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 3,
		elevation: 4,
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	primaryButton: {
		backgroundColor: '#3498db',
	},
	primaryButtonPressed: {
		backgroundColor: '#2980b9',
		transform: [{ scale: 0.97 }],
	},
	primaryButtonText: {
		color: 'white',
	},
	secondaryButton: {
		backgroundColor: 'white',
		borderWidth: 1,
		borderColor: '#3498db',
	},
	secondaryButtonPressed: {
		backgroundColor: '#ecf0f1',
		transform: [{ scale: 0.97 }],
	},
	secondaryButtonText: {
		color: '#3498db',
	},
	dangerButton: {
		backgroundColor: '#e74c3c',
	},
	dangerButtonPressed: {
		backgroundColor: '#c0392b',
		transform: [{ scale: 0.97 }],
	},
	dangerButtonText: {
		color: 'white',
	},
	logoutButton: {
		backgroundColor: '#ff5252',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
	},
	logoutText: {
		color: 'white',
		fontWeight: 'bold',
	},
	userInfoContainer: {
		position: 'absolute',
		bottom: 40,
		left: 0,
		right: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		padding: 10,
		alignItems: 'center',
	},
	userInfoText: {
		color: 'white',
		fontSize: 16,
		marginVertical: 2,
	}
});

export default MainScreen;
