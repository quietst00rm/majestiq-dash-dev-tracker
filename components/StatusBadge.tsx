import React from 'react';
import { ApplicantStatus } from '../types';

interface Props {
  status: ApplicantStatus;
}

const styles: Record<ApplicantStatus, string> = {
  [ApplicantStatus.NEW]: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/30',
  [ApplicantStatus.REVIEWING]: 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-400/30',
  [ApplicantStatus.INTERVIEW]: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-400/30',
  [ApplicantStatus.OFFER]: 'bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-700/10 dark:bg-pink-900/30 dark:text-pink-300 dark:ring-pink-400/30',
  [ApplicantStatus.HIRED]: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/30',
  [ApplicantStatus.REJECTED]: 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

export const StatusBadge: React.FC<Props> = ({ status }) => {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};