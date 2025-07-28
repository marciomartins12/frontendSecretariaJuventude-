import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, TimeRecord } from '@/types';
import { api } from '@/services/api';

interface DataContextType {
  employees: Employee[];
  timeRecords: TimeRecord[];
  loading: boolean;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addTimeRecord: (record: Omit<TimeRecord, 'id' | 'createdAt'>) => Promise<boolean>;
  clockInOut: (employeeId: string) => Promise<{success: boolean, message: string, action?: 'entry' | 'exit'}>;
  getEmployeeRecords: (employeeId: string) => TimeRecord[];
  getTodayRecords: () => (TimeRecord & { employee: Employee })[];
  getScheduledEmployeesToday: () => Employee[];
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [employeesData, recordsData] = await Promise.all([
        api.getEmployees(),
        api.getTimeRecords()
      ]);
      
      setEmployees(employeesData);
      setTimeRecords(recordsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    try {
      const newEmployee = await api.createEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const updatedEmployee = await api.updateEmployee(id, employeeData);
      setEmployees(prev =>
        prev.map(emp => (emp.id === id ? updatedEmployee : emp))
      );
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await api.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setTimeRecords(prev => prev.filter(record => record.employeeId !== id));
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      throw error;
    }
  };

  const addTimeRecord = async (recordData: Omit<TimeRecord, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newRecord = await api.createTimeRecord(recordData);
      
      // Atualizar lista local - verificar se já existe
      const existingIndex = timeRecords.findIndex(
        record => record.employeeId === recordData.employeeId && record.date === recordData.date
      );
      
      if (existingIndex >= 0) {
        // Atualizar registro existente
        setTimeRecords(prev =>
          prev.map((record, index) =>
            index === existingIndex ? newRecord : record
          )
        );
      } else {
        // Adicionar novo registro
        setTimeRecords(prev => [...prev, newRecord]);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      return false;
    }
  };

  const clockInOut = async (employeeId: string): Promise<{success: boolean, message: string, action?: 'entry' | 'exit'}> => {
    try {
      const response = await api.clockInOut(employeeId);
      
      // Atualizar lista local
      const existingIndex = timeRecords.findIndex(
        record => record.employeeId === employeeId && record.date === response.record.date
      );
      
      if (existingIndex >= 0) {
        setTimeRecords(prev =>
          prev.map((record, index) =>
            index === existingIndex ? response.record : record
          )
        );
      } else {
        setTimeRecords(prev => [...prev, response.record]);
      }
      
      return {
        success: true,
        message: response.message,
        action: response.action
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao registrar ponto'
      };
    }
  };

  const getEmployeeRecords = (employeeId: string): TimeRecord[] => {
    return timeRecords.filter(record => record.employeeId === employeeId);
  };

  const getTodayRecords = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeRecords
      .filter(record => record.date === today)
      .map(record => {
        const employee = employees.find(emp => emp.id === record.employeeId)!;
        return { ...record, employee };
      });
  };

  const getScheduledEmployeesToday = (): Employee[] => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Mapear nome do dia em inglês para o formato usado no sistema
    const dayMapping: { [key: string]: string } = {
      'sunday': 'sunday',
      'monday': 'monday', 
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday'
    };
    
    const dayOfWeek = dayMapping[dayName] || dayName;
    
    return employees.filter(employee => employee.workDays.includes(dayOfWeek));
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        timeRecords,
        loading,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTimeRecord,
        clockInOut,
        getEmployeeRecords,
        getTodayRecords,
        getScheduledEmployeesToday,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};