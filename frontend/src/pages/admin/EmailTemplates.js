import React, { useState, useEffect } from 'react';
import { useEmailTemplates } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2,
  Mail,
  Eye,
  Info
} from 'lucide-react';

const placeholders = [
  { key: '{leerling}', description: 'Naam van de leerling' },
  { key: '{klas}', description: 'Klas van de leerling' },
  { key: '{datum}', description: 'Datum van de studie' },
  { key: '{startuur}', description: 'Starttijd' },
  { key: '{einduur}', description: 'Eindtijd' },
  { key: '{studie}', description: 'Naam van de studie' },
  { key: '{leerkracht}', description: 'Naam van de leerkracht' },
];

const defaultFormData = {
  templateKey: '',
  subject: '',
  body: '',
  isActive: true
};

export default function AdminEmailTemplates() {
  const { getTemplates, createTemplate, updateTemplate, deleteTemplate, loading } = useEmailTemplates();
  
  const [templates, setTemplates] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [previewDialog, setPreviewDialog] = useState({ open: false, template: null });
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleOpenDialog = (mode, templateData = null) => {
    setDialog({ open: true, mode, data: templateData });
    if (templateData) {
      setFormData({
        templateKey: templateData.templateKey,
        subject: templateData.subject,
        body: templateData.body,
        isActive: templateData.isActive
      });
    } else {
      setFormData(defaultFormData);
    }
  };

  const handleSave = async () => {
    try {
      if (dialog.mode === 'create') {
        await createTemplate(formData);
        toast.success('E-mailtemplate aangemaakt');
      } else {
        await updateTemplate(dialog.data.id, formData);
        toast.success('E-mailtemplate bijgewerkt');
      }
      setDialog({ open: false, mode: 'create', data: null });
      loadTemplates();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Weet u zeker dat u deze template wilt verwijderen?')) return;
    
    try {
      await deleteTemplate(templateId);
      toast.success('Template verwijderd');
      loadTemplates();
    } catch (error) {
      // Error handled by useApi
    }
  };

  const renderPreview = (template) => {
    const sampleData = {
      '{leerling}': 'Jan Janssens',
      '{klas}': '3A',
      '{datum}': '15/01/2026',
      '{startuur}': '15:30',
      '{einduur}': '17:00',
      '{studie}': 'Inhaalstudie',
      '{leerkracht}': 'Mevr. De Vries'
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(sampleData).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return { subject, body };
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-email-templates-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">E-mailtemplates</h1>
          <p className="text-slate-500 mt-1">
            Beheer de templates voor automatische e-mails
          </p>
        </div>
        <Button 
          className="bg-[#2E5C5A] hover:bg-[#244A48]"
          onClick={() => handleOpenDialog('create')}
          data-testid="add-template-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Template toevoegen
        </Button>
      </div>

      {/* Info card */}
      <Card className="border-0 shadow-sm bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">E-mailverzending uitgeschakeld</p>
            <p className="text-sm text-amber-700">
              E-mailverzending is momenteel uitgeschakeld. Templates worden opgeslagen maar mails worden niet verstuurd.
              Dit kan later geactiveerd worden via een e-mailservice integratie.
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
                <TableHead>Sleutel</TableHead>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nog geen templates. Voeg er een toe om te beginnen.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} className={!template.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">
                          {template.templateKey}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${template.isActive ? 'status-badge-success' : 'status-badge-neutral'}`}>
                        {template.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewDialog({ open: true, template })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog('edit', template)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(template.id)}
                        >
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

      {/* Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'create' ? 'Nieuwe template' : 'Template bewerken'}
            </DialogTitle>
            <DialogDescription>
              Gebruik placeholders zoals {'{leerling}'} in de tekst
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateKey">Template sleutel *</Label>
              <Input
                id="templateKey"
                placeholder="bijv. student_confirmation"
                value={formData.templateKey}
                onChange={(e) => setFormData({ ...formData, templateKey: e.target.value })}
                disabled={dialog.mode === 'edit'}
                data-testid="template-key-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Onderwerp *</Label>
              <Input
                id="subject"
                placeholder="bijv. Bevestiging aanmelding {studie}"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                data-testid="template-subject-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Inhoud *</Label>
              <Textarea
                id="body"
                placeholder="Beste {leerkracht},&#10;&#10;De aanmelding voor {leerling} is bevestigd..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={8}
                data-testid="template-body-input"
              />
            </div>
            
            {/* Placeholders info */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-500 mb-2">Beschikbare placeholders:</p>
              <div className="flex flex-wrap gap-2">
                {placeholders.map((p) => (
                  <code 
                    key={p.key}
                    className="text-xs bg-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-slate-300"
                    onClick={() => setFormData({ ...formData, body: formData.body + p.key })}
                    title={p.description}
                  >
                    {p.key}
                  </code>
                ))}
              </div>
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
              disabled={loading || !formData.templateKey || !formData.subject || !formData.body}
              className="bg-[#2E5C5A] hover:bg-[#244A48]"
              data-testid="save-template-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template preview</DialogTitle>
            <DialogDescription>
              Voorbeeld met voorbeeldgegevens
            </DialogDescription>
          </DialogHeader>
          {previewDialog.template && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Onderwerp:</p>
                <p className="font-medium">{renderPreview(previewDialog.template).subject}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Inhoud:</p>
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {renderPreview(previewDialog.template).body}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog({ open: false, template: null })}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
