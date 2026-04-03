import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRegistrations } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { formatDateShort, getStatusBadgeClass, getStatusLabel, getStudyTypeColor } from '../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Search,
  UserPlus,
  ClipboardList,
  X,
  Calendar,
  Clock,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

export default function MyRegistrations() {
  const { getMyRegistrations, cancelRegistration, loading } = useRegistrations();

  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [absentRegistrations, setAbsentRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState({ open: false, registration: null });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [searchQuery, registrations, activeTab]);

  const loadRegistrations = async () => {
    try {
      const data = await getMyRegistrations();
      setRegistrations(data);
      
      // Filter absent registrations
      const absent = data.filter(r => r.attendanceStatus === 'absent');
      setAbsentRegistrations(absent);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;
    
    // Filter by tab
    if (activeTab === 'absent') {
      filtered = registrations.filter(r => r.attendanceStatus === 'absent');
    } else if (activeTab === 'active') {
      filtered = registrations.filter(r => r.status === 'registered');
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r => r.studentName.toLowerCase().includes(query) ||
             r.className?.toLowerCase().includes(query) ||
             r.studyLabelSnapshot.toLowerCase().includes(query)
      );
    }
    
    setFilteredRegistrations(filtered);
  };

  const handleCancel = async () => {
    if (!cancelDialog.registration) return;
    
    try {
      await cancelRegistration(cancelDialog.registration.id);
      toast.success('Aanmelding geannuleerd');
      loadRegistrations();
    } catch (error) {
      // Error handled by useApi
    } finally {
      setCancelDialog({ open: false, registration: null });
    }
  };

  const getAttendanceBadge = (reg) => {
    if (reg.attendanceStatus === 'absent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
          <XCircle className="w-3 h-3" />
          Afwezig
        </span>
      );
    }
    if (reg.attendanceStatus === 'present') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          Aanwezig
        </span>
      );
    }
    return null;
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="my-registrations-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mijn aanmeldingen</h1>
          <p className="text-slate-500 mt-1">
            Bekijk en beheer uw aangemelde leerlingen
          </p>
        </div>
        <Button asChild className="bg-[#2E5C5A] hover:bg-[#244A48]">
          <Link to="/aanmelden">
            <UserPlus className="w-4 h-4 mr-2" />
            Nieuwe aanmelding
          </Link>
        </Button>
      </div>

      {/* Absent Alert */}
      {absentRegistrations.length > 0 && (
        <Card className="border-0 shadow-sm bg-rose-50 border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-rose-900">
                  {absentRegistrations.length} leerling{absentRegistrations.length !== 1 ? 'en' : ''} afwezig gemeld
                </p>
                <p className="text-sm text-rose-700">
                  Deze leerlingen zijn niet aanwezig geweest op hun ingeplande studie
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-shrink-0">
              <TabsList>
                <TabsTrigger value="all">Alles ({registrations.length})</TabsTrigger>
                <TabsTrigger value="active">Actief ({registrations.filter(r => r.status === 'registered').length})</TabsTrigger>
                {absentRegistrations.length > 0 && (
                  <TabsTrigger value="absent" className="text-rose-600">
                    Afwezig ({absentRegistrations.length})
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Zoeken op leerling, klas of studie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-registrations"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {filteredRegistrations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              {searchQuery ? 'Geen resultaten' : 'Nog geen aanmeldingen'}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchQuery 
                ? 'Probeer een andere zoekterm'
                : 'Begin met het aanmelden van leerlingen'
              }
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link to="/aanmelden">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Eerste aanmelding maken
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards view */}
          <div className="md:hidden space-y-3">
            {filteredRegistrations.map((reg) => (
              <Card 
                key={reg.id} 
                className={`border-0 shadow-sm ${
                  reg.attendanceStatus === 'absent' ? 'bg-rose-50 border-l-4 border-l-rose-500' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{reg.studentName}</p>
                        {getAttendanceBadge(reg)}
                      </div>
                      <p className="text-sm text-slate-500">{reg.className}</p>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(reg.status)}`}>
                      {getStatusLabel(reg.status)}
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getStudyTypeColor('gray')}`}>
                        {reg.studyLabelSnapshot}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateShort(reg.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {reg.startTime} - {reg.endTime}
                      </span>
                    </div>
                  </div>
                  {reg.attendanceStatus === 'absent' && (reg.educatorNote || reg.absenceReason) && (
                    <div className="p-2.5 bg-rose-100/60 rounded-md space-y-1 mb-3">
                      {reg.absenceReason && (
                        <p className="text-xs text-rose-700"><span className="font-semibold">Reden:</span> {reg.absenceReason}</p>
                      )}
                      {reg.educatorNote && (
                        <p className="text-xs text-rose-700 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span><span className="font-semibold">Opmerking opvoeder:</span> {reg.educatorNote}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {reg.status === 'registered' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => setCancelDialog({ open: true, registration: reg })}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuleren
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table view */}
          <Card className="border-0 shadow-sm hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leerling</TableHead>
                    <TableHead>Klas</TableHead>
                    <TableHead>Studie</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Aanwezigheid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((reg) => (
                    <TableRow 
                      key={reg.id} 
                      className={reg.attendanceStatus === 'absent' ? 'bg-rose-50' : ''}
                    >
                      <TableCell className="font-medium">{reg.studentName}</TableCell>
                      <TableCell>{reg.className}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStudyTypeColor('gray')}`}>
                          {reg.studyLabelSnapshot}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateShort(reg.date)}</TableCell>
                      <TableCell>{reg.startTime} - {reg.endTime}</TableCell>
                      <TableCell>
                        <div>
                          {getAttendanceBadge(reg) || (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                          {reg.attendanceStatus === 'absent' && (reg.educatorNote || reg.absenceReason) && (
                            <div className="mt-1 space-y-0.5">
                              {reg.absenceReason && (
                                <p className="text-xs text-rose-600"><span className="font-semibold">Reden:</span> {reg.absenceReason}</p>
                              )}
                              {reg.educatorNote && (
                                <p className="text-xs text-rose-600 flex items-start gap-1">
                                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>{reg.educatorNote}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${getStatusBadgeClass(reg.status)}`}>
                          {getStatusLabel(reg.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {reg.status === 'registered' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => setCancelDialog({ open: true, registration: reg })}
                            data-testid={`cancel-btn-${reg.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, registration: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aanmelding annuleren</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u de aanmelding van <strong>{cancelDialog.registration?.studentName}</strong> wilt annuleren?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Terug</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Annuleren'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
