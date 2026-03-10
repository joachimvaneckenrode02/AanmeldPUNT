import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudyTypes, useStudyMoments, useClasses, useRegistrations } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatDateShort, getStudyTypeColor } from '../lib/utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  UserPlus, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Registration() {
  const { user } = useAuth();
  const { getStudyTypes } = useStudyTypes();
  const { getAvailableMoments, getMoment } = useStudyMoments();
  const { getClasses } = useClasses();
  const { createRegistration, loading: submitting } = useRegistrations();

  const [studyTypes, setStudyTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [availableMoments, setAvailableMoments] = useState([]);
  const [selectedMomentDetails, setSelectedMomentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    teacherName: user?.name || '',
    teacherEmail: user?.email || '',
    studentName: '',
    classId: '',
    studyTypeId: '',
    studyMomentId: '',
    note: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        teacherName: user.name,
        teacherEmail: user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    if (formData.studyTypeId) {
      loadAvailableMoments(formData.studyTypeId);
    } else {
      setAvailableMoments([]);
      setFormData(prev => ({ ...prev, studyMomentId: '' }));
    }
  }, [formData.studyTypeId]);

  useEffect(() => {
    if (formData.studyMomentId) {
      loadMomentDetails(formData.studyMomentId);
    } else {
      setSelectedMomentDetails(null);
    }
  }, [formData.studyMomentId]);

  const loadInitialData = async () => {
    try {
      const [typesData, classesData] = await Promise.all([
        getStudyTypes(),
        getClasses()
      ]);
      setStudyTypes(typesData);
      setClasses(classesData);
    } catch (error) {
      toast.error('Fout bij laden van gegevens');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMoments = async (studyTypeId) => {
    try {
      const moments = await getAvailableMoments(studyTypeId);
      setAvailableMoments(moments);
    } catch (error) {
      console.error('Error loading moments:', error);
    }
  };

  const loadMomentDetails = async (momentId) => {
    try {
      const details = await getMoment(momentId);
      setSelectedMomentDetails(details);
    } catch (error) {
      console.error('Error loading moment details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createRegistration(formData);
      setSuccess(true);
      toast.success('Aanmelding succesvol geregistreerd!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          teacherName: user?.name || '',
          teacherEmail: user?.email || '',
          studentName: '',
          classId: '',
          studyTypeId: '',
          studyMomentId: '',
          note: ''
        });
        setSelectedMomentDetails(null);
      }, 2000);
    } catch (error) {
      // Error is handled by useApi hook
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5C5A]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto animate-scaleIn">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Aanmelding geslaagd!
            </h2>
            <p className="text-slate-500">
              De leerling is succesvol aangemeld voor de studie.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn" data-testid="registration-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leerling aanmelden</h1>
        <p className="text-slate-500 mt-1">
          Meld een leerling aan voor een studiemoment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2E5C5A]" />
                Aanmeldingsformulier
              </CardTitle>
              <CardDescription>
                Vul alle gegevens in om de aanmelding te voltooien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Teacher info (readonly) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50">
                  <div>
                    <Label className="text-xs text-slate-500">Leerkracht</Label>
                    <p className="font-medium text-slate-900">{formData.teacherName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">E-mail</Label>
                    <p className="font-medium text-slate-900">{formData.teacherEmail}</p>
                  </div>
                </div>

                {/* Student info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Naam leerling *</Label>
                    <Input
                      id="studentName"
                      placeholder="Voornaam Achternaam"
                      value={formData.studentName}
                      onChange={(e) => handleChange('studentName', e.target.value)}
                      required
                      data-testid="student-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classId">Klas *</Label>
                    <Select
                      value={formData.classId}
                      onValueChange={(value) => handleChange('classId', value)}
                      required
                    >
                      <SelectTrigger data-testid="class-select">
                        <SelectValue placeholder="Selecteer klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Study type */}
                <div className="space-y-2">
                  <Label htmlFor="studyTypeId">Type studie *</Label>
                  <Select
                    value={formData.studyTypeId}
                    onValueChange={(value) => handleChange('studyTypeId', value)}
                    required
                  >
                    <SelectTrigger data-testid="study-type-select">
                      <SelectValue placeholder="Selecteer studiesoort" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.mainType}
                          {type.subType && ` - ${type.subType}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Study moment */}
                <div className="space-y-2">
                  <Label htmlFor="studyMomentId">Datum / moment *</Label>
                  {!formData.studyTypeId ? (
                    <p className="text-sm text-slate-500 p-3 rounded-lg bg-slate-50">
                      Selecteer eerst een studiesoort om beschikbare momenten te zien
                    </p>
                  ) : availableMoments.length === 0 ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Geen beschikbare momenten</span>
                      </div>
                      <p className="text-sm text-amber-600 mt-1">
                        Er zijn momenteel geen momenten beschikbaar voor dit type studie.
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={formData.studyMomentId}
                      onValueChange={(value) => handleChange('studyMomentId', value)}
                      required
                    >
                      <SelectTrigger data-testid="study-moment-select">
                        <SelectValue placeholder="Selecteer moment" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMoments.map((moment) => (
                          <SelectItem key={moment.id} value={moment.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {formatDateShort(moment.date)} | {moment.startTime} - {moment.endTime}
                              </span>
                              <span className={`ml-3 text-xs ${moment.availableSpots <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                ({moment.availableSpots} vrij)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Opmerking (optioneel)</Label>
                  <Textarea
                    id="note"
                    placeholder="Eventuele opmerkingen..."
                    value={formData.note}
                    onChange={(e) => handleChange('note', e.target.value)}
                    rows={3}
                    data-testid="note-input"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#2E5C5A] hover:bg-[#244A48]"
                  disabled={submitting || !formData.studyMomentId}
                  data-testid="submit-registration-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Bezig met aanmelden...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Leerling aanmelden
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Side panel - Moment details */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Moment details</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedMomentDetails ? (
                <p className="text-sm text-slate-500">
                  Selecteer een moment om de details te zien
                </p>
              ) : (
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg border ${getStudyTypeColor(selectedMomentDetails.studyType?.colorLabel)}`}>
                    <p className="font-medium">
                      {selectedMomentDetails.studyType?.mainType}
                    </p>
                    {selectedMomentDetails.studyType?.subType && (
                      <p className="text-sm">{selectedMomentDetails.studyType.subType}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{formatDateShort(selectedMomentDetails.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {selectedMomentDetails.startTime} - {selectedMomentDetails.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {selectedMomentDetails.currentRegistrations} / {selectedMomentDetails.capacity} plaatsen bezet
                      </span>
                    </div>
                  </div>

                  {selectedMomentDetails.registrations?.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                        Reeds ingeschreven
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedMomentDetails.registrations.map((reg) => (
                          <div key={reg.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-900">{reg.studentName}</span>
                            <span className="text-slate-500">{reg.className}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
