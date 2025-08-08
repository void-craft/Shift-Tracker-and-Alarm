import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { useAppContext, Shift, Alarm } from '../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AlarmModal from '../components/AlarmModal'; // Import the new component

interface LocalAlarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

const HomeScreen = () => {
  const { shifts, markedDates, updateAlarm } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [localAlarms, setLocalAlarms] = useState<LocalAlarm[]>([]);
  const [isAddPersonalAlarmModalVisible, setAddPersonalAlarmModalVisible] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<LocalAlarm | undefined>(undefined);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
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
      dayNameShort: format(date, 'EE', { locale: es }),
      dayNumber: format(date, 'dd'),
      monthShort: format(date, 'MMM', { locale: es }).replace('.', '').toUpperCase(),
      shift: getShiftForDate(dateString),
    };
  });

  const handleOpenAddPersonalAlarmModal = (alarm?: LocalAlarm) => {
    setEditingAlarm(alarm);
    setAddPersonalAlarmModalVisible(true);
  };

  const handleSavePersonalAlarm = (label: string, time: string, isEditing: boolean) => {
    if (isEditing && editingAlarm) {
        setLocalAlarms(prevAlarms =>
            prevAlarms.map(alarm =>
                alarm.id === editingAlarm.id ? { ...alarm, label, time } : alarm
            ).sort((a, b) => a.time.localeCompare(b.time))
        );
    } else {
        const newAlarm: LocalAlarm = {
            id: Date.now().toString(),
            time: time,
            label: label,
            enabled: true,
        };
        setLocalAlarms(prevAlarms => [...prevAlarms, newAlarm].sort((a, b) => a.time.localeCompare(b.time)));
    }
    setAddPersonalAlarmModalVisible(false);
    setEditingAlarm(undefined);
  };

  const handleDeleteLocalAlarm = (id: string) => {
    setLocalAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
    setAddPersonalAlarmModalVisible(false);
    setEditingAlarm(undefined);
  };

  const handleToggleLocalAlarm = (id: string) => {
    setLocalAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
      )
    );
  };

  const handleDeleteButtonPress = (id: string) => {
    Alert.alert(
      "Eliminar Alarma Personal",
      "¿Estás seguro de que quieres eliminar esta alarma?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => handleDeleteLocalAlarm(id) },
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

      <View style={styles.card}>
        <View style={styles.alarmsHeader}>
          <Text style={styles.cardTitle}>Alarmas Personales</Text>
          <TouchableOpacity style={styles.addAlarmButton} onPress={() => handleOpenAddPersonalAlarmModal()}>
            <Text style={styles.addAlarmButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {localAlarms.length > 0 ? (
          localAlarms.map(alarm => (
            <TouchableOpacity key={alarm.id} style={styles.alarmRow} onPress={() => handleOpenAddPersonalAlarmModal(alarm)}>
              <View style={styles.alarmDetails}>
                <Text style={[styles.alarmTime, !alarm.enabled && styles.alarmDisabledText]}>
                  {alarm.time}
                </Text>
                <Text style={[styles.alarmLabel, !alarm.enabled && styles.alarmDisabledText]}>
                  {alarm.label}
                </Text>
              </View>
              <View style={styles.alarmActions}>
                <TouchableOpacity onPress={() => handleToggleLocalAlarm(alarm.id)}>
                  <Text style={[styles.toggleButton, alarm.enabled ? styles.toggleButtonActive : styles.toggleButtonInactive]}>
                    {alarm.enabled ? 'Activado' : 'Desactivado'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteButtonPress(alarm.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noShiftText}>No hay alarmas personales configuradas para hoy.</Text>
        )}
      </View>

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

      <AlarmModal
        isVisible={isAddPersonalAlarmModalVisible}
        onClose={() => setAddPersonalAlarmModalVisible(false)}
        onSave={handleSavePersonalAlarm}
        onDelete={() => handleDeleteLocalAlarm(editingAlarm?.id as string)}
        initialAlarm={editingAlarm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFECDA', padding: 15 },
  header: { alignItems: 'center', marginBottom: 20, backgroundColor: '#FFE0B2', borderRadius: 15, paddingVertical: 20, elevation: 5, shadowColor: '#FF9800', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  dateText: { fontSize: 24, color: '#663300', fontWeight: 'bold', marginBottom: 5 },
  timeText: { fontSize: 60, fontWeight: 'bold', color: '#FF5722', textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  card: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 8, shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#424242', textAlign: 'center' },
  shiftInfo: { padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  shiftName: { color: 'white', fontSize: 26, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  noShiftText: { fontSize: 18, color: '#999', textAlign: 'center', fontStyle: 'italic' },
  alarmsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addAlarmButton: { backgroundColor: '#673AB7', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#4527A0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  addAlarmButtonText: { color: 'white', fontSize: 24, fontWeight: 'bold', lineHeight: 28 },
  alarmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  alarmDetails: { flex: 1 },
  alarmTime: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  alarmLabel: { fontSize: 15, color: '#666' },
  alarmDisabledText: { color: '#aaa', textDecorationLine: 'line-through' },
  alarmActions: { flexDirection: 'row', alignItems: 'center' },
  toggleButton: { fontSize: 15, fontWeight: 'bold', marginRight: 15 },
  toggleButtonActive: { color: '#4CAF50' },
  toggleButtonInactive: { color: '#FFC107' },
  deleteButton: { backgroundColor: '#EF5350', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  upcomingDaysScrollContainer: { paddingVertical: 10 },
  upcomingDayCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#A0C4FF', marginHorizontal: 8, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  upcomingDayCircleDayName: { fontSize: 12, fontWeight: 'bold', color: 'white', textTransform: 'uppercase' },
  upcomingDayCircleDayNumber: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: -2, marginBottom: -2 },
  upcomingDayCircleMonth: { fontSize: 10, fontWeight: '600', color: 'white', textTransform: 'uppercase' },
  upcomingDayCircleShiftName: { fontSize: 9, color: 'white', fontWeight: '600', marginTop: 0, textAlign: 'center', paddingHorizontal: 2 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: '90%', backgroundColor: 'white', borderRadius: 25, padding: 30, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#333' },
  input: { width: '100%', height: 55, borderColor: '#ddd', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 18, color: '#333', marginBottom: 20, backgroundColor: '#f9f9f9' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25 },
  modalButton: { borderRadius: 15, paddingVertical: 12, paddingHorizontal: 25, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  buttonClose: { backgroundColor: '#9E9E9E' },
  buttonSave: { backgroundColor: '#4CAF50' },
  buttonDelete: { backgroundColor: '#E74C3C', marginRight: 'auto' },
  buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
  timePickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 10, height: 150 },
  timePickerSeparator: { fontSize: 28, fontWeight: 'bold', color: '#333', marginHorizontal: 5 },
  pickerColumn: { width: 80, height: 150 },
  pickerAmPmColumn: { width: 60, height: 150 },
});

export default HomeScreen;