import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import CompanySetupScreen from '../screens/CompanySetupScreen';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';

import GCModifyScreen from '../screens/GCModifyScreen';
import GCTrackScreen from '../screens/GCTrackScreen';
import GCInwardScreen from '../screens/GCInwardScreen';
import GCBulkInwardScreen from '../screens/GCBulkInwardScreen';
import TripSheetEntryScreen from '../screens/TripSheetEntryScreen';
import GCReportScreen from '../screens/GCReportScreen';
import InwardReportScreen from '../screens/InwardReportScreen';
import CashBookEntryScreen from '../screens/CashBookEntryScreen';
import TripSheetReportScreen from '../screens/TripSheetReportScreen';
import UpdateDeliveryScreen from '../screens/UpdateDeliveryScreen';
import UploadPODScreen from '../screens/UploadPODScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CompanySetup" component={CompanySetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />

        <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="GCModify" component={GCModifyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GCTrack" component={GCTrackScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GCInward" component={GCInwardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GCBulkInward" component={GCBulkInwardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TripSheetEntry" component={TripSheetEntryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GCReport" component={GCReportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="InwardReport" component={InwardReportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CashBookEntry" component={CashBookEntryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TripSheetReport" component={TripSheetReportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UpdateDelivery" component={UpdateDeliveryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UploadPOD" component={UploadPODScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
