import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { useAppContext, Shift } from '../context/AppContext'; // Ensure this path is correct

LocaleConfig.locales.es = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

// --- Selection Bar Component ---
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

// --- Shift Selection Modal Component ---
interface ShiftSelectionModalProps {
  isVisible: boolean;
  shifts: { [key: string]: Shift };
  onSelectShift: (shift: Shift) => void;
  onClose: () => void;
}

const ShiftSelectionModal = ({ isVisible, shifts, onSelectShift, onClose }: ShiftSelectionModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.centeredView} onPress={onClose}>
        <View style={styles.modalView} onStartShouldSetResponder={() => true}> {/* Prevents modal closing when tapping inside */}
          <Text style={styles.modalTitle}>Selecciona un Turno</Text>
          {Object.values(shifts).map(shift => (
            <TouchableOpacity
              key={shift.key}
              style={[styles.shiftOption, { backgroundColor: shift.color }]}
              onPress={() => onSelectShift(shift)}
            >
              <Text style={styles.shiftOptionText}>{shift.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};


const CalendarScreen = () => {
  const { shifts, markedDates, setMarkedDates } = useAppContext();

  // State for the new multi-select mode
  const [selectionModeShift, setSelectionModeShift] = useState<Shift | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  // State to control the visibility of the shift selection modal
  const [showShiftSelectionModal, setShowShiftSelectionModal] = useState(false);

  // New state to manage the assignment flow step
  // 'idle': No assignment in progress
  // 'selectingShift': User is choosing a shift from the modal
  // 'selectingDays': User is selecting days on the calendar
  const [assignmentStep, setAssignmentStep] = useState<'idle' | 'selectingShift' | 'selectingDays'>('idle');

  const handleDayPress = (day: { dateString: string }) => {
    if (assignmentStep !== 'selectingDays' || !selectionModeShift) return; // Only allow day selection in 'selectingDays' step

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
    setAssignmentStep('idle'); // Reset step to idle
  };

  // Function to initiate shift assignment process
  const handleAssignShifts = () => {
    setAssignmentStep('selectingShift'); // Move to selecting shift step
    setShowShiftSelectionModal(true); // Open the shift selection modal
  };

  // Function called when a shift is selected from the modal
  const handleSelectShiftFromModal = (shift: Shift) => {
    setSelectionModeShift(shift); // Set the selected shift for assignment
    setSelectedDays([]); // Clear any previous day selections
    setShowShiftSelectionModal(false); // Close the modal
    setAssignmentStep('selectingDays'); // Move to selecting days step
  };

  // Determine the subtitle text based on the assignment step
  const getSubtitleText = () => {
    switch (assignmentStep) {
      case 'idle':
        return 'Toca "Asignar Turnos" para empezar';
      case 'selectingShift':
        return 'Selecciona un turno para asignar';
      case 'selectingDays':
        return `Selecciona los días para asignar "${selectionModeShift?.name}"`;
      default:
        return '';
    }
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
        <Text style={styles.subtitle}>{getSubtitleText()}</Text>
        {assignmentStep === 'idle' && ( // Only show assign button when idle
          <TouchableOpacity style={styles.assignButton} onPress={handleAssignShifts}>
            <Text style={styles.assignButtonText}>Asignar Turnos</Text>
          </TouchableOpacity>
        )}
      </View>

      <Calendar
        style={styles.calendar}
        onDayPress={handleDayPress}
        markingType={'custom'}
        markedDates={displayedMarkings}
        // Disable calendar interaction if not in 'selectingDays' step
        // This is a stylistic choice; you can remove it if you want calendar always interactive.
        // If disabled, onDayPress won't fire unless assignmentStep is 'selectingDays'
        disabledByDefault={assignmentStep !== 'selectingDays'}
        enableSwipeMonths={assignmentStep === 'idle'} // Allow month swipe only when idle
      />

      {/* --- LEGEND (Non-interactive, purely informative) --- */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Leyenda de Turnos:</Text>
        {Object.values(shifts).map(shift => (
          <View key={shift.key} style={styles.legendItem}>
            <View style={[styles.legendColorBox, {backgroundColor: shift.color}]} />
            <Text style={styles.legendText}>{shift.name}</Text>
          </View>
        ))}
      </View>

      {/* --- Show selection bar only when in 'selectingDays' step --- */}
      {assignmentStep === 'selectingDays' && selectionModeShift && (
        <SelectionBar
          shift={selectionModeShift}
          onApply={handleApplySelection}
          onCancel={handleCancelSelection}
        />
      )}

      {/* --- Shift Selection Modal --- */}
      <ShiftSelectionModal
        isVisible={assignmentStep === 'selectingShift'}
        shifts={shifts}
        onSelectShift={handleSelectShiftFromModal}
        onClose={() => handleCancelSelection()} // Close modal and reset if user cancels from modal
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F0F2' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#666', marginTop: 4, marginBottom: 15 },
  // New Assign Button Styles
  assignButton: {
    backgroundColor: '#007BFF', // A nice blue color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendar: { margin: 10, borderRadius: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, },
  legendContainer: { padding: 15, margin: 10, backgroundColor: 'white', borderRadius: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, },
  legendTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendColorBox: { width: 20, height: 20, borderRadius: 4, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  legendText: { fontSize: 16, color: '#333' },
  // Selection Bar Styles
  selectionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 4, },
  selectionText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  selectionButtons: { flexDirection: 'row' },
  actionButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  applyButton: { backgroundColor: 'rgba(255,255,255,0.3)' },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // Make modal a bit narrower
    maxWidth: 400, // Max width for larger screens
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  shiftOption: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  shiftOptionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#6c757d', // Grey color for close button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;
