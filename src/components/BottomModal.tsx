import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../utils/Constants';
import PrettyButton from './PrettyButton';
import { PlusIcon } from '../utils/Svgs';

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  showCloseButton?: boolean;
}

const BottomModal: React.FC<BottomModalProps> = ({
  visible,
  onClose,
  title,
  children,
  containerStyle,
  titleStyle,
  showCloseButton = true,
}) => {
  const handleOverlayPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              <View style={[styles.modalContent, containerStyle]}>
                {(title || showCloseButton) && (
                  <View style={styles.modalHeader}>
                    {title && <Text style={[styles.modalTitle, titleStyle]}>{title}</Text>}
                    {showCloseButton && (
                      <PrettyButton
                        onPress={onClose}
                        style={styles.modalClose}
                        contentStyle={{ gap: 0 }}
                      >
                        <View style={{ transform: [{ rotate: '45deg' }], width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                          <PlusIcon width={14} height={14} fill={Colors.primary} />
                        </View>
                      </PrettyButton>
                    )}
                  </View>
                )}
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 400 },
    shadowOpacity: 1,
    shadowRadius: 400,
    elevation: 400,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
  },
});

export default BottomModal; 