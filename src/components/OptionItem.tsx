import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Colors } from '../utils/Constants';

interface OptionItemProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const OptionItem: React.FC<OptionItemProps> = ({
  label,
  onPress,
  icon,
  destructive = false,
  style,
  labelStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text 
        style={[
          styles.label, 
          destructive && styles.destructiveLabel,
          labelStyle
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray + '40',
  },
  iconContainer: {
    marginRight: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  destructiveLabel: {
    color: '#FF3B30',
  },
});

export default OptionItem; 