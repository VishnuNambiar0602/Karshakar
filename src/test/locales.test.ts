import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Locales Key Parity Validation', () => {
  const localesDir = path.join(process.cwd(), 'src/locales');
  const enFilePath = path.join(localesDir, 'en.json');
  
  // Read and parse en.json as reference
  const enContent = fs.readFileSync(enFilePath, 'utf8');
  const enJson = JSON.parse(enContent);
  const enKeys = Object.keys(enJson).sort();

  const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  localeFiles.forEach(file => {
    it(`should validate JSON parsing and key parity for ${file}`, () => {
      const filePath = path.join(localesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 1. JSON parsing check
      let parsedJson: Record<string, string>;
      expect(() => {
        parsedJson = JSON.parse(content);
      }).not.toThrow();
      
      parsedJson = JSON.parse(content);
      const keys = Object.keys(parsedJson).sort();

      // 2. Check for missing keys
      const missingKeys = enKeys.filter(k => !keys.includes(k));
      expect(missingKeys, `${file} is missing keys: ${missingKeys.join(', ')}`).toEqual([]);

      // 3. Check for extra keys
      const extraKeys = keys.filter(k => !enKeys.includes(k));
      expect(extraKeys, `${file} has extra keys not present in en.json: ${extraKeys.join(', ')}`).toEqual([]);
    });
  });
});
