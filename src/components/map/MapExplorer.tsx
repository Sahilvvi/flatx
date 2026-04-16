'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
  type ViewState,
  type MapLayerMouseEvent,
} from 'react-map-gl';
import useSupercluster from 'use-supercluster';
import type { BBox, Feature, Polygon } from 'geojson';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM, MAPBOX_TOKEN, hasMapbox } from '@/lib/env';
import type { Listing } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { FiltersPanel, DEFAULT_FILTERS, type FiltersState } from '@/components/FiltersPanel';
import { ListingCard } from '@/components/ListingCard';
import { CommutePanel, DEFAULT_COMMUTE, type CommuteState } from '@/components/map/CommutePanel';
import { pointInRing } from '@/lib/geo';

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
  const [commute, setCommute] = useState<CommuteState>(DEFAULT_COMMUTE);
  const [pickingOffice, setPickingOffice] = useState(false);

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

  // Pre-compute which listings fall within the 45-min polygon for "in commute" highlight.
  const withinCommute = useMemo(() => {
    if (!commute.geojson) return new Set<string>();
    const mid =
      commute.geojson.features.find((f) => (f.properties as { contour?: number })?.contour === 45) ??
      (commute.geojson.features[Math.floor(commute.geojson.features.length / 2)] as Feature<Polygon> | undefined);
    if (!mid || mid.geometry.type !== 'Polygon') return new Set<string>();
    const ring = (mid.geometry as Polygon).coordinates[0];
    const result = new Set<string>();
    for (const l of listings) if (pointInRing(l.lng, l.lat, ring)) result.add(l.id);
    return result;
  }, [commute.geojson, listings]);

  const activeListing = listings.find((l) => l.id === activeId) ?? null;

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (pickingOffice) {
        const office = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setPickingOffice(false);
        setCommute((c) => ({ ...c, office, loading: true, error: null }));
        const params = new URLSearchParams({
          lat: String(office.lat),
          lng: String(office.lng),
          minutes: commute.minutes.join(','),
          profile: commute.profile,
        });
        fetch(`/api/commute?${params.toString()}`)
          .then((r) => r.json())
          .then((data) => {
            setCommute((c) => ({
              ...c,
              office,
              geojson: data.isochrones ?? null,
              loading: false,
              error: data.isochrones ? null : data.note ?? data.error ?? null,
            }));
          })
          .catch((err) => {
            setCommute((c) => ({
              ...c,
              office,
              loading: false,
              error: err instanceof Error ? err.message : 'Failed to load commute zones',
            }));
          });
      }
    },
    [pickingOffice, commute.minutes, commute.profile],
  );

  // Sort list: listings within commute zone first when commute is active.
  const orderedListings = useMemo(() => {
    if (withinCommute.size === 0) return listings;
    return [...listings].sort((a, b) => {
      const ai = withinCommute.has(a.id) ? 0 : 1;
      const bi = withinCommute.has(b.id) ? 0 : 1;
      return ai - bi;
    });
  }, [listings, withinCommute]);

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
        <CommutePanel
          value={commute}
          onChange={setCommute}
          onPickOffice={() => {
            setPickingOffice(true);
            setMobileView('map');
          }}
          pickingOffice={pickingOffice}
        />
        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 text-xs text-slate-500">
          <span>
            {loading
              ? 'Loading…'
              : `${listings.length} listing${listings.length === 1 ? '' : 's'}${
                  withinCommute.size ? ` · ${withinCommute.size} within 45 min` : ''
                }`}
          </span>
          <Link href="/listings/new" className="text-[color:var(--brand)] font-semibold">
            + Add listing
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-3">
          {loading && listings.length === 0 && <ListingCardSkeleton count={4} />}
          {listings.length === 0 && !loading && (
            <div className="text-center text-slate-500 text-sm py-12">
              No listings in this area. Try widening the radius or panning the map.
            </div>
          )}
          {orderedListings.map((l) => (
            <div key={l.id} className="relative">
              {withinCommute.has(l.id) && (
                <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  within 45 min
                </span>
              )}
              <ListingCard
                listing={l}
                active={l.id === activeId}
                onHover={setActiveId}
                onClick={(lis) => {
                  setActiveId(lis.id);
                  setViewState((v) => ({
                    ...v,
                    latitude: lis.lat,
                    longitude: lis.lng,
                    zoom: Math.max(v.zoom ?? 13, 14),
                  }));
                  setMobileView('map');
                }}
              />
            </div>
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
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close"
                className="text-slate-500"
              >
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
        {pickingOffice && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-full shadow">
            Click anywhere on the map to set your office
          </div>
        )}

        {hasMapbox ? (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onMoveEnd={onMapMove}
            onLoad={onMapMove}
            onClick={onMapClick}
            cursor={pickingOffice ? 'crosshair' : undefined}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            style={{ width: '100%', height: '100%' }}
            reuseMaps
          >
            <NavigationControl position="top-right" showCompass={false} />

            {commute.geojson && (
              <Source id="commute-isochrones" type="geojson" data={commute.geojson}>
                <Layer
                  id="commute-fill"
                  type="fill"
                  paint={{
                    'fill-color': [
                      'match',
                      ['get', 'contour'],
                      30, 'rgba(11,110,79,0.28)',
                      45, 'rgba(255,179,71,0.28)',
                      60, 'rgba(255,107,53,0.20)',
                      'rgba(148,163,184,0.20)',
                    ],
                  }}
                />
                <Layer
                  id="commute-outline"
                  type="line"
                  paint={{
                    'line-color': [
                      'match',
                      ['get', 'contour'],
                      30, '#0b6e4f',
                      45, '#b45309',
                      60, '#c2410c',
                      '#64748b',
                    ],
                    'line-width': 1.5,
                    'line-opacity': 0.8,
                  }}
                />
              </Source>
            )}

            {commute.office && (
              <Marker longitude={commute.office.lng} latitude={commute.office.lat} anchor="bottom">
                <div className="text-2xl drop-shadow" aria-label="Office location">
                  🏢
                </div>
              </Marker>
            )}

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
                  <Marker
                    key={`cluster-${props.cluster_id}`}
                    longitude={lng}
                    latitude={lat}
                    anchor="center"
                  >
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
              const inCommute = withinCommute.has(listing.id);
              return (
                <Marker
                  key={listing.id}
                  longitude={listing.lng}
                  latitude={listing.lat}
                  anchor="bottom"
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveId(listing.id)}
                    onClick={() => setActiveId(listing.id)}
                    className={`rent-marker ${listing.kind === 'flatmate' ? 'flatmate' : ''} ${
                      withinCommute.size && !inCommute ? 'dimmed' : ''
                    } ${inCommute ? 'in-commute' : ''}`}
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
                    <div className="font-semibold text-slate-900 leading-tight">
                      {activeListing.title}
                    </div>
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

function ListingCardSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 p-3 animate-pulse bg-white space-y-2"
        >
          <div className="h-4 w-2/3 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-200 rounded" />
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
          <div className="h-8 w-full bg-slate-100 rounded mt-2" />
        </div>
      ))}
    </>
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
