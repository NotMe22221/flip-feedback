interface SessionExportData {
  id: string;
  created_at: string;
  ai_score: number | null;
  posture_score: number | null;
  stability_score: number | null;
  smoothness_score: number | null;
  avg_knee_angle: number | null;
  avg_hip_angle: number | null;
  landing_stability: number | null;
  duration_seconds: number | null;
  voice_notes: string | null;
  feedback_text: string | null;
  video_path: string | null;
}

const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportSessionsToCSV = (sessions: SessionExportData[]): string => {
  const headers = [
    'Session ID',
    'Date',
    'Time',
    'AI Score',
    'Posture Score (%)',
    'Stability Score (%)',
    'Smoothness Score (%)',
    'Avg Knee Angle',
    'Avg Hip Angle',
    'Landing Stability',
    'Duration (seconds)',
    'Video Path',
    'Feedback',
    'Voice Notes'
  ];

  const rows = sessions.map(session => {
    const date = new Date(session.created_at);
    return [
      escapeCSVField(session.id),
      escapeCSVField(date.toLocaleDateString()),
      escapeCSVField(date.toLocaleTimeString()),
      escapeCSVField(session.ai_score?.toFixed(2) ?? ''),
      escapeCSVField(session.posture_score ?? ''),
      escapeCSVField(session.stability_score ?? ''),
      escapeCSVField(session.smoothness_score ?? ''),
      escapeCSVField(session.avg_knee_angle?.toFixed(2) ?? ''),
      escapeCSVField(session.avg_hip_angle?.toFixed(2) ?? ''),
      escapeCSVField(session.landing_stability?.toFixed(2) ?? ''),
      escapeCSVField(session.duration_seconds?.toFixed(2) ?? ''),
      escapeCSVField(session.video_path ?? ''),
      escapeCSVField(session.feedback_text ?? ''),
      escapeCSVField(session.voice_notes ?? '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
