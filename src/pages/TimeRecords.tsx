import React, { useState } from 'react';
import { Clock, Filter, Download, Calendar, FileSpreadsheet, Users, Edit3, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useData } from '@/context/DataContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/services/api';
import { exportAttendanceToExcel, exportSimpleTimeRecords } from '@/utils/exportExcel';
import { toast } from '@/hooks/use-toast';
import { AttendanceStatus } from '@/types';

const TimeRecords: React.FC = () => {
  const { employees, timeRecords, refreshData } = useData();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Estado para modal de observações
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [observations, setObservations] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const getStatusLabel = (status: AttendanceStatus) => {
    const labels = {
      [AttendanceStatus.PRESENT]: 'Presente',
      [AttendanceStatus.ABSENT]: 'Faltou'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: AttendanceStatus) => {
    const variants = {
      [AttendanceStatus.PRESENT]: 'default' as const,
      [AttendanceStatus.ABSENT]: 'destructive' as const
    };
    return variants[status] || 'default';
  };

  // Exportar registros simples
  const handleSimpleExport = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "Nenhum registro",
        description: "Não há registros para exportar.",
        variant: "destructive",
      });
      return;
    }

    const start = startDate || new Date(Math.min(...filteredRecords.map(r => new Date(r.date).getTime()))).toISOString().split('T')[0];
    const end = endDate || new Date(Math.max(...filteredRecords.map(r => new Date(r.date).getTime()))).toISOString().split('T')[0];

    exportSimpleTimeRecords(filteredRecords.map(record => ({
      ...record,
      employee: employees.find(emp => emp.id === record.employeeId)
    })), start, end);

    toast({
      title: "Exportação realizada",
      description: "Arquivo Excel baixado com sucesso.",
    });
  };

  // Exportar relatório completo de frequência
  const handleAttendanceReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Datas obrigatórias",
        description: "Selecione as datas de início e fim para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const reportData = await api.getAttendanceReport({
        startDate,
        endDate,
        employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined
      });

      exportAttendanceToExcel(reportData, startDate, endDate);

      toast({
        title: "Relatório gerado",
        description: "Relatório completo de frequência exportado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de frequência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar faltas automaticamente
  const handleGenerateAbsences = async () => {
    if (!endDate) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma data para gerar as faltas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.generateAbsenceRecords(endDate);
      
      toast({
        title: "Faltas detectadas",
        description: "Registros de falta foram criados automaticamente.",
      });

      // Atualizar dados sem recarregar a página
      await refreshData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao detectar faltas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de observações
  const openObservationsDialog = (record: any) => {
    setSelectedRecord(record);
    setObservations(record.observations || '');
    setDialogOpen(true);
  };

  // Salvar observações
  const saveObservations = async () => {
    if (!selectedRecord) return;

    try {
      const status = selectedRecord.entryTime ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
      
      await api.markAbsence(
        selectedRecord.employeeId,
        selectedRecord.date,
        status,
        observations
      );

      toast({
        title: "Observação salva",
        description: "Observação atualizada com sucesso.",
      });

      setDialogOpen(false);
      
      // Atualizar dados sem recarregar a página
      await refreshData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar observação.",
        variant: "destructive",
      });
    }
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
            Visualize registros, gerencie faltas e exporte relatórios completos.
          </p>
        </div>
      </div>

      {/* Filters & Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Data Inicial</label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Período Rápido</label>
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

          {/* Botões de Ação */}
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleSimpleExport} 
                variant="outline" 
                className="gap-2"
                disabled={sortedRecords.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar Registros
              </Button>

              <Button 
                onClick={handleAttendanceReport} 
                className="gap-2"
                disabled={loading || !startDate || !endDate}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {loading ? 'Gerando...' : 'Relatório Completo'}
              </Button>

              <Button 
                onClick={handleGenerateAbsences}
                variant="secondary" 
                className="gap-2"
                disabled={loading || !endDate}
              >
                <Users className="h-4 w-4" />
                Detectar Faltas
              </Button>

              <Button 
                onClick={exportToCSV} 
                variant="ghost" 
                className="gap-2"
                disabled={sortedRecords.length === 0}
              >
                <Download className="h-4 w-4" />
                CSV Simples
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              <strong>Relatório Completo:</strong> Inclui estatísticas, faltas detectadas e análise detalhada por funcionário.
              <br />
              <strong>Detectar Faltas:</strong> Cria registros automáticos para funcionários que deveriam trabalhar mas não bateram ponto.
            </p>
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
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(record.status || AttendanceStatus.PRESENT)}>
                            {getStatusLabel(record.status || AttendanceStatus.PRESENT)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openObservationsDialog(record)}
                            className="h-6 w-6 p-0"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
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
                      
                      {record.observations && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Observações:</strong> {record.observations}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Observações */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  Funcionário: {getEmployeeName(selectedRecord.employeeId)}
                  <br />
                  Data: {selectedRecord.date}
                  <br />
                  Status: {getStatusLabel(selectedRecord.entryTime ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Digite observações sobre este registro (ex: atestado médico, licença, etc.)"
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveObservations}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeRecords;