# Strava Running Performance Dashboard (StravaDash)

A high-performance running telemetry dashboard that connects to your Strava profile, retrieves your activity history, and runs analytical models to compute training metrics. 

Designed with a premium **Dark Athletic Chrono** aesthetic using Next.js App Router, Tailwind CSS, and Prisma SQLite.

---

## ⚡ Core Performance Models

* **Fitness & Fatigue Curve (Banister Impulse-Response Model):** Calculates CTL (Chronic Training Load / Fitness) over a 42-day rolling window, ATL (Acute Training Load / Fatigue) over a 7-day window, and TSB (Training Stress Balance / Form) to advise if your body state is Fresh, Optimal, or Overreaching.
* **Polarized Heart-Rate Zone Index:** Evaluates heart-rate time-in-zones and prints a polarized score, checking if you follow the 80/20 athletic rule (keeping 80%+ of volume in low-intensity Z1/Z2 recovery zones to build aerobic base capacity).
* **Riegel Race predictions:** Dynamically estimates your finish times for 5k, 10k, Half Marathon, and Full Marathon based on your current running baseline.
* **All-Time Personal Records:** Scans your activities to index your fastest times for 400m, 800m, 1k, 1mi, 5k, 10k, Half, and Full Marathons.
* **Consistency Heatmap:** Visualizes weekly training frequency grids.

---

## 🚀 Getting Started

### 1. Register a Strava API Application
To pull your personal data, you need to create a developer application on Strava:
1. Log into [Strava Settings](https://www.strava.com/settings/api).
2. Create an application.
3. Configure the following properties:
   * **Category:** Visualizer / Dashboard
   * **Authorization Redirect Domain:** `localhost:3000`
4. Make note of your **Client ID** and **Client Secret**.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
# Strava Developer Keys
STRAVA_CLIENT_ID="YOUR_STRAVA_CLIENT_ID"
STRAVA_CLIENT_SECRET="YOUR_STRAVA_CLIENT_SECRET"
STRAVA_REDIRECT_URI="http://localhost:3000/auth/callback"

# Database Configuration (Defaults to local SQLite)
DATABASE_URL="file:./dev.db"
```

### 3. Install & Sync
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the database tables and generate client models:
   ```bash
   npx prisma db push
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000), click **Connect with Strava**, and authorize the app. The engine will synchronize your running activities and compute your dashboard telemetry.

---

## 🛠 Tech Stack
* **Framework:** Next.js (App Router, Server Actions)
* **Styling:** Tailwind CSS (Custom Dark Chrono tokens)
* **Database / ORM:** Prisma with SQLite (fully compatible with PostgreSQL/Neon for production deployment)
* **Visuals:** Hand-drawn React SVG charting (no third-party heavy dependencies, React 19 native)
