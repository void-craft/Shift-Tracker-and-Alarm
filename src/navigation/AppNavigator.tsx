import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CalendarScreen from '../screens/CalendarScreen';
import ShiftsScreen from '../screens/ShiftsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF9A3C',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Calendario" component={CalendarScreen} />
      <Tab.Screen name="Turnos" component={ShiftsScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
