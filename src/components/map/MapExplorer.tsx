'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
  type ViewState,
} from 'react-map-gl';
import useSupercluster from 'use-supercluster';
import type { BBox } from 'geojson';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM, MAPBOX_TOKEN, hasMapbox } from '@/lib/env';
import type { Listing } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { FiltersPanel, DEFAULT_FILTERS, type FiltersState } from '@/components/FiltersPanel';
import { ListingCard } from '@/components/ListingCard';

interface Props {
  initialListings: Listing[];
}

export function MapExplorer({ initialListings }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    zoom: DEFAULT_ZOOM,
  });
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bounds, setBounds] = useState<BBox | null>(null);

  // Fetch listings whenever filters or centre change (debounced).
  useEffect(() => {
    const handle = setTimeout(() => {
      const { latitude, longitude } = viewState;
      if (latitude === undefined || longitude === undefined) return;
      setLoading(true);
      const params = new URLSearchParams({
        lat: String(latitude),
        lng: String(longitude),
        radius: String(filters.radiusM),
      });
      if (filters.minRent) params.set('minRent', String(filters.minRent));
      if (filters.maxRent) params.set('maxRent', String(filters.maxRent));
      if (filters.kind) params.set('kind', filters.kind);
      filters.bhk.forEach((b) => params.append('bhk', b));
      filters.furnishing.forEach((f) => params.append('furnishing', f));
      fetch(`/api/listings/nearby?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.listings)) setListings(data.listings);
        })
        .catch(() => {
          /* keep previous data */
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
    // We intentionally depend on the primitive lat/lng, not the whole viewState
    // object — the zoom changes continuously while dragging and would thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState.latitude, viewState.longitude, filters]);

  const points = useMemo(
    () =>
      listings.map((l) => ({
        type: 'Feature' as const,
        properties: { cluster: false, listingId: l.id, rent: l.rent, kind: l.kind },
        geometry: { type: 'Point' as const, coordinates: [l.lng, l.lat] as [number, number] },
      })),
    [listings],
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds ?? undefined,
    zoom: viewState.zoom ?? DEFAULT_ZOOM,
    options: { radius: 60, maxZoom: 16 },
  });

  const onMapMove = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getMap().getBounds();
    if (!b) return;
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }, []);

  const onClusterClick = useCallback(
    (clusterId: number, lat: number, lng: number) => {
      if (!supercluster) return;
      const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 18);
      setViewState((v) => ({ ...v, latitude: lat, longitude: lng, zoom: expansionZoom }));
    },
    [supercluster],
  );

  const activeListing = listings.find((l) => l.id === activeId) ?? null;

  return (
    <div className="relative h-[calc(100vh-56px)] w-full flex">
      {/* Filters toggle — mobile */}
      <button
        type="button"
        onClick={() => setFiltersOpen((o) => !o)}
        className="absolute z-30 top-3 left-3 md:hidden bg-white shadow rounded-full px-3 py-2 text-xs font-semibold"
      >
        ⚙️ Filters
      </button>

      {/* Sidebar: filters + results */}
      <aside
        className={[
          'w-full md:w-[380px] shrink-0 bg-white md:border-r border-slate-200 flex flex-col',
          'md:h-full md:static absolute inset-0 z-20 transition-transform',
          mobileView === 'list' ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="border-b border-slate-200">
          <FiltersPanel
            value={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </div>
        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 text-xs text-slate-500">
          <span>
            {loading ? 'Loading…' : `${listings.length} listing${listings.length === 1 ? '' : 's'}`}
          </span>
          <Link href="/listings/new" className="text-[color:var(--brand)] font-semibold">
            + Add listing
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-3">
          {listings.length === 0 && !loading && (
            <div className="text-center text-slate-500 text-sm py-12">
              No listings in this area. Try widening the radius or panning the map.
            </div>
          )}
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              active={l.id === activeId}
              onHover={setActiveId}
              onClick={(lis) => {
                setActiveId(lis.id);
                setViewState((v) => ({ ...v, latitude: lis.lat, longitude: lis.lng, zoom: Math.max(v.zoom ?? 13, 14) }));
                setMobileView('map');
              }}
            />
          ))}
        </div>
      </aside>

      {/* Filters drawer — mobile overlay */}
      {filtersOpen && (
        <div className="absolute inset-0 z-40 bg-black/30 md:hidden" onClick={() => setFiltersOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <h2 className="font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close" className="text-slate-500">
                ✕
              </button>
            </div>
            <FiltersPanel
              value={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        </div>
      )}

      {/* Map canvas */}
      <div className="relative flex-1 min-h-0">
        {hasMapbox ? (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onMoveEnd={onMapMove}
            onLoad={onMapMove}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            style={{ width: '100%', height: '100%' }}
            reuseMaps
          >
            <NavigationControl position="top-right" showCompass={false} />
            {clusters.map((c) => {
              const [lng, lat] = c.geometry.coordinates;
              const props = c.properties as {
                cluster?: boolean;
                cluster_id?: number;
                point_count?: number;
                listingId?: string;
                rent?: number;
                kind?: string;
              };
              if (props.cluster && props.cluster_id !== undefined) {
                const count = props.point_count ?? 0;
                const size = 32 + Math.min(24, Math.log2(count + 1) * 8);
                return (
                  <Marker key={`cluster-${props.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                    <div
                      className="cluster-marker"
                      style={{ width: size, height: size, fontSize: size / 3 }}
                      onClick={() => onClusterClick(props.cluster_id!, lat, lng)}
                    >
                      {count}
                    </div>
                  </Marker>
                );
              }
              const listing = listings.find((l) => l.id === props.listingId);
              if (!listing) return null;
              return (
                <Marker key={listing.id} longitude={listing.lng} latitude={listing.lat} anchor="bottom">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveId(listing.id)}
                    onClick={() => setActiveId(listing.id)}
                    className={`rent-marker ${listing.kind === 'flatmate' ? 'flatmate' : ''}`}
                    style={{
                      transform: activeId === listing.id ? 'scale(1.12)' : undefined,
                      zIndex: activeId === listing.id ? 5 : 1,
                    }}
                  >
                    {formatINR(listing.rent).replace('₹', '₹ ')}
                  </button>
                </Marker>
              );
            })}

            {activeListing && (
              <Marker
                longitude={activeListing.lng}
                latitude={activeListing.lat}
                anchor="top"
                offset={[0, 8]}
              >
                <div className="mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-3 w-64 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900 leading-tight">{activeListing.title}</div>
                    <button
                      onClick={() => setActiveId(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {activeListing.area_name} · {activeListing.bhk_type}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {formatINR(activeListing.rent)}
                    <span className="text-xs text-slate-500 font-normal">/mo</span>
                  </div>
                  <Link
                    href={`/listings/${activeListing.id}`}
                    className="block mt-2 text-center bg-[color:var(--brand)] text-white text-xs font-semibold py-1.5 rounded-md"
                  >
                    View details
                  </Link>
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <MapFallback />
        )}

        {/* Mobile toggle between map/list */}
        <button
          type="button"
          onClick={() => setMobileView((v) => (v === 'map' ? 'list' : 'map'))}
          className="md:hidden absolute bottom-4 right-4 z-30 bg-slate-900 text-white rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
        >
          {mobileView === 'map' ? `📋 ${listings.length} listings` : '🗺️ Map'}
        </button>
      </div>
    </div>
  );
}

function MapFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-50 p-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-slate-900">Map tiles unavailable</h2>
        <p className="text-slate-600 text-sm mt-2">
          Set <code className="bg-slate-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your{' '}
          <code className="bg-slate-200 px-1 rounded">.env.local</code> and restart the dev server
          to see the interactive map. The sidebar still shows sample Mumbai listings so you can
          browse and test filters.
        </p>
      </div>
    </div>
  );
}
