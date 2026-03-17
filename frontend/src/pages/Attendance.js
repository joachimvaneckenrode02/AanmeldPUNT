import React, { useState, useEffect } from 'react';
import { useAttendance, useStudents, useClasses } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { formatDate, getStudyTypeColor } from '../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, Calendar, CheckCircle2, XCircle, Search, MessageSquare, UserPlus, 
  Thermometer, Send, ChevronDown, ChevronUp
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Aanwezig', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', activeBg: 'bg-emerald-100 ring-2 ring-emerald-500' },
  { value: 'absent', label: 'Afwezig', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200', activeBg: 'bg-rose-100 ring-2 ring-rose-500' },
  { value: 'sick', label: 'Ziek', icon: Thermometer, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200', activeBg: 'bg-amber-100 ring-2 ring-amber-500' },
];

function StudentRow({ student, moment, onStatusChange, onExpandToggle, isExpanded }) {
  const att = student.attendance;
  const status = att?.status || (att?.isPresent ? 'present' : 'absent');
  const regNote = student.registration?.note;
  const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  return (
    <div className={`rounded-lg transition-all border ${
      status === 'present' ? 'bg-emerald-50/30 border-emerald-100' :
      status === 'sick' ? 'bg-amber-50/30 border-amber-200' :
      'bg-rose-50/30 border-rose-200'
    }`} data-testid={`attendance-student-${student.registration.id}`}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            status === 'present' ? 'bg-emerald-100' : status === 'sick' ? 'bg-amber-100' : 'bg-rose-100'
          }`}>
            <statusOption.icon className={`w-4 h-4 ${statusOption.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{student.registration.studentName}</span>
              <span className="text-sm text-slate-500">{student.className}</span>
            </div>
            {regNote && (
              <div className="flex items-start gap-1.5 mt-0.5">
                <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-700 italic">{regNote}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(student, moment, opt.value, att?.absenceReason, att?.educatorNote)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                status === opt.value ? opt.activeBg : opt.bg
              }`}
              title={opt.label}
              data-testid={`set-${opt.value}-${student.registration.id}`}
            >
              <opt.icon className={`w-3.5 h-3.5 inline mr-1 ${opt.color}`} />
              {opt.label}
            </button>
          ))}
          <button onClick={() => onExpandToggle(student.registration.id)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 ml-1"
            title="Details">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Expanded details: reason + educator note */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 animate-fadeIn">
          <ExpandedFields
            student={student}
            moment={moment}
            status={status}
            onStatusChange={onStatusChange}
          />
        </div>
      )}
    </div>
  );
}

function ExpandedFields({ student, moment, status, onStatusChange }) {
  const att = student.attendance;
  const [reason, setReason] = useState(att?.absenceReason || '');
  const [eduNote, setEduNote] = useState(att?.educatorNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onStatusChange(student, moment, status, reason, eduNote);
    setSaving(false);
    toast.success('Opgeslagen');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      {status !== 'present' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">
            {status === 'sick' ? 'Opmerking ziekte' : 'Reden afwezigheid'}
          </Label>
          <Input
            placeholder={status === 'sick' ? 'bv. Hoofdpijn, koorts...' : 'bv. Niet komen opdagen, vergeten...'}
            value={reason} onChange={(e) => setReason(e.target.value)}
            className="h-8 text-sm"
            data-testid={`reason-input-${student.registration.id}`}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500 flex items-center gap-1">
          <Send className="w-3 h-3" />Bericht naar leerkracht
        </Label>
        <Input
          placeholder="bv. Leerling was onrustig, heeft goed gewerkt..."
          value={eduNote} onChange={(e) => setEduNote(e.target.value)}
          className="h-8 text-sm"
          data-testid={`educator-note-${student.registration.id}`}
        />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving}
          className="bg-[#2E5C5A] hover:bg-[#244A48] h-7 text-xs">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Opslaan'}
        </Button>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { getByDate, recordAttendance, addStudentToMoment, loading } = useAttendance();
  const { searchStudents } = useStudents();
  const { getClasses } = useClasses();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [momentData, setMomentData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  
  // Add student dialog
  const [addDialog, setAddDialog] = useState({ open: false, momentId: null, momentLabel: '' });
  const [classes, setClasses] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [addForm, setAddForm] = useState({ studentName: '', classId: '', note: '' });

  useEffect(() => { loadAttendance(); }, [selectedDate]);

  const loadAttendance = async () => {
    setPageLoading(true);
    try {
      const data = await getByDate(selectedDate);
      setMomentData(data);
    } catch (error) { console.error('Error:', error); }
    finally { setPageLoading(false); }
  };

  const handleStatusChange = async (student, moment, newStatus, absenceReason, educatorNote) => {
    const isPresent = newStatus === 'present';
    try {
      await recordAttendance({
        registrationId: student.registration.id,
        studyMomentId: moment.id,
        isPresent,
        status: newStatus,
        absenceReason: absenceReason || null,
        educatorNote: educatorNote || null
      });
      loadAttendance();
    } catch (error) {}
  };

  const toggleExpand = (regId) => {
    setExpandedRows(prev => ({ ...prev, [regId]: !prev[regId] }));
  };

  const handleOpenAddDialog = async (moment) => {
    setAddDialog({ open: true, momentId: moment.id, momentLabel: moment.labelFull });
    setAddForm({ studentName: '', classId: '', note: '' });
    setStudentSearch('');
    setStudentResults([]);
    try { const cls = await getClasses(); setClasses(cls); } catch (e) {}
  };

  const handleStudentSearch = async (query) => {
    setStudentSearch(query);
    setAddForm(prev => ({ ...prev, studentName: query }));
    if (query.length >= 2) {
      try {
        const results = await searchStudents(query);
        setStudentResults(results.slice(0, 8));
      } catch (e) {}
    } else { setStudentResults([]); }
  };

  const selectStudent = (student) => {
    setAddForm(prev => ({ ...prev, studentName: student.name, classId: student.classId }));
    setStudentSearch(student.name);
    setStudentResults([]);
  };

  const handleAddStudent = async () => {
    if (!addForm.studentName || !addForm.classId) { toast.error('Vul naam en klas in'); return; }
    try {
      await addStudentToMoment({
        studentName: addForm.studentName,
        classId: addForm.classId,
        studyMomentId: addDialog.momentId,
        note: addForm.note
      });
      toast.success(`${addForm.studentName} toegevoegd`);
      setAddDialog({ open: false, momentId: null, momentLabel: '' });
      loadAttendance();
    } catch (error) {}
  };

  const filterStudents = (students) => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.registration.studentName.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  };

  const hasSearchResults = searchQuery ? momentData.some(m => filterStudents(m.students).length > 0) : true;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="attendance-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aanwezigheden</h1>
          <p className="text-slate-500 mt-1">Registreer de aanwezigheid van leerlingen</p>
        </div>
      </div>

      {/* Date + Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2 w-full md:w-48">
              <label className="text-sm font-medium text-slate-700">Datum</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="pl-10" data-testid="attendance-date-input" />
              </div>
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-slate-700">Zoek leerling</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Zoek op naam of klas..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="attendance-search-input" />
              </div>
            </div>
            <div className="flex gap-3 text-xs flex-shrink-0">
              {STATUS_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <opt.icon className={`w-3.5 h-3.5 ${opt.color}`} />
                  <span className="text-slate-600">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {pageLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" /></div>
      ) : momentData.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Geen studiemomenten</h3>
            <p className="text-slate-500">Er zijn geen studiemomenten gepland voor {formatDate(selectedDate)}.</p>
          </CardContent>
        </Card>
      ) : !hasSearchResults ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Geen resultaten</h3>
            <p className="text-slate-500">Geen leerlingen gevonden voor "{searchQuery}"</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {momentData.map((item) => {
            const filteredStudents = filterStudents(item.students);
            if (searchQuery && filteredStudents.length === 0) return null;
            
            return (
              <Card key={item.moment.id} className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStudyTypeColor(item.studyType?.colorLabel)}`}>
                        {item.studyType?.mainType}{item.studyType?.subType && ` - ${item.studyType.subType}`}
                      </div>
                      <div>
                        <CardTitle className="text-base">{item.moment.startTime} - {item.moment.endTime}</CardTitle>
                        <CardDescription>{filteredStudents.length} leerling{filteredStudents.length !== 1 ? 'en' : ''}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" />{item.presentCount}</span>
                        <span className="flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" />{item.absentCount}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleOpenAddDialog(item.moment)}
                        className="text-[#2E5C5A] border-[#2E5C5A]/30 hover:bg-[#2E5C5A]/10"
                        data-testid={`add-student-${item.moment.id}`}>
                        <UserPlus className="w-4 h-4 mr-1" />Toevoegen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {filteredStudents.map((student) => (
                      <StudentRow
                        key={student.registration.id}
                        student={student}
                        moment={item.moment}
                        onStatusChange={handleStatusChange}
                        onExpandToggle={toggleExpand}
                        isExpanded={expandedRows[student.registration.id]}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Student Dialog */}
      <Dialog open={addDialog.open} onOpenChange={(open) => setAddDialog({ ...addDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leerling manueel toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een laattijdige leerling toe aan {addDialog.momentLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Naam leerling *</Label>
              <div className="relative">
                <Input placeholder="Typ naam om te zoeken..." value={studentSearch}
                  onChange={(e) => handleStudentSearch(e.target.value)} data-testid="add-student-name-input" />
                {studentResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {studentResults.map((s) => (
                      <button key={s.id} onClick={() => selectStudent(s)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex justify-between text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-slate-400">{s.className}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Klas *</Label>
              <Select value={addForm.classId} onValueChange={(value) => setAddForm(prev => ({ ...prev, classId: value }))}>
                <SelectTrigger data-testid="add-student-class-select"><SelectValue placeholder="Selecteer klas" /></SelectTrigger>
                <SelectContent>
                  {classes.filter(c => c.isActive).map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opmerking (optioneel)</Label>
              <Input placeholder="bv. Laattijdig aangesloten" value={addForm.note}
                onChange={(e) => setAddForm(prev => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog({ ...addDialog, open: false })}>Annuleren</Button>
            <Button onClick={handleAddStudent} disabled={loading || !addForm.studentName || !addForm.classId}
              className="bg-[#2E5C5A] hover:bg-[#244A48]" data-testid="confirm-add-student">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
