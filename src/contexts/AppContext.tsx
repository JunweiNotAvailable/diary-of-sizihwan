import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { UserModel } from '../utils/Interfaces';
import { getLocales } from 'expo-localization';
import i18n from '../i18n';

interface AppContextType {
  user: UserModel | null
  setUser: React.Dispatch<React.SetStateAction<UserModel | null>>
  locale: 'zh' | 'en'
}

const AppStateContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export const AppStateProvider: React.FC<AppProviderProps> = ({ children }) => {

  const [user, setUser] = useState<UserModel | null>(null);
  const [locale, setLocale] = useState<'zh' | 'en'>('en');

  useEffect(() => {
    const deviceLocale = getLocales()[0].languageCode;
    const appLocale = deviceLocale === 'zh' ? 'zh' : 'en';
    setLocale(appLocale);
  }, []);

  // Update i18n language when locale changes
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <AppStateContext.Provider value={{ 
      locale,
      user, setUser,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook to access the context values
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};