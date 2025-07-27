import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { useAppContext, Shift, Alarm } from '../context/AppContext';

const ShiftsScreen = () => {
    const { shifts, addShift, deleteShift, updateAlarm, addAlarm, deleteAlarm: delAlarm } = useAppContext();

    const handleAddShift = () => {
        Alert.prompt(
            "Añadir Nuevo Turno",
            "Introduce el nombre para el nuevo turno:",
            (text) => {
                if (text) addShift(text);
            }
        );
    };

    const handleDeleteShift = (shift: Shift) => {
        Alert.alert(
            "Eliminar Turno",
            `¿Estás seguro de que quieres eliminar "${shift.name}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", onPress: () => deleteShift(shift.key), style: "destructive" }
            ]
        );
    };

    const renderAlarm = ({ item, shiftKey }: { item: Alarm, shiftKey: string }) => (
        <View style={styles.alarmItem}>
            <View>
                <TextInput 
                    style={styles.alarmLabel}
                    value={item.label}
                    onChangeText={(text) => updateAlarm(shiftKey, item.id, { label: text })}
                />
                <TextInput 
                    style={styles.alarmTime}
                    value={item.time}
                    onChangeText={(text) => updateAlarm(shiftKey, item.id, { time: text })}
                />
            </View>
            <View style={styles.alarmControls}>
                <Switch
                    value={item.enabled}
                    onValueChange={(newValue) => updateAlarm(shiftKey, item.id, { enabled: newValue })}
                />
                <TouchableOpacity onPress={() => delAlarm(shiftKey, item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderShift = ({ item }: { item: Shift }) => (
        <View style={styles.shiftCard}>
            <View style={[styles.shiftCardHeader, { backgroundColor: item.color }]}>
                <Text style={styles.shiftCardTitle}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteShift(item)} style={styles.deleteShiftButton}>
                    <Text style={styles.deleteShiftButtonText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.alarmList}>
                <FlatList
                    data={item.alarms}
                    renderItem={({ item: alarmItem }) => renderAlarm({ item: alarmItem, shiftKey: item.key })}
                    keyExtractor={(alarm) => alarm.id}
                    ListEmptyComponent={<Text style={styles.noAlarmsText}>No hay alarmas para este turno.</Text>}
                />
                <TouchableOpacity style={styles.addAlarmButton} onPress={() => addAlarm(item.key)}>
                    <Text style={styles.addAlarmButtonText}>+ Añadir Alarma</Text>
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
                ListFooterComponent={
                    <TouchableOpacity style={styles.addShiftButton} onPress={handleAddShift}>
                        <Text style={styles.addShiftButtonText}>+ Añadir Nuevo Tipo de Turno</Text>
                    </TouchableOpacity>
                }
            />
        </SafeAreaView>
    );
};

// Add all the styles here
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F0F2' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
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
    alarmControls: { flexDirection: 'row', alignItems: 'center' },
    deleteButton: { marginLeft: 15, padding: 5 },
    deleteButtonText: { fontSize: 20, color: 'red', fontWeight: 'bold' },
    noAlarmsText: { textAlign: 'center', color: '#999', padding: 10 },
    addAlarmButton: { backgroundColor: '#E8F0F2', borderRadius: 8, padding: 12, marginTop: 15, alignItems: 'center' },
    addAlarmButtonText: { color: '#4A90E2', fontWeight: 'bold', fontSize: 16 },
    addShiftButton: { backgroundColor: '#2ECC71', borderRadius: 10, padding: 15, margin: 10, alignItems: 'center', elevation: 3 },
    addShiftButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ShiftsScreen;