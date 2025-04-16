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

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  textareaStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  rows?: number;
}

const Textarea = forwardRef<TextInput, TextareaProps>(
  (
    {
      label,
      error,
      containerStyle,
      labelStyle,
      textareaStyle,
      errorStyle,
      rows = 4,
      ...rest
    },
    ref
  ) => {
    // Calculate height based on rows
    const textareaHeight = Math.max(rows * 20, 50);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.textarea,
            { height: textareaHeight },
            error ? styles.textareaError : null,
            textareaStyle,
          ]}
          multiline
          textAlignVertical="top"
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
  textarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textareaError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});

export default Textarea; 