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
import { useAppState } from '../../../contexts/AppContext';
import { Categories, Colors, Locations } from '../../../utils/Constants';
import { ChevronDownIcon, PlusIcon, PrettyLoadingIcon } from '../../../utils/Svgs';
import { Input, Textarea, PrettyButton, Select } from '../../../components';
import { EmbeddingModel, ReviewModel } from '../../../utils/Interfaces';
import { Config } from '../../../utils/Config';
import { hasInappropriateContent } from '../../../utils/ContentFilter';

const EditReviewScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { t } = useTranslation();
  const { user, locale } = useAppState();
  const { reviewId } = route.params;

  // Form state
  const [review, setReview] = useState<ReviewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get review and setup initial state
  useEffect(() => {
    if (!reviewId) return;

    // Get review from server
    (async () => {
      const res = await fetch(`${Config.api.url}/data?table=reviews&id=${reviewId}`);
      const reviewData = (await res.json()).data;
      setReview(reviewData);
      setIsLoading(false);
    })();
  }, [reviewId]);

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

    if (!review?.title.trim()) {
      setTitleError(t('new.errors.titleRequired', 'Title is required'));
      isValid = false;
    } else if (review && hasInappropriateContent(review.title)) {
      setTitleError(t('new.errors.inappropriate', 'Title contains inappropriate language'));
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!review?.content.trim()) {
      setContentError(t('new.errors.contentRequired', 'Content is required'));
      isValid = false;
    } else if (review && hasInappropriateContent(review.content)) {
      setContentError(t('new.errors.inappropriate', 'Content contains inappropriate language'));
      isValid = false;
    } else {
      setContentError('');
    }

    if (!review?.location) {
      setLocationError(t('new.errors.locationRequired', 'Please select a location'));
      isValid = false;
    } else {
      setLocationError('');
    }

    if (review?.categories.length === 0) {
      setCategoryError(t('new.errors.categoryRequired', 'Please select at least one category'));
      isValid = false;
    } else {
      setCategoryError('');
    }

    return isValid;
  };

  // Handle post
  const handlePost = async () => {
    if (!validateForm() || !user || !review) return;

    setIsSubmitting(true);
    try {
      // Post review to server
      const { id, created_at, user_id, ...reviewData } = review;
      await fetch(`${Config.api.url}/data?table=reviews&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      // Update embedding
      const translateResponse = await fetch(`${Config.api.url}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `
            Title: ${reviewData.title}
            Location: ${Locations.nsysu.find(location => location.id === reviewData.location)?.name_en}
            Categories: ${reviewData.categories.join(', ')}
            Content:\n${reviewData.content}
          `,
          targetLang: 'en',
        })
      });
      const translateData = (await translateResponse.json()).data;
      const enContent = translateData.translatedText;

      const res = await fetch(`${Config.api.url}/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: enContent })
      });
      const data = await res.json();
      const vector = data.data.vector;

      const embedding: EmbeddingModel = {
        id: review.id,
        vector,
        payload: {
          allow_reference: reviewData.allow_reference,
          location: reviewData.location,
          categories: reviewData.categories
        }
      }
      // Store vector
      await fetch(`${Config.api.url}/qdrant/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(embedding)
      });

      // Check if there's an onDone callback and use it to return the updated review
      if (route.params?.onDone) {
        route.params.onDone(review);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error posting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>{t('profile.myReviews.editReviewTitle', 'Edit Review')}</Text>
            <PrettyButton
              style={[styles.headerButton, { alignItems: 'flex-start' }]}
              onPress={handlePost}
            >
              {isSubmitting ? <PrettyLoadingIcon width={16} height={16} stroke={Colors.primaryGray} /> : <Text style={{ fontSize: 14, fontWeight: '600' }}>{t('general.save', 'Save')}</Text>}
            </PrettyButton>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Input
              label={t('general.title', '標題')}
              value={review?.title}
              onChangeText={(text) => review && setReview({ ...review, title: text })}
              placeholder={t('new.titlePlaceholder', 'Enter a title for your review')}
              error={titleError}
              containerStyle={{ marginBottom: 30 }}
              labelStyle={{ fontWeight: '600', marginBottom: 0 }}
              inputStyle={{ fontSize: 18, borderWidth: 0, paddingTop: 0, paddingHorizontal: 0, fontWeight: '600' }}
            />

            <Textarea
              label={t('new.content', 'Content')}
              value={review?.content}
              onChangeText={(text) => review && setReview({ ...review, content: text })}
              placeholder={t('new.contentPlaceholder', 'Write your review here...')}
              error={contentError}
              rows={Math.min(10, Math.max(4, review?.content?.split('\n').length || 0))}
              containerStyle={{ marginBottom: 30 }}
              labelStyle={{ fontWeight: '600' }}
              textareaStyle={{ paddingVertical: 0, paddingHorizontal: 0, paddingBottom: 10, borderRadius: 0, borderWidth: 0, borderBottomWidth: 1 }}
            />

            <Select
              label={t('new.location', 'Location')}
              placeholder={t('new.selectLocation', 'Select a location')}
              options={Locations.nsysu.map(location => ({ id: location.id, name: locale === 'zh' ? location.name : location.name_en }))}
              selectedIds={review?.location || ''}
              onSelect={(id: string | string[]) => review && setReview({ ...review, location: id as string })}
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
              selectedIds={review?.categories || []}
              onSelect={(ids: string | string[]) => review && setReview({ ...review, categories: ids as string[] })}
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
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
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

export default EditReviewScreen;