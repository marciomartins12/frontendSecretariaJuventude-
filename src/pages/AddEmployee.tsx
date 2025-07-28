import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/context/DataContext';
import { WEEK_DAYS } from '@/types';
import { toast } from '@/hooks/use-toast';

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { addEmployee } = useData();
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    registration: '',
    workDays: [] as string[],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkDayChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      workDays: checked 
        ? [...prev.workDays, day]
        : prev.workDays.filter(d => d !== day)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.position.trim() || !formData.registration.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.workDays.length === 0) {
      toast({
        title: "Escala de trabalho",
        description: "Selecione pelo menos um dia da semana para a escala.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addEmployee(formData);
      toast({
        title: "Funcionário cadastrado",
        description: `${formData.name} foi cadastrado com sucesso.`,
      });
      navigate('/employees');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao cadastrar o funcionário.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/employees')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cadastrar Funcionário</h1>
          <p className="text-muted-foreground">
            Adicione um novo funcionário ao sistema de ponto eletrônico.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Dados do Funcionário
            </CardTitle>
            <CardDescription>
              Preencha as informações do novo funcionário e defina sua escala de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite o nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo/Função *</Label>
                  <Input
                    id="position"
                    type="text"
                    placeholder="Ex: Assistente Administrativo, Coordenador..."
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">Matrícula *</Label>
                  <Input
                    id="registration"
                    type="text"
                    placeholder="Digite o número da matrícula"
                    value={formData.registration}
                    onChange={(e) => handleInputChange('registration', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Work Schedule */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Escala de Trabalho *</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione os dias da semana em que o funcionário deve trabalhar.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WEEK_DAYS.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={formData.workDays.includes(day.value)}
                        onCheckedChange={(checked) => 
                          handleWorkDayChange(day.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {formData.workDays.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Dias selecionados:</strong> {formData.workDays.length} 
                      {formData.workDays.length === 1 ? ' dia' : ' dias'} por semana
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Funcionário'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/employees')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddEmployee;