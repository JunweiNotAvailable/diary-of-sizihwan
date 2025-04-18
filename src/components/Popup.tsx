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
  const { width } = Dimensions.get('window');
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

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.popupContainer,
                { width: width * 0.9, maxHeight: Dimensions.get('window').height * 0.8 },
                { opacity, transform: [{ scale }] },
                contentContainerStyle
              ]}
            >
              {title && <Text style={styles.title}>{title}</Text>}
              <ScrollView style={styles.contentContainer}>
                <Text style={styles.content}>{content}</Text>
              </ScrollView>
              <PrettyButton
                style={styles.closeButton}
                onPress={onClose}
              >
                <View style={{ transform: [{ rotate: '45deg' }] }}><PlusIcon width={12} height={12} /></View>
              </PrettyButton>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  },
  contentContainer: {
    width: '100%',
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
  },
  closeText: {
    fontSize: 24,
    color: Colors.primaryGray,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default Popup; 