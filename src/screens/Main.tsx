import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import HomeScreen from './Main/Home';
import ProfileScreen from './Main/Profile';
import NewScreen from './Main/New';
import AskScreen from './Main/Ask';	
import ReviewsScreen from './Main/Reviews';	
import UserProfileScreen from './Main/UserProfile';
import MyReviewsScreen from './Main/ProfileOptions/MyReviews';
import EditReviewScreen from './Main/ProfileOptions/EditReview';
import SettingsScreen from './Main/ProfileOptions/Settings';
import LatestScreen from './Main/Latest';
import RelevantReviewsScreen from './Main/RelevantReviews';
import AskHistory from './Main/ProfileOptions/AskHistory';
import AskHistoryView from './Main/ProfileOptions/AskHistoryView';
import { Platform } from 'react-native';
// Create the stack navigator
const Stack = createNativeStackNavigator();
const backgroundColor = '#fff';

const getModalOptions = (animation: 'slide_from_bottom' | 'flip'): NativeStackNavigationOptions => {
  return Platform.OS === 'ios' ? {
    presentation: 'modal',
    animation: animation || 'slide_from_bottom',
    contentStyle: { backgroundColor },
  } : {
    contentStyle: { backgroundColor },
  };
};

const MainScreen = () => {

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Home */}
      <Stack.Screen name="Home" component={HomeScreen} />
      {/* New review */}
			<Stack.Screen
        name="New"
        component={NewScreen}
      />
      {/* Reviews */}
			<Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
      />
      {/* Latest */}
      <Stack.Screen name="Latest" component={LatestScreen}
        options={getModalOptions('slide_from_bottom')}
      />
      {/* Ask */}
			<Stack.Screen
        name="Ask"
        component={AskScreen}
        options={getModalOptions('slide_from_bottom')}
      />
      {/* Relevant reviews */}
      <Stack.Screen
        name="RelevantReviews"
        component={RelevantReviewsScreen}
        options={getModalOptions('slide_from_bottom')}
      />

      {/* Profile */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={getModalOptions('slide_from_bottom')}
      />
      {/* My reviews */}
      <Stack.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={getModalOptions('slide_from_bottom')}
      />
      {/* Edit review */}
      <Stack.Screen
        name="EditReview"
        component={EditReviewScreen}
      />
      {/* Ask history */}
      <Stack.Screen
        name="AskHistory"
        component={AskHistory}
        options={getModalOptions('slide_from_bottom')}
      />
      {/* Ask history view */}
      <Stack.Screen
        name="AskHistoryView"
        component={AskHistoryView}
        options={getModalOptions('flip')}
      />
      {/* Settings */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={getModalOptions('slide_from_bottom')}
      />
      
      {/* User profile */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={getModalOptions('slide_from_bottom')}
      />
    </Stack.Navigator>
  );
};

export default MainScreen;
