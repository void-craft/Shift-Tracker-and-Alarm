import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Alert, Switch } from 'react-native'; // Import Switch
import { useAppContext, Shift, Alarm } from '../context/AppContext'; // Ensure Alarm is imported
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Define the structure for a local alarm (still needed for day-specific alarms)
interface LocalAlarm {
  id: string;
  time: string; // e.g., "14:30"
  label: string;
  isEnabled: boolean;
}

const HomeScreen = () => {
  const { shifts, markedDates, updateAlarm } = useAppContext(); // Make sure updateAlarm is available in context
  const [currentTime, setCurrentTime] = useState(new Date());

  // State for day-specific alarms (separate from shift alarms)
  const [localAlarms, setLocalAlarms] = useState<LocalAlarm[]>([]);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to retrieve shift info for a given date
  const getShiftForDate = (dateString: string): Shift | null => {
    const marking = markedDates[dateString];
    if (marking?.customStyles?.container) {
      const color = marking.customStyles.container.backgroundColor;
      // Find shift by color (assuming colors are unique to shifts)
      return Object.values(shifts).find((s: Shift) => s.color === color) || null;
    }
    return null;
  };

  const todayString = format(new Date(), 'yyyy-MM-dd');
  const todaysShift = getShiftForDate(todayString); // Get today's assigned shift

  // Generate upcoming 5 days' schedule
  const upcomingDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1); // Start from tomorrow
    const dateString = format(date, 'yyyy-MM-dd');
    return {
      dateString,
      dayName: format(date, 'eeee', { locale: es }), // Full day name (e.g., "lunes")
      shift: getShiftForDate(dateString),
    };
  });

  // --- Local Alarm Management Functions (for day-specific alarms) ---

  const handleAddAlarm = () => {
    Alert.prompt(
      "Agregar Alarma Personal", // Clarify it's a personal alarm
      "Ingresa la hora (HH:MM) y una descripción opcional.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Guardar",
          onPress: (text: string | undefined) => { // Explicitly type 'text'
            const [timeInput, labelInput] = (text || "").split(';');
            const time = timeInput?.trim();
            const label = (labelInput?.trim() || "Alarma").slice(0, 30);

            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!time || !timeRegex.test(time)) {
              Alert.alert("Error", "Formato de hora inválido. Usa HH:MM (ej. 14:30)");
              return;
            }

            const newAlarm: LocalAlarm = {
              id: Date.now().toString(),
              time: time,
              label: label,
              isEnabled: true,
            };
            setLocalAlarms(prevAlarms => [...prevAlarms, newAlarm].sort((a, b) => a.time.localeCompare(b.time)));
          }
        },
      ],
      "plain-text",
      "14:30;Recordatorio" // Example input
    );
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

      {/* --- Shift Alarms Section (NEW) --- */}
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
                // Use updateAlarm from context to toggle shift alarms
                onValueChange={(newValue) => updateAlarm(todaysShift.key, alarm.id, { enabled: newValue })}
              />
            </View>
          ))}
        </View>
      )}

      {/* --- Local Alarms Section --- */}
      <View style={styles.card}>
        <View style={styles.alarmsHeader}>
          <Text style={styles.cardTitle}>Alarmas Personales</Text> {/* Clarified title */}
          <TouchableOpacity style={styles.addAlarmButton} onPress={handleAddAlarm}>
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
        {upcomingDays.map(day => (
          <View key={day.dateString} style={styles.upcomingRow}>
            <Text style={styles.upcomingDay}>{day.dayName}</Text>
            {day.shift ? (
              <Text style={[styles.upcomingShift, { color: day.shift.color }]}>{day.shift.name}</Text>
            ) : (
              <Text style={styles.upcomingShift}>Libre</Text>
            )}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F0F2', padding: 15 },
  header: { alignItems: 'center', marginBottom: 20 },
  dateText: { fontSize: 18, color: '#666' },
  timeText: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  shiftInfo: { padding: 20, borderRadius: 8, alignItems: 'center' },
  shiftName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  noShiftText: { fontSize: 16, color: '#999', textAlign: 'center' },

  // --- Alarms Specific Styles ---
  alarmsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addAlarmButton: {
    backgroundColor: '#007BFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addAlarmButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22, // Adjust line height to center '+' vertically
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alarmDetails: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  alarmLabel: {
    fontSize: 14,
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
  toggleButton: { // Base style for local alarm toggle button
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 15,
  },
  toggleButtonActive: { // Specific style when local alarm is active
    color: '#4CAF50', // Green
  },
  toggleButtonInactive: { // Specific style when local alarm is inactive
    color: '#FFC107', // Amber
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // --- Upcoming Days Original Styles ---
  upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  upcomingDay: { fontSize: 16, textTransform: 'capitalize', color: '#333' },
  upcomingShift: { fontSize: 16, fontWeight: 'bold' },
});

export default HomeScreen;