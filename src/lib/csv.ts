
import type { MetricData, GroundTruthDataPoint } from "@/lib/types";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCsv(csvText: string, t: (key: string) => string): GroundTruthDataPoint[] | { error: string } {
  try {
    const rows = csvText.trim().split(/\r?\n/);
    const header = parseCsvLine((rows.shift() || '').toLowerCase());
    const dateIndex = header.indexOf('date');
    const valueIndex = header.indexOf('value');

    if (dateIndex === -1 || valueIndex === -1) {
      return { error: t('dashboard.csv.error.columns') };
    }

    return rows.map(row => {
      const columns = parseCsvLine(row);
      return {
        date: columns[dateIndex],
        value: parseFloat(columns[valueIndex]),
      };
    }).filter(p => !isNaN(p.value) && p.date);
  } catch {
    return { error: t('dashboard.csv.error.parse') };
  }
}

/**
 * Escapes a value for CSV to prevent CSV injection (DDE) and handle special characters.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  
  // Prevent CSV Injection (DDE): escape leading dangerous characters
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  
  // Handle commas, quotes, and newlines
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

export function generateCsv(data: MetricData[], t: (key: string) => string): string {
  if (!data.length) return "";

  const headers = [
    t('dashboard.metrics.table.metric'),
    t('dashboard.metrics.table.start'),
    t('dashboard.metrics.table.end'),
    t('dashboard.metrics.table.change'),
    t('dashboard.metrics.table.points')
  ].map(h => escapeCsvValue(h)).join(',');

  const rows = data.map(metric => 
    [
      escapeCsvValue(metric.name),
      escapeCsvValue(metric.firstValue?.toFixed(4) ?? 'N/A'),
      escapeCsvValue(metric.lastValue?.toFixed(4) ?? 'N/A'),
      escapeCsvValue(metric.percentageChange?.toFixed(2) ?? 'N/A'),
      escapeCsvValue(metric.n)
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
