import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  FlatList
} from 'react-native';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../utils/Constants';

interface ImagePreviewProps {
  visible: boolean;
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImagePreview: React.FC<ImagePreviewProps> = ({
  visible,
  imageUrls,
  initialIndex,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scales, setScales] = useState<{[key: number]: Animated.Value}>({});
  const flatListRef = useRef<FlatList>(null);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Initialize or get scale for specific index
  const getScale = (index: number) => {
    if (!scales[index]) {
      const newScales = { ...scales };
      newScales[index] = new Animated.Value(1);
      setScales(newScales);
    }
    return scales[index] || new Animated.Value(1);
  };

  // Reset all zoom scales
  const resetAllZoom = () => {
    Object.keys(scales).forEach((key) => {
      scales[Number(key)].setValue(1);
    });
  };

  // Effect to scroll to initial index when modal becomes visible
  useEffect(() => {
    if (visible && flatListRef.current) {
      // Wait for FlatList to fully render
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  // Handle on view change
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handlePinchEvent = (index: number) => {
    return Animated.event(
      [{ nativeEvent: { scale: getScale(index) } }],
      { useNativeDriver: true }
    );
  };

  const handlePinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // We don't track lastScale since we're using a new Animated.Value for each image
    }
  };

  const goToNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
    } else {
      // Loop to first image
      flatListRef.current?.scrollToIndex({
        index: 0,
        animated: true
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true
      });
    } else {
      // Loop to last image
      flatListRef.current?.scrollToIndex({
        index: imageUrls.length - 1,
        animated: true
      });
    }
  };

  const handleClose = () => {
    resetAllZoom();
    onClose();
  };

  const renderItem = ({ item, index }: { item: string, index: number }) => {
    const scale = getScale(index);
    
    return (
      <View style={styles.slide}>
        <PinchGestureHandler
          onGestureEvent={handlePinchEvent(index)}
          onHandlerStateChange={handlePinchStateChange}
        >
          <Animated.View style={styles.pinchContainer}>
            <Animated.Image
              source={{ uri: item }}
              style={[
                styles.image,
                {
                  transform: [{ scale }]
                }
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </PinchGestureHandler>
      </View>
    );
  };

  // If there are no images, don't render anything
  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.fullScreen}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            data={imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderItem}
            keyExtractor={(_, index) => `image-${index}`}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfigRef.current}
            initialNumToRender={imageUrls.length} // Prerender all images for smooth swiping
            maxToRenderPerBatch={3} // For performance
            windowSize={3} // For performance
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />

          <View style={styles.navigationContainer}>
            <TouchableOpacity style={styles.navButton} onPress={goToPrevious}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.counter}>
              {currentIndex + 1} / {imageUrls.length}
            </Text>
            
            <TouchableOpacity style={styles.navButton} onPress={goToNext}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinchContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: -4,
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ImagePreview; 