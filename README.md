# Earth Insights Analysis Platform

The Earth Insights Analysis Platform is a comprehensive geospatial application designed to provide environmental and agricultural analytics. By utilizing NASA Landsat satellite imagery and real-time meteorological data, the platform delivers actionable insights for land management, climate monitoring, and agricultural optimization.

## Core Capabilities

### Geospatial Analytics
The platform leverages Google Earth Engine to process satellite data and compute critical environmental indices:
*   Normalized Difference Vegetation Index (NDVI) for vegetation health monitoring.
*   Normalized Difference Water Index (NDWI) for surface water detection and analysis.
*   Normalized Difference Built-up Index (NDBI) for monitoring urban expansion.
*   Normalized Burn Ratio (NBR) for assessment of burn severity in fire-affected regions.

### Land Cover Classification
Automated analysis compares historical and current satellite imagery to identify changes in land use, including deforestation, urbanization, and water body fluctuations.

### Artificial Intelligence Integration
The system integrates Google Gemini and other Large Language Models to interpret complex geospatial datasets. This provides users with natural language summaries of environmental trends and predictive agricultural advice.

### Meteorological Integration
Real-time and historical data from the Open-Meteo API are correlated with satellite observations to provide a holistic view of environmental conditions, including soil moisture and precipitation trends.

## Technical Foundation

*   **Framework:** Next.js 15 (App Router)
*   **Runtime:** Node.js
*   **Data Processing:** Google Earth Engine
*   **AI Framework:** Google Genkit
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS and Radix UI
*   **Database Integration:** Firebase Admin SDK (Initialization ready)

## Implementation Details

The application is structured as a modern full-stack platform. Server-side logic handles high-compute tasks and secure API communication, while the client-side dashboard provides interactive visualizations using Recharts. A robust fallback mechanism is implemented to ensure AI service availability across multiple providers, including Groq and Mistral.

## Documentation

For more detailed information, please refer to the following documents:
*   [Comprehensive Project Documentation](docs/PROJECT_DOCUMENTATION.md)
*   [Technical Architecture](docs/ARCHITECTURE.md)
*   [Development Roadmap](docs/ROADMAP.md)
