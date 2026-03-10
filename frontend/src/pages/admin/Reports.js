import React, { useState, useEffect } from 'react';
import { useReports, useStudyTypes, useClasses } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
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
import { Progress } from '../../components/ui/progress';
import { formatDateShort, getStudyTypeColor } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Download,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminReports() {
  const { getSummary, exportRegistrations, loading } = useReports();
  
  const [summary, setSummary] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async (from, to) => {
    try {
      const params = {};
      if (from) params.dateFrom = from;
      if (to) params.dateTo = to;
      
      const data = await getSummary(params);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleFilter = () => {
    setPageLoading(true);
    loadSummary(dateRange.from, dateRange.to);
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;
      
      const data = await exportRegistrations(params);
      
      // Convert to CSV
      if (data.length === 0) {
        toast.error('Geen data om te exporteren');
        return;
      }

      const headers = ['Datum', 'Leerling', 'Klas', 'Studie', 'Tijd', 'Leerkracht', 'Status'];
      const rows = data.map(r => [
        formatDateShort(r.date),
        r.studentName,
        r.className,
        r.studyLabelSnapshot,
        `${r.startTime}-${r.endTime}`,
        r.teacherName,
        r.status
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aanmeldingen_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Export gedownload');
    } catch (error) {
      toast.error('Export mislukt');
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
    <div className="space-y-6 animate-fadeIn" data-testid="admin-reports-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rapportage</h1>
          <p className="text-slate-500 mt-1">
            Overzicht en statistieken van aanmeldingen
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={handleExport}
          disabled={loading}
          data-testid="export-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporteren (CSV)
        </Button>
      </div>

      {/* Date filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Van datum</Label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tot datum</Label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleFilter} className="bg-[#2E5C5A] hover:bg-[#244A48]">
              <Calendar className="w-4 h-4 mr-2" />
              Filter toepassen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Totaal aanmeldingen</p>
                <p className="text-3xl font-bold text-slate-900">{summary?.totalRegistrations || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ingeschreven</p>
                <p className="text-3xl font-bold text-emerald-600">{summary?.registered || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Geannuleerd</p>
                <p className="text-3xl font-bold text-rose-600">{summary?.cancelled || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Aanwezigheidsgraad</p>
                <p className="text-3xl font-bold text-[#2E5C5A]">{summary?.attendance?.rate || 0}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Aanwezigheid</CardTitle>
          <CardDescription>Overzicht van geregistreerde aanwezigheden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Aanwezig</span>
                <span className="font-medium text-emerald-600">{summary?.attendance?.present || 0}</span>
              </div>
              <Progress value={summary?.attendance?.total ? (summary.attendance.present / summary.attendance.total) * 100 : 0} className="h-2 bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Afwezig</span>
                <span className="font-medium text-rose-600">{summary?.attendance?.absent || 0}</span>
              </div>
              <Progress value={summary?.attendance?.total ? (summary.attendance.absent / summary.attendance.total) * 100 : 0} className="h-2 bg-slate-100 [&>div]:bg-rose-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Totaal geregistreerd</span>
                <span className="font-medium">{summary?.attendance?.total || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By study type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Per studiesoort</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.byStudyType?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Geen data</p>
            ) : (
              <div className="space-y-3">
                {summary?.byStudyType?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStudyTypeColor(item.studyType?.colorLabel).split(' ')[0]}`} />
                      <span className="text-sm">
                        {item.studyType?.mainType}
                        {item.studyType?.subType && ` - ${item.studyType.subType}`}
                      </span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Per klas</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.byClass?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Geen data</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {summary?.byClass?.filter(c => c.count > 0).sort((a, b) => b.count - a.count).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.class?.name}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
