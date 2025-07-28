import React, { useState } from 'react';
import { Clock, Filter, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/context/DataContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TimeRecords: React.FC = () => {
  const { employees, timeRecords } = useData();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filtrar registros
  const filteredRecords = timeRecords.filter(record => {
    const employeeMatch = selectedEmployee === 'all' || record.employeeId === selectedEmployee;
    
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const recordDate = new Date(record.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          dateMatch = recordDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateMatch = recordDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateMatch = recordDate >= monthAgo;
          break;
      }
    }
    
    return employeeMatch && dateMatch;
  });

  // Ordenar por data mais recente
  const sortedRecords = filteredRecords.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Funcionário não encontrado';
  };

  const getEmployeeInfo = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee || null;
  };

  const calculateWorkHours = (entryTime?: string, exitTime?: string) => {
    if (!entryTime || !exitTime) return null;
    
    const [entryHour, entryMinute] = entryTime.split(':').map(Number);
    const [exitHour, exitMinute] = exitTime.split(':').map(Number);
    
    const entryInMinutes = entryHour * 60 + entryMinute;
    const exitInMinutes = exitHour * 60 + exitMinute;
    
    const diffInMinutes = exitInMinutes - entryInMinutes;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Funcionário', 'Matrícula', 'Cargo', 'Entrada', 'Saída', 'Horas Trabalhadas'];
    const csvData = sortedRecords.map(record => {
      const employee = getEmployeeInfo(record.employeeId);
      const workHours = calculateWorkHours(record.entryTime, record.exitTime);
      
      return [
        format(parseISO(record.date), 'dd/MM/yyyy'),
        employee?.name || 'N/A',
        employee?.registration || 'N/A',
        employee?.position || 'N/A',
        record.entryTime || 'N/A',
        record.exitTime || 'N/A',
        workHours || 'Incompleto'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_ponto_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registros de Ponto</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie o histórico de registros de ponto.
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2" disabled={sortedRecords.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionário</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os registros</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registros ({sortedRecords.length})
          </CardTitle>
          <CardDescription>
            Histórico de registros de entrada e saída dos funcionários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRecords.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum registro encontrado para os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRecords.map((record) => {
                const employee = getEmployeeInfo(record.employeeId);
                const workHours = calculateWorkHours(record.entryTime, record.exitTime);
                const isComplete = record.entryTime && record.exitTime;
                
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {employee?.name || 'Funcionário não encontrado'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {employee?.position} • {employee?.registration}
                          </p>
                        </div>
                        <Badge variant={isComplete ? 'success' : 'warning'}>
                          {isComplete ? 'Completo' : 'Incompleto'}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        {record.entryTime && (
                          <span>Entrada: {record.entryTime}</span>
                        )}
                        {record.exitTime && (
                          <span>Saída: {record.exitTime}</span>
                        )}
                        {workHours && (
                          <span className="font-medium text-foreground">
                            Total: {workHours}
                          </span>
                        )}
                      </div>
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

export default TimeRecords;