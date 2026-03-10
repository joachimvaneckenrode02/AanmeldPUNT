import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard, useStudyMoments, useRegistrations } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatDate, formatDateShort, getStatusBadgeClass, getStatusLabel, getStudyTypeColor } from '../lib/utils';
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  UserPlus,
  ChevronRight,
  Loader2,
  BookOpen,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { getStats, seedData, loading: statsLoading } = useDashboard();
  const { getAvailableMoments } = useStudyMoments();
  const { getMyRegistrations } = useRegistrations();
  
  const [stats, setStats] = useState(null);
  const [upcomingMoments, setUpcomingMoments] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, momentsData, registrationsData] = await Promise.all([
        getStats(),
        getAvailableMoments(),
        getMyRegistrations()
      ]);
      
      setStats(statsData);
      setUpcomingMoments(momentsData.slice(0, 5));
      setRecentRegistrations(registrationsData.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedData();
      toast.success(`Data aangemaakt: ${result.created.studyTypes} studiesoorten, ${result.created.classes} klassen, ${result.created.emailTemplates} templates`);
      loadDashboardData();
    } catch (error) {
      toast.error('Fout bij aanmaken voorbeelddata');
    } finally {
      setSeeding(false);
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
    <div className="space-y-8 animate-fadeIn" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welkom, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1">
            {formatDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-[#2E5C5A] hover:bg-[#244A48]" data-testid="new-registration-btn">
            <Link to="/aanmelden">
              <UserPlus className="w-4 h-4 mr-2" />
              Nieuwe aanmelding
            </Link>
          </Button>
          {isAdmin() && (
            <Button 
              variant="outline" 
              onClick={handleSeedData}
              disabled={seeding}
              data-testid="seed-data-btn"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Voorbeelddata
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <Card className="border-0 shadow-sm card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Studies vandaag</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.today?.moments || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Aanmeldingen vandaag</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.today?.registrations || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Mijn aanmeldingen</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.myRegistrations || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Deze week</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.weekRegistrations || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Study Moments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Komende studiemomenten</CardTitle>
              <CardDescription>Beschikbare plaatsen</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/beschikbaar">
                Alles bekijken
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingMoments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Geen komende studiemomenten</p>
                {isAdmin() && (
                  <Button variant="link" className="mt-2" asChild>
                    <Link to="/admin/beschikbaarheid">Momenten aanmaken</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMoments.map((moment) => (
                  <div
                    key={moment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStudyTypeColor(moment.studyType?.colorLabel)}`}>
                        {moment.studyType?.mainType}
                        {moment.studyType?.subType && ` - ${moment.studyType.subType}`}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateShort(moment.date)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {moment.startTime} - {moment.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${moment.availableSpots <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {moment.availableSpots} vrij
                      </span>
                      <p className="text-xs text-slate-500">
                        van {moment.capacity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Mijn recente aanmeldingen</CardTitle>
              <CardDescription>Laatst toegevoegd</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/mijn-aanmeldingen">
                Alles bekijken
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Nog geen aanmeldingen</p>
                <Button variant="link" className="mt-2" asChild>
                  <Link to="/aanmelden">Eerste aanmelding maken</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {reg.studentName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{reg.className}</span>
                        <span className="text-xs text-slate-300">|</span>
                        <span className="text-xs text-slate-500">{reg.studyLabelSnapshot}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge ${getStatusBadgeClass(reg.status)}`}>
                        {getStatusLabel(reg.status)}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDateShort(reg.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-[#2E5C5A] to-[#1A3C3A] text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Snelle acties</h3>
              <p className="text-white/70 text-sm">
                Begin snel met de meest gebruikte functies
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 text-white border-0"
                asChild
              >
                <Link to="/aanmelden">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Aanmelden
                </Link>
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 text-white border-0"
                asChild
              >
                <Link to="/beschikbaar">
                  <Calendar className="w-4 h-4 mr-2" />
                  Studies bekijken
                </Link>
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 text-white border-0"
                asChild
              >
                <Link to="/mijn-aanmeldingen">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Mijn lijst
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
