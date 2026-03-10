import React, { useState, useEffect } from 'react';
import { useStudyTypes } from '../../hooks/useApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { getStudyTypeColor } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, Plus, Pencil, Trash2, Eye, EyeOff
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
  mainType: '', subType: '', key: '',
  defaultCapacity: 20, defaultStartTime: '16:00', defaultEndTime: '17:00',
  colorLabel: 'gray', isActive: true
};

export default function AdminStudyTypes() {
  const { getStudyTypes, createStudyType, updateStudyType, deleteStudyType, toggleStudyTypeActive, loading } = useStudyTypes();
  
  const [studyTypes, setStudyTypes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [formData, setFormData] = useState(defaultFormData);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  useEffect(() => { loadStudyTypes(); }, []);

  const loadStudyTypes = async () => {
    try { setStudyTypes(await getStudyTypes(true)); } 
    catch (error) { console.error('Error loading study types:', error); }
    finally { setPageLoading(false); }
  };

  const generateKey = (mainType, subType) => {
    const base = mainType.toLowerCase().replace(/\s+/g, '-');
    return subType ? `${base}-${subType.toLowerCase().replace(/\s+/g, '-')}` : base;
  };

  const handleOpenDialog = (mode, typeData = null) => {
    setDialog({ open: true, mode, data: typeData });
    if (typeData) {
      setFormData({
        mainType: typeData.mainType, subType: typeData.subType || '', key: typeData.key,
        defaultCapacity: typeData.defaultCapacity, defaultStartTime: typeData.defaultStartTime,
        defaultEndTime: typeData.defaultEndTime, colorLabel: typeData.colorLabel || 'gray', isActive: typeData.isActive
      });
    } else {
      setFormData(defaultFormData);
    }
  };

  const handleMainTypeChange = (value) => {
    setFormData(prev => ({ ...prev, mainType: value, key: generateKey(value, prev.subType) }));
  };

  const handleSubTypeChange = (value) => {
    setFormData(prev => ({ ...prev, subType: value, key: generateKey(prev.mainType, value) }));
  };

  const handleSave = async () => {
    try {
      const dataToSave = { ...formData, subType: formData.subType || null };
      if (dialog.mode === 'create') { await createStudyType(dataToSave); toast.success('Studiesoort aangemaakt'); }
      else { await updateStudyType(dialog.data.id, dataToSave); toast.success('Studiesoort bijgewerkt'); }
      setDialog({ open: false, mode: 'create', data: null });
      loadStudyTypes();
    } catch (error) {}
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await deleteStudyType(deleteConfirm.item.id);
      toast.success(`Studiesoort "${deleteConfirm.item.mainType}" definitief verwijderd`);
      setDeleteConfirm({ open: false, item: null });
      loadStudyTypes();
    } catch (error) {}
  };

  const handleToggleActive = async (type) => {
    try {
      await toggleStudyTypeActive(type.id);
      toast.success(type.isActive ? 'Studiesoort gedeactiveerd' : 'Studiesoort geactiveerd');
      loadStudyTypes();
    } catch (error) {}
  };

  if (pageLoading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" /></div>);
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-study-types-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Studiesoorten</h1>
          <p className="text-slate-500 mt-1">Beheer de verschillende types studie en begeleiding</p>
        </div>
        <Button className="bg-[#2E5C5A] hover:bg-[#244A48]" onClick={() => handleOpenDialog('create')} data-testid="add-study-type-btn">
          <Plus className="w-4 h-4 mr-2" />Studiesoort toevoegen
        </Button>
      </div>

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
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studyTypes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Nog geen studiesoorten.</TableCell></TableRow>
              ) : (
                studyTypes.map((type) => (
                  <TableRow key={type.id} className={!type.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStudyTypeColor(type.colorLabel).split(' ')[0]}`} />
                        <span className="font-medium">{type.mainType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{type.subType || '-'}</TableCell>
                    <TableCell>{type.defaultCapacity} plaatsen</TableCell>
                    <TableCell>{type.defaultStartTime} - {type.defaultEndTime}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${type.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                        {type.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog('edit', type)} data-testid={`edit-type-${type.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm"
                          className={type.isActive ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}
                          onClick={() => handleToggleActive(type)}
                          data-testid={`toggle-type-${type.id}`}
                          title={type.isActive ? 'Deactiveren' : 'Activeren'}>
                          {type.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => setDeleteConfirm({ open: true, item: type })} data-testid={`delete-type-${type.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.mode === 'create' ? 'Nieuwe studiesoort' : 'Studiesoort bewerken'}</DialogTitle>
            <DialogDescription>{dialog.mode === 'create' ? 'Voeg een nieuwe studiesoort toe' : 'Wijzig de gegevens van deze studiesoort'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mainType">Hoofdtype *</Label>
                <Input id="mainType" placeholder="bijv. Inhaalstudie" value={formData.mainType}
                  onChange={(e) => handleMainTypeChange(e.target.value)} data-testid="main-type-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subType">Subtype</Label>
                <Input id="subType" placeholder="bijv. Frans" value={formData.subType}
                  onChange={(e) => handleSubTypeChange(e.target.value)} data-testid="sub-type-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Sleutel</Label>
              <Input id="key" value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="unieke-sleutel" data-testid="key-input" />
              <p className="text-xs text-slate-500">Unieke identificatie, wordt automatisch gegenereerd</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capaciteit</Label>
                <Input id="capacity" type="number" min="1" value={formData.defaultCapacity}
                  onChange={(e) => setFormData({ ...formData, defaultCapacity: parseInt(e.target.value) })} data-testid="capacity-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Starttijd</Label>
                <Input id="startTime" type="time" value={formData.defaultStartTime}
                  onChange={(e) => setFormData({ ...formData, defaultStartTime: e.target.value })} data-testid="start-time-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Eindtijd</Label>
                <Input id="endTime" type="time" value={formData.defaultEndTime}
                  onChange={(e) => setFormData({ ...formData, defaultEndTime: e.target.value })} data-testid="end-time-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kleur</Label>
              <Select value={formData.colorLabel} onValueChange={(value) => setFormData({ ...formData, colorLabel: value })}>
                <SelectTrigger data-testid="color-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStudyTypeColor(color.value).split(' ')[0]}`} />{color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Actief</Label>
              <Switch id="isActive" checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>Annuleren</Button>
            <Button onClick={handleSave} disabled={loading || !formData.mainType || !formData.key}
              className="bg-[#2E5C5A] hover:bg-[#244A48]" data-testid="save-study-type-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Studiesoort definitief verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u <strong>"{deleteConfirm.item?.mainType}{deleteConfirm.item?.subType ? ` - ${deleteConfirm.item.subType}` : ''}"</strong> definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700" data-testid="confirm-delete-type">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
