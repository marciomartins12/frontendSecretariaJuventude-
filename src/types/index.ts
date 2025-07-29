export interface Employee {
  id: string;
  name: string;
  position: string;
  registration: string;
  workDays: string[]; // ['monday', 'tuesday', etc.] ou datas específicas
  createdAt: Date;
}

export interface TimeRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  entryTime?: string; // HH:MM
  exitTime?: string; // HH:MM
  status: AttendanceStatus;
  shift: ShiftType;
  observations?: string;
  createdAt: Date;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT'
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON', 
  FULL_DAY = 'FULL_DAY'
}

export interface AuthState {
  isAuthenticated: boolean;
  user: { username: string } | null;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];