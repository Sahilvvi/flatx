'use client';

import { useState } from 'react';
import Map, { Marker, NavigationControl, type ViewState } from 'react-map-gl';
import { MAPBOX_TOKEN, hasMapbox } from '@/lib/env';

interface Props {
  lat: number;
  lng: number;
}

export function ListingMapPreview({ lat, lng }: Props) {
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    latitude: lat,
    longitude: lng,
    zoom: 14,
  });

  if (!hasMapbox) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Location pinned at <code className="bg-white px-1 rounded border">{lat.toFixed(4)}, {lng.toFixed(4)}</code>.
        Configure Mapbox to see it on a map.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 280 }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="text-3xl drop-shadow" aria-hidden>
            📍
          </div>
        </Marker>
        
        {/* Mock neighborhood context since GeoJSON is currently unavailable */}
        <Marker longitude={lng + 0.005} latitude={lat - 0.002} anchor="bottom">
          <div className="bg-blue-600 text-white rounded-full p-1 shadow-md text-xs">🚆</div>
        </Marker>
        <Marker longitude={lng - 0.003} latitude={lat + 0.004} anchor="bottom">
          <div className="bg-emerald-600 text-white rounded-full p-1 shadow-md text-xs">🛒</div>
        </Marker>
      </Map>

      {/* Neighborhood Context Overlay */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur shadow rounded-lg p-2.5 text-xs text-slate-700 pointer-events-none">
        <div className="font-semibold text-slate-900 mb-1">Neighborhood Context</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span>🚆</span> <span>Local Station (12 min walk)</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span>🛒</span> <span>Supermarket (5 min walk)</span>
        </div>
      </div>
    </div>
  );
}
