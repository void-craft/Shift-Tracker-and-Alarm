import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { useAppContext, Shift } from '../context/AppContext';

LocaleConfig.locales.es = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

// --- NEW SELECTION BAR COMPONENT ---
const SelectionBar = ({ shift, onApply, onCancel }: { shift: Shift, onApply: () => void, onCancel: () => void }) => (
    <View style={[styles.selectionBar, { backgroundColor: shift.color }]}>
        <Text style={styles.selectionText}>Asignando: {shift.name}</Text>
        <View style={styles.selectionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
                <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.applyButton]} onPress={onApply}>
                <Text style={styles.actionButtonText}>Aplicar</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const CalendarScreen = () => {
  const { shifts, markedDates, setMarkedDates } = useAppContext();
  
  // State for the new multi-select mode
  const [selectionModeShift, setSelectionModeShift] = useState<Shift | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleDayPress = (day: { dateString: string }) => {
    if (!selectionModeShift) return; // Do nothing if not in selection mode

    const { dateString } = day;
    setSelectedDays(currentSelectedDays => {
      if (currentSelectedDays.includes(dateString)) {
        return currentSelectedDays.filter(d => d !== dateString); // Deselect
      } else {
        return [...currentSelectedDays, dateString]; // Select
      }
    });
  };

  const handleApplySelection = () => {
    if (!selectionModeShift) return;

    const newMarkings: MarkedDates = {};
    selectedDays.forEach(day => {
        newMarkings[day] = {
            customStyles: {
                container: { backgroundColor: selectionModeShift.color, borderRadius: 8 },
                text: { color: 'white', fontWeight: 'bold' },
            },
        };
    });

    setMarkedDates(currentMarked => ({ ...currentMarked, ...newMarkings }));
    handleCancelSelection(); // Reset after applying
  };

  const handleCancelSelection = () => {
    setSelectionModeShift(null);
    setSelectedDays([]);
  };

  // Combine existing markings with temporary selections for display
  const displayedMarkings = { ...markedDates };
  selectedDays.forEach(day => {
    displayedMarkings[day] = {
        customStyles: {
            container: { backgroundColor: selectionModeShift?.color, borderRadius: 8, opacity: 0.7 },
            text: { color: 'white' },
        },
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Calendario</Text>
        <Text style={styles.subtitle}>Toca un turno abajo para empezar a seleccionar días</Text>
      </View>
      <Calendar
        style={styles.calendar}
        onDayPress={handleDayPress}
        markingType={'custom'}
        markedDates={displayedMarkings}
      />
      
      {/* --- LEGEND (Now interactive) --- */}
      <View style={styles.legendContainer}>
        {Object.values(shifts).map(shift => (
          <TouchableOpacity key={shift.key} style={styles.legendItem} onPress={() => setSelectionModeShift(shift)}>
            <View style={[styles.legendColorBox, {backgroundColor: shift.color}]} />
            <Text style={styles.legendText}>{shift.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- Show selection bar only when in selection mode --- */}
      {selectionModeShift && (
        <SelectionBar 
            shift={selectionModeShift} 
            onApply={handleApplySelection} 
            onCancel={handleCancelSelection} 
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F0F2' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { textAlign: 'center', color: '#666', marginTop: 4 },
    calendar: { margin: 10, borderRadius: 10, elevation: 4 },
    legendContainer: { padding: 15, margin: 10, backgroundColor: 'white', borderRadius: 10, elevation: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    legendColorBox: { width: 20, height: 20, borderRadius: 4, marginRight: 10 },
    legendText: { fontSize: 16, color: '#333' },
    // New Styles
    selectionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10 },
    selectionText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    selectionButtons: { flexDirection: 'row' },
    actionButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 10 },
    applyButton: { backgroundColor: 'rgba(255,255,255,0.3)' },
    actionButtonText: { color: 'white', fontWeight: 'bold' },
});

export default CalendarScreen;
