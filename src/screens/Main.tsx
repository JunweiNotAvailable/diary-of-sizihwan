import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
// Create the stack navigator
const Stack = createNativeStackNavigator();
const backgroundColor = '#fff';

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
        options={{
          presentation: 'fullScreenModal',
        }}
      />
      {/* Reviews */}
			<Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
      />
      {/* Latest */}
      <Stack.Screen name="Latest" component={LatestScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
      {/* Ask */}
			<Stack.Screen
        name="Ask"
        component={AskScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
      {/* Relevant reviews */}
      <Stack.Screen
        name="RelevantReviews"
        component={RelevantReviewsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />

      {/* Profile */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
      {/* My reviews */}
      <Stack.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
      {/* Edit review */}
      <Stack.Screen
        name="EditReview"
        component={EditReviewScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
      {/* Ask history */}
      <Stack.Screen
        name="AskHistory"
        component={AskHistory}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
      {/* Ask history view */}
      <Stack.Screen
        name="AskHistoryView"
        component={AskHistoryView}
        options={{
          presentation: 'modal',
          animation: 'flip',
        }}
      />
      {/* Settings */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
      
      {/* User profile */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor },
        }}
      />
    </Stack.Navigator>
  );
};

export default MainScreen;
