import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Main/Home';
import ProfileScreen from './Main/Profile';
import NewScreen from './Main/New';
import AskScreen from './Main/Ask';	

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
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
			<Stack.Screen
        name="New"
        component={NewScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
			<Stack.Screen
        name="Ask"
        component={AskScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainScreen;
