import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { LoginRequest, AuthResponse, Role } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email and password are required' 
      });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee || !employee.isActive) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid credentials or inactive account' 
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, employee.password);
    if (!isPasswordValid) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid credentials' 
      });
      return;
    }

    const token = generateToken({
      employeeId: employee.id,
      email: employee.email,
      role: employee.role as Role,
    });

    const { password: _, ...employeeWithoutPassword } = employee;

    const response: AuthResponse = {
      token,
      employee: employeeWithoutPassword,
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to login' 
    });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: req.user.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
        pis: true,
        phone: true,
        address: true,
        department: true,
        position: true,
        admissionDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee || !employee.isActive) {
      res.status(404).json({ 
        error: 'Not Found', 
        message: 'Employee not found or inactive' 
      });
      return;
    }

    res.json(employee);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to get profile' 
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Current password and new password are required' 
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ 
        error: 'Bad Request', 
        message: 'New password must be at least 6 characters long' 
      });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: req.user.employeeId },
    });

    if (!employee) {
      res.status(404).json({ 
        error: 'Not Found', 
        message: 'Employee not found' 
      });
      return;
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Current password is incorrect' 
      });
      return;
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.employee.update({
      where: { id: req.user.employeeId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to change password' 
    });
  }
};
