'use client';

import dynamic from 'next/dynamic';
import MainLayout from '../../components/MainLayout.js';

// Dynamic import with SSR disabled to prevent Leaflet "window is not defined" error in SSR
const TravelMap = dynamic(
  () => import('../../components/TravelMap.js'),
  { 
    ssr: false,
    loading: () => <div className="text-center py-5 text-white">Loading Interactive Maps...</div>
  }
);

export default function TravelMapPage() {
  return (
    <MainLayout>
      <div className="mb-4">
        <h2 className="fw-bold font-heading text-white m-0">🗺️ Interactive Travel Map</h2>
        <p className="text-secondary m-0">Log visited locations, draw itineraries, and map out paths.</p>
      </div>
      <TravelMap />
    </MainLayout>
  );
}
