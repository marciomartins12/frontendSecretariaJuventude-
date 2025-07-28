import React from 'react';
import { Clock, Users, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { getScheduledEmployeesToday, getTodayRecords, clockInOut } = useData();
  const navigate = useNavigate();
  
  const scheduledEmployees = getScheduledEmployeesToday();
  const todayRecords = getTodayRecords();
  
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const handleTimeRecord = async (employeeId: string) => {
    try {
      const result = await clockInOut(employeeId);
      
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
    }
  };

  const getEmployeeStatus = (employeeId: string) => {
    const record = todayRecords.find(r => r.employeeId === employeeId);
    if (!record) return { status: 'not-started', label: 'Não registrado', color: 'secondary' };
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
                      {!record?.entryTime && (
                        <Button
                          onClick={() => handleTimeRecord(employee.id)}
                          size="sm"
                          className="gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Registrar Entrada
                        </Button>
                      )}
                      
                      {record?.entryTime && !record?.exitTime && (
                        <Button
                          onClick={() => handleTimeRecord(employee.id)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Registrar Saída
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;