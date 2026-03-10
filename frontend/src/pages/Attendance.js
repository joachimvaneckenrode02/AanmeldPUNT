import React, { useState, useEffect } from 'react';
import { useAttendance } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { formatDate, getStudyTypeColor } from '../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, Calendar, Users, CheckCircle2, XCircle, Search, MessageSquare
} from 'lucide-react';

export default function Attendance() {
  const { getByDate, recordAttendance, loading } = useAttendance();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [momentData, setMomentData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadAttendance(); }, [selectedDate]);

  const loadAttendance = async () => {
    setPageLoading(true);
    try {
      const data = await getByDate(selectedDate);
      setMomentData(data);
    } catch (error) { console.error('Error loading attendance:', error); }
    finally { setPageLoading(false); }
  };

  const handleToggleAttendance = async (registration, moment, currentAttendance) => {
    const newPresent = !currentAttendance?.isPresent;
    try {
      await recordAttendance({
        registrationId: registration.id,
        studyMomentId: moment.id,
        isPresent: newPresent,
        note: currentAttendance?.note || null
      });
      toast.success(newPresent ? 'Aanwezig gemarkeerd' : 'Afwezig gemarkeerd');
      loadAttendance();
    } catch (error) {}
  };

  // Filter students by search across all moments
  const filterStudents = (students) => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.registration.studentName.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  };

  // Check if student matches search in any moment
  const hasSearchResults = searchQuery ? momentData.some(m => filterStudents(m.students).length > 0) : true;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="attendance-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aanwezigheden</h1>
          <p className="text-slate-500 mt-1">Registreer de aanwezigheid van leerlingen per studiemoment</p>
        </div>
      </div>

      {/* Date selector + Search */}
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
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-slate-700">Zoek leerling</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Zoek op naam of klas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="attendance-search-input"
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Aanwezig</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-600">Afwezig</span>
              </div>
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
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />{item.presentCount}
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <XCircle className="w-4 h-4" />{item.absentCount}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Geen inschrijvingen voor dit moment</p>
                  ) : (
                    <div className="space-y-1">
                      {filteredStudents.map((student) => {
                        const isPresent = student.attendance?.isPresent ?? true;
                        const regNote = student.registration?.note;
                        return (
                          <div
                            key={student.registration.id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                              isPresent ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-rose-50 hover:bg-rose-100 border border-rose-200'
                            }`}
                            data-testid={`attendance-student-${student.registration.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isPresent ? 'bg-emerald-100' : 'bg-rose-100'
                              }`}>
                                {isPresent ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900">{student.registration.studentName}</span>
                                  <span className="text-sm text-slate-500">{student.className}</span>
                                </div>
                                {regNote && (
                                  <div className="flex items-start gap-1.5 mt-1">
                                    <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-amber-700 italic">{regNote}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <span className={`text-xs font-medium ${isPresent ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isPresent ? 'Aanwezig' : 'Afwezig'}
                              </span>
                              <Switch
                                checked={isPresent}
                                onCheckedChange={() => handleToggleAttendance(student.registration, item.moment, student.attendance)}
                                data-testid={`toggle-attendance-${student.registration.id}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
