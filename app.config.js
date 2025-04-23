const { getDefaultConfig } = require('expo/metro-config');

module.exports = {
  ...getDefaultConfig(__dirname),
  
  // Import the base configuration from app.json
  name: "西灣日記",
  slug: "diary-of-sizihwan",
  
  // Localization configuration
  localization: {
    defaultLocale: "en",
    locales: ["en", "zh"],
  },
  
  // Set up resources paths
  ios: {
    // Use the InfoPlist.strings files in localization directories
    localizedResources: {
      "en": "./assets/locales/en.lproj",
      "zh": "./assets/locales/zh.lproj",
    }
  },
  
  // For Android permissions
  android: {
    permissions: ["android.permission.CAMERA", "android.permission.ACCESS_FINE_LOCATION", "android.permission.READ_EXTERNAL_STORAGE"],
    // Use strings.xml in the res directory
    useNextNotificationsApi: true,
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#FFFFFF"
    }
  }
};