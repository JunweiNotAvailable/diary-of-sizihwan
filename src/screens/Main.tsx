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

// Create the stack navigator
const Stack = createNativeStackNavigator();

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
      {/* Profile */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      {/* My reviews */}
      <Stack.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      {/* Edit review */}
      <Stack.Screen
        name="EditReview"
        component={EditReviewScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      
      {/* New review */}
			<Stack.Screen
        name="New"
        component={NewScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      {/* Ask */}
			<Stack.Screen
        name="Ask"
        component={AskScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      {/* Reviews */}
			<Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
      />
      {/* User profile */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      {/* Settings */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainScreen;
