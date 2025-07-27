import React, { useState, useContext, createContext, ReactNode } from 'react';
import { MarkedDates } from 'react-native-calendars/src/types';

// --- TYPE DEFINITIONS ---
export type Alarm = { id: string; label: string; time: string; enabled: boolean };
export type Shift = { key: string; color: string; name: string; alarms: Alarm[] };
export type Shifts = Record<string, Shift>;

// --- INITIAL DATA ---
const INITIAL_SHIFTS: Shifts = {
  early: { 
    key: 'early', color: '#FF9A3C', name: 'Turno Mañana',
    alarms: [{ id: '1', label: 'Despertar', time: '05:30', enabled: true }]
  },
  late: { 
    key: 'late', color: '#4A90E2', name: 'Turno Tarde',
    alarms: [{ id: '4', label: 'Comer', time: '13:00', enabled: true }]
  },
  weekOff: { key: 'weekOff', color: '#2ECC71', name: 'Día Libre', alarms: [] },
};

// --- CONTEXT DEFINITION ---
interface AppContextType {
  shifts: Shifts;
  addShift: (name: string) => void;
  deleteShift: (shiftKey: string) => void;
  updateAlarm: (shiftKey: string, alarmId: string, updatedAlarm: Partial<Alarm>) => void;
  addAlarm: (shiftKey: string, label: string, time: string) => void; // <-- UPDATED
  deleteAlarm: (shiftKey: string, alarmId: string) => void;
  markedDates: MarkedDates;
  setMarkedDates: React.Dispatch<React.SetStateAction<MarkedDates>>;
}

const AppContext = createContext<AppContextType | null>(null);

// --- PROVIDER COMPONENT ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [shifts, setShifts] = useState<Shifts>(INITIAL_SHIFTS);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const addShift = (name: string) => {
    const newShiftKey = `shift-${Date.now()}`;
    const newShift: Shift = {
      key: newShiftKey,
      name: name,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`, // Random color
      alarms: [],
    };
    setShifts(currentShifts => ({ ...currentShifts, [newShiftKey]: newShift }));
  };

  const deleteShift = (shiftKey: string) => {
    setShifts(currentShifts => {
      const newShifts = { ...currentShifts };
      delete newShifts[shiftKey];
      return newShifts;
    });
  };

  const updateAlarm = (shiftKey: string, alarmId: string, updatedAlarm: Partial<Alarm>) => {
    setShifts(currentShifts => {
        const newShifts = { ...currentShifts };
        const shiftToUpdate = { ...newShifts[shiftKey] };
        shiftToUpdate.alarms = shiftToUpdate.alarms.map(alarm => 
            alarm.id === alarmId ? { ...alarm, ...updatedAlarm } : alarm
        );
        newShifts[shiftKey] = shiftToUpdate;
        return newShifts;
    });
  };

  // --- THIS FUNCTION IS NOW FIXED ---
  const addAlarm = (shiftKey: string, label: string, time: string) => {
      setShifts(currentShifts => {
          const newShifts = { ...currentShifts };
          const shiftToUpdate = { ...newShifts[shiftKey] };
          const newAlarm: Alarm = {
              id: `alarm-${Date.now()}`,
              label: label, // Use passed label
              time: time,   // Use passed time
              enabled: true,
          };
          shiftToUpdate.alarms = [...shiftToUpdate.alarms, newAlarm];
          newShifts[shiftKey] = shiftToUpdate;
          return newShifts;
      });
  };

  const deleteAlarm = (shiftKey: string, alarmId: string) => {
      setShifts(currentShifts => {
          const newShifts = { ...currentShifts };
          const shiftToUpdate = { ...newShifts[shiftKey] };
          shiftToUpdate.alarms = shiftToUpdate.alarms.filter(alarm => alarm.id !== alarmId);
          newShifts[shiftKey] = shiftToUpdate;
          return newShifts;
      });
  };

  const value = {
    shifts, addShift, deleteShift,
    updateAlarm, addAlarm, deleteAlarm,
    markedDates, setMarkedDates,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
