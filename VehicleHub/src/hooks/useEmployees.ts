import { useCallback } from 'react';
import { Employee } from '../types';
import { useStorage } from './useStorage';
import { generateId } from '../utils/calculations';

const STORAGE_KEY = '@vehiclehub_employees';

export function useEmployees() {
  const { data: employees, loading, saveData } = useStorage<Employee[]>(STORAGE_KEY, []);

  const addEmployee = useCallback(
    async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
      const emp: Employee = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveData([...employees, emp]);
      return emp;
    },
    [employees, saveData]
  );

  const updateEmployee = useCallback(
    async (id: string, updates: Partial<Employee>) => {
      await saveData(
        employees.map(e =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        )
      );
    },
    [employees, saveData]
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      await saveData(employees.filter(e => e.id !== id));
    },
    [employees, saveData]
  );

  const getEmployee = useCallback(
    (id: string) => employees.find(e => e.id === id),
    [employees]
  );

  const assignVehicle = useCallback(
    async (employeeId: string, vehicleId: string) => {
      await saveData(
        employees.map(e =>
          e.id === employeeId && !e.assignedVehicleIds.includes(vehicleId)
            ? { ...e, assignedVehicleIds: [...e.assignedVehicleIds, vehicleId], updatedAt: new Date().toISOString() }
            : e
        )
      );
    },
    [employees, saveData]
  );

  const unassignVehicle = useCallback(
    async (employeeId: string, vehicleId: string) => {
      await saveData(
        employees.map(e =>
          e.id === employeeId
            ? { ...e, assignedVehicleIds: e.assignedVehicleIds.filter(v => v !== vehicleId), updatedAt: new Date().toISOString() }
            : e
        )
      );
    },
    [employees, saveData]
  );

  return { employees, loading, addEmployee, updateEmployee, deleteEmployee, getEmployee, assignVehicle, unassignVehicle };
}
