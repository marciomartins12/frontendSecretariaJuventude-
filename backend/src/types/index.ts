export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  cpf: string;
  pis: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  admissionDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeRecord {
  id: string;
  employeeId: string;
  type: RecordType;
  timestamp: Date;
  location?: string;
  notes?: string;
}

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export enum RecordType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  BREAK_START = 'BREAK_START',
  BREAK_END = 'BREAK_END'
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  role?: Role;
  cpf: string;
  pis: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  employee: Omit<Employee, 'password'>;
}

export interface CreateTimeRecordRequest {
  type: RecordType;
  location?: string;
  notes?: string;
}

export interface JWTPayload {
  employeeId: string;
  email: string;
  role: Role;
}
