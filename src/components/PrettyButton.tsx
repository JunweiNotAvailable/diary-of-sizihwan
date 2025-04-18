import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../utils/Constants';

interface PrettyButtonProps {
  onPress: () => void;
  title?: string | React.ReactNode;
  type?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const PrettyButton: React.FC<PrettyButtonProps> = ({
  onPress,
  title,
  type = 'primary',
  icon = null,
  disabled = false,
  loading = false,
  style = {},
  textStyle = {},
  contentStyle = {},
  children,
}) => {
  const animatedScale = useRef(new Animated.Value(1)).current;

  // Create an animated version of Pressable
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <AnimatedPressable
      style={[
        styles.buttonBase,
        type === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.buttonDisabled,
        { transform: [{ scale: animatedScale }] },
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      android_ripple={{
        color: type === 'primary' ? '#2980b9' : '#e1f0fa',
      }}
    >
      {children ? (
        children
      ) : (
        <View style={[styles.buttonContent, contentStyle]}>
          {icon}
          {typeof title === 'string' ? (
            <Text
            style={[
              styles.buttonText,
              type === 'secondary' && styles.secondaryButtonText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : (
          title
          )}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: 50,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
});

export default PrettyButton; 