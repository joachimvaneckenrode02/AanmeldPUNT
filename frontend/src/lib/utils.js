import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTime = (timeStr) => {
  return timeStr || '';
};

export const getWeekdayName = (weekday) => {
  const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
  return days[weekday] || '';
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'registered':
      return 'status-badge-success';
    case 'cancelled':
      return 'status-badge-error';
    case 'completed':
      return 'status-badge-neutral';
    default:
      return 'status-badge-neutral';
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'registered':
      return 'Ingeschreven';
    case 'cancelled':
      return 'Geannuleerd';
    case 'completed':
      return 'Voltooid';
    default:
      return status;
  }
};

export const getStudyTypeColor = (colorLabel) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    red: 'bg-rose-100 text-rose-700 border-rose-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return colors[colorLabel] || colors.gray;
};
