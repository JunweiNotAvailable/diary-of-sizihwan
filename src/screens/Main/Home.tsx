import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, MapStyleElement, Marker } from 'react-native-maps';
import {
	StyleSheet,
	View,
	Platform,
	Alert,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Image,
	SafeAreaView,
	Animated,
	Pressable
} from 'react-native';
import { useAppState } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { Colors, Map } from '../../utils/Constants';
import { PlusIcon, SettingsIcon, LocateIcon, PersonIcon } from '../../utils/Svgs';

// Custom map style to remove text labels for geographical elements while preserving user annotations
const mapStyle: MapStyleElement[] = ["poi", "transit", "water", "landscape"].map(featureType => ({
	featureType,
	elementType: "labels",
	stylers: [{ visibility: "off" }]
}));

// Custom AnimatedButton component
const AnimatedButton = ({ 
	onPress, 
	style, 
	children 
}: { 
	onPress?: () => void, 
	style: any, 
	children: React.ReactNode 
}) => {
	const animatedScale = useRef(new Animated.Value(1)).current;
	
	// Create animated version of TouchableOpacity
	const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

	const handlePressIn = () => {
		Animated.spring(animatedScale, {
			toValue: 0.92,
			useNativeDriver: true,
			speed: 50,
			bounciness: 1
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(animatedScale, {
			toValue: 1,
			useNativeDriver: true,
			speed: 20,
			bounciness: 2
		}).start();
	};

	return (
		<AnimatedTouchable
			style={[
				style,
				{ transform: [{ scale: animatedScale }] }
			]}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			activeOpacity={1} // Disable default opacity effect
		>
			{children}
		</AnimatedTouchable>
	);
};

const HomeScreen = ({ navigation }: { navigation: any }) => {
	const { t } = useTranslation();
	const { user } = useAppState();
	const [locationPermission, setLocationPermission] = useState(false);
	const [mapError, setMapError] = useState(false);
	const [initialRegion, setInitialRegion] = useState(Map.defaultLocation);
	const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);
	const [showUser, setShowUser] = useState(false);

	const mapRef = useRef<MapView>(null);

	// Request location permission and get user's location
	useEffect(() => {
		const getLocationPermission = async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();

				if (status === 'granted') {
					setLocationPermission(true);

					// Get current location
					const location = await Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Balanced,
					});

					const locationCoords = {
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					};

					setCurrentLocation(locationCoords);

					setInitialRegion({
						...locationCoords,
						latitudeDelta: 0.0075,
						longitudeDelta: 0.0075,
					});
				} else {
					// Permission denied
					Alert.alert(
						t('location.permissionTitle'),
						t('location.permissionDenied')
					);
				}
			} catch (error) {
				console.error('Error getting location permission:', error);
			}
		};

		getLocationPermission();
	}, []);

	// Error boundary for map loading
	useEffect(() => {
		const handleMapError = () => {
			try {
				// Add a timeout to detect if the map fails to load
				const timeout = setTimeout(() => {
					if (mapRef.current === null) {
						setMapError(true);
					}
				}, 5000);

				return () => clearTimeout(timeout);
			} catch (error) {
				console.error('Map error:', error);
				setMapError(true);
			}
		};

		handleMapError();
	}, []);

	// Function to center the map on user's current location
	const centerOnUser = () => {
		if (currentLocation && mapRef.current) {
			mapRef.current.animateToRegion({
				...currentLocation,
				latitudeDelta: 0.0075,
				longitudeDelta: 0.0075,
			}, 500);
		}
	};

	if (mapError) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Unable to load map</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<MapView
				ref={mapRef}
				style={StyleSheet.absoluteFill}
				provider={PROVIDER_GOOGLE}
				customMapStyle={mapStyle}
				initialRegion={initialRegion}
				showsCompass={false}
				rotateEnabled={false}
				liteMode={false}
			>
				{/* User marker */}
				{(currentLocation && showUser) && (
					<Marker
						coordinate={currentLocation}
						anchor={{ x: 0.5, y: 0.5 }}
					>
						<AnimatedButton style={styles.profileButton}>
							{user?.picture ? (
								<Image
									source={{ uri: user.picture }}
									style={styles.profileImage}
								/>
							) : (
								<View style={styles.profilePlaceholder}>
									<View style={{ marginTop: 8 }}>
										<PersonIcon width={28} height={28} fill="#ccc" />
									</View>
								</View>
							)}
						</AnimatedButton>
					</Marker>
				)}
			</MapView>

			{/* Top bar with input and profile button using SafeAreaView */}
			<SafeAreaView style={styles.safeAreaContainer}>
				<View style={styles.topBarContainer}>
					{/* Search input button */}
					<AnimatedButton
						style={styles.searchInputButton}
            onPress={() => navigation.navigate('Ask')}
					>
						<Text style={styles.searchPlaceholder}>{t('ask.placeholder', 'Ask me about the campus...')}</Text>
					</AnimatedButton>

					{/* Profile button */}
					<AnimatedButton style={styles.mapButton} onPress={() => navigation.navigate('Profile')}>
						<PersonIcon width={20} height={20} fill={Colors.primary} />
					</AnimatedButton>
				</View>
			</SafeAreaView>

			<View style={styles.bottomBarContainer}>
				{/* Space between buttons */}
				<View style={{ width: 45 }}></View>
				{/* Bottom primary button */}
				<AnimatedButton style={styles.primaryButton} onPress={() => navigation.navigate('New')}>
					<PlusIcon width={24} height={24} fill={Colors.primary} />
				</AnimatedButton>
				{/* Relocate user button */}
				<AnimatedButton 
					style={styles.mapButton}
					onPress={centerOnUser}
				>
					<LocateIcon width={24} height={24} stroke={Colors.primary} />
				</AnimatedButton>
			</View>
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
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	errorText: {
		color: '#e74c3c',
		fontSize: 16,
		marginBottom: 20,
	},
	profileButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		shadowColor: '#0008',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 0,
	},
	profileImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: 'white',
	},
	profilePlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#ddd',
		borderWidth: 2,
		borderColor: 'white',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	safeAreaContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
	topBarContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 16,
		gap: 12,
	},
	searchInputButton: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		paddingHorizontal: 16,
		height: 45,
		borderRadius: 24,
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	searchPlaceholder: {
		color: '#aaa',
		fontWeight: '500',
		fontSize: 15,
	},
	mapButton: {
		width: 45,
		height: 45,
		borderRadius: 16,
		backgroundColor: 'white',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	bottomBarContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		gap: 12,
		position: 'absolute',
		bottom: 30,
		left: 0,
		right: 0,
	},
	primaryButton: {
		width: 54,
		height: 54,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'white',
		shadowColor: '#0008',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 4,
	},
	primaryButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	}
});

export default HomeScreen;