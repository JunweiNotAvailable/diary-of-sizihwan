import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, MapStyleElement, Marker } from 'react-native-maps';
import {
	StyleSheet,
	View,
	Platform,
	Alert,
	Text,
	TouchableOpacity,
	Image,
	SafeAreaView
} from 'react-native';
import { useAppState } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { Colors, Map } from '../utils/Constants';
import { Ionicons } from '@expo/vector-icons';

// Custom map style to remove text labels for geographical elements while preserving user annotations
const mapStyle: MapStyleElement[] = ["poi", "transit", "water", "landscape"].map(featureType => ({
	featureType,
	elementType: "labels",
	stylers: [{ visibility: "off" }]
}));

const MainScreen = ({ navigation }: { navigation: any }) => {
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
						<TouchableOpacity
							style={styles.profileButton}
						>
							{user?.picture ? (
								<Image
									source={{ uri: user.picture }}
									style={styles.profileImage}
								/>
							) : (
								<View style={styles.profilePlaceholder}>
									<Ionicons name="person" size={32} color="#ccc" style={{ marginTop: 6 }} />
								</View>
							)}
						</TouchableOpacity>
					</Marker>
				)}
			</MapView>

			{/* Top bar with input and settings button using SafeAreaView */}
			<SafeAreaView style={styles.safeAreaContainer}>
				<View style={styles.topBarContainer}>
					{/* Search input button */}
					<TouchableOpacity
						style={styles.searchInputButton}
					>
						<Text style={styles.searchPlaceholder}>{t('search.placeholder', 'Ask me anything...')}</Text>
					</TouchableOpacity>

					{/* Settings button */}
					<TouchableOpacity style={styles.mapButton}>
						<Ionicons name="settings-outline" size={24} color="#000" />
					</TouchableOpacity>
				</View>
			</SafeAreaView>

			<View style={styles.bottomBarContainer}>
				{/* Space between buttons */}
				<TouchableOpacity style={{ width: 45 }}></TouchableOpacity>
				{/* Bottom primary button */}
				<TouchableOpacity style={styles.primaryButton}>

				</TouchableOpacity>
				{/* Relocate user button */}
				<TouchableOpacity
					style={styles.mapButton}
					onPress={centerOnUser}
				>
					<Ionicons name="locate-outline" size={24} color="#000" />
				</TouchableOpacity>
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
		borderRadius: 24,
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
		backgroundColor: 'white',
		width: 54,
		height: 54,
		borderRadius: 50,
		alignItems: 'center',
		justifyContent: 'center',
		// borderWidth: 3,
		borderColor: Colors.primary,
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

export default MainScreen;
