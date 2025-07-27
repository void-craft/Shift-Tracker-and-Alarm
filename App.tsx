import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';

// --- TYPE DEFINITIONS ---
type CustomMarking = MarkedDates[string];

// --- LOCALE CONFIG ---
LocaleConfig.locales.es = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

// --- SHIFT & LEGEND DEFINITIONS ---
const SHIFTS = {
  early: { key: 'early', color: '#FF9A3C', name: 'Turno Mañana' },
  late: { key: 'late', color: '#4A90E2', name: 'Turno Tarde' },
  night: { key: 'night', color: '#8A2BE2', name: 'Turno Noche' },
  weekOff: { key: 'weekOff', color: '#2ECC71', name: 'Día Libre' },
  leave: { key: 'leave', color: '#E74C3C', name: 'Vacaciones' },
};

const Legend = () => (
  <View style={styles.legendContainer}>
    {Object.values(SHIFTS).map(shift => (
      <View key={shift.key} style={styles.legendItem}>
        <View style={[styles.legendColorBox, {backgroundColor: shift.color}]} />
        <Text style={styles.legendText}>{shift.name}</Text>
      </View>
    ))}
  </View>
);

// --- SCREEN COMPONENTS ---
const CalendarScreen = () => {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const assignShift = (shiftKey: keyof typeof SHIFTS) => {
    const newMarkedDates = { ...markedDates };
    const createMarking = (key: keyof typeof SHIFTS): CustomMarking => ({
      customStyles: {
        container: { backgroundColor: SHIFTS[key].color, borderRadius: 8 },
        text: { color: 'white', fontWeight: 'bold' },
      },
    });
    newMarkedDates[selectedDate] = createMarking(shiftKey);
    setMarkedDates(newMarkedDates);
    setModalVisible(false);
  };

  const clearShift = () => {
    const newMarkedDates = { ...markedDates };
    delete newMarkedDates[selectedDate];
    setMarkedDates(newMarkedDates);
    setModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Calendario</Text>
      </View>
      <Calendar
        style={styles.calendar}
        onDayPress={handleDayPress}
        markingType={'custom'}
        markedDates={markedDates}
      />
      <Legend />
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Asignar Turno</Text>
            <Text style={styles.modalDate}>{selectedDate}</Text>
            {Object.values(SHIFTS).map(shift => (
              <Pressable
                key={shift.key}
                style={[styles.button, { backgroundColor: shift.color }]}
                onPress={() => assignShift(shift.key as keyof typeof SHIFTS)}
              >
                <Text style={styles.buttonText}>{shift.name}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.button, styles.buttonClear]} onPress={clearShift}>
              <Text style={styles.buttonClearText}>Quitar Turno</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonClose]} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ShiftsScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Gestionar Turnos</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholderText}>Próximamente: Editar alarmas aquí.</Text>
    </View>
  </SafeAreaView>
);

// --- APP NAVIGATOR ---
const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: 'white' } }}>
        <Tab.Screen name="Calendario" component={CalendarScreen} />
        <Tab.Screen name="Turnos" component={ShiftsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F0F2' },
    header: { padding: 20, paddingBottom: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    calendar: { margin: 10, borderRadius: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    placeholderText: { fontSize: 18, textAlign: 'center', color: '#666' },
    legendContainer: { padding: 15, margin: 10, backgroundColor: 'white', borderRadius: 10, elevation: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    legendColorBox: { width: 20, height: 20, borderRadius: 4, marginRight: 10 },
    legendText: { fontSize: 16, color: '#333' },
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  modalDate: { fontSize: 18, color: '#666', marginBottom: 20 },
    button: { borderRadius: 10, padding: 12, elevation: 2, marginBottom: 10, width: '100%' },
    buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    buttonClose: { backgroundColor: '#aaa' },
    buttonClear: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
    buttonClearText: { color: '#333', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
});

export default App;
