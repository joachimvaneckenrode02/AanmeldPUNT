import React, { useState, useEffect } from 'react';
import { useRegistrations, useStudyTypes, useClasses } from '../../hooks/useApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { formatDateShort, getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Search,
  Filter,
  X,
  Calendar,
  Download
} from 'lucide-react';

export default function AdminRegistrations() {
  const { getRegistrations, updateRegistration, cancelRegistration, loading } = useRegistrations();
  const { getStudyTypes } = useStudyTypes();
  const { getClasses } = useClasses();

  const [registrations, setRegistrations] = useState([]);
  const [studyTypes, setStudyTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState({ open: false, registration: null });
  
  const [filters, setFilters] = useState({
    search: '',
    studyTypeId: 'all',
    classId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [filters.studyTypeId, filters.classId, filters.status, filters.dateFrom, filters.dateTo]);

  const loadInitialData = async () => {
    try {
      const [typesData, classesData] = await Promise.all([
        getStudyTypes(true),
        getClasses(true)
      ]);
      setStudyTypes(typesData);
      setClasses(classesData);
      await loadRegistrations();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      const params = {};
      if (filters.studyTypeId !== 'all') params.studyTypeId = filters.studyTypeId;
      if (filters.classId !== 'all') params.classId = filters.classId;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const data = await getRegistrations(params);
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
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

  const handleStatusChange = async (regId, newStatus) => {
    try {
      await updateRegistration(regId, { status: newStatus });
      toast.success('Status bijgewerkt');
      loadRegistrations();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const filteredRegistrations = filters.search
    ? registrations.filter(r =>
        r.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.teacherName.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.className?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : registrations;

  const clearFilters = () => {
    setFilters({
      search: '',
      studyTypeId: 'all',
      classId: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-registrations-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alle aanmeldingen</h1>
          <p className="text-slate-500 mt-1">
            Bekijk en beheer alle aanmeldingen
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Zoeken..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.studyTypeId}
              onValueChange={(value) => setFilters({ ...filters, studyTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Studiesoort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle studiesoorten</SelectItem>
                {studyTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.mainType}{type.subType && ` - ${type.subType}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.classId}
              onValueChange={(value) => setFilters({ ...filters, classId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Klas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle klassen</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="registered">Ingeschreven</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                placeholder="Van"
              />
              <span className="text-slate-400">-</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                placeholder="Tot"
              />
            </div>
            <div className="flex justify-end">
              <p className="text-sm text-slate-500">
                {filteredRegistrations.length} resultaten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leerling</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Studie</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Tijd</TableHead>
                <TableHead>Leerkracht</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Geen aanmeldingen gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.studentName}</TableCell>
                    <TableCell>{reg.className}</TableCell>
                    <TableCell>{reg.studyLabelSnapshot}</TableCell>
                    <TableCell>{formatDateShort(reg.date)}</TableCell>
                    <TableCell>{reg.startTime} - {reg.endTime}</TableCell>
                    <TableCell className="text-slate-500">{reg.teacherName}</TableCell>
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
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, registration: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aanmelding annuleren</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u de aanmelding van <strong>{cancelDialog.registration?.studentName}</strong> wilt annuleren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Terug</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Annuleren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
