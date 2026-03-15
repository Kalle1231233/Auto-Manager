import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { AddVehicleScreen } from '../screens/AddVehicleScreen';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { AddTripScreen } from '../screens/AddTripScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { BusinessScreen } from '../screens/BusinessScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { Colors, FontSize } from '../constants/theme';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'home';
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Vehicles') iconName = focused ? 'car-sport' : 'car-sport-outline';
          if (route.name === 'Stats') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          if (route.name === 'Business') iconName = focused ? 'business' : 'business-outline';
          if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Fahrzeuge' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistiken' }} />
      <Tab.Screen name="Business" component={BusinessScreen} options={{ title: 'Geschäft' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Einstellungen' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="VehicleDetail"
          component={VehicleDetailScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="AddVehicle"
          component={AddVehicleScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="AddEntry"
          component={AddEntryScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="AddTrip"
          component={AddTripScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
