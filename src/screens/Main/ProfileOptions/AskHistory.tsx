import { View, Text, StyleSheet, SafeAreaView, FlatList, Platform, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAppState } from '../../../contexts/AppContext';
import { Config } from '../../../utils/Config';
import { AskModel } from '../../../utils/Interfaces';
import { PlusIcon, PrettyLoadingIcon, ChevronDownIcon } from '../../../utils/Svgs';
import { Colors } from '../../../utils/Constants';
import { PrettyButton } from '../../../components';
import { t } from 'i18next';
import { getTimeFromNow } from '../../../utils/Functions';

const AskHistory = ({ navigation }: { navigation: any }) => {

  const { user } = useAppState();
  const [asks, setAsks] = useState<AskModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const res = await fetch(`${Config.api.url}/data?table=asks&query=user_id:${user.id}&sortBy=created_at&order=desc`);
      const asks = (await res.json()).data;
      setAsks(asks);
      setIsLoading(false);
    })();
  }, [user]);

  if (isLoading) return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <PrettyLoadingIcon width={28} height={28} stroke={Colors.primaryGray} />
      </View>
    </View>
  );

  const handleClose = () => {
    navigation.goBack();
  };

  const renderAskItem = ({ item }: { item: AskModel }) => {
    return (
      <TouchableWithoutFeedback onPress={() => navigation.navigate('AskHistoryView', { ask: item })}>
        <View style={styles.askItemContainer}>
          <View style={{ gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.askItemQuestion}>{item.question}</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>{getTimeFromNow(item.created_at)}</Text>
          </View>
          <Text numberOfLines={1} ellipsizeMode='tail' style={styles.askItemResponse}>{item.response}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <PrettyButton
            style={[styles.headerButton, { alignItems: 'flex-start' }]}
            onPress={handleClose}
          >
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronDownIcon width={20} height={20} />
            </View>
          </PrettyButton>
          <Text style={styles.headerTitle}>{t('profile.askHistory.title', 'Ask History')}</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Use FlatList with ListHeaderComponent instead of nested ScrollView */}
        <FlatList
          data={asks}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          keyExtractor={(item) => item.id}
          renderItem={renderAskItem}
          ListEmptyComponent={
            <View style={styles.loadingContainer}>
              <Text style={[styles.emptyText]}>{t('profile.askHistory.noAsks')}</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#555',
    marginTop: -2,
  },
  scrollContent: {
    flex: 1,
    gap: 20,
  },
  listContainer: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 24,
  },
  emptyText: {
    color: Colors.primaryGray,
  },
  askItemContainer: {
    paddingVertical: 20,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLightGray,
    gap: 10,
  },
  askItemQuestion: {
    fontSize: 16,
    fontWeight: '600',
  },
  askItemResponse: {
    fontSize: 14,
    color: '#888',
  },
});

export default AskHistory