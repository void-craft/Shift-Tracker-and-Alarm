import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CalendarScreen from '../screens/CalendarScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF9A3C',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
      />
      <Tab.Screen 
        name="Calendario" 
        component={CalendarScreen} 
      />
      <Tab.Screen 
        name="Turnos" 
        component={ShiftsScreen} 
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
