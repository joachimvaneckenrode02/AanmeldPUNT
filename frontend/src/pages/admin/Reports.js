import React, { useState, useEffect } from 'react';
import { useReports, useClasses } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { formatDateShort, getStudyTypeColor } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, Download, Calendar, Users, TrendingUp, CheckCircle2, XCircle, BarChart3, UserX
} from 'lucide-react';

export default function AdminReports() {
  const { getSummary, getAttendanceDetail, exportRegistrations, loading } = useReports();
  const { getClasses } = useClasses();
  
  const [summary, setSummary] = useState(null);
  const [attendanceDetail, setAttendanceDetail] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [filterClassId, setFilterClassId] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [summaryData, classesData] = await Promise.all([getSummary({}), getClasses()]);
      setSummary(summaryData);
      setClasses(classesData);
      const detailData = await getAttendanceDetail({});
      setAttendanceDetail(detailData);
    } catch (error) { console.error('Error loading data:', error); }
    finally { setPageLoading(false); }
  };

  const handleFilter = async () => {
    setPageLoading(true);
    try {
      const params = {};
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;
      
      const detailParams = { ...params };
      if (filterClassId !== 'all') detailParams.classId = filterClassId;
      
      const [summaryData, detailData] = await Promise.all([
        getSummary(params),
        getAttendanceDetail(detailParams)
      ]);
      setSummary(summaryData);
      setAttendanceDetail(detailData);
    } catch (error) { console.error('Error filtering:', error); }
    finally { setPageLoading(false); }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;
      
      const data = await exportRegistrations(params);
      if (data.length === 0) { toast.error('Geen data om te exporteren'); return; }

      const headers = ['Datum', 'Leerling', 'Klas', 'Studie', 'Tijd', 'Leerkracht', 'Status'];
      const rows = data.map(r => [
        formatDateShort(r.date), r.studentName, r.className, r.studyLabelSnapshot,
        `${r.startTime}-${r.endTime}`, r.teacherName, r.status
      ]);
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aanmeldingen_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export gedownload');
    } catch (error) { toast.error('Export mislukt'); }
  };

  const handleExportAttendance = () => {
    if (!attendanceDetail?.byStudent?.length) { toast.error('Geen aanwezigheidsdata'); return; }
    
    const headers = ['Leerling', 'Klas', 'Totaal aanmeldingen', 'Aanwezig', 'Afwezig', 'Aanwezigheid %'];
    const rows = attendanceDetail.byStudent.map(s => [
      s.name, s.className, s.total, s.present, s.absent, `${s.rate}%`
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aanwezigheid_rapport_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Aanwezigheidsrapport gedownload');
  };

  const getRateColor = (rate) => {
    if (rate >= 80) return 'text-emerald-600';
    if (rate >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getRateBarColor = (rate) => {
    if (rate >= 80) return '';
    if (rate >= 60) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-rose-500';
  };

  if (pageLoading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" /></div>);
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-reports-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rapportage</h1>
          <p className="text-slate-500 mt-1">Overzicht, statistieken en afwezigheidsrapporten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAttendance} disabled={loading} data-testid="export-attendance-btn">
            <UserX className="w-4 h-4 mr-2" />Aanwezigheid (CSV)
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={loading} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />Aanmeldingen (CSV)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Van datum</Label>
                <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tot datum</Label>
                <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Klas</Label>
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                  <SelectTrigger><SelectValue placeholder="Alle klassen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle klassen</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleFilter} className="bg-[#2E5C5A] hover:bg-[#244A48]">
              <Calendar className="w-4 h-4 mr-2" />Filter toepassen
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
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
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
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
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
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center"><XCircle className="w-6 h-6 text-rose-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Aanwezigheidsgraad</p>
                <p className={`text-3xl font-bold ${getRateColor(summary?.attendance?.rate || 0)}`}>{summary?.attendance?.rate || 0}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-teal-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" />Overzicht</TabsTrigger>
          <TabsTrigger value="students" className="gap-2"><Users className="w-4 h-4" />Per leerling</TabsTrigger>
          <TabsTrigger value="classes" className="gap-2"><Users className="w-4 h-4" />Per klas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>Aanwezigheid</CardTitle><CardDescription>Overzicht van geregistreerde aanwezigheden</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Aanwezig</span><span className="font-medium text-emerald-600">{summary?.attendance?.present || 0}</span></div>
                  <Progress value={summary?.attendance?.total ? (summary.attendance.present / summary.attendance.total) * 100 : 0} className="h-2 bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Afwezig</span><span className="font-medium text-rose-600">{summary?.attendance?.absent || 0}</span></div>
                  <Progress value={summary?.attendance?.total ? (summary.attendance.absent / summary.attendance.total) * 100 : 0} className="h-2 bg-slate-100 [&>div]:bg-rose-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Totaal geregistreerd</span><span className="font-medium">{summary?.attendance?.total || 0}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By study type with attendance */}
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Per studiesoort</CardTitle></CardHeader>
              <CardContent>
                {attendanceDetail?.byStudyType?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Geen data</p>
                ) : (
                  <div className="space-y-4">
                    {attendanceDetail?.byStudyType?.map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStudyTypeColor(item.colorLabel).split(' ')[0]}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-slate-500">{item.total} aanm.</span>
                            <span className={`font-medium ${getRateColor(item.rate)}`}>{item.rate}%</span>
                          </div>
                        </div>
                        <Progress value={item.rate} className={`h-1.5 bg-slate-100 ${getRateBarColor(item.rate)}`} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Per klas</CardTitle></CardHeader>
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
        </TabsContent>

        {/* Per Student Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Aanwezigheid per leerling</CardTitle>
              <CardDescription>Gesorteerd op aanwezigheidspercentage (laagste eerst)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leerling</TableHead><TableHead>Klas</TableHead>
                    <TableHead className="text-center">Totaal</TableHead>
                    <TableHead className="text-center">Aanwezig</TableHead>
                    <TableHead className="text-center">Afwezig</TableHead>
                    <TableHead className="text-right">Aanwezigheid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!attendanceDetail?.byStudent || attendanceDetail.byStudent.length === 0) ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Geen aanwezigheidsdata beschikbaar</TableCell></TableRow>
                  ) : (
                    attendanceDetail.byStudent.map((student, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-slate-500">{student.className}</TableCell>
                        <TableCell className="text-center">{student.total}</TableCell>
                        <TableCell className="text-center text-emerald-600">{student.present}</TableCell>
                        <TableCell className="text-center text-rose-600">{student.absent}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={student.rate} className={`w-16 h-1.5 bg-slate-100 ${getRateBarColor(student.rate)}`} />
                            <span className={`font-medium text-sm w-12 text-right ${getRateColor(student.rate)}`}>{student.rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Class Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Aanwezigheid per klas</CardTitle>
              <CardDescription>Overzicht van aanwezigheidspercentages per klas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klas</TableHead>
                    <TableHead className="text-center">Totaal</TableHead>
                    <TableHead className="text-center">Aanwezig</TableHead>
                    <TableHead className="text-center">Afwezig</TableHead>
                    <TableHead className="text-right">Aanwezigheid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!attendanceDetail?.byClass || attendanceDetail.byClass.length === 0) ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Geen aanwezigheidsdata beschikbaar</TableCell></TableRow>
                  ) : (
                    attendanceDetail.byClass.map((cls, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{cls.className}</TableCell>
                        <TableCell className="text-center">{cls.total}</TableCell>
                        <TableCell className="text-center text-emerald-600">{cls.present}</TableCell>
                        <TableCell className="text-center text-rose-600">{cls.absent}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={cls.rate} className={`w-20 h-2 bg-slate-100 ${getRateBarColor(cls.rate)}`} />
                            <span className={`font-medium text-sm w-12 text-right ${getRateColor(cls.rate)}`}>{cls.rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
