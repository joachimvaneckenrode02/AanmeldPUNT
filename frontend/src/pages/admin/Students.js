import React, { useState, useEffect, useRef } from 'react';
import { useStudents, useClasses } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { formatDateShort } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Upload, 
  Trash2,
  Users,
  FileSpreadsheet,
  Search,
  AlertCircle
} from 'lucide-react';

export default function AdminStudents() {
  const { isSuperAdmin } = useAuth();
  const { getStudents, createStudent, deleteStudent, importStudents, loading } = useStudents();
  const { getClasses } = useClasses();
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false });
  const [formData, setFormData] = useState({ name: '', classId: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, filterClass, students]);

  const loadData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        getStudents(),
        getClasses(true)
      ]);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    
    if (filterClass !== 'all') {
      filtered = filtered.filter(s => s.classId === filterClass);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.className?.toLowerCase().includes(query)
      );
    }
    
    setFilteredStudents(filtered);
  };

  const handleSave = async () => {
    try {
      await createStudent(formData);
      toast.success('Leerling toegevoegd');
      setDialog({ open: false });
      setFormData({ name: '', classId: '', email: '' });
      loadData();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Weet u zeker dat u deze leerling wilt verwijderen?')) return;
    
    try {
      await deleteStudent(studentId);
      toast.success('Leerling verwijderd');
      loadData();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importStudents(file);
      setImportResult(result);
      toast.success(`${result.imported} leerlingen geïmporteerd, ${result.skipped} overgeslagen`);
      loadData();
    } catch (error) {
      // Error handled by useApi
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="space-y-6 animate-fadeIn" data-testid="admin-students-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leerlingen</h1>
          <p className="text-slate-500 mt-1">
            Beheer de leerlingenlijst voor autocomplete
          </p>
        </div>
        <div className="flex gap-3">
          {isSuperAdmin() && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                data-testid="import-students-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importeren
              </Button>
            </>
          )}
          <Button 
            className="bg-[#2E5C5A] hover:bg-[#244A48]"
            onClick={() => setDialog({ open: true })}
            data-testid="add-student-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Leerling toevoegen
          </Button>
        </div>
      </div>

      {/* Info card for superadmin */}
      {isSuperAdmin() && (
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Excel import voor leerlingen</p>
              <p className="text-sm text-blue-700">
                Upload een Excel of CSV bestand met kolommen "naam" (of "leerling") en "klas". 
                De klas moet overeenkomen met een bestaande klas in het systeem.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import result */}
      {importResult && importResult.errors?.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Sommige leerlingen konden niet worden geïmporteerd:</p>
                <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Zoeken op naam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter op klas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {classes.filter(c => c.isActive).map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-slate-500">
        <span>{filteredStudents.length} leerlingen weergegeven</span>
        <span>•</span>
        <span>{students.length} totaal</span>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Toegevoegd</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    {searchQuery || filterClass !== 'all' 
                      ? 'Geen leerlingen gevonden' 
                      : 'Nog geen leerlingen. Voeg er een toe of importeer via Excel.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {student.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell className="text-slate-500">
                      {formatDateShort(student.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leerling toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe leerling toe aan de lijst
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                placeholder="Voornaam Achternaam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="student-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Klas *</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) => setFormData({ ...formData, classId: value })}
              >
                <SelectTrigger data-testid="student-class-select">
                  <SelectValue placeholder="Selecteer klas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter(c => c.isActive).map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail (optioneel)</Label>
              <Input
                id="email"
                type="email"
                placeholder="leerling@school.be"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.name || !formData.classId}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              data-testid="save-student-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
