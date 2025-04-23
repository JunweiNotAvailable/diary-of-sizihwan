import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '../utils/Constants';
import { PrettyButton } from '.';
import { PlusIcon } from '../utils/Svgs';

interface PopupProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  content: string;
  contentContainerStyle?: any;
}

const Popup = ({ visible, onClose, title, content, contentContainerStyle }: PopupProps) => {
  const { width, height } = Dimensions.get('window');
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  if (!visible) return null;

  // Calculate maximum height for the popup (70% of screen height)
  const maxPopupHeight = height * 0.7;
  // Calculate maximum height for content (popup height minus title and padding)
  const titleHeight = title ? 50 : 0; // Approximate title height including margin
  const paddingTotal = 48; // Total vertical padding (24px top + 24px bottom)
  const maxContentHeight = maxPopupHeight - titleHeight - paddingTotal;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.popupContainer,
            { width: width * 0.9, maxHeight: maxPopupHeight },
            { opacity, transform: [{ scale }] },
            contentContainerStyle
          ]}
        >
          {title && <Text style={styles.title}>{title}</Text>}

          <ScrollView
            style={[styles.contentContainer, { maxHeight: maxContentHeight }]}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.content}>{content}</Text>
          </ScrollView>

          <PrettyButton
            style={styles.closeButton}
            onPress={onClose}
          >
            <View style={{ transform: [{ rotate: '45deg' }] }}><PlusIcon width={12} height={12} /></View>
          </PrettyButton>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  contentContainer: {
    width: '100%',
    flexGrow: 0,
  },
  scrollContentContainer: {
    paddingBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    fontWeight: '300',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 15,
    backgroundColor: Colors.secondaryGray,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 24,
    color: Colors.primaryGray,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default Popup; 