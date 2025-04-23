import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, MapStyleElement, Marker } from 'react-native-maps';
import {
	StyleSheet,
	View,
	Alert,
	Text,
	Image,
	SafeAreaView,
	Modal,
	ScrollView,
	TouchableOpacity,
	Animated,
	Dimensions,
} from 'react-native';
import { useAppState } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { Colors, Map, Locations, IconColors } from '../../utils/Constants';
import { PlusIcon, LocateIcon, PersonIcon, BubbleIcon } from '../../utils/Svgs';
import { PrettyButton } from '../../components';
import { LocationIcon } from '../../components/LocationIcon';
import { Config } from '../../utils/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom map style to remove text labels for geographical elements while preserving user annotations
const mapStyle: MapStyleElement[] = ["poi", "transit", "water", "landscape"].map(featureType => ({
	featureType,
	elementType: "labels",
	stylers: [{ visibility: "off" }]
}));

const HomeScreen = ({ navigation, route }: { navigation: any, route: any }) => {
	const { t } = useTranslation();
	const { user } = useAppState();
	const { showTermOfUse } = route.params || {};
	const [locationPermission, setLocationPermission] = useState(false);
	const [mapError, setMapError] = useState(false);
	const [initialRegion, setInitialRegion] = useState(Map.defaultLocation);
	const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);
	const [showUser, setShowUser] = useState(false);
	
	// Terms of Use state variables
	const [termsModalVisible, setTermsModalVisible] = useState(false);
	const [canAgree, setCanAgree] = useState(false);
	const scrollViewRef = useRef<ScrollView>(null);
	const opacity = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(0.8)).current;
	
	// Reference to the location subscription
	const locationSubscription = useRef<Location.LocationSubscription | null>(null);

	const mapRef = useRef<MapView>(null);

	// Show Terms of Use modal if required
	useEffect(() => {
		if (showTermOfUse) {
			setTermsModalVisible(true);
		}
	}, [showTermOfUse]);
	
	// Animation for the Terms modal
	useEffect(() => {
		if (termsModalVisible) {
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.spring(scale, {
					toValue: 1,
					tension: 65,
					friction: 7,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 0.8,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [termsModalVisible]);

	// Load preferences
	useEffect(() => {
		(async () => {
			const showMyLocation = await AsyncStorage.getItem(Config.storage.showMyLocation);
			setShowUser(!showMyLocation || showMyLocation !== 'false');
		})();
	}, [AsyncStorage.getItem(Config.storage.showMyLocation)]);

	// Request location permission and get user's location
	useEffect(() => {
		const getLocationPermission = async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();

				if (status === 'granted') {
					setLocationPermission(true);

					// Get current location initially
					const location = await Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Balanced,
					});

					const locationCoords = {
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					};

					const beachLocation = Locations.nsysu[0].coordinates;
					setCurrentLocation(locationCoords); // User's current location

					setInitialRegion({
						...locationCoords,
						// ...beachLocation,
						latitudeDelta: 0.0042,
						longitudeDelta: 0.0042,
					});
					
					// Start watching for location updates
					startLocationUpdates();
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
		
		// Clean up location subscription when component unmounts
		return () => {
			if (locationSubscription.current) {
				locationSubscription.current.remove();
				locationSubscription.current = null;
			}
		};
	}, []);
	
	// Function to start location updates
	const startLocationUpdates = async () => {
		try {
			// Start the subscription to location updates
			locationSubscription.current = await Location.watchPositionAsync(
				{
					accuracy: Location.Accuracy.Balanced,
					timeInterval: 5000,  // Update every 5 seconds
					distanceInterval: 10, // Update if moved by 10 meters
				},
				(location) => {
					// Update the current location when changes are detected
					const newLocation = {
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					};
					
					setCurrentLocation(newLocation);
				}
			);
		} catch (error) {
			console.error('Error setting up location tracking:', error);
		}
	};

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
	
	// Handle scroll to detect when user reaches the bottom of Terms
	const handleScroll = (event: any) => {
		const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
		const paddingToBottom = 20;
		if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
			setCanAgree(true);
		}
	};
	
	// When user agrees to the terms
	const handleAgreeTerms = () => {
		setTermsModalVisible(false);
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
				{Locations.nsysu.map((location, index) => {
					const Icon = LocationIcon[location.icon as keyof typeof LocationIcon];
					const iconColors = IconColors[location.icon as keyof typeof IconColors] || { fg: Colors.primary, bg: Colors.secondary };
					return (
						<Marker
							key={location.id}
							coordinate={location.coordinates}
							anchor={{ x: 0.5, y: 0.5 }}
							onPress={() => navigation.navigate('Reviews', { location })}
							style={{ zIndex: Locations.nsysu.length - index }}
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
						onPress={() => navigation.navigate('Profile')}
						style={{ zIndex: 100 }}
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
					onPress={() => navigation.navigate('New')}
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
			
			{/* Terms of Use Modal */}
			<Modal
				transparent
				visible={termsModalVisible}
				animationType="none"
				onRequestClose={() => {}}
			>
				<View style={styles.termsOverlay}>
					<Animated.View
						style={[
							styles.termsContainer,
							{ opacity, transform: [{ scale }] }
						]}
					>
						<Text style={styles.termsTitle}>{t('profile.termOfUse.title', 'Terms of Use')}</Text>
						
						<ScrollView
							ref={scrollViewRef}
							style={styles.termsScrollView}
							onScroll={handleScroll}
							scrollEventThrottle={16}
						>
							<Text style={styles.termsContent}>
								{t('profile.termOfUse.content')}
							</Text>
						</ScrollView>
						
						<View style={styles.termsFooter}>
							<TouchableOpacity
								style={[
									styles.agreeButton,
									!canAgree && styles.agreeButtonDisabled
								]}
								onPress={handleAgreeTerms}
								disabled={!canAgree}
							>
								<Text style={[
									styles.agreeButtonText,
									!canAgree && styles.agreeButtonTextDisabled
								]}>
									{canAgree ? 
										t('profile.termOfUse.agree', 'I Agree') : 
										t('profile.termOfUse.scrollToAgree', 'Scroll to bottom to agree')
									}
								</Text>
							</TouchableOpacity>
						</View>
					</Animated.View>
				</View>
			</Modal>
		</View>
	);
};

const { width, height } = Dimensions.get('window');

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
		backgroundColor: '#f3f3f3',
		borderRadius: 16,
		shadowColor: '#0008',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 0,
	},
	profileImage: {
		width: 40,
		height: 40,
		borderRadius: 16,
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
		alignItems: 'flex-end',
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
	termsOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	termsContainer: {
		width: width * 0.9,
		maxHeight: height * 0.8,
		backgroundColor: 'white',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	termsTitle: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 16,
		textAlign: 'center',
	},
	termsScrollView: {
		maxHeight: height * 0.6,
	},
	termsContent: {
		fontSize: 16,
		lineHeight: 24,
		textAlign: 'left',
		marginBottom: 20,
	},
	termsFooter: {
		marginTop: 16,
		alignItems: 'center',
	},
	agreeButton: {
		backgroundColor: Colors.primary,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 10,
		width: '100%',
		alignItems: 'center',
	},
	agreeButtonDisabled: {
		backgroundColor: '#ccc',
	},
	agreeButtonText: {
		color: 'white',
		fontWeight: '700',
		fontSize: 16,
	},
	agreeButtonTextDisabled: {
		color: '#888',
	},
});

export default HomeScreen;