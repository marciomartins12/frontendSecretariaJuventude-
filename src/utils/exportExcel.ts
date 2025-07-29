import * as XLSX from 'xlsx';
import { AttendanceStatus } from '@/types';

interface AttendanceReportData {
  employee: {
    id: string;
    name: string;
    position: string;
    registration: string;
    workDays: string[];
  };
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  earlyExit: number;
  partial: number;
  justified: number;
  records: Array<{
    id: string;
    date: string;
    entryTime?: string;
    exitTime?: string;
    status: AttendanceStatus;
    observations?: string;
  }>;
}

const getStatusLabel = (status: AttendanceStatus): string => {
  const labels = {
    [AttendanceStatus.PRESENT]: 'Presente',
    [AttendanceStatus.ABSENT]: 'Faltou'
  };
  return labels[status] || status;
};

export const exportAttendanceToExcel = (
  reportData: AttendanceReportData[], 
  startDate: string, 
  endDate: string
) => {
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // === ABA 1: RESUMO GERAL ===
  const summaryData = reportData.map(item => ({
    'Matrícula': item.employee.registration,
    'Nome': item.employee.name,
    'Cargo': item.employee.position,
    'Dias Escalados': item.employee.workDays.map(day => {
      const dayLabels: { [key: string]: string } = {
        'monday': 'Segunda',
        'tuesday': 'Terça', 
        'wednesday': 'Quarta',
        'thursday': 'Quinta',
        'friday': 'Sexta',
        'saturday': 'Sábado',
        'sunday': 'Domingo'
      };
      return dayLabels[day] || day;
    }).join(', '),
    'Total de Dias': item.totalDays,
    'Presentes': item.present,
    'Faltas': item.absent,
    '% Presença': item.totalDays > 0 ? ((item.present / item.totalDays) * 100).toFixed(1) + '%' : '0%',
    '% Faltas': item.totalDays > 0 ? ((item.absent / item.totalDays) * 100).toFixed(1) + '%' : '0%'
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo Geral');

  // === ABA 2: DETALHAMENTO POR FUNCIONÁRIO ===
  const detailData: any[] = [];
  
  reportData.forEach(item => {
    // Adicionar cabeçalho do funcionário
    detailData.push({
      'Data': `FUNCIONÁRIO: ${item.employee.name}`,
      'Matrícula': item.employee.registration,
      'Entrada': '',
      'Saída': '',
      'Status': '',
      'Observações': ''
    });

    // Adicionar registros do funcionário
    item.records.forEach(record => {
      detailData.push({
        'Data': record.date,
        'Matrícula': item.employee.registration,
        'Entrada': record.entryTime || '-',
        'Saída': record.exitTime || '-',
        'Status': getStatusLabel(record.status),
        'Observações': record.observations || ''
      });
    });

    // Linha em branco para separar funcionários
    detailData.push({
      'Data': '',
      'Matrícula': '',
      'Entrada': '',
      'Saída': '',
      'Status': '',
      'Observações': ''
    });
  });

  const detailSheet = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Detalhamento');

  // === ABA 3: APENAS FALTAS ===
  const absenceData: any[] = [];
  
  reportData.forEach(item => {
    const absenceRecords = item.records.filter(record => 
      record.status === AttendanceStatus.ABSENT
    );

    absenceRecords.forEach(record => {
      absenceData.push({
        'Data': record.date,
        'Matrícula': item.employee.registration,
        'Nome': item.employee.name,
        'Cargo': item.employee.position,
        'Status': getStatusLabel(record.status),
        'Observações': record.observations || ''
      });
    });
  });

  const absenceSheet = XLSX.utils.json_to_sheet(absenceData);
  XLSX.utils.book_append_sheet(wb, absenceSheet, 'Faltas');

  // === ABA 4: ESTATÍSTICAS ===
  const totalEmployees = reportData.length;
  const totalDays = reportData.reduce((sum, item) => sum + item.totalDays, 0);
  const totalAbsences = reportData.reduce((sum, item) => sum + item.absent, 0);
  const totalPresences = reportData.reduce((sum, item) => sum + item.present, 0);

  const statsData = [
    { 'Estatística': 'Total de Funcionários', 'Valor': totalEmployees },
    { 'Estatística': 'Total de Dias Trabalhados', 'Valor': totalDays },
    { 'Estatística': 'Total de Presenças', 'Valor': totalPresences },
    { 'Estatística': 'Total de Faltas', 'Valor': totalAbsences },
    { 'Estatística': '% Geral de Presença', 'Valor': totalDays > 0 ? ((totalPresences / totalDays) * 100).toFixed(1) + '%' : '0%' },
    { 'Estatística': '% Geral de Faltas', 'Valor': totalDays > 0 ? ((totalAbsences / totalDays) * 100).toFixed(1) + '%' : '0%' },
    { 'Estatística': '', 'Valor': '' },
    { 'Estatística': 'Período do Relatório', 'Valor': `${startDate} a ${endDate}` },
    { 'Estatística': 'Data de Geração', 'Valor': new Date().toLocaleDateString('pt-BR') }
  ];

  const statsSheet = XLSX.utils.json_to_sheet(statsData);
  XLSX.utils.book_append_sheet(wb, statsSheet, 'Estatísticas');

  // Gerar e baixar arquivo
  const fileName = `relatorio_frequencia_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportSimpleTimeRecords = (records: any[], startDate: string, endDate: string) => {
  const data = records.map(record => ({
    'Data': record.date,
    'Matrícula': record.employee?.registration || '',
    'Nome': record.employee?.name || '',
    'Cargo': record.employee?.position || '',
    'Entrada': record.entryTime || '-',
    'Saída': record.exitTime || '-',
    'Status': getStatusLabel(record.status || (record.entryTime ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT)),
    'Observações': record.observations || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Registros de Ponto');

  const fileName = `registros_ponto_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
