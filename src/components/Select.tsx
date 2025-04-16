import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Colors } from '../utils/Constants';
import { ChevronDownIcon, PlusIcon, CheckIcon } from '../utils/Svgs';
import PrettyButton from './PrettyButton';
import BottomModal from './BottomModal';

interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  selectedIds: string | string[];
  error?: string;
  multiSelect?: boolean;
  allowAddNew?: boolean;
  addNewPlaceholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<TextStyle>;
  modalTitle?: string;
  // functions
  onSelect: (id: string | string[]) => void;
  onAddNew?: (option: string) => void;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  selectedIds,
  onSelect,
  error,
  multiSelect = false,
  allowAddNew = false,
  addNewPlaceholder = 'Add a new option',
  containerStyle,
  labelStyle,
  buttonStyle,
  errorStyle,
  modalTitle = 'Select Options',
  onAddNew
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newOption, setNewOption] = useState('');

  // Format selected items for display
  const getSelectedText = () => {
    if (multiSelect) {
      const selectedArray = selectedIds as string[];
      if (selectedArray.length === 0) return '';

      return selectedArray
        .map(id => {
          const option = options.find(opt => opt.id === id);
          return option ? option.name : id;
        })
        .join(', ');
    } else {
      const selectedId = selectedIds as string;
      if (!selectedId) return '';

      const option = options.find(opt => opt.id === selectedId);
      return option ? option.name : selectedId;
    }
  };

  // Handle selection of an item
  const handleSelect = (id: string) => {
    if (multiSelect) {
      const selectedArray = selectedIds as string[];
      if (selectedArray.includes(id)) {
        onSelect(selectedArray.filter(item => item !== id));
      } else {
        onSelect([...selectedArray, id]);
      }
    } else {
      onSelect(id);
      setModalVisible(false);
    }
  };

  // Render content for the modal
  const renderModalContent = () => (
    <>
      {allowAddNew && (
        <View style={styles.newOptionContainer}>
          <TextInput
            style={styles.newOptionInput}
            value={newOption}
            onChangeText={setNewOption}
            placeholder={addNewPlaceholder}
            placeholderTextColor="#999"
          />
          <PrettyButton
            onPress={() => {
              if (newOption.trim()) {
                onAddNew?.(newOption);
                setNewOption('');
              }
            }}
            style={[
              styles.addButton,
              !newOption.trim() && styles.addButtonDisabled
            ]}
            disabled={!newOption.trim()}
            children={<PlusIcon width={10} height={10} fill={Colors.primary} />}
          />
        </View>
      )}

      <FlatList
        data={options}
        style={{ maxHeight: 350 }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => handleSelect(item.id)}
          >
            <Text style={styles.modalItemText}>{item.name}</Text>
            {multiSelect
              ? ((selectedIds as string[]).includes(item.id) && (
                <View style={styles.selectedIndicator}>
                  <CheckIcon width={10} height={10} stroke={'#fff'} />
                </View>
              ))
              : (item.id === selectedIds && (
                <View style={styles.selectedIndicator}>
                  <CheckIcon width={10} height={10} stroke={'#fff'} />
                </View>
              ))
            }
          </TouchableOpacity>
        )}
      />
    </>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <TouchableOpacity
        style={[styles.dropdown, error ? styles.dropdownError : null, buttonStyle]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedIds && getSelectedText() ? styles.dropdownText : styles.dropdownPlaceholder}>
          {selectedIds && getSelectedText() ? getSelectedText() : placeholder}
        </Text>
        <ChevronDownIcon width={16} height={16} fill={Colors.primaryGray} />
      </TouchableOpacity>

      {error ? <Text style={[styles.errorText, errorStyle]}>{error}</Text> : null}

      <BottomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
      >
        {renderModalContent()}
      </BottomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: Colors.primaryLightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  dropdownError: {
    borderColor: '#e74c3c',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#aaa',
    flex: 1,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newOptionContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  newOptionInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondaryGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
});

export default Select; 