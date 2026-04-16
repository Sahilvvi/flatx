'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LocationPicker } from '@/components/map/LocationPicker';
import { ImageUploader } from '@/components/forms/ImageUploader';
import {
  BHK_OPTIONS,
  FURNISHING_OPTIONS,
  LISTING_KINDS,
  type BhkType,
  type Furnishing,
  type ListingKind,
} from '@/lib/types';

const SOCIETY_TAGS = [
  'bachelor_friendly',
  'family_preferred',
  'pet_friendly',
  'vegetarian_only',
  'women_only',
  'non_smoker',
];

interface AddListingFormProps {
  initialLat?: number;
  initialLng?: number;
}

export function AddListingForm({ initialLat, initialLng }: AddListingFormProps = {}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<ListingKind>('flat');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');
  const [bhk, setBhk] = useState<BhkType>('1BHK');
  const [furnishing, setFurnishing] = useState<Furnishing>('semi');
  const [area, setArea] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat !== undefined && initialLng !== undefined
      ? { lat: initialLat, lng: initialLng }
      : null,
  );
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pin) {
      setError('Please drop a pin on the map to mark the listing location.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          title,
          description,
          rent: Number(rent),
          deposit: deposit ? Number(deposit) : undefined,
          bhk_type: bhk,
          furnishing,
          area_name: area,
          lat: pin.lat,
          lng: pin.lng,
          contact_whatsapp: whatsapp,
          tags,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create listing');
      router.push(`/listings/${data.listing.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">What are you listing?</h2>
        <div className="flex flex-wrap gap-2">
          {LISTING_KINDS.map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={chip(kind === k)}
            >
              {k === 'flat' ? 'Full flat' : k === 'room' ? 'Room / PG' : 'Looking for flatmate'}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Basics</h2>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Title</span>
          <input
            type="text"
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 1BHK in Bandra West, 5 min to station"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Description</span>
          <textarea
            rows={4}
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Amenities, preferred tenant profile, house rules, etc."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Rent (₹ / month)</span>
            <input
              type="number"
              required
              min={1000}
              step={500}
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Deposit (₹)</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">BHK / Room type</span>
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value as BhkType)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {BHK_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Furnishing</span>
            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value as Furnishing)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {FURNISHING_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f === 'semi' ? 'Semi-furnished' : f[0].toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Area / neighbourhood</span>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Bandra West, Powai"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          {pin ? 'Location pinned' : 'Drop a pin on the map'}
        </h2>
        {pin && initialLat !== undefined && initialLng !== undefined && (
          <p className="text-xs text-slate-500 mb-3">
            Pre-filled from the map. Click the map to adjust if needed.
          </p>
        )}
        <LocationPicker value={pin} onChange={setPin} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Photos</h2>
        <p className="text-xs text-slate-500">
          Add up to 6 photos of the place. JPEG / PNG / WEBP, max 5&nbsp;MB each.
        </p>
        <ImageUploader value={images} onChange={setImages} maxFiles={6} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Society / preferences</h2>
        <div className="flex flex-wrap gap-2">
          {SOCIETY_TAGS.map((t) => (
            <button type="button" key={t} onClick={() => toggleTag(t)} className={chip(tags.includes(t))}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">How should tenants contact you?</h2>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">WhatsApp number</span>
          <input
            type="tel"
            inputMode="numeric"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="e.g. 9198XXXXXXXX"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <p className="text-xs text-slate-500">
          We never call you — interested tenants tap a WhatsApp link that opens a chat with this
          number directly. Skip if you prefer not to share your number here.
        </p>
      </section>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-md bg-[color:var(--brand)] text-white text-sm font-semibold hover:bg-[color:var(--brand-dark)] disabled:opacity-60"
        >
          {submitting ? 'Publishing…' : 'Publish listing'}
        </button>
      </div>
    </form>
  );
}

function chip(active: boolean) {
  return [
    'px-3 py-1.5 rounded-full border text-xs font-medium transition',
    active
      ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
  ].join(' ');
}
