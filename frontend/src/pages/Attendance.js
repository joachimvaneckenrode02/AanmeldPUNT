import React, { useState, useEffect } from 'react';
import { useAttendance } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Switch } from '../components/ui/switch';
import { formatDate, formatDateShort, getStudyTypeColor } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  Users, 
  Clock,
  CheckCircle2,
  XCircle,
  Save
} from 'lucide-react';

export default function Attendance() {
  const { getAttendanceByDate, recordAttendance, loading } = useAttendance();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [momentsData, setMomentsData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [savingIds, setSavingIds] = useState(new Set());

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setPageLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await getAttendanceByDate(dateStr);
      setMomentsData(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleAttendanceChange = async (registration, studyMomentId, isPresent) => {
    const saveKey = registration.id;
    setSavingIds(prev => new Set([...prev, saveKey]));
    
    try {
      await recordAttendance({
        registrationId: registration.id,
        studyMomentId: studyMomentId,
        isPresent: isPresent
      });
      
      // Update local state
      setMomentsData(prev => prev.map(moment => {
        if (moment.moment.id === studyMomentId) {
          return {
            ...moment,
            students: moment.students.map(student => {
              if (student.registration.id === registration.id) {
                return {
                  ...student,
                  attendance: {
                    ...student.attendance,
                    isPresent: isPresent
                  }
                };
              }
              return student;
            }),
            presentCount: moment.students.filter(s => 
              s.registration.id === registration.id ? isPresent : s.attendance?.isPresent
            ).length,
            absentCount: moment.students.filter(s => 
              s.registration.id === registration.id ? !isPresent : (s.attendance && !s.attendance.isPresent)
            ).length
          };
        }
        return moment;
      }));
      
      toast.success(isPresent ? 'Aanwezig geregistreerd' : 'Afwezig geregistreerd');
    } catch (error) {
      // Error handled by useApi
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(saveKey);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="attendance-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aanwezigheden</h1>
          <p className="text-slate-500 mt-1">
            Registreer de aanwezigheid van leerlingen
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start" data-testid="date-picker">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Content */}
      {pageLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
        </div>
      ) : momentsData.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Geen studiemomenten
            </h3>
            <p className="text-slate-500">
              Er zijn geen studiemomenten gepland voor deze dag.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {momentsData.map((data) => (
            <Card key={data.moment.id} className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStudyTypeColor(data.studyType?.colorLabel)}`}>
                      {data.studyType?.mainType}
                      {data.studyType?.subType && ` - ${data.studyType.subType}`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      {data.moment.startTime} - {data.moment.endTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      {data.presentCount} aanwezig
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-600">
                      <XCircle className="w-4 h-4" />
                      {data.absentCount} afwezig
                    </span>
                    <span className="text-slate-400">
                      {data.totalStudents} totaal
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.students.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Geen leerlingen ingeschreven voor dit moment
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.students.map((student) => {
                      const isSaving = savingIds.has(student.registration.id);
                      const isPresent = student.attendance?.isPresent ?? null;
                      
                      return (
                        <div
                          key={student.registration.id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isPresent === true 
                              ? 'bg-emerald-50' 
                              : isPresent === false 
                                ? 'bg-rose-50' 
                                : 'bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {student.registration.studentName}
                              </p>
                              <p className="text-sm text-slate-500">
                                {student.className}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {isSaving && (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                variant={isPresent === false ? "default" : "outline"}
                                size="sm"
                                className={isPresent === false ? "bg-rose-600 hover:bg-rose-700" : ""}
                                onClick={() => handleAttendanceChange(student.registration, data.moment.id, false)}
                                disabled={isSaving}
                                data-testid={`absent-btn-${student.registration.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Afwezig
                              </Button>
                              <Button
                                variant={isPresent === true ? "default" : "outline"}
                                size="sm"
                                className={isPresent === true ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                                onClick={() => handleAttendanceChange(student.registration, data.moment.id, true)}
                                disabled={isSaving}
                                data-testid={`present-btn-${student.registration.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Aanwezig
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
