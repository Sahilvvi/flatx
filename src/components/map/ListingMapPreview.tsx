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
    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 260 }}>
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
          <div className="text-2xl drop-shadow" aria-hidden>
            📍
          </div>
        </Marker>
      </Map>
    </div>
  );
}
