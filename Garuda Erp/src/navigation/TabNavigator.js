import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import GCEntryScreen from '../screens/GCEntryScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

import TripSheetEntryScreen from '../screens/TripSheetEntryScreen';

export default function TabNavigator() {
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
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="GC Entry" component={GCEntryScreen} />
      <Tab.Screen name="Tripsheet" component={TripSheetEntryScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
