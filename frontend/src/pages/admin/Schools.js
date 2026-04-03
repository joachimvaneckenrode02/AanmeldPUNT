import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, School, ToggleLeft, ToggleRight } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Schools() {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, school: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, school: null });
  const [formData, setFormData] = useState({ name: '', slug: '', accessCode: '', address: '', city: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  useEffect(() => { loadSchools(); }, []);

  const loadSchools = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/schools`);
      setSchools(res.data);
    } catch (err) {
      toast.error('Fout bij laden scholen');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const openCreate = () => {
    setFormData({ name: '', slug: '', accessCode: generateCode(), address: '', city: '', isActive: true });
    setEditDialog({ open: true, school: null });
  };

  const openEdit = (school) => {
    setFormData({
      name: school.name,
      slug: school.slug,
      accessCode: school.accessCode || '',
      address: school.address || '',
      city: school.city || '',
      isActive: school.isActive
    });
    setEditDialog({ open: true, school });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.accessCode) {
      toast.error('Naam, slug en schoolcode zijn verplicht');
      return;
    }
    setSaving(true);
    try {
      if (editDialog.school) {
        await axios.put(`${API_URL}/api/schools/${editDialog.school.id}`, formData);
        toast.success('School bijgewerkt');
      } else {
        await axios.post(`${API_URL}/api/schools`, formData);
        toast.success('School aangemaakt');
      }
      setEditDialog({ open: false, school: null });
      loadSchools();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.school) return;
    try {
      await axios.delete(`${API_URL}/api/schools/${deleteDialog.school.id}`);
      toast.success('School verwijderd');
      setDeleteDialog({ open: false, school: null });
      loadSchools();
    } catch (err) {
      toast.error('Fout bij verwijderen');
    }
  };

  const toggleActive = async (school) => {
    try {
      await axios.patch(`${API_URL}/api/schools/${school.id}/toggle-active`);
      toast.success(`School ${school.isActive ? 'gedeactiveerd' : 'geactiveerd'}`);
      loadSchools();
    } catch (err) {
      toast.error('Fout bij wijzigen status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-schools-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scholen</h1>
          <p className="text-slate-500 mt-1">Beheer alle scholen op het platform</p>
        </div>
        <Button onClick={openCreate} className="bg-[#2E5C5A] hover:bg-[#244A48]">
          <Plus className="w-4 h-4 mr-2" />
          School toevoegen
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Schoolcode</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <School className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Geen scholen</h3>
                    <p className="text-slate-500">Voeg een eerste school toe om te beginnen</p>
                  </TableCell>
                </TableRow>
              ) : (
                schools.map((school) => (
                  <TableRow key={school.id} className={!school.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-[#2E5C5A]" />
                        {school.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded font-mono font-bold tracking-wider">{school.accessCode}</code>
                    </TableCell>
                    <TableCell>{school.city || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        school.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {school.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(school)}>
                          {school.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(school)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => setDeleteDialog({ open: true, school })}>
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
      <AlertDialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, school: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editDialog.school ? 'School bewerken' : 'Nieuwe school'}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Schoolnaam *</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData(f => ({ ...f, name, slug: editDialog.school ? f.slug : generateSlug(name) }));
                }}
                placeholder="Sint-Jansschool"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug * <span className="text-xs text-slate-400">(unieke URL-naam)</span></Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value }))}
                placeholder="sint-jansschool"
              />
            </div>
            <div className="space-y-2">
              <Label>Schoolcode * <span className="text-xs text-slate-400">(leerkrachten gebruiken deze code om zich te registreren)</span></Label>
              <div className="flex gap-2">
                <Input
                  value={formData.accessCode}
                  onChange={(e) => setFormData(f => ({ ...f, accessCode: e.target.value.toUpperCase() }))}
                  placeholder="ABC123"
                  className="font-mono tracking-wider uppercase"
                />
                <Button type="button" variant="outline" onClick={() => setFormData(f => ({ ...f, accessCode: generateCode() }))}>
                  Genereer
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                  placeholder="Schoolstraat 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Stad</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                  placeholder="Brussel"
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} className="bg-[#2E5C5A] hover:bg-[#244A48]" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editDialog.school ? 'Opslaan' : 'Aanmaken'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, school: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>School verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u <strong>{deleteDialog.school?.name}</strong> wilt verwijderen?
              Alle data van deze school gaat verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
