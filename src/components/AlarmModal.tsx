// src/components/AlarmModal.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Modal, Pressable, Alert } from 'react-native';
// @ts-ignore
import Picker from 'react-native-wheel-scroll-picker';
import { Shift, Alarm } from '../context/AppContext';

// --- TIME PICKER DATA ---
const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ampm = ['AM', 'PM'];

interface AlarmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (label: string, time: string, isEditing: boolean) => void;
  onDelete?: () => void;
  initialAlarm?: Alarm;
}

const AlarmModal: React.FC<AlarmModalProps> = ({
  isVisible,
  onClose,
  onSave,
  onDelete,
  initialAlarm,
}) => {
  const [label, setLabel] = useState(initialAlarm?.label || '');
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState(0);

  useEffect(() => {
    if (isVisible && initialAlarm?.time) {
      const [timePart, periodPart] = initialAlarm.time.split(' ');
      const [hourStr, minuteStr] = timePart.split(':');

      let hourNum = parseInt(hourStr, 10);
      const minuteNum = parseInt(minuteStr, 10);
      const ampmIndex = periodPart === 'PM' ? 1 : 0;

      if (hourNum === 12) {
        hourNum = 0;
      } else {
        hourNum = hourNum - 1;
      }

      setLabel(initialAlarm.label);
      setSelectedHour(hourNum);
      setSelectedMinute(minuteNum);
      setSelectedAmPm(ampmIndex);
    } else if (isVisible) {
      const now = new Date();
      let currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      let initialHourIndex;
      let initialAmPmIndex = 0;
      
      if (currentHour === 0) {
        initialHourIndex = 0;
        initialAmPmIndex = 0;
      } else if (currentHour === 12) {
        initialHourIndex = 0;
        initialAmPmIndex = 1;
      } else if (currentHour > 12) {
        initialHourIndex = currentHour - 1;
        initialAmPmIndex = 1;
      } else {
        initialHourIndex = currentHour - 1;
        initialAmPmIndex = 0;
      }
      setLabel('');
      setSelectedHour(initialHourIndex);
      setSelectedMinute(currentMinute);
      setSelectedAmPm(initialAmPmIndex);
    }
  }, [isVisible, initialAlarm]);

  const handleSave = () => {
    const finalLabel = label.trim() || 'Nueva Alarma';
    const hourValue = hours[selectedHour];
    const minuteValue = minutes[selectedMinute];
    const ampmValue = ampm[selectedAmPm];
    const finalTime = `${hourValue}:${minuteValue} ${ampmValue}`;
    onSave(finalLabel, finalTime, !!initialAlarm?.id);
  };

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert("Eliminar Alarma", "¿Estás seguro de que quieres eliminar esta alarma?",
        [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", onPress: onDelete, style: "destructive" }]
      );
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.centeredView} onPress={onClose}>
        <View style={styles.modalView} onStartShouldSetResponder={(_event) => true}>
          <Text style={styles.modalTitle}>{initialAlarm?.id ? 'Editar Alarma' : 'Añadir Alarma'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Etiqueta (ej. Despertar)"
            placeholderTextColor="#999"
            value={label}
            onChangeText={setLabel}
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
            {initialAlarm?.id && (
              <Pressable style={[styles.modalButton, styles.buttonDelete]} onPress={handleDelete}>
                <Text style={styles.buttonText}>Eliminar</Text>
              </Pressable>
            )}
            <Pressable style={[styles.modalButton, styles.buttonClose]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.modalButton, styles.buttonSave]} onPress={handleSave}>
              <Text style={styles.buttonText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: '90%', backgroundColor: 'white', borderRadius: 25, padding: 30, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#333' },
  input: { width: '100%', height: 55, borderColor: '#ddd', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 18, color: '#333', marginBottom: 20, backgroundColor: '#f9f9f9' },
  timePickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 10, height: 150 },
  pickerColumn: { width: 80, height: 150 },
  timePickerSeparator: { fontSize: 28, fontWeight: 'bold', color: '#333', marginHorizontal: 5 },
  pickerAmPmColumn: { width: 60, height: 150 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25 },
  modalButton: { borderRadius: 15, paddingVertical: 12, paddingHorizontal: 25, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  buttonClose: { backgroundColor: '#9E9E9E' },
  buttonSave: { backgroundColor: '#4CAF50' },
  buttonDelete: { backgroundColor: '#E74C3C', marginRight: 'auto' },
  buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
});

export default AlarmModal;