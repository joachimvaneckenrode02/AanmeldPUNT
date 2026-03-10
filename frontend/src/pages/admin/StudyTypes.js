import React, { useState, useEffect } from 'react';
import { useStudyTypes } from '../../hooks/useApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { formatDateShort, getStudyTypeColor } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2,
  BookOpen
} from 'lucide-react';

const colorOptions = [
  { value: 'blue', label: 'Blauw' },
  { value: 'green', label: 'Groen' },
  { value: 'red', label: 'Rood' },
  { value: 'purple', label: 'Paars' },
  { value: 'orange', label: 'Oranje' },
  { value: 'teal', label: 'Teal' },
  { value: 'gray', label: 'Grijs' },
];

const defaultFormData = {
  mainType: '',
  subType: '',
  key: '',
  defaultCapacity: 20,
  defaultStartTime: '15:30',
  defaultEndTime: '17:00',
  colorLabel: 'gray',
  isActive: true
};

export default function AdminStudyTypes() {
  const { getStudyTypes, createStudyType, updateStudyType, deleteStudyType, loading } = useStudyTypes();
  
  const [studyTypes, setStudyTypes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    loadStudyTypes();
  }, []);

  const loadStudyTypes = async () => {
    try {
      const data = await getStudyTypes(true);
      setStudyTypes(data);
    } catch (error) {
      console.error('Error loading study types:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const generateKey = (mainType, subType) => {
    const base = mainType.toLowerCase().replace(/\s+/g, '-');
    if (subType) {
      return `${base}-${subType.toLowerCase().replace(/\s+/g, '-')}`;
    }
    return base;
  };

  const handleOpenDialog = (mode, typeData = null) => {
    setDialog({ open: true, mode, data: typeData });
    if (typeData) {
      setFormData({
        mainType: typeData.mainType,
        subType: typeData.subType || '',
        key: typeData.key,
        defaultCapacity: typeData.defaultCapacity,
        defaultStartTime: typeData.defaultStartTime,
        defaultEndTime: typeData.defaultEndTime,
        colorLabel: typeData.colorLabel || 'gray',
        isActive: typeData.isActive
      });
    } else {
      setFormData(defaultFormData);
    }
  };

  const handleMainTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      mainType: value,
      key: generateKey(value, prev.subType)
    }));
  };

  const handleSubTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      subType: value,
      key: generateKey(prev.mainType, value)
    }));
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        subType: formData.subType || null
      };
      
      if (dialog.mode === 'create') {
        await createStudyType(dataToSave);
        toast.success('Studiesoort aangemaakt');
      } else {
        await updateStudyType(dialog.data.id, dataToSave);
        toast.success('Studiesoort bijgewerkt');
      }
      setDialog({ open: false, mode: 'create', data: null });
      loadStudyTypes();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('Weet u zeker dat u deze studiesoort wilt deactiveren?')) return;
    
    try {
      await deleteStudyType(typeId);
      toast.success('Studiesoort gedeactiveerd');
      loadStudyTypes();
    } catch (error) {
      // Error handled by useApi
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-study-types-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Studiesoorten</h1>
          <p className="text-slate-500 mt-1">
            Beheer de verschillende types studie en begeleiding
          </p>
        </div>
        <Button 
          className="bg-[#2E5C5A] hover:bg-[#244A48]"
          onClick={() => handleOpenDialog('create')}
          data-testid="add-study-type-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Studiesoort toevoegen
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Subtype</TableHead>
                <TableHead>Capaciteit</TableHead>
                <TableHead>Tijdstip</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studyTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nog geen studiesoorten. Voeg er een toe om te beginnen.
                  </TableCell>
                </TableRow>
              ) : (
                studyTypes.map((type) => (
                  <TableRow key={type.id} className={!type.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStudyTypeColor(type.colorLabel).split(' ')[0]}`} />
                        <span className="font-medium">{type.mainType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {type.subType || '-'}
                    </TableCell>
                    <TableCell>{type.defaultCapacity} plaatsen</TableCell>
                    <TableCell>
                      {type.defaultStartTime} - {type.defaultEndTime}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${type.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                        {type.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog('edit', type)}
                          data-testid={`edit-type-${type.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {type.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(type.id)}
                            data-testid={`delete-type-${type.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'create' ? 'Nieuwe studiesoort' : 'Studiesoort bewerken'}
            </DialogTitle>
            <DialogDescription>
              {dialog.mode === 'create' 
                ? 'Voeg een nieuwe studiesoort toe'
                : 'Wijzig de gegevens van deze studiesoort'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mainType">Hoofdtype *</Label>
                <Input
                  id="mainType"
                  placeholder="bijv. Inhaalstudie"
                  value={formData.mainType}
                  onChange={(e) => handleMainTypeChange(e.target.value)}
                  data-testid="main-type-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subType">Subtype</Label>
                <Input
                  id="subType"
                  placeholder="bijv. Frans"
                  value={formData.subType}
                  onChange={(e) => handleSubTypeChange(e.target.value)}
                  data-testid="sub-type-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="key">Sleutel</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="unieke-sleutel"
                data-testid="key-input"
              />
              <p className="text-xs text-slate-500">Unieke identificatie, wordt automatisch gegenereerd</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capaciteit</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.defaultCapacity}
                  onChange={(e) => setFormData({ ...formData, defaultCapacity: parseInt(e.target.value) })}
                  data-testid="capacity-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Starttijd</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.defaultStartTime}
                  onChange={(e) => setFormData({ ...formData, defaultStartTime: e.target.value })}
                  data-testid="start-time-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Eindtijd</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.defaultEndTime}
                  onChange={(e) => setFormData({ ...formData, defaultEndTime: e.target.value })}
                  data-testid="end-time-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kleur</Label>
              <Select
                value={formData.colorLabel}
                onValueChange={(value) => setFormData({ ...formData, colorLabel: value })}
              >
                <SelectTrigger data-testid="color-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStudyTypeColor(color.value).split(' ')[0]}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Actief</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.mainType || !formData.key}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              data-testid="save-study-type-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
