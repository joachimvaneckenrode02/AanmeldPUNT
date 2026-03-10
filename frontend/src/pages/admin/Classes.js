import React, { useState, useEffect, useRef } from 'react';
import { useClasses } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
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
  Pencil, 
  Trash2,
  GraduationCap,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminClasses() {
  const { getClasses, createClass, updateClass, deleteClass, importClasses, loading } = useClasses();
  
  const [classes, setClasses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getClasses(true);
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleOpenDialog = (mode, classData = null) => {
    setDialog({ open: true, mode, data: classData });
    setFormData(classData ? { name: classData.name, isActive: classData.isActive } : { name: '', isActive: true });
  };

  const handleSave = async () => {
    try {
      if (dialog.mode === 'create') {
        await createClass(formData);
        toast.success('Klas aangemaakt');
      } else {
        await updateClass(dialog.data.id, formData);
        toast.success('Klas bijgewerkt');
      }
      setDialog({ open: false, mode: 'create', data: null });
      loadClasses();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Weet u zeker dat u deze klas wilt deactiveren?')) return;
    
    try {
      await deleteClass(classId);
      toast.success('Klas gedeactiveerd');
      loadClasses();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importClasses(file);
      toast.success(`${result.imported} klassen geïmporteerd, ${result.skipped} overgeslagen`);
      loadClasses();
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
    <div className="space-y-6 animate-fadeIn" data-testid="admin-classes-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Klassen</h1>
          <p className="text-slate-500 mt-1">
            Beheer de klassen van uw school
          </p>
        </div>
        <div className="flex gap-3">
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
            data-testid="import-classes-btn"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importeren
          </Button>
          <Button 
            className="bg-[#2E5C5A] hover:bg-[#244A48]"
            onClick={() => handleOpenDialog('create')}
            data-testid="add-class-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Klas toevoegen
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Excel import</p>
            <p className="text-sm text-blue-700">
              Upload een Excel of CSV bestand met een kolom "naam" of "klas" om meerdere klassen tegelijk te importeren.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nog geen klassen. Voeg er een toe of importeer via Excel.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id} className={!cls.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{cls.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${cls.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                        {cls.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDateShort(cls.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog('edit', cls)}
                          data-testid={`edit-class-${cls.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {cls.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(cls.id)}
                            data-testid={`delete-class-${cls.id}`}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'create' ? 'Nieuwe klas' : 'Klas bewerken'}
            </DialogTitle>
            <DialogDescription>
              {dialog.mode === 'create' 
                ? 'Voeg een nieuwe klas toe aan uw school'
                : 'Wijzig de gegevens van deze klas'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                placeholder="bijv. 3A of 4 Latijn"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="class-name-input"
              />
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
              disabled={loading || !formData.name}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              data-testid="save-class-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
