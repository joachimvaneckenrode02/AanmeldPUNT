import React, { useState, useEffect } from 'react';
import { useStudyTypes, useAvailabilityRules, useStudyMoments, useExclusionDates } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
import { formatDateShort, getWeekdayName, getStudyTypeColor } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2,
  Calendar,
  CalendarDays,
  Wand2
} from 'lucide-react';

const weekdays = [
  { value: 0, label: 'Maandag' },
  { value: 1, label: 'Dinsdag' },
  { value: 2, label: 'Woensdag' },
  { value: 3, label: 'Donderdag' },
  { value: 4, label: 'Vrijdag' },
];

const defaultRuleForm = {
  studyTypeId: '',
  weekday: 0,
  validFrom: '',
  validUntil: '',
  startTime: '15:30',
  endTime: '17:00',
  defaultCapacity: 20,
  isActive: true,
  notes: ''
};

const defaultMomentForm = {
  date: '',
  studyTypeId: '',
  startTime: '15:30',
  endTime: '17:00',
  capacity: 20,
  isActive: true,
  notes: ''
};

export default function AdminAvailability() {
  const { getStudyTypes } = useStudyTypes();
  const { getRules, createRule, updateRule, deleteRule, loading: rulesLoading } = useAvailabilityRules();
  const { getMoments, createMoment, updateMoment, deleteMoment, generateMoments, loading: momentsLoading } = useStudyMoments();
  
  const [studyTypes, setStudyTypes] = useState([]);
  const [rules, setRules] = useState([]);
  const [moments, setMoments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [ruleDialog, setRuleDialog] = useState({ open: false, mode: 'create', data: null });
  const [momentDialog, setMomentDialog] = useState({ open: false, mode: 'create', data: null });
  const [generateDialog, setGenerateDialog] = useState({ open: false });
  
  const [ruleForm, setRuleForm] = useState(defaultRuleForm);
  const [momentForm, setMomentForm] = useState(defaultMomentForm);
  const [generateForm, setGenerateForm] = useState({ startDate: '', endDate: '', studyTypeIds: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [typesData, rulesData, momentsData] = await Promise.all([
        getStudyTypes(true),
        getRules(true),
        getMoments({ includeInactive: true })
      ]);
      setStudyTypes(typesData);
      setRules(rulesData);
      setMoments(momentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setPageLoading(false);
    }
  };

  // Rule handlers
  const handleOpenRuleDialog = (mode, ruleData = null) => {
    setRuleDialog({ open: true, mode, data: ruleData });
    if (ruleData) {
      setRuleForm({
        studyTypeId: ruleData.studyTypeId,
        weekday: ruleData.weekday,
        validFrom: ruleData.validFrom,
        validUntil: ruleData.validUntil,
        startTime: ruleData.startTime,
        endTime: ruleData.endTime,
        defaultCapacity: ruleData.defaultCapacity,
        isActive: ruleData.isActive,
        notes: ruleData.notes || ''
      });
    } else {
      setRuleForm(defaultRuleForm);
    }
  };

  const handleSaveRule = async () => {
    try {
      if (ruleDialog.mode === 'create') {
        await createRule(ruleForm);
        toast.success('Beschikbaarheidsregel aangemaakt');
      } else {
        await updateRule(ruleDialog.data.id, ruleForm);
        toast.success('Beschikbaarheidsregel bijgewerkt');
      }
      setRuleDialog({ open: false, mode: 'create', data: null });
      loadData();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Weet u zeker dat u deze regel wilt verwijderen?')) return;
    try {
      await deleteRule(ruleId);
      toast.success('Regel verwijderd');
      loadData();
    } catch (error) {}
  };

  // Moment handlers
  const handleOpenMomentDialog = (mode, momentData = null) => {
    setMomentDialog({ open: true, mode, data: momentData });
    if (momentData) {
      setMomentForm({
        date: momentData.date,
        studyTypeId: momentData.studyTypeId,
        startTime: momentData.startTime,
        endTime: momentData.endTime,
        capacity: momentData.capacity,
        isActive: momentData.isActive,
        notes: momentData.notes || ''
      });
    } else {
      setMomentForm(defaultMomentForm);
    }
  };

  const handleSaveMoment = async () => {
    try {
      const studyType = studyTypes.find(t => t.id === momentForm.studyTypeId);
      const date = new Date(momentForm.date);
      const labelFull = studyType?.mainType + (studyType?.subType ? ` - ${studyType.subType}` : '');
      
      const dataToSave = {
        ...momentForm,
        weekday: date.getDay() === 0 ? 6 : date.getDay() - 1,
        labelFull
      };
      
      if (momentDialog.mode === 'create') {
        await createMoment(dataToSave);
        toast.success('Studiemoment aangemaakt');
      } else {
        await updateMoment(momentDialog.data.id, dataToSave);
        toast.success('Studiemoment bijgewerkt');
      }
      setMomentDialog({ open: false, mode: 'create', data: null });
      loadData();
    } catch (error) {}
  };

  const handleDeleteMoment = async (momentId) => {
    if (!window.confirm('Weet u zeker dat u dit moment wilt verwijderen?')) return;
    try {
      await deleteMoment(momentId);
      toast.success('Moment verwijderd');
      loadData();
    } catch (error) {}
  };

  // Generate handler
  const handleGenerate = async () => {
    try {
      const result = await generateMoments(generateForm);
      toast.success(`${result.created} momenten aangemaakt, ${result.skipped} overgeslagen`);
      setGenerateDialog({ open: false });
      loadData();
    } catch (error) {}
  };

  const getStudyTypeName = (id) => {
    const type = studyTypes.find(t => t.id === id);
    if (!type) return 'Onbekend';
    return type.mainType + (type.subType ? ` - ${type.subType}` : '');
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-availability-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Beschikbaarheid</h1>
          <p className="text-slate-500 mt-1">
            Beheer beschikbaarheidsregels en studiemomenten
          </p>
        </div>
        <Button 
          className="bg-[#D66D4F] hover:bg-[#c55f43]"
          onClick={() => setGenerateDialog({ open: true })}
          data-testid="generate-moments-btn"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Momenten genereren
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Terugkerende regels
          </TabsTrigger>
          <TabsTrigger value="moments" className="gap-2">
            <Calendar className="w-4 h-4" />
            Concrete momenten
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              onClick={() => handleOpenRuleDialog('create')}
              data-testid="add-rule-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Regel toevoegen
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Studiesoort</TableHead>
                    <TableHead>Weekdag</TableHead>
                    <TableHead>Geldig</TableHead>
                    <TableHead>Tijdstip</TableHead>
                    <TableHead>Capaciteit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Nog geen regels. Voeg er een toe om te beginnen.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule.id} className={!rule.isActive ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          {getStudyTypeName(rule.studyTypeId)}
                        </TableCell>
                        <TableCell>{getWeekdayName(rule.weekday)}</TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDateShort(rule.validFrom)} - {formatDateShort(rule.validUntil)}
                        </TableCell>
                        <TableCell>{rule.startTime} - {rule.endTime}</TableCell>
                        <TableCell>{rule.defaultCapacity}</TableCell>
                        <TableCell>
                          <span className={`status-badge ${rule.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                            {rule.isActive ? 'Actief' : 'Inactief'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenRuleDialog('edit', rule)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
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
        </TabsContent>

        {/* Moments Tab */}
        <TabsContent value="moments" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              onClick={() => handleOpenMomentDialog('create')}
              data-testid="add-moment-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Moment toevoegen
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Studiesoort</TableHead>
                    <TableHead>Tijdstip</TableHead>
                    <TableHead>Bezetting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nog geen momenten. Genereer ze of voeg manueel toe.
                      </TableCell>
                    </TableRow>
                  ) : (
                    moments.slice(0, 50).map((moment) => (
                      <TableRow key={moment.id} className={!moment.isActive ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          {formatDateShort(moment.date)}
                          <span className="text-slate-400 ml-2 text-xs">
                            {getWeekdayName(moment.weekday)}
                          </span>
                        </TableCell>
                        <TableCell>{moment.labelFull}</TableCell>
                        <TableCell>{moment.startTime} - {moment.endTime}</TableCell>
                        <TableCell>
                          <span className={moment.currentRegistrations >= moment.capacity ? 'text-rose-600 font-medium' : ''}>
                            {moment.currentRegistrations || 0} / {moment.capacity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`status-badge ${moment.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                            {moment.isActive ? 'Actief' : 'Inactief'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenMomentDialog('edit', moment)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDeleteMoment(moment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {moments.length > 50 && (
                <div className="p-4 text-center text-sm text-slate-500">
                  Toont eerste 50 van {moments.length} momenten
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={ruleDialog.open} onOpenChange={(open) => setRuleDialog({ ...ruleDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {ruleDialog.mode === 'create' ? 'Nieuwe regel' : 'Regel bewerken'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Studiesoort *</Label>
              <Select
                value={ruleForm.studyTypeId}
                onValueChange={(value) => setRuleForm({ ...ruleForm, studyTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer" />
                </SelectTrigger>
                <SelectContent>
                  {studyTypes.filter(t => t.isActive).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.mainType}{type.subType && ` - ${type.subType}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Weekdag *</Label>
              <Select
                value={String(ruleForm.weekday)}
                onValueChange={(value) => setRuleForm({ ...ruleForm, weekday: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekdays.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Geldig van *</Label>
                <Input
                  type="date"
                  value={ruleForm.validFrom}
                  onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Geldig tot *</Label>
                <Input
                  type="date"
                  value={ruleForm.validUntil}
                  onChange={(e) => setRuleForm({ ...ruleForm, validUntil: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Starttijd</Label>
                <Input
                  type="time"
                  value={ruleForm.startTime}
                  onChange={(e) => setRuleForm({ ...ruleForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Eindtijd</Label>
                <Input
                  type="time"
                  value={ruleForm.endTime}
                  onChange={(e) => setRuleForm({ ...ruleForm, endTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capaciteit</Label>
                <Input
                  type="number"
                  min="1"
                  value={ruleForm.defaultCapacity}
                  onChange={(e) => setRuleForm({ ...ruleForm, defaultCapacity: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Actief</Label>
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialog({ ...ruleDialog, open: false })}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSaveRule}
              disabled={rulesLoading || !ruleForm.studyTypeId || !ruleForm.validFrom || !ruleForm.validUntil}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
            >
              {rulesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moment Dialog */}
      <Dialog open={momentDialog.open} onOpenChange={(open) => setMomentDialog({ ...momentDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {momentDialog.mode === 'create' ? 'Nieuw moment' : 'Moment bewerken'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Datum *</Label>
              <Input
                type="date"
                value={momentForm.date}
                onChange={(e) => setMomentForm({ ...momentForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Studiesoort *</Label>
              <Select
                value={momentForm.studyTypeId}
                onValueChange={(value) => setMomentForm({ ...momentForm, studyTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer" />
                </SelectTrigger>
                <SelectContent>
                  {studyTypes.filter(t => t.isActive).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.mainType}{type.subType && ` - ${type.subType}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Starttijd</Label>
                <Input
                  type="time"
                  value={momentForm.startTime}
                  onChange={(e) => setMomentForm({ ...momentForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Eindtijd</Label>
                <Input
                  type="time"
                  value={momentForm.endTime}
                  onChange={(e) => setMomentForm({ ...momentForm, endTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capaciteit</Label>
                <Input
                  type="number"
                  min="1"
                  value={momentForm.capacity}
                  onChange={(e) => setMomentForm({ ...momentForm, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Actief</Label>
              <Switch
                checked={momentForm.isActive}
                onCheckedChange={(checked) => setMomentForm({ ...momentForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMomentDialog({ ...momentDialog, open: false })}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSaveMoment}
              disabled={momentsLoading || !momentForm.date || !momentForm.studyTypeId}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
            >
              {momentsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={generateDialog.open} onOpenChange={(open) => setGenerateDialog({ open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Momenten genereren</DialogTitle>
            <DialogDescription>
              Genereer automatisch studiemomenten op basis van de terugkerende regels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Van datum *</Label>
                <Input
                  type="date"
                  value={generateForm.startDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tot datum *</Label>
                <Input
                  type="date"
                  value={generateForm.endDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Laat studiesoorten leeg om voor alle actieve types momenten te genereren.
              Bestaande momenten worden niet overschreven.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialog({ open: false })}>
              Annuleren
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={momentsLoading || !generateForm.startDate || !generateForm.endDate}
              className="bg-[#D66D4F] hover:bg-[#c55f43]"
            >
              {momentsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Genereren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
