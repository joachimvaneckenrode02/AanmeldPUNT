import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
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
  Pencil,
  User,
  Shield,
  UserCog
} from 'lucide-react';

const roleOptions = [
  { value: 'teacher', label: 'Leerkracht', icon: User },
  { value: 'educator', label: 'Opvoeder', icon: UserCog },
  { value: 'admin', label: 'Admin', icon: Shield },
];

export default function AdminUsers() {
  const { getUsers, updateUser, loading } = useUsers();
  
  const [users, setUsers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, user: null });
  const [formData, setFormData] = useState({ name: '', role: '', isActive: true });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleOpenDialog = (user) => {
    setDialog({ open: true, user });
    setFormData({
      name: user.name,
      role: user.role,
      isActive: user.isActive
    });
  };

  const handleSave = async () => {
    try {
      await updateUser(dialog.user.id, formData);
      toast.success('Gebruiker bijgewerkt');
      setDialog({ open: false, user: null });
      loadUsers();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const getRoleLabel = (role) => {
    const option = roleOptions.find(r => r.value === role);
    return option?.label || role;
  };

  const getRoleIcon = (role) => {
    const option = roleOptions.find(r => r.value === role);
    const Icon = option?.icon || User;
    return <Icon className="w-4 h-4" />;
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-users-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gebruikers</h1>
          <p className="text-slate-500 mt-1">
            Beheer gebruikersaccounts en rollen
          </p>
        </div>
      </div>

      {/* Info */}
      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700">
            <strong>Rollen:</strong> Leerkrachten kunnen leerlingen aanmelden. 
            Opvoeders kunnen aanwezigheden registreren. 
            Admins hebben volledige toegang tot alle functionaliteit.
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Geregistreerd</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Geen gebruikers gevonden
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(user.role)}
                        <span>{getRoleLabel(user.role)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${user.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                        {user.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDateShort(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                        data-testid={`edit-user-${user.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
            <DialogDescription>
              Wijzig de rol of status van deze gebruiker
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="user-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="w-4 h-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              data-testid="save-user-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
