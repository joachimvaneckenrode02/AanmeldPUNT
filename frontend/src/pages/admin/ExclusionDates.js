import React, { useState, useEffect } from 'react';
import { useExclusionDates, useStudyTypes } from '../../hooks/useApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
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
import { formatDateShort, formatDate, getStudyTypeColor } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, Plus, Pencil, Trash2, CalendarX
} from 'lucide-react';

export default function AdminExclusionDates() {
  const { getDates, createDate, updateDate, deleteDate, loading } = useExclusionDates();
  const { getStudyTypes } = useStudyTypes();
  
  const [dates, setDates] = useState([]);
  const [studyTypes, setStudyTypes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [formData, setFormData] = useState({ date: '', reason: '', excludedStudyTypeIds: [] });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [datesData, typesData] = await Promise.all([getDates(true), getStudyTypes()]);
      setDates(datesData);
      setStudyTypes(typesData);
    } catch (error) { console.error('Error loading data:', error); }
    finally { setPageLoading(false); }
  };

  const handleOpenDialog = (mode, dateData = null) => {
    setDialog({ open: true, mode, data: dateData });
    if (dateData) {
      setFormData({
        date: dateData.date,
        reason: dateData.reason,
        excludedStudyTypeIds: dateData.excludedStudyTypeIds || []
      });
    } else {
      setFormData({ date: '', reason: '', excludedStudyTypeIds: [] });
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        excludedStudyTypeIds: formData.excludedStudyTypeIds.length > 0 ? formData.excludedStudyTypeIds : null
      };
      if (dialog.mode === 'create') {
        await createDate(dataToSave);
        toast.success('Uitsluitingsdatum toegevoegd');
      } else {
        await updateDate(dialog.data.id, dataToSave);
        toast.success('Uitsluitingsdatum bijgewerkt');
      }
      setDialog({ open: false, mode: 'create', data: null });
      setFormData({ date: '', reason: '', excludedStudyTypeIds: [] });
      loadData();
    } catch (error) {}
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await deleteDate(deleteConfirm.item.id);
      toast.success('Datum verwijderd');
      setDeleteConfirm({ open: false, item: null });
      loadData();
    } catch (error) {}
  };

  const toggleStudyType = (typeId) => {
    setFormData(prev => {
      const ids = prev.excludedStudyTypeIds || [];
      if (ids.includes(typeId)) {
        return { ...prev, excludedStudyTypeIds: ids.filter(id => id !== typeId) };
      }
      return { ...prev, excludedStudyTypeIds: [...ids, typeId] };
    });
  };

  const getExcludedLabel = (date) => {
    const ids = date.excludedStudyTypeIds;
    if (!ids || ids.length === 0) return 'Alle studies';
    return ids.map(id => {
      const type = studyTypes.find(t => t.id === id);
      if (!type) return 'Onbekend';
      return type.mainType + (type.subType ? ` - ${type.subType}` : '');
    }).join(', ');
  };

  if (pageLoading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" /></div>);
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-exclusions-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Uitsluitingsdata</h1>
          <p className="text-slate-500 mt-1">Beheer dagen waarop geen studies plaatsvinden (vakanties, feestdagen, etc.)</p>
        </div>
        <Button className="bg-[#2E5C5A] hover:bg-[#244A48]" onClick={() => handleOpenDialog('create')} data-testid="add-exclusion-btn">
          <Plus className="w-4 h-4 mr-2" />Datum toevoegen
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <CalendarX className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Specifieke uitsluiting</p>
            <p className="text-sm text-amber-700">
              U kunt per datum specifieke studietypes uitsluiten. Laat het leeg om alle studies op die datum uit te sluiten.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Reden</TableHead>
                <TableHead>Uitgesloten studies</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Nog geen uitsluitingsdata.</TableCell></TableRow>
              ) : (
                dates.map((date) => (
                  <TableRow key={date.id} className={!date.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarX className="w-4 h-4 text-rose-500" />
                        <div>
                          <span className="font-medium">{formatDateShort(date.date)}</span>
                          <span className="text-slate-400 ml-2 text-sm">{formatDate(date.date).split(',')[0]}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{date.reason}</TableCell>
                    <TableCell>
                      {(!date.excludedStudyTypeIds || date.excludedStudyTypeIds.length === 0) ? (
                        <span className="status-badge status-badge-error">Alle studies</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {date.excludedStudyTypeIds.map(id => {
                            const type = studyTypes.find(t => t.id === id);
                            if (!type) return null;
                            return (
                              <span key={id} className={`text-xs px-2 py-0.5 rounded-full ${getStudyTypeColor(type.colorLabel)}`}>
                                {type.mainType}{type.subType ? ` - ${type.subType}` : ''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog('edit', date)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => setDeleteConfirm({ open: true, item: date })} data-testid={`delete-exclusion-${date.id}`}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.mode === 'create' ? 'Uitsluitingsdatum toevoegen' : 'Uitsluitingsdatum bewerken'}</DialogTitle>
            <DialogDescription>
              {dialog.mode === 'create' 
                ? 'Voeg een datum toe waarop geen studies mogen plaatsvinden'
                : 'Wijzig de gegevens van deze uitsluitingsdatum'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input id="date" type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} data-testid="exclusion-date-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reden *</Label>
              <Input id="reason" placeholder="bijv. Kerstvakantie, Paasmaandag, Pedagogische studiedag"
                value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} data-testid="exclusion-reason-input" />
            </div>
            <div className="space-y-3">
              <Label>Specifieke studies uitsluiten (optioneel)</Label>
              <p className="text-xs text-slate-500">Laat leeg om alle studies uit te sluiten. Selecteer specifieke studies om enkel die uit te sluiten.</p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {studyTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={(formData.excludedStudyTypeIds || []).includes(type.id)}
                      onCheckedChange={() => toggleStudyType(type.id)}
                      data-testid={`exclude-type-${type.id}`}
                    />
                    <label htmlFor={`type-${type.id}`} className="flex items-center gap-2 text-sm cursor-pointer">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStudyTypeColor(type.colorLabel).split(' ')[0]}`} />
                      {type.mainType}{type.subType ? ` - ${type.subType}` : ''}
                    </label>
                  </div>
                ))}
              </div>
              {(formData.excludedStudyTypeIds || []).length > 0 && (
                <p className="text-xs text-amber-600">
                  {formData.excludedStudyTypeIds.length} studie(s) geselecteerd - enkel deze worden uitgesloten
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>Annuleren</Button>
            <Button onClick={handleSave} disabled={loading || !formData.date || !formData.reason}
              className="bg-[#2E5C5A] hover:bg-[#244A48]" data-testid="save-exclusion-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uitsluitingsdatum verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u de uitsluiting voor <strong>{deleteConfirm.item ? formatDateShort(deleteConfirm.item.date) : ''}</strong> wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
