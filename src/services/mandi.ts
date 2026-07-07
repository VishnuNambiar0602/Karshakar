import 'server-only';
import { logger } from '@/lib/logger';

export interface MandiPriceItem {
  mandiName: string;
  state: string;
  district: string;
  crop: string;
  variety: string;
  minPrice: number; // INR per Quintal (100 kg)
  maxPrice: number; // INR per Quintal
  modalPrice: number; // INR per Quintal
  date: string;
}

const MANDI_BASE_PRICES: Record<string, { base: number; variety: string; mandis: { name: string; state: string; district: string }[] }> = {
  Rice: {
    base: 2200,
    variety: 'Common Paddy',
    mandis: [
      { name: 'Kurukshetra Mandi', state: 'Haryana', district: 'Kurukshetra' },
      { name: 'Burdwan Mandi', state: 'West Bengal', district: 'Purba Bardhaman' },
      { name: 'Gondia Mandi', state: 'Maharashtra', district: 'Gondia' },
      { name: 'Nalgonda Mandi', state: 'Telangana', district: 'Nalgonda' },
    ]
  },
  Wheat: {
    base: 2400,
    variety: 'Lok-1 / Dara',
    mandis: [
      { name: 'Khanna Mandi', state: 'Punjab', district: 'Ludhiana' },
      { name: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore' },
      { name: 'Hapur Mandi', state: 'Uttar Pradesh', district: 'Hapur' },
      { name: 'Kota Mandi', state: 'Rajasthan', district: 'Kota' },
    ]
  },
  Maize: {
    base: 2090,
    variety: 'Yellow Hybrid',
    mandis: [
      { name: 'Gulabbagh Mandi', state: 'Bihar', district: 'Purnia' },
      { name: 'Davangere Mandi', state: 'Karnataka', district: 'Davangere' },
      { name: 'Chhindwara Mandi', state: 'Madhya Pradesh', district: 'Chhindwara' },
      { name: 'Warangal Mandi', state: 'Telangana', district: 'Warangal' },
    ]
  },
  Cotton: {
    base: 7200,
    variety: 'Medium Staple',
    mandis: [
      { name: 'Adoni Mandi', state: 'Andhra Pradesh', district: 'Kurnool' },
      { name: 'Rajkot Mandi', state: 'Gujarat', district: 'Rajkot' },
      { name: 'Amravati Mandi', state: 'Maharashtra', district: 'Amravati' },
      { name: 'Bathinda Mandi', state: 'Punjab', district: 'Bathinda' },
    ]
  },
  Tomato: {
    base: 1800,
    variety: 'Local Hybrid',
    mandis: [
      { name: 'Kolar Mandi', state: 'Karnataka', district: 'Kolar' },
      { name: 'Pimpalgaon Mandi', state: 'Maharashtra', district: 'Nashik' },
      { name: 'Azadpur Mandi', state: 'Delhi', district: 'North Delhi' },
      { name: 'Madanapalle Mandi', state: 'Andhra Pradesh', district: 'Chittoor' },
    ]
  },
  Potato: {
    base: 1400,
    variety: 'Jyoti / Pukhraj',
    mandis: [
      { name: 'Agra Mandi', state: 'Uttar Pradesh', district: 'Agra' },
      { name: 'Hooghly Mandi', state: 'West Bengal', district: 'Hooghly' },
      { name: 'Deesa Mandi', state: 'Gujarat', district: 'Banaskantha' },
      { name: 'Farrukhabad Mandi', state: 'Uttar Pradesh', district: 'Farrukhabad' },
    ]
  },
  Onion: {
    base: 2500,
    variety: 'Red Onion',
    mandis: [
      { name: 'Lasalgaon Mandi', state: 'Maharashtra', district: 'Nashik' },
      { name: 'Mahuva Mandi', state: 'Gujarat', district: 'Bhavnagar' },
      { name: 'Puna Mandi', state: 'Maharashtra', district: 'Pune' },
      { name: 'Kurnool Mandi', state: 'Andhra Pradesh', district: 'Kurnool' },
    ]
  }
};

/**
 * Gets real-time simulated Mandi prices for a crop.
 */
export function getSimulatedMandiPrices(crop: string): MandiPriceItem[] {
  const normCrop = Object.keys(MANDI_BASE_PRICES).find(
    k => k.toLowerCase() === crop.toLowerCase()
  ) || 'Wheat';
  
  const data = MANDI_BASE_PRICES[normCrop];
  const todayStr = new Date().toISOString().split('T')[0];
  const dateSeed = todayStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  return data.mandis.map((m, index) => {
    const seed = dateSeed + index * 17;
    const variancePercent = ((seed % 15) - 7) / 100;
    const modalPrice = Math.round(data.base * (1 + variancePercent));
    const minPrice = Math.round(modalPrice * 0.9);
    const maxPrice = Math.round(modalPrice * 1.1);

    return {
      mandiName: m.name,
      state: m.state,
      district: m.district,
      crop: normCrop,
      variety: data.variety,
      minPrice,
      maxPrice,
      modalPrice,
      date: todayStr
    };
  });
}

/**
 * Fetches Mandi prices from data.gov.in Agmarknet API, or falls back to simulated data.
 */
export async function getMandiPrices(crop: string): Promise<MandiPriceItem[]> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (apiKey) {
    try {
      const commodityMap: Record<string, string> = {
        Rice: 'Paddy(Dhan)',
        Wheat: 'Wheat',
        Maize: 'Maize',
        Cotton: 'Cotton',
        Tomato: 'Tomato',
        Potato: 'Potato',
        Onion: 'Onion',
      };
      const queryCommodity = commodityMap[crop] || crop;

      const url = `https://api.data.gov.in/resource/9ef8428a-d404-4115-a2d4-b96a1a829680?api-key=${apiKey}&format=json&filters[commodity]=${encodeURIComponent(queryCommodity)}&limit=10`;
      
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.records && json.records.length > 0) {
          logger.info('mandi_prices_fetched_real', { crop, recordsCount: json.records.length });
          return json.records.map((r: any) => ({
            mandiName: `${r.market || 'Mandi'} Market`,
            state: r.state || 'N/A',
            district: r.district || 'N/A',
            crop: crop,
            variety: r.variety || 'Common',
            minPrice: parseFloat(r.min_price || '0'),
            maxPrice: parseFloat(r.max_price || '0'),
            modalPrice: parseFloat(r.modal_price || '0'),
            date: r.arrival_date || new Date().toISOString().split('T')[0],
          }));
        } else {
          logger.warn('mandi_prices_api_empty_records', { crop });
        }
      } else {
        const errText = await res.text();
        logger.error('mandi_prices_api_error', { status: res.status, error: errText });
      }
    } catch (e) {
      logger.error('mandi_prices_api_exception', { error: String(e) });
    }
  }

  logger.info('mandi_prices_fallback_simulated', { crop });
  return getSimulatedMandiPrices(crop);
}
