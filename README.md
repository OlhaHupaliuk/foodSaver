# FoodSaver

FoodSaver is a full‑stack mobile app that helps restaurants sell surplus food at a discount and lets users discover nearby deals. The project includes:
- **Frontend:** Expo Router (React Native + TypeScript, NativeWind) app with auth flows, role‑based tabs, restaurant/food listings, orders, reviews, and owner statistics.
- **Backend:** Node.js + Express + MongoDB API with JWT auth, role checks, reviews, analytics, and geospatial queries for nearby items.

## Repository Structure
- `foodsaver/` – Expo mobile app.
- `foodsaver-backend/` – Express/MongoDB API.

## Backend Setup (`foodsaver-backend`)
1. Install dependencies:
   ```sh
   cd foodsaver-backend
   npm install
   ```
2. Create `.env` in `foodsaver-backend`:
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/foodsaver
   JWT_SECRET=replace-with-strong-secret
   JWT_EXPIRE=7d
   # Optional for address geocoding:
   GOOGLE_MAPS_API_KEY=your-key
   ```
3. Run the API:
   ```
   npm run dev    # with nodemon
   # or
   npm start
   ```
4. The server will listen on `http://localhost:5000` by default. Confirm the health check at `/`.

## Frontend Setup (`foodsaver`)
1. Install dependencies:
   ```
   cd foodsaver
   npm install
   ```
2. Update `API_URL` in `services/api.ts` to the machine/IP reachable from your emulator or device (e.g., `http://192.168.x.x:5000/api`).
3. Start the Expo app:
   ```sh
   npm run start       # opens Expo CLI
   npm run android     # Android emulator/device
   npm run ios         # iOS simulator (macOS)
   npm run web         # Web preview
   ```
4. If using a physical device, ensure it’s on the same network as the backend host. Scan the QR from Expo CLI or use a tunnel if needed.
