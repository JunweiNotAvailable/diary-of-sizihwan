import React, { forwardRef } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../utils/Constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerStyle,
      labelStyle,
      inputStyle,
      errorStyle,
      ...rest
    },
    ref
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            error ? styles.inputError : null,
            inputStyle,
          ]}
          placeholderTextColor="#aaa"
          {...rest}
        />
        {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input; 