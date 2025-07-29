import React, { useState } from 'react';
import { Clock, Users, CheckCircle, XCircle, Calendar, AlertTriangle, UserX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AttendanceStatus, ShiftType } from '@/types';
import { api } from '@/services/api';

const Dashboard: React.FC = () => {
  const { getScheduledEmployeesToday, getTodayRecords, clockInOut, refreshData } = useData();
  const navigate = useNavigate();
  
  // Estados para modais de confirmação
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    type: '', 
    employeeId: '', 
    employeeName: '', 
    shift: ShiftType.FULL_DAY 
  });
  
  const scheduledEmployees = getScheduledEmployeesToday();
  const todayRecords = getTodayRecords();
  
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Abrir confirmação para registro de ponto
  const openConfirmation = (type: string, employeeId: string, employeeName: string) => {
    setConfirmDialog({
      open: true,
      type,
      employeeId,
      employeeName,
      shift: ShiftType.FULL_DAY
    });
  };

  // Registrar ponto após confirmação
  const handleTimeRecord = async () => {
    try {
      const result = await clockInOut(confirmDialog.employeeId);
      
      if (result.success) {
        toast({
          title: "Registro realizado",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro no registro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no registro",
        description: error.message || "Não foi possível registrar o ponto.",
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  // Marcar falta
  const handleMarkAbsence = async () => {
    try {
      await api.markAbsence(
        confirmDialog.employeeId,
        today,
        AttendanceStatus.ABSENT,
        `Falta ${getShiftLabel(confirmDialog.shift)} - Registrado pelo administrador`,
        confirmDialog.shift
      );

      toast({
        title: "Falta registrada",
        description: `Falta ${getShiftLabel(confirmDialog.shift)} registrada para ${confirmDialog.employeeName}.`,
      });

      // Atualizar dados sem recarregar a página
      await refreshData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar falta.",
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const getShiftLabel = (shift: ShiftType) => {
    const labels = {
      [ShiftType.MORNING]: 'Manhã',
      [ShiftType.AFTERNOON]: 'Tarde',
      [ShiftType.FULL_DAY]: 'Dia Inteiro'
    };
    return labels[shift];
  };

  const getEmployeeStatus = (employeeId: string) => {
    const record = todayRecords.find(r => r.employeeId === employeeId);
    if (!record) return { status: 'not-started', label: 'Não registrado', color: 'secondary' };
    if (record.status === AttendanceStatus.ABSENT) return { status: 'absent', label: 'Faltou', color: 'destructive' };
    if (record.entryTime && !record.exitTime) return { status: 'working', label: 'Trabalhando', color: 'info' };
    if (record.entryTime && record.exitTime) return { status: 'finished', label: 'Finalizado', color: 'success' };
    return { status: 'not-started', label: 'Não registrado', color: 'secondary' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{currentTime}</div>
          <div className="text-sm text-muted-foreground">Hora atual</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escalados Hoje</p>
                <p className="text-2xl font-bold">{scheduledEmployees.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registraram Entrada</p>
                <p className="text-2xl font-bold text-info">
                  {todayRecords.filter(r => r.entryTime).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalizaram</p>
                <p className="text-2xl font-bold text-success">
                  {todayRecords.filter(r => r.entryTime && r.exitTime).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">
                  {scheduledEmployees.length - todayRecords.filter(r => r.entryTime).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funcionários Escalados para Hoje
          </CardTitle>
          <CardDescription>
            Gerencie os registros de ponto dos funcionários escalados para hoje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum funcionário escalado para hoje.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/employees')}
              >
                Gerenciar Escalas
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledEmployees.map((employee) => {
                const record = todayRecords.find(r => r.employeeId === employee.id);
                const status = getEmployeeStatus(employee.id);
                
                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-foreground">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {employee.position} - {employee.registration}
                          </p>
                        </div>
                        <Badge 
                          variant={status.color as any}
                          className="ml-2"
                        >
                          {status.label}
                        </Badge>
                      </div>
                      
                      {record && (
                        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                          {record.entryTime && (
                            <span>Entrada: {record.entryTime}</span>
                          )}
                          {record.exitTime && (
                            <span>Saída: {record.exitTime}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Não mostrar botões se o funcionário levou falta */}
                      {record?.status !== AttendanceStatus.ABSENT && (
                        <>
                          {!record?.entryTime && (
                            <>
                              <Button
                                onClick={() => openConfirmation('entry', employee.id, employee.name)}
                                size="sm"
                                className="gap-2"
                              >
                                <Clock className="h-4 w-4" />
                                Registrar Entrada
                              </Button>
                              <Button
                                onClick={() => openConfirmation('absence', employee.id, employee.name)}
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                              >
                                <UserX className="h-4 w-4" />
                                Marcar Falta
                              </Button>
                            </>
                          )}
                          
                          {record?.entryTime && !record?.exitTime && (
                            <Button
                              onClick={() => openConfirmation('exit', employee.id, employee.name)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Registrar Saída
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({...confirmDialog, open: false})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar Ação
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'entry' && (
                <>Registrar <strong>entrada</strong> para <strong>{confirmDialog.employeeName}</strong>?</>
              )}
              {confirmDialog.type === 'exit' && (
                <>Registrar <strong>saída</strong> para <strong>{confirmDialog.employeeName}</strong>?</>
              )}
              {confirmDialog.type === 'absence' && (
                <>Marcar <strong>falta</strong> para <strong>{confirmDialog.employeeName}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog.type === 'absence' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Turno da Falta</label>
                <Select 
                  value={confirmDialog.shift} 
                  onValueChange={(value: ShiftType) => setConfirmDialog({...confirmDialog, shift: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ShiftType.MORNING}>Manhã</SelectItem>
                    <SelectItem value={ShiftType.AFTERNOON}>Tarde</SelectItem>
                    <SelectItem value={ShiftType.FULL_DAY}>Dia Inteiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog({...confirmDialog, open: false})}
            >
              Cancelar
            </Button>
            {confirmDialog.type === 'absence' ? (
              <Button variant="destructive" onClick={handleMarkAbsence}>
                Marcar Falta
              </Button>
            ) : (
              <Button onClick={handleTimeRecord}>
                {confirmDialog.type === 'entry' ? 'Registrar Entrada' : 'Registrar Saída'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;