import React, { useState, useContext, createContext } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Modal, Pressable, FlatList, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';

// --- TYPE DEFINITIONS ---
type CustomMarking = MarkedDates[string];
type Alarm = { id: string; label: string; time: string };
type Shift = { key: string; color: string; name: string; alarms: Alarm[] };

// --- LOCALE CONFIG ---
LocaleConfig.locales.es = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

// --- INITIAL DATA (Was SHIFTS constant) ---
const INITIAL_SHIFTS: Record<string, Shift> = {
  early: { 
    key: 'early', 
    color: '#FF9A3C', 
    name: 'Turno Mañana',
    alarms: [
      { id: '1', label: 'Despertar', time: '05:30' },
      { id: '2', label: 'Salir de casa', time: '06:15' },
      { id: '3', label: 'Entrar a trabajar', time: '07:00' },
    ]
  },
  late: { 
    key: 'late', 
    color: '#4A90E2', 
    name: 'Turno Tarde',
    alarms: [
      { id: '4', label: 'Comer', time: '13:00' },
      { id: '5', label: 'Salir de casa', time: '14:15' },
      { id: '6', label: 'Entrar a trabajar', time: '15:00' },
    ]
  },
  night: { 
    key: 'night', 
    color: '#8A2BE2', 
    name: 'Turno Noche',
    alarms: [
      { id: '7', label: 'Cenar', time: '21:00' },
      { id: '8', label: 'Entrar a trabajar', time: '23:00' },
    ]
  },
  weekOff: { key: 'weekOff', color: '#2ECC71', name: 'Día Libre', alarms: [] },
  leave: { key: 'leave', color: '#E74C3C', name: 'Vacaciones', alarms: [] },
};

// --- APP CONTEXT (To share state between screens) ---
const AppContext = createContext<{
  shifts: Record<string, Shift>;
  setShifts: React.Dispatch<React.SetStateAction<Record<string, Shift>>>;
  markedDates: MarkedDates;
  setMarkedDates: React.Dispatch<React.SetStateAction<MarkedDates>>;
} | null>(null);

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

// --- LEGEND COMPONENT ---
const Legend = () => {
  const { shifts } = useAppContext(); // Use context
  return (
    <View style={styles.legendContainer}>
      {Object.values(shifts).map(shift => (
        <View key={shift.key} style={styles.legendItem}>
          <View style={[styles.legendColorBox, {backgroundColor: shift.color}]} />
          <Text style={styles.legendText}>{shift.name}</Text>
        </View>
      ))}
    </View>
  );
};

// --- SCREEN COMPONENTS ---
const CalendarScreen = () => {
  const { shifts, markedDates, setMarkedDates } = useAppContext(); // Use context
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const assignShift = (shiftKey: keyof typeof shifts) => {
    const newMarkedDates = { ...markedDates };
    const createMarking = (key: keyof typeof shifts): CustomMarking => ({
      customStyles: {
        container: { backgroundColor: shifts[key].color, borderRadius: 8 },
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
            {Object.values(shifts).map(shift => (
              <Pressable
                key={shift.key}
                style={[styles.button, { backgroundColor: shift.color }]}
                onPress={() => assignShift(shift.key as keyof typeof shifts)}
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

const ShiftsScreen = () => {
    const { shifts, setShifts } = useAppContext(); // Use context

    const addAlarmToEarlyShift = () => {
        setShifts(currentShifts => {
            const newShifts = { ...currentShifts };
            const earlyShift = { ...newShifts.early };
            const newAlarm = {
                id: `alarm-${Date.now()}`, // Unique ID
                label: 'Nueva Alarma',
                time: '12:00'
            };
            earlyShift.alarms = [...earlyShift.alarms, newAlarm];
            newShifts.early = earlyShift;
            return newShifts;
        });
    };

    const renderAlarm = ({ item }: { item: Alarm }) => (
        <View style={styles.alarmItem}>
            <Text style={styles.alarmLabel}>{item.label}</Text>
            <Text style={styles.alarmTime}>{item.time}</Text>
        </View>
    );

    const renderShift = ({ item }: { item: Shift }) => (
        <View style={styles.shiftCard}>
            <View style={[styles.shiftCardHeader, { backgroundColor: item.color }]}>
                <Text style={styles.shiftCardTitle}>{item.name}</Text>
            </View>
            <View style={styles.alarmList}>
                <FlatList
                    data={item.alarms}
                    renderItem={renderAlarm}
                    keyExtractor={(alarm) => alarm.id}
                    ListEmptyComponent={<Text style={styles.noAlarmsText}>No hay alarmas para este turno.</Text>}
                />
                {/* This is a temporary button for testing */}
                <TouchableOpacity style={styles.addAlarmButton} onPress={addAlarmToEarlyShift}>
                    <Text style={styles.addAlarmButtonText}>+ Añadir Alarma a Turno Mañana</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gestionar Turnos</Text>
            </View>
            <FlatList
                data={Object.values(shifts)}
                renderItem={renderShift}
                keyExtractor={(shift) => shift.key}
                contentContainerStyle={styles.shiftListContainer}
            />
        </SafeAreaView>
    );
};


// --- APP NAVIGATOR & PROVIDER ---
const Tab = createBottomTabNavigator();

const App = () => {
  const [shifts, setShifts] = useState(INITIAL_SHIFTS);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  return (
    <AppContext.Provider value={{ shifts, setShifts, markedDates, setMarkedDates }}>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: 'white' } }}>
          <Tab.Screen name="Calendario" component={CalendarScreen} />
          <Tab.Screen name="Turnos" component={ShiftsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
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
    shiftListContainer: { padding: 10 },
    shiftCard: { backgroundColor: 'white', borderRadius: 10, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
    shiftCardHeader: { borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: 15 },
    shiftCardTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    alarmList: { paddingHorizontal: 15, paddingBottom: 15 },
    alarmItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    alarmLabel: { fontSize: 16 },
    alarmTime: { fontSize: 16, color: '#333', fontWeight: '500' },
    noAlarmsText: { textAlign: 'center', color: '#999', padding: 10 },
    addAlarmButton: { backgroundColor: '#E8F0F2', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
    addAlarmButtonText: { color: '#4A90E2', fontWeight: 'bold' },
});

export default App;
