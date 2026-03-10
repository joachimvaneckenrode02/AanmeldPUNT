import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudyTypes, useStudyMoments } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatDate, formatDateShort, getStudyTypeColor, getWeekdayName } from '../lib/utils';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  Users, 
  UserPlus,
  Filter,
  ChevronRight
} from 'lucide-react';

export default function AvailableStudies() {
  const { getStudyTypes } = useStudyTypes();
  const { getAvailableMoments } = useStudyMoments();

  const [studyTypes, setStudyTypes] = useState([]);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMoments();
  }, [selectedType]);

  const loadData = async () => {
    try {
      const types = await getStudyTypes();
      setStudyTypes(types);
      await loadMoments();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoments = async () => {
    try {
      const studyTypeId = selectedType === 'all' ? null : selectedType;
      const data = await getAvailableMoments(studyTypeId);
      setMoments(data);
    } catch (error) {
      console.error('Error loading moments:', error);
    }
  };

  // Group moments by date
  const groupedMoments = moments.reduce((groups, moment) => {
    const date = moment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(moment);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="available-studies-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Beschikbare studies</h1>
          <p className="text-slate-500 mt-1">
            Bekijk alle beschikbare studiemomenten en vrije plaatsen
          </p>
        </div>
        <Button asChild className="bg-[#2E5C5A] hover:bg-[#244A48]">
          <Link to="/aanmelden">
            <UserPlus className="w-4 h-4 mr-2" />
            Nieuwe aanmelding
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="w-64">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="filter-study-type">
                  <SelectValue placeholder="Filter op studiesoort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle studiesoorten</SelectItem>
                  {studyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.mainType}
                      {type.subType && ` - ${type.subType}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moments list */}
      {Object.keys(groupedMoments).length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Geen beschikbare momenten
            </h3>
            <p className="text-slate-500">
              Er zijn momenteel geen studiemomenten met vrije plaatsen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMoments).map(([date, dateMoments]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2E5C5A]" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {formatDate(date)}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-5">
                {dateMoments.map((moment) => {
                  const spotsPercentage = (moment.currentRegistrations / moment.capacity) * 100;
                  const isAlmostFull = moment.availableSpots <= 3;
                  
                  return (
                    <Card 
                      key={moment.id} 
                      className="border-0 shadow-sm card-hover overflow-hidden"
                    >
                      <div className={`h-1.5 ${
                        isAlmostFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} style={{ width: `${spotsPercentage}%` }} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStudyTypeColor(moment.studyType?.colorLabel)}`}>
                            {moment.studyType?.mainType}
                            {moment.studyType?.subType && (
                              <span className="block text-xs opacity-75">
                                {moment.studyType.subType}
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-semibold ${
                            isAlmostFull ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {moment.availableSpots} vrij
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {moment.startTime} - {moment.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users className="w-4 h-4 text-slate-400" />
                            {moment.currentRegistrations} / {moment.capacity} plaatsen
                          </div>
                        </div>
                        
                        <Button 
                          asChild 
                          variant="outline" 
                          className="w-full"
                          size="sm"
                        >
                          <Link to={`/aanmelden?moment=${moment.id}`}>
                            Aanmelden
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
