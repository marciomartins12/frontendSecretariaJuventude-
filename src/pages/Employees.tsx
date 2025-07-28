import React, { useState } from 'react';
import { Users, Trash2, Edit, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useData } from '@/context/DataContext';
import { Employee, WEEK_DAYS } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Employees: React.FC = () => {
  const { employees, deleteEmployee } = useData();
  const navigate = useNavigate();

  const handleDeleteEmployee = async (employee: Employee) => {
    try {
      await deleteEmployee(employee.id);
      toast({
        title: "Funcionário removido",
        description: `${employee.name} foi removido do sistema.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover funcionário.",
        variant: "destructive",
      });
    }
  };

  const getWorkDaysLabel = (workDays: string[]) => {
    return workDays.map(day => {
      const weekDay = WEEK_DAYS.find(wd => wd.value === day);
      return weekDay ? weekDay.label : day;
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie os funcionários e suas escalas de trabalho.
          </p>
        </div>
        <Button onClick={() => navigate('/add-employee')} className="gap-2">
          <Users className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      {/* Employees List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Funcionários ({employees.length})
          </CardTitle>
          <CardDescription>
            Todos os funcionários cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum funcionário cadastrado ainda.
              </p>
              <Button onClick={() => navigate('/add-employee')}>
                Cadastrar Primeiro Funcionário
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium text-foreground">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {employee.position} • Matrícula: {employee.registration}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Escala: {getWorkDaysLabel(employee.workDays)}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {employee.workDays.length} {employee.workDays.length === 1 ? 'dia' : 'dias'} por semana
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/employees/${employee.id}/edit`)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o funcionário <strong>{employee.name}</strong>?
                            Esta ação não pode ser desfeita e todos os registros de ponto associados 
                            também serão removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEmployee(employee)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;