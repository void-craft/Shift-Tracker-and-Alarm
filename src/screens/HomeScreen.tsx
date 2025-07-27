import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HomeScreen = () => {
  const { shifts, markedDates } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getShiftForDate = (dateString: string) => {
    const marking = markedDates[dateString];
    if (marking?.customStyles?.container) {
      const color = marking.customStyles.container.backgroundColor;
      return Object.values(shifts).find(s => s.color === color) || null;
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
      dayName: format(date, 'eeee', { locale: es }),
      shift: getShiftForDate(dateString),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{format(currentTime, 'EEEE, d MMMM yyyy', { locale: es })}</Text>
        <Text style={styles.timeText}>{format(currentTime, 'p')}</Text>
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
    card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 20, elevation: 3 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    shiftInfo: { padding: 20, borderRadius: 8, alignItems: 'center' },
    shiftName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    noShiftText: { fontSize: 16, color: '#999', textAlign: 'center' },
    upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    upcomingDay: { fontSize: 16, textTransform: 'capitalize' },
    upcomingShift: { fontSize: 16, fontWeight: 'bold' },
});

export default HomeScreen;
