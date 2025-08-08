// src/screens/ShiftsScreen.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Switch, Alert, Modal, Pressable } from 'react-native';
import { useAppContext, Shift, Alarm } from '../context/AppContext';
import AlarmModal from '../components/AlarmModal'; // Import the new component
// @ts-ignore
import Picker from 'react-native-wheel-scroll-picker';

// --- TIME PICKER DATA (Removed from here, as it's now in AlarmModal) ---
const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ampm = ['AM', 'PM'];

const ShiftsScreen = () => {
    const { shifts, addShift, deleteShift, updateAlarm, addAlarm, deleteAlarm } = useAppContext();

    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddShiftModalVisible, setAddShiftModalVisible] = useState(false);
    const [newShiftName, setNewShiftName] = useState('');
    
    // --- REPLACED: Alarm modal state is now simpler ---
    const [isAlarmModalVisible, setAlarmModalVisible] = useState(false);
    const [currentShiftKey, setCurrentShiftKey] = useState<string | null>(null);
    const [currentAlarm, setCurrentAlarm] = useState<Alarm | undefined>(undefined);

    const handleAddShift = () => {
        if (newShiftName.trim()) {
            addShift(newShiftName.trim());
            setNewShiftName('');
            setAddShiftModalVisible(false);
        }
    };

    const handleDeleteShift = (shift: Shift) => {
        Alert.alert("Eliminar Turno", `¿Estás seguro de que quieres eliminar "${shift.name}"?`,
            [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", onPress: () => deleteShift(shift.key), style: "destructive" }]
        );
    };

    // --- REPLACED: openAlarmModal now just sets state to open the modal ---
    const handleOpenAlarmModal = (shiftKey: string, alarm?: Alarm) => {
        setCurrentShiftKey(shiftKey);
        setCurrentAlarm(alarm);
        setAlarmModalVisible(true);
    };

    // --- REPLACED: Save logic is simplified and passed to AlarmModal ---
    const handleSaveAlarm = (label: string, time: string, isEditing: boolean) => {
        if (!currentShiftKey) return;
        if (isEditing && currentAlarm?.id) {
            updateAlarm(currentShiftKey, currentAlarm.id, { label: label, time: time });
        } else {
            addAlarm(currentShiftKey, label, time);
        }
        setAlarmModalVisible(false);
        setCurrentAlarm(undefined);
        setCurrentShiftKey(null);
    };

    // --- REPLACED: Delete logic is simplified and passed to AlarmModal ---
    const handleDeleteAlarm = () => {
      if (currentShiftKey && currentAlarm?.id) {
          deleteAlarm(currentShiftKey, currentAlarm.id);
      }
      setAlarmModalVisible(false);
      setCurrentAlarm(undefined);
      setCurrentShiftKey(null);
    };

    const renderAlarm = ({ item, shiftKey }: { item: Alarm, shiftKey: string }) => (
        <TouchableOpacity
            style={styles.alarmItem}
            onPress={() => isEditMode && handleOpenAlarmModal(shiftKey, item)}
            disabled={!isEditMode}
        >
            <View>
                <Text style={styles.alarmLabel}>{item.label}</Text>
                <Text style={styles.alarmTime}>{item.time}</Text>
            </View>
            <Switch
                value={item.enabled}
                onValueChange={(newValue) => updateAlarm(shiftKey, item.id, { enabled: newValue })}
            />
        </TouchableOpacity>
    );

    const renderShift = ({ item }: { item: Shift }) => (
        <View style={styles.shiftCard}>
            <View style={[styles.shiftCardHeader, { backgroundColor: item.color }]}>
                <Text style={styles.shiftCardTitle}>{item.name}</Text>
                {isEditMode && (
                    <TouchableOpacity onPress={() => handleDeleteShift(item)} style={styles.deleteShiftButton}>
                        <Text style={styles.deleteShiftButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.alarmList}>
                <FlatList
                    data={item.alarms}
                    renderItem={({ item: alarmItem }) => renderAlarm({ item: alarmItem, shiftKey: item.key })}
                    keyExtractor={(alarm) => alarm.id}
                    ListEmptyComponent={<Text style={styles.noAlarmsText}>No hay alarmas para este turno.</Text>}
                />
                {isEditMode && (
                    <TouchableOpacity style={styles.addAlarmButton} onPress={() => handleOpenAlarmModal(item.key)}>
                        <Text style={styles.addAlarmButtonText}>+ Añadir Alarma</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gestionar Turnos</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditMode(!isEditMode)}>
                    <Text style={styles.editButtonText}>{isEditMode ? 'Hecho' : 'Editar'}</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={Object.values(shifts)}
                renderItem={renderShift}
                keyExtractor={(shift) => shift.key}
                contentContainerStyle={styles.shiftListContainer}
                ListFooterComponent={
                    isEditMode ? (
                        <TouchableOpacity style={styles.addShiftButton} onPress={() => setAddShiftModalVisible(true)}>
                            <Text style={styles.addShiftButtonText}>+ Añadir Nuevo Tipo de Turno</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />
            {/* Now using the reusable AlarmModal component */}
            <AlarmModal
              isVisible={isAlarmModalVisible}
              onClose={() => setAlarmModalVisible(false)}
              onSave={handleSaveAlarm}
              onDelete={handleDeleteAlarm}
              initialAlarm={currentAlarm}
            />
            {/* ADD SHIFT MODAL */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isAddShiftModalVisible}
                onRequestClose={() => setAddShiftModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Nuevo Turno</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del turno (ej. Noche)"
                            placeholderTextColor="#999"
                            value={newShiftName}
                            onChangeText={setNewShiftName}
                        />
                        <View style={styles.modalButtonContainer}>
                            <Pressable style={[styles.modalButton, styles.buttonClose]} onPress={() => setAddShiftModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </Pressable>
                            <Pressable style={[styles.modalButton, styles.buttonSave]} onPress={handleAddShift}>
                                <Text style={styles.buttonText}>Guardar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F0F2' },
    header: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    editButton: { backgroundColor: '#4A90E2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    editButtonText: { color: 'white', fontWeight: 'bold' },
    shiftListContainer: { padding: 10 },
    shiftCard: { backgroundColor: 'white', borderRadius: 10, marginBottom: 15, elevation: 3 },
    shiftCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: 15 },
    shiftCardTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    deleteShiftButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
    deleteShiftButtonText: { color: 'white', fontWeight: 'bold' },
    alarmList: { paddingHorizontal: 15, paddingBottom: 15 },
    alarmItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    alarmLabel: { fontSize: 18, color: '#000' },
    alarmTime: { fontSize: 14, color: '#666' },
    addAlarmButton: { backgroundColor: '#E8F0F2', borderRadius: 8, padding: 12, marginTop: 15, alignItems: 'center' },
    addAlarmButtonText: { color: '#4A90E2', fontWeight: 'bold', fontSize: 16 },
    addShiftButton: { backgroundColor: '#2ECC71', borderRadius: 10, padding: 15, margin: 10, alignItems: 'center', elevation: 3 },
    addShiftButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    input: { width: '100%', height: 50, borderColor: 'gray', borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 16 },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 20 },
    modalButton: { borderRadius: 10, padding: 15, elevation: 2, marginLeft: 10 },
    buttonClose: { backgroundColor: '#aaa' },
    buttonSave: { backgroundColor: '#4A90E2' },
    buttonDelete: { backgroundColor: '#E74C3C', marginRight: 'auto' },
    buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    timePickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginVertical: 10 },
    timePickerSeparator: { fontSize: 24, fontWeight: 'bold' },
    noAlarmsText: { textAlign: 'center', color: '#999', padding: 10 },
});

export default ShiftsScreen;