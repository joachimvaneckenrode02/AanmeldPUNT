import React, { useState, useEffect } from 'react';
import { useExclusionDates } from '../../hooks/useApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { formatDateShort, formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Trash2,
  CalendarX
} from 'lucide-react';

export default function AdminExclusionDates() {
  const { getDates, createDate, deleteDate, loading } = useExclusionDates();
  
  const [dates, setDates] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false });
  const [formData, setFormData] = useState({ date: '', reason: '' });

  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async () => {
    try {
      const data = await getDates(true);
      setDates(data);
    } catch (error) {
      console.error('Error loading dates:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await createDate(formData);
      toast.success('Uitsluitingsdatum toegevoegd');
      setDialog({ open: false });
      setFormData({ date: '', reason: '' });
      loadDates();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDelete = async (dateId) => {
    if (!window.confirm('Weet u zeker dat u deze datum wilt verwijderen?')) return;
    
    try {
      await deleteDate(dateId);
      toast.success('Datum verwijderd');
      loadDates();
    } catch (error) {
      // Error handled by useApi
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
    <div className="space-y-6 animate-fadeIn" data-testid="admin-exclusions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Uitsluitingsdata</h1>
          <p className="text-slate-500 mt-1">
            Beheer dagen waarop geen studies plaatsvinden (vakanties, feestdagen, etc.)
          </p>
        </div>
        <Button 
          className="bg-[#2E5C5A] hover:bg-[#244A48]"
          onClick={() => setDialog({ open: true })}
          data-testid="add-exclusion-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Datum toevoegen
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Reden</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nog geen uitsluitingsdata. Voeg er een toe om te beginnen.
                  </TableCell>
                </TableRow>
              ) : (
                dates.map((date) => (
                  <TableRow key={date.id} className={!date.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarX className="w-4 h-4 text-rose-500" />
                        <div>
                          <span className="font-medium">{formatDateShort(date.date)}</span>
                          <span className="text-slate-400 ml-2 text-sm">
                            {formatDate(date.date).split(',')[0]}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{date.reason}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${date.isActive ? 'status-badge-error' : 'status-badge-neutral'}`}>
                        {date.isActive ? 'Uitgesloten' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDelete(date.id)}
                        data-testid={`delete-exclusion-${date.id}`}
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

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uitsluitingsdatum toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een datum toe waarop geen studies mogen plaatsvinden
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="exclusion-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reden *</Label>
              <Input
                id="reason"
                placeholder="bijv. Kerstvakantie, Paasmaandag, Pedagogische studiedag"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                data-testid="exclusion-reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || !formData.date || !formData.reason}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              data-testid="save-exclusion-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
