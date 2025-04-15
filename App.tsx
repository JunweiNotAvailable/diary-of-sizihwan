import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/screens/Splash';
import AuthScreen from './src/screens/Auth';
import MainScreen from './src/screens/Main';
import { AppStateProvider } from './src/contexts/AppContext';
import './src/i18n'; // Import i18n configuration

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppStateProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppStateProvider>
  );
}
