import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import GCEntryScreen from '../screens/GCEntryScreen';
import MoreScreen from '../screens/MoreScreen';
import TripSheetEntryScreen from '../screens/TripSheetEntryScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === 'Dashboard') icon = '🏠';
          else if (route.name === 'GC Entry') icon = '📝';
          else if (route.name === 'Tripsheet') icon = '🚚';
          else if (route.name === 'More') icon = '☰';
          
          return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: (Platform.OS === 'ios' ? 55 : 60) + insets.bottom,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          paddingBottom: 2,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="GC Entry" component={GCEntryScreen} />
      <Tab.Screen name="Tripsheet" component={TripSheetEntryScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
