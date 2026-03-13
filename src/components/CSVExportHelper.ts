// CSVExportHelper for SimpleTrackers.io
export function exportToCSV(data: Array<Record<string, any>>, filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csvRows = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))];
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
