# Kisan Alert - Smart Farmer Advisory & Satellite Monitoring Portal

Kisan Alert is a farmer-first agricultural portal designed to provide real-time soil condition diagnostics, automated weather alerts, and AI-powered crop leaf disease pathology. Powered by the **Earth Insights** satellite and machine learning engine, Kisan Alert bridges the gap between complex geospatial data and actionable agricultural advice.

---

## 🌾 Core Capabilities

### 1. Interactive 3D Satellite Plot Tracker
Farmers can register their land plots by latitude and longitude. The plots are mapped onto a rotating, mouse-interactive 3D globe as glowing markers that pulse in colors reflecting active alert severity.

### 2. Automatic Meteorological & Soil Alerts
Kisan Alert runs evaluations on a 4-hour schedule comparing local crop plots with live sensor records from the Open-Meteo and Soil APIs. Immediate warnings are generated for conditions such as:
*   **Volumetric Water Content (VWC) anomalies** (dry soil or waterlogging saturation).
*   **Extreme heatwaves** (above 40°C).
*   **Frost hazards** (below 4°C).
*   **Heavy precipitation** (flooding risks).
*   **Irrigation recommendations** (approximate watering depths tailored to crop types).

### 3. AI Crop Leaf Pathology Scanner
Upload a photograph of a plant leaf with spots or insect damage. Using **Gemini Vision** (with local fallback mock classification), the portal analyzes the leaf to identify:
*   Pest infestations, disease strains, or nutritional deficiencies.
*   Organic control remedies (traditional, chemical-free methods).
*   Chemical remedies.
*   Long-term crop rotation and irrigation prevention schedules.

### 4. Text-to-Speech Voice Advisories
To support low-literacy users and improve accessibility, farmers can click a "listen" button on any active alert warning or AI diagnostic result card to play an audio advisory read out in their regional language.

### 5. Mandi Rates Market Ticker
Surfaces live commodity prices per Quintal for major Indian crops (Wheat, Rice, Cotton, Tomato, Potato, Onion, etc.) by connecting to the **data.gov.in Agmarknet API**, complete with minimum, maximum, and modal price trading ranges.

---

## ⚡ The Earth Insights Advanced Analytics Engine
Under the hood, Kisan Alert is backed by the high-performance **Earth Insights** engine:
*   **Geospatial Processing:** Uses Google Earth Engine to compute spectral indices (NDVI for vegetation health, NDWI for water detection, NDBI for urban growth, and NBR for burn assessment).
*   **Machine Learning:** Employs a customized U-Net segmentation architecture to classify land cover and forecast crop yields.
*   **Serverless Chaining:** Runs Cloud Run Jobs and Google Cloud Workflows to handle high-throughput batch operations.

---

## 🛠️ Technical Foundation

*   **Framework:** Next.js 15 (App Router)
*   **Runtime:** Node.js
*   **Notifications:** Twilio SMS + WhatsApp Cloud API
*   **AI Framework:** Google Genkit + Gemini 2.5
*   **Database:** Dual-storage architecture (Firestore + local file JSON DB fallback)
*   **Test Suite:** Vitest (including JSON locales key-parity tests)

---

## 💰 MVP Tier Notice
The Kisan Alert MVP is **100% free** for all farmers. Pricing tiers and paid checkout pages have been hidden for this milestone. All registered farmers receive full access to alerts, diagnostics, and mandi lookups.

---

## 📖 Documentation
*   [Kisan Alert Roadmap](TODO.md)
*   [Technical Architecture](docs/ARCHITECTURE.md)
*   [Comprehensive Project Documentation](docs/PROJECT_DOCUMENTATION.md)
