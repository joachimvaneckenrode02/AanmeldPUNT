import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
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
import { formatDateShort } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, Pencil, User, Shield, UserCog, Crown, Trash2
} from 'lucide-react';

const roleOptions = [
  { value: 'teacher', label: 'Leerkracht', icon: User, description: 'Kan leerlingen aanmelden' },
  { value: 'educator', label: 'Opvoeder', icon: UserCog, description: 'Kan aanwezigheden registreren' },
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Volledige toegang' },
  { value: 'superadmin', label: 'Superadmin', icon: Crown, description: 'Volledige toegang + rollenbeheer' },
];

export default function AdminUsers() {
  const { getUsers, updateUser, deleteUser, loading } = useUsers();
  const { user: currentUser, isSuperAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, user: null });
  const [formData, setFormData] = useState({ name: '', role: '', isActive: true });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { setUsers(await getUsers()); }
    catch (error) { console.error('Error loading users:', error); }
    finally { setPageLoading(false); }
  };

  const handleOpenDialog = (user) => {
    setDialog({ open: true, user });
    setFormData({ name: user.name, role: user.role, isActive: user.isActive });
  };

  const handleSave = async () => {
    try {
      await updateUser(dialog.user.id, formData);
      toast.success('Gebruiker bijgewerkt');
      setDialog({ open: false, user: null });
      loadUsers();
    } catch (error) {}
  };

  const handleDelete = async () => {
    if (!deleteConfirm.user) return;
    try {
      await deleteUser(deleteConfirm.user.id);
      toast.success(`Gebruiker "${deleteConfirm.user.name}" definitief verwijderd`);
      setDeleteConfirm({ open: false, user: null });
      loadUsers();
    } catch (error) {}
  };

  const getRoleLabel = (role) => roleOptions.find(r => r.value === role)?.label || role;
  const getRoleIcon = (role) => { const Icon = roleOptions.find(r => r.value === role)?.icon || User; return <Icon className="w-4 h-4" />; };
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'educator': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const availableRoles = isSuperAdmin() ? roleOptions : roleOptions.filter(r => r.value !== 'superadmin');

  if (pageLoading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" /></div>);
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-users-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gebruikers</h1>
          <p className="text-slate-500 mt-1">Beheer gebruikersaccounts en rollen</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">Rollenoverzicht:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-start gap-2 text-sm">
                  <role.icon className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-medium text-blue-900">{role.label}:</span>
                    <span className="text-blue-700 ml-1">{role.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead><TableHead>E-mail</TableHead>
                <TableHead>Rol</TableHead><TableHead>Status</TableHead>
                <TableHead>Geregistreerd</TableHead><TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Geen gebruikers gevonden</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className={!u.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">{u.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          {u.name}
                          {u.id === currentUser?.id && (<span className="ml-2 text-xs text-slate-400">(jij)</span>)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{u.email}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                        {getRoleIcon(u.role)}<span>{getRoleLabel(u.role)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${u.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                        {u.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDateShort(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isSuperAdmin() && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(u)} data-testid={`edit-user-${u.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {u.id !== currentUser?.id && (
                              <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => setDeleteConfirm({ open: true, user: u })} data-testid={`delete-user-${u.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
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

      {/* Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebruiker bewerken</DialogTitle>
            <DialogDescription>Wijzig de rol of status van deze gebruiker</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} data-testid="user-name-input" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger data-testid="user-role-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="w-4 h-4" />
                        <span className="font-medium">{role.label}</span>
                        <span className="text-slate-500 text-xs">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Actief</Label>
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>Annuleren</Button>
            <Button onClick={handleSave} disabled={loading || !formData.name} className="bg-[#2E5C5A] hover:bg-[#244A48]" data-testid="save-user-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker definitief verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u <strong>"{deleteConfirm.user?.name}"</strong> ({deleteConfirm.user?.email}) definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700" data-testid="confirm-delete-user">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
