import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../contexts/AppContext';
import { Categories, Colors, Locations } from '../../utils/Constants';
import { ChevronDownIcon, PlusIcon, PrettyLoadingIcon } from '../../utils/Svgs';
import { Input, Textarea, PrettyButton, Select } from '../../components';
import { EmbeddingModel, ReviewModel } from '../../utils/Interfaces';
import { Config } from '../../utils/Config';
import { generateRandomString } from '../../utils/Functions';
import { hasInappropriateContent } from '../../utils/ContentFilter';

const NewScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { t } = useTranslation();
  const { user, locale } = useAppState();

  // Get initial location from route params if available
  const initialLocation = route.params?.locationId || '';

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState(initialLocation);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allowReference, setAllowReference] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update location if route params change
  useEffect(() => {
    if (route.params?.locationId) {
      setLocation(route.params.locationId);
    }
  }, [route.params?.locationId]);

  // UI state
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Handle close
  const handleClose = () => {
    navigation.goBack();
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError(t('new.errors.titleRequired', 'Title is required'));
      isValid = false;
    } else if (hasInappropriateContent(title)) {
      setTitleError(t('new.errors.inappropriate', 'Title contains inappropriate language'));
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!content.trim()) {
      setContentError(t('new.errors.contentRequired', 'Content is required'));
      isValid = false;
    } else if (hasInappropriateContent(content)) {
      setContentError(t('new.errors.inappropriate', 'Content contains inappropriate language'));
      isValid = false;
    } else {
      setContentError('');
    }

    if (!location) {
      setLocationError(t('new.errors.locationRequired', 'Please select a location'));
      isValid = false;
    } else {
      setLocationError('');
    }

    if (selectedCategories.length === 0) {
      setCategoryError(t('new.errors.categoryRequired', 'Please select at least one category'));
      isValid = false;
    } else {
      setCategoryError('');
    }

    return isValid;
  };

  // Handle post
  const handlePost = async () => {
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    try {
      // Create review object
      const review: ReviewModel = {
        id: generateRandomString(30, 'rev'),
        user_id: user.id,
        title,
        content,
        location,
        categories: selectedCategories,
        created_at: new Date().toISOString(),
        allow_reference: allowReference,
        extra: {
          score: 0,
          likes: []
        }
      };

      // Create embedding
      const translateResponse = await fetch(`${Config.api.url}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `
            Title: ${review.title}
            Location: ${Locations.nsysu.find(location => location.id === review.location)?.name_en}
            Categories: ${review.categories.join(', ')}
            Content:\n${review.content}
          `,
          targetLang: 'en',
        })
      });
      const translateData = (await translateResponse.json()).data;
      const enContent = translateData.translatedText;

      const response = await fetch(`${Config.api.url}/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: enContent })
      });
      const data = await response.json();
      const vector = data.data.vector;

      const embedding: EmbeddingModel = {
        id: review.id,
        vector,
        payload: {
          allow_reference: review.allow_reference,
          location: review.location,
          categories: review.categories
        }
      }

      // Post review to server
      await fetch(`${Config.api.url}/data?table=reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(review)
      });

      // Store vector
      await fetch(`${Config.api.url}/qdrant/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(embedding)
      });

      // Check if there's an onDone callback and use it to return the new review
      if (route.params?.onDone) {
        route.params.onDone(review);
        navigation.goBack();
      } else {
        navigation.goBack();
        setTimeout(() => {
          navigation.navigate('Reviews', { location: Locations.nsysu.find(location => location.id === review.location) });
        }, 500);
      }

    } catch (error) {
      console.error('Error posting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: '#fff0' }}
        >
          {/* Header */}
          <View style={styles.header}>
            <PrettyButton
              style={[styles.headerButton, { alignItems: 'flex-start' }]}
              onPress={() => navigation.goBack()}
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <ChevronDownIcon width={20} height={20} />
              </View>
            </PrettyButton>
            <Text style={styles.headerTitle}>{t('new.title', 'New Review')}</Text>
            <PrettyButton
              style={[styles.headerButton, { alignItems: 'flex-start' }]}
              onPress={handlePost}
            >
              {isSubmitting ? <PrettyLoadingIcon width={16} height={16} stroke={Colors.primaryGray} /> : <Text style={{ fontSize: 14, fontWeight: '600' }}>{t('new.submit', 'Submit')}</Text>}
            </PrettyButton>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Input
              label={t('general.title', '標題')}
              value={title}
              autoFocus
              onChangeText={setTitle}
              placeholder={t('new.titlePlaceholder', 'Enter a title for your review')}
              error={titleError}
              containerStyle={{ marginBottom: 30 }}
              labelStyle={{ fontWeight: '600', marginBottom: 0 }}
              inputStyle={{ fontSize: 18, borderWidth: 0, paddingTop: 0, paddingHorizontal: 0, fontWeight: '600' }}
            />

            <Textarea
              label={t('new.content', 'Content')}
              value={content}
              onChangeText={setContent}
              placeholder={t('new.contentPlaceholder', 'Write your review here...')}
              error={contentError}
              rows={Math.min(10, Math.max(4, content.split('\n').length))}
              containerStyle={{ marginBottom: 30 }}
              labelStyle={{ fontWeight: '600' }}
              textareaStyle={{ paddingVertical: 0, paddingHorizontal: 0, paddingBottom: 10, borderRadius: 0, borderWidth: 0, borderBottomWidth: 1 }}
            />

            <Select
              label={t('new.location', 'Location')}
              placeholder={t('new.selectLocation', 'Select a location')}
              options={Locations.nsysu.map(location => ({ id: location.id, name: locale === 'zh' ? location.name : location.name_en }))}
              selectedIds={location}
              onSelect={(id: string | string[]) => setLocation(id as string)}
              error={locationError}
              containerStyle={{ marginBottom: 30 }}
              modalTitle={t('new.location', 'Location')}
              labelStyle={{ fontWeight: '600' }}
              buttonStyle={{ borderRadius: 12 }}
            />

            <Select
              label={t('new.categories', 'Categories')}
              placeholder={t('new.selectCategories', 'Select categories')}
              options={Categories.map((category) => ({ id: category.name, name: t(`categories.${category.name}`) }))}
              selectedIds={selectedCategories}
              onSelect={(ids: string | string[]) => setSelectedCategories(ids as string[])}
              error={categoryError}
              multiSelect={true}
              // allowAddNew={true}
              addNewPlaceholder={t('new.addCategory', 'Add a new category')}
              modalTitle={t('new.categories', 'Categories')}
              containerStyle={{ marginBottom: 30 }}
              labelStyle={{ fontWeight: '600' }}
              buttonStyle={{ borderRadius: 12 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomColor: Colors.primaryLightGray,
    width: '100%',
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 0,
    margin: 0,
    backgroundColor: '#0000',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  dropdownContainer: {
    marginBottom: 15,
    width: '100%',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
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
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#aaa',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#444',
    flex: 1,
    paddingRight: 10,
  },
});

export default NewScreen;