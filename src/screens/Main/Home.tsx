import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, MapStyleElement, Marker } from 'react-native-maps';
import {
	StyleSheet,
	View,
	Alert,
	Text,
	Image,
	SafeAreaView,
} from 'react-native';
import { useAppState } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { Colors, Map, Locations, IconColors } from '../../utils/Constants';
import { PlusIcon, LocateIcon, PersonIcon, BubbleIcon } from '../../utils/Svgs';
import { PrettyButton } from '../../components';
import { LocationIcon } from '../../components/icons/LocationIcon';
import { Config } from '../../utils/Config';

// Custom map style to remove text labels for geographical elements while preserving user annotations
const mapStyle: MapStyleElement[] = ["poi", "transit", "water", "landscape"].map(featureType => ({
	featureType,
	elementType: "labels",
	stylers: [{ visibility: "off" }]
}));

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

					const libraryLocation = Locations.nsysu[0].coordinates;
					// setCurrentLocation(locationCoords); // User's current location
					setCurrentLocation(libraryLocation); // Library's location

					setInitialRegion({
						// ...locationCoords,
						...libraryLocation,
						latitudeDelta: 0.0042,
						longitudeDelta: 0.0042,
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
				latitudeDelta: 0.0042,
				longitudeDelta: 0.0042,
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
				region={initialRegion}
				showsCompass={false}
				rotateEnabled={false}
				liteMode={false}
			>
				{/* Location markers */}
				{Locations.nsysu.map((location) => {
					const Icon = LocationIcon[location.icon as keyof typeof LocationIcon];
					const iconColors = IconColors[location.icon as keyof typeof IconColors] || { fg: Colors.primary, bg: Colors.secondary };
					return (
						<Marker
							key={location.id}
							coordinate={location.coordinates}
							anchor={{ x: 0.5, y: 0.5 }}
							onPress={() => navigation.navigate('Reviews', { location })}
						>
							<View style={[styles.marker, { backgroundColor: iconColors.bg, borderColor: iconColors.fg + '66' }]}>
								{Icon && <Icon width={16} height={16} stroke={iconColors.fg} fill={iconColors.fg} />}
							</View>
						</Marker>
					)
				})}

				{/* User marker */}
				{(currentLocation && showUser) && (
					<Marker
						coordinate={currentLocation}
						anchor={{ x: 0.5, y: 0.5 }}
					>
						<View style={styles.profileButton}>
							{user?.picture ? (
								<Image
									source={{ uri: `https://${Config.s3.bucketName}.s3.${Config.s3.region}.amazonaws.com/${user.picture}` }}
									style={styles.profileImage}
								/>
							) : (
								<View style={styles.profilePlaceholder}>
									<View style={{ marginTop: 8 }}>
										<PersonIcon width={28} height={28} fill="#ccc" />
									</View>
								</View>
							)}
						</View>
					</Marker>
				)}
			</MapView>

			{/* Top Bar */}
			<SafeAreaView style={styles.safeAreaContainer}>
				<View style={styles.topBarContainer}>
					{/* Search input button */}
					<PrettyButton
						style={styles.searchInputButton}
						onPress={() => navigation.navigate('Ask')}
					>
						<Text style={styles.searchPlaceholder}>{t('ask.placeholder', 'Ask me about the campus...')}</Text>
					</PrettyButton>
					{/* Profile button */}
					<PrettyButton style={styles.mapButton} onPress={() => navigation.navigate('Profile')}>
						<PersonIcon width={20} height={20} fill={Colors.primary} />
					</PrettyButton>
				</View>
			</SafeAreaView>

			<View style={styles.bottomBarContainer}>
				{/* Latest reviews */}
				<PrettyButton
					style={styles.mapButton}
					onPress={() => navigation.navigate('Latest')}
					contentStyle={{ gap: 0 }}
					children={<BubbleIcon width={24} height={24} fill={Colors.primary} />}
				/>
				{/* Bottom primary button */}
				<PrettyButton
					style={styles.primaryButton}
					onPress={() => navigation.navigate('New', { onDone: () => { } })}
					contentStyle={{ gap: 0 }}
					children={<PlusIcon width={20} height={20} fill={'#fff'} />}
				/>
				{/* Relocate user button */}
				<PrettyButton
					style={styles.mapButton}
					onPress={centerOnUser}
					contentStyle={{ gap: 0 }}
					children={<LocateIcon width={24} height={24} stroke={Colors.primary} />}
				/>
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
		justifyContent: 'flex-start',
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
		backgroundColor: Colors.primary,
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
	},
	marker: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 16,
		borderWidth: 2,
	},
	markerText: {
		color: Colors.primary,
		fontWeight: '600',
		fontSize: 12,
	},
});

export default HomeScreen;