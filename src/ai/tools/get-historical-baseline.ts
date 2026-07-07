
/**
 * @fileOverview A tool/utility to fetch or simulate historical baseline data for a location.
 * Currently simulates data based on latitude.
 */

export interface HistoricalBaseline {
  description: string;
  averageNDVI: number;
  averageNDWI: number;
}

export async function getHistoricalBaseline(latitude: number, longitude: number): Promise<HistoricalBaseline> {
  // SIMULATION: In a real app, this would query a database of historical satellite data.
  // For now, we return a plausible baseline based on simple geography logic.

  let description = "Unknown region";
  let averageNDVI = 0.5;
  let averageNDWI = 0.0;

  if (Math.abs(latitude) < 23.5) {
    description = "Tropical region. Expect high vegetation density and consistent seasonal patterns.";
    averageNDVI = 0.7;
    averageNDWI = 0.1;
  } else if (Math.abs(latitude) < 50) {
    description = "Temperate region. Expect distinct seasonal variations in vegetation (growing season vs. dormant).";
    averageNDVI = 0.5;
    averageNDWI = -0.1;
  } else {
    description = "Polar/Subpolar region. Sparse vegetation, potential snow cover.";
    averageNDVI = 0.2;
    averageNDWI = 0.2;
  }

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    description,
    averageNDVI,
    averageNDWI
  };
}
