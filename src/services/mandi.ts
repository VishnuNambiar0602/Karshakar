import 'server-only';

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
export async function getMandiPrices(crop: string): Promise<MandiPriceItem[]> {
  const normCrop = Object.keys(MANDI_BASE_PRICES).find(
    k => k.toLowerCase() === crop.toLowerCase()
  ) || 'Wheat';
  
  const data = MANDI_BASE_PRICES[normCrop];
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Seed price based on date to maintain consistency within a day
  const dateSeed = todayStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  return data.mandis.map((m, index) => {
    // Generate deterministic variance based on date + mandi index
    const seed = dateSeed + index * 17;
    const variancePercent = ((seed % 15) - 7) / 100; // -7% to +7%
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
