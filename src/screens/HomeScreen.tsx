import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Alert, Switch, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { useAppContext, Shift, Alarm } from '../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// @ts-ignore - This suppresses the TypeScript error for the library not having type declarations
import Picker from 'react-native-wheel-scroll-picker';

// --- TIME PICKER DATA for HomeScreen ---
const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0')); // "12", "01", "02", ..., "11" for 12-hour format
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // "00", "01", ..., "59"
const ampm = ['AM', 'PM'];

interface LocalAlarm {
  id: string;
  time: string; // e.g., "HH:MM AM/PM"
  label: string;
  isEnabled: boolean;
}

const HomeScreen = () => {
  const { shifts, markedDates, updateAlarm } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [localAlarms, setLocalAlarms] = useState<LocalAlarm[]>([]);

  // Ref to store the minute when an alarm last triggered, to prevent multiple alerts within the same minute.
  const lastTriggeredMinuteRef = useRef<Map<string, string>>(new Map());

  // State for the custom personal alarm modal
  const [isAddPersonalAlarmModalVisible, setAddPersonalAlarmModalVisible] = useState(false);
  const [newPersonalAlarmLabel, setNewPersonalAlarmLabel] = useState('');

  // States for the wheel pickers
  const [selectedHour, setSelectedHour] = useState(0); // Index for '12' (AM/PM determined by selectedAmPm)
  const [selectedMinute, setSelectedMinute] = useState(0); // Index for '00'
  const [selectedAmPm, setSelectedAmPm] = useState(0); // Index for 'AM'


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effect to check and trigger local alarms
  useEffect(() => {
    const currentFormattedTime = format(currentTime, 'hh:mm a', { locale: es }).toUpperCase();

    localAlarms.forEach(alarm => {
      if (
        alarm.isEnabled &&
        alarm.time === currentFormattedTime &&
        lastTriggeredMinuteRef.current.get(alarm.id) !== currentFormattedTime
      ) {
        Alert.alert(
          "¡Alarma!",
          `Es hora de tu alarma: ${alarm.label || 'Sin etiqueta'}`,
          [{ text: "OK" }]
        );
        lastTriggeredMinuteRef.current.set(alarm.id, currentFormattedTime);
      }
    });
  }, [currentTime, localAlarms]);

  const getShiftForDate = (dateString: string): Shift | null => {
    const marking = markedDates[dateString];
    if (marking?.customStyles?.container) {
      const color = marking.customStyles.container.backgroundColor;
      return Object.values(shifts).find((s: Shift) => s.color === color) || null;
    }
    return null;
  };

  const todayString = format(new Date(), 'yyyy-MM-dd');
  const todaysShift = getShiftForDate(todayString);

  const upcomingDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const dateString = format(date, 'yyyy-MM-dd');
    return {
      dateString,
      dayNameShort: format(date, 'EE', { locale: es }), // Short day name (e.g., "lun")
      dayNumber: format(date, 'dd'), // Day of the month (e.g., "01")
      monthShort: format(date, 'MMM', { locale: es }).replace('.', '').toUpperCase(), // Short month name (e.g., "jul"), remove dot, uppercase
      shift: getShiftForDate(dateString),
    };
  });

  const handleOpenAddPersonalAlarmModal = () => {
    setNewPersonalAlarmLabel(''); // Clear label input

    // Initialize picker to current time
    const now = new Date();
    let currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let initialHourIndex;
    let initialAmPmIndex = 0; // 0 for AM, 1 for PM

    if (currentHour === 0) { // 12 AM
      initialHourIndex = 0; // Index for "12"
      initialAmPmIndex = 0; // AM
    } else if (currentHour === 12) { // 12 PM
      initialHourIndex = 0; // Index for "12"
      initialAmPmIndex = 1; // PM
    } else if (currentHour > 12) { // PM hours (13-23)
      initialHourIndex = currentHour - 1; // 13 (1PM) is index 0, ..., 23 (11PM) is index 10
      initialAmPmIndex = 1; // PM
    } else { // AM hours (1-11)
      initialHourIndex = currentHour - 1; // 1 (1AM) is index 0, ..., 11 (11AM) is index 10
      initialAmPmIndex = 0; // AM
    }

    setSelectedHour(initialHourIndex);
    setSelectedMinute(currentMinute);
    setSelectedAmPm(initialAmPmIndex);

    setAddPersonalAlarmModalVisible(true);
  };

  const handleSavePersonalAlarm = () => {
    const label = (newPersonalAlarmLabel.trim() || "Alarma").slice(0, 30);

    // Get the selected hour (1-12) and minute (0-59) as strings
    const hourValue = hours[selectedHour];
    const minuteValue = minutes[selectedMinute];
    const ampmValue = ampm[selectedAmPm];

    const finalTime = `${hourValue}:${minuteValue} ${ampmValue}`;

    // Basic validation (can be enhanced)
    if (!finalTime.trim()) {
      Alert.alert("Error", "Por favor, selecciona una hora para la alarma.");
      return;
    }

    const newAlarm: LocalAlarm = {
      id: Date.now().toString(),
      time: finalTime, // Store in "HH:MM AM/PM" format
      label: label,
      isEnabled: true,
    };
    setLocalAlarms(prevAlarms => [...prevAlarms, newAlarm].sort((a, b) => {
      // Sort by time (e.g., "07:30 AM" < "08:00 AM")
      return a.time.localeCompare(b.time);
    }));
    setAddPersonalAlarmModalVisible(false); // Close modal
  };

  const handleToggleLocalAlarm = (id: string) => {
    setLocalAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === id ? { ...alarm, isEnabled: !alarm.isEnabled } : alarm
      )
    );
  };

  const handleDeleteLocalAlarm = (id: string) => {
    Alert.alert(
      "Eliminar Alarma Personal",
      "¿Estás seguro de que quieres eliminar esta alarma?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setLocalAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
            lastTriggeredMinuteRef.current.delete(id);
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{format(currentTime, 'EEEE, d MMMM yyyy', { locale: es })}</Text>
        <Text style={styles.timeText}>{format(currentTime, 'p', { locale: es })}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Turno de Hoy</Text>
        {todaysShift ? (
          <View style={[styles.shiftInfo, { backgroundColor: todaysShift.color }]}>
            <Text style={styles.shiftName}>{todaysShift.name}</Text>
          </View>
        ) : (
          <Text style={styles.noShiftText}>No hay turno asignado para hoy.</Text>
        )}
      </View>

      {/* --- Shift Alarms Section --- */}
      {todaysShift && todaysShift.alarms && todaysShift.alarms.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alarmas del Turno ({todaysShift.name})</Text>
          {todaysShift.alarms.map((alarm: Alarm) => (
            <View key={alarm.id} style={styles.alarmRow}>
              <View style={styles.alarmDetails}>
                <Text style={[styles.alarmTime, !alarm.enabled && styles.alarmDisabledText]}>
                  {alarm.time}
                </Text>
                <Text style={[styles.alarmLabel, !alarm.enabled && styles.alarmDisabledText]}>
                  {alarm.label}
                </Text>
              </View>
              <Switch
                value={alarm.enabled}
                onValueChange={(newValue) => updateAlarm(todaysShift.key, alarm.id, { enabled: newValue })}
              />
            </View>
          ))}
        </View>
      )}

      {/* --- Local Alarms Section --- */}
      <View style={styles.card}>
        <View style={styles.alarmsHeader}>
          <Text style={styles.cardTitle}>Alarmas Personales</Text>
          <TouchableOpacity style={styles.addAlarmButton} onPress={handleOpenAddPersonalAlarmModal}>
            <Text style={styles.addAlarmButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {localAlarms.length > 0 ? (
          localAlarms.map(alarm => (
            <View key={alarm.id} style={styles.alarmRow}>
              <View style={styles.alarmDetails}>
                <Text style={[styles.alarmTime, !alarm.isEnabled && styles.alarmDisabledText]}>
                  {alarm.time}
                </Text>
                <Text style={[styles.alarmLabel, !alarm.isEnabled && styles.alarmDisabledText]}>
                  {alarm.label}
                </Text>
              </View>
              <View style={styles.alarmActions}>
                <TouchableOpacity onPress={() => handleToggleLocalAlarm(alarm.id)}>
                  <Text style={[styles.toggleButton, alarm.isEnabled ? styles.toggleButtonActive : styles.toggleButtonInactive]}>
                    {alarm.isEnabled ? 'Activado' : 'Desactivado'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLocalAlarm(alarm.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noShiftText}>No hay alarmas personales configuradas para hoy.</Text>
        )}
      </View>

      {/* --- Upcoming Days Section --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Próximos 5 Días</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingDaysScrollContainer}>
          {upcomingDays.map((day, _index) => (
            <View key={day.dateString} style={[styles.upcomingDayCircle, { backgroundColor: day.shift?.color || '#A0C4FF' }]}>
              <Text style={styles.upcomingDayCircleDayName}>{day.dayNameShort}</Text>
              <Text style={styles.upcomingDayCircleDayNumber}>{day.dayNumber}</Text>
              <Text style={styles.upcomingDayCircleMonth}>{day.monthShort}</Text>
              {day.shift && <Text style={styles.upcomingDayCircleShiftName}>{day.shift.name}</Text>}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* --- ADD PERSONAL ALARM CUSTOM MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAddPersonalAlarmModalVisible}
        onRequestClose={() => setAddPersonalAlarmModalVisible(false)}
      >
        <Pressable style={styles.centeredView} onPress={() => setAddPersonalAlarmModalVisible(false)}>
          <View style={styles.modalView} onStartShouldSetResponder={(_event) => true}>
            <Text style={styles.modalTitle}>Añadir Alarma Personal</Text>

            <TextInput
              style={styles.input}
              placeholder="Etiqueta (ej. Despertar)"
              placeholderTextColor="#999"
              value={newPersonalAlarmLabel}
              onChangeText={setNewPersonalAlarmLabel}
            />

            <View style={styles.timePickerContainer}>
              <Picker
                dataSource={hours}
                selectedIndex={selectedHour}
                onValueChange={(data: string, index: number) => setSelectedHour(index)}
                wrapperHeight={150}
                itemHeight={50}
                highlightColor="#d8d8d8"
                style={styles.pickerColumn}
              />
              <Text style={styles.timePickerSeparator}>:</Text>
              <Picker
                dataSource={minutes}
                selectedIndex={selectedMinute}
                onValueChange={(data: string, index: number) => setSelectedMinute(index)}
                wrapperHeight={150}
                itemHeight={50}
                highlightColor="#d8d8d8"
                style={styles.pickerColumn}
              />
              <Picker
                dataSource={ampm}
                selectedIndex={selectedAmPm}
                onValueChange={(data: string, index: number) => setSelectedAmPm(index)}
                wrapperHeight={150}
                itemHeight={50}
                highlightColor="#d8d8d8"
                style={styles.pickerAmPmColumn}
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <Pressable style={[styles.modalButton, styles.buttonClose]} onPress={() => setAddPersonalAlarmModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.buttonSave]} onPress={handleSavePersonalAlarm}>
                <Text style={styles.buttonText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFECDA', // Warm, fun background
    padding: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFE0B2', // Lighter orange/peach
    borderRadius: 15,
    paddingVertical: 20,
    elevation: 5,
    shadowColor: '#FF9800', // Orange shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dateText: {
    fontSize: 24, // Bigger
    color: '#663300', // Darker brown for contrast
    fontWeight: 'bold',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 60, // Much Bigger
    fontWeight: 'bold',
    color: '#FF5722', // Vibrant orange-red
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15, // More rounded corners
    padding: 20,
    marginBottom: 20,
    elevation: 8, // More prominent shadow
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 22, // Slightly bigger title
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#424242', // Darker gray for titles
    textAlign: 'center',
  },
  shiftInfo: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80, // Ensure a good height for the shift display
  },
  shiftName: {
    color: 'white',
    fontSize: 26, // Larger shift name
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noShiftText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  alarmsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addAlarmButton: {
    backgroundColor: '#673AB7', // Deep Purple
    width: 40, // Larger button
    height: 40,
    borderRadius: 20, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4527A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addAlarmButtonText: {
    color: 'white',
    fontSize: 24, // Larger plus sign
    fontWeight: 'bold',
    lineHeight: 28,
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5', // Lighter separator
  },
  alarmDetails: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 20, // Slightly larger
    fontWeight: 'bold',
    color: '#333',
  },
  alarmLabel: {
    fontSize: 15,
    color: '#666',
  },
  alarmDisabledText: {
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 15,
  },
  toggleButtonActive: {
    color: '#4CAF50', // Green
  },
  toggleButtonInactive: {
    color: '#FFC107', // Amber
  },
  deleteButton: {
    backgroundColor: '#EF5350', // Red, slightly softer
    width: 28, // Slightly larger
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  upcomingDaysScrollContainer: {
    paddingVertical: 10,
    // alignItems: 'center' removed as it can interfere with horizontal scroll content width.
    // Content should just flow horizontally.
  },
  upcomingDayCircle: {
    width: 80, // Diameter of the circle
    height: 80,
    borderRadius: 40, // Half of width/height for a perfect circle
    backgroundColor: '#A0C4FF', // Light blue default for upcoming days
    marginHorizontal: 8, // Spacing between circles
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)', // Subtle white border
  },
  upcomingDayCircleDayName: {
    fontSize: 12, // Slightly smaller to fit
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  upcomingDayCircleDayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: -2, // Adjust vertical spacing
    marginBottom: -2,
  },
  upcomingDayCircleMonth: { // New style for month
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  upcomingDayCircleShiftName: {
    fontSize: 9, // Even smaller for shift name
    color: 'white',
    fontWeight: '600',
    marginTop: 0,
    textAlign: 'center', // Ensure it wraps well if long
    paddingHorizontal: 2, // Prevent text from touching edges
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 25, // More rounded
    padding: 30, // More padding
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 24, // Bigger title
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 55, // Taller input
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12, // More rounded
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#333',
    marginBottom: 20, // More space
    backgroundColor: '#f9f9f9',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute buttons evenly
    width: '100%',
    marginTop: 25,
  },
  modalButton: {
    borderRadius: 15, // More rounded buttons
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonClose: {
    backgroundColor: '#9E9E9E', // Grey
  },
  buttonSave: {
    backgroundColor: '#4CAF50', // Green for save
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center pickers
    width: '100%',
    marginVertical: 10,
    height: 150, // Fixed height for the container to hold pickers
  },
  timePickerSeparator: {
    fontSize: 28, // Bigger separator
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 5,
  },
  pickerColumn: { // Style for hour and minute pickers
    width: 80,
    height: 150, // Explicitly set height
  },
  pickerAmPmColumn: { // Style for AM/PM picker
    width: 60,
    height: 150, // Explicitly set height
  },
});

export default HomeScreen;