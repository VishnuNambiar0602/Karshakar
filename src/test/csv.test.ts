import { describe, expect, it } from 'vitest';
import { generateCsv, parseCsv } from '@/lib/csv';

describe('csv helpers', () => {
  const t = (key: string) => key;

  it('parses valid date/value csv rows', () => {
    const parsed = parseCsv('date,value\n2026-01-01,0.55\n2026-01-02,0.61', t);

    if ('error' in parsed) {
      throw new Error(parsed.error);
    }

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ date: '2026-01-01', value: 0.55 });
  });

  it('returns error when required columns are missing', () => {
    const parsed = parseCsv('timestamp,val\n2026-01-01,0.55', t);

    expect(parsed).toEqual({ error: 'dashboard.csv.error.columns' });
  });

  it('parses quoted date/value rows with commas and escaped quotes', () => {
    const parsed = parseCsv('date,value\n"2026-01-01","0.55"\n"2026-01,02","0.61"\n"2026-01-03","""0.73"""', t);

    if ('error' in parsed) {
      throw new Error(parsed.error);
    }

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ date: '2026-01-01', value: 0.55 });
    expect(parsed[1]).toEqual({ date: '2026-01,02', value: 0.61 });
  });

  it('escapes formula-like values during csv generation', () => {
    const csv = generateCsv(
      [
        {
          name: '=HYPERLINK("http://example.com")',
          firstValue: 1,
          lastValue: 2,
          percentageChange: 100,
          n: 5,
          timeSeries: [],
        },
      ],
      t
    );

    expect(csv).toContain("'=HYPERLINK");
  });

  it('escapes other dangerous spreadsheet prefixes', () => {
    const csv = generateCsv(
      [
        {
          name: '+SUM(A1:A2)',
          firstValue: 1,
          lastValue: 2,
          percentageChange: 100,
          n: 5,
          timeSeries: [],
        },
        {
          name: '@cmd',
          firstValue: 1,
          lastValue: 2,
          percentageChange: 100,
          n: 5,
          timeSeries: [],
        },
      ],
      t
    );

    expect(csv).toContain("'+SUM(A1:A2)");
    expect(csv).toContain("'@cmd");
  });
});
