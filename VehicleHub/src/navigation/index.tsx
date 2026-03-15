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
import { TeamScreen } from '../screens/TeamScreen';
import { AddEmployeeScreen } from '../screens/AddEmployeeScreen';
import { EmployeeDetailScreen } from '../screens/EmployeeDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AddDocumentScreen } from '../screens/AddDocumentScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { Colors } from '../constants/theme';

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
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            Vehicles: ['car-sport', 'car-sport-outline'],
            Stats: ['bar-chart', 'bar-chart-outline'],
            Business: ['business', 'business-outline'],
            Team: ['people', 'people-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Fahrzeuge' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistiken' }} />
      <Tab.Screen name="Business" component={BusinessScreen} options={{ title: 'Geschäft' }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ title: 'Team' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddEntry" component={AddEntryScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddTrip" component={AddTripScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
