'use client';

import { useState } from 'react';
import Map, { Marker, NavigationControl, type ViewState } from 'react-map-gl';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM, MAPBOX_TOKEN, hasMapbox } from '@/lib/env';

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  className?: string;
}

export function LocationPicker({ value, onChange, className }: Props) {
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    latitude: value?.lat ?? DEFAULT_LAT,
    longitude: value?.lng ?? DEFAULT_LNG,
    zoom: value ? 14 : DEFAULT_ZOOM,
  });

  if (!hasMapbox) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
          Map picker requires a Mapbox token. Enter latitude and longitude manually below.
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-xs text-slate-600">
            Latitude
            <input
              type="number"
              step="0.0001"
              value={value?.lat ?? ''}
              onChange={(e) =>
                onChange({ lat: Number(e.target.value) || 0, lng: value?.lng ?? DEFAULT_LNG })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            Longitude
            <input
              type="number"
              step="0.0001"
              value={value?.lng ?? ''}
              onChange={(e) =>
                onChange({ lat: value?.lat ?? DEFAULT_LAT, lng: Number(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="rounded-lg overflow-hidden border border-slate-300" style={{ height: 320 }}>
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={(e) => onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />
          {value && (
            <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
              <div className="text-2xl drop-shadow" aria-hidden>
                📍
              </div>
            </Marker>
          )}
        </Map>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {value ? (
          <>Pinned at <code className="bg-slate-100 px-1 rounded">{value.lat.toFixed(4)}, {value.lng.toFixed(4)}</code></>
        ) : (
          'Click on the map to drop a pin for this listing.'
        )}
      </p>
    </div>
  );
}
