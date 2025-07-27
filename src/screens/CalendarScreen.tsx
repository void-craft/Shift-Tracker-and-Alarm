import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { useAppContext } from '../context/AppContext';

type CustomMarking = MarkedDates[string];

LocaleConfig.locales.es = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

const Legend = () => {
  const { shifts } = useAppContext();
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

const CalendarScreen = () => {
  const { shifts, markedDates, setMarkedDates } = useAppContext();
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

// Add all the styles here
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F0F2' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    calendar: { margin: 10, borderRadius: 10, elevation: 4 },
    legendContainer: { padding: 15, marginHorizontal: 10, backgroundColor: 'white', borderRadius: 10, elevation: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    legendColorBox: { width: 20, height: 20, borderRadius: 4, marginRight: 10 },
    legendText: { fontSize: 16, color: '#333' },
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 35, alignItems: 'center', width: '90%', elevation: 5 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    modalDate: { fontSize: 18, color: '#666', marginBottom: 20 },
    button: { borderRadius: 10, padding: 12, elevation: 2, marginBottom: 10, width: '100%' },
    buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    buttonClose: { backgroundColor: '#aaa' },
    buttonClear: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
    buttonClearText: { color: '#333', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
});

export default CalendarScreen;