import { AddListingForm } from '@/components/forms/AddListingForm';

export const metadata = {
  title: 'List a flat, room or flatmate · Mumbai Rent Intelligence',
};

interface PageProps {
  searchParams?: { lat?: string; lng?: string };
}

function parseCoord(raw: string | undefined, bounds: [number, number]): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  if (n < bounds[0] || n > bounds[1]) return undefined;
  return n;
}

export default function NewListingPage({ searchParams }: PageProps) {
  // Guardrails: accept only sane lat/lng so stray query params can't corrupt the form.
  const initialLat = parseCoord(searchParams?.lat, [-90, 90]);
  const initialLng = parseCoord(searchParams?.lng, [-180, 180]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add a listing</h1>
        <p className="text-slate-600 text-sm mt-1">
          Broker-free. Your listing appears on the map instantly. Tenants contact you directly via
          WhatsApp.
        </p>
      </header>
      <AddListingForm initialLat={initialLat} initialLng={initialLng} />
    </div>
  );
}
