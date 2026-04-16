import type { BhkType, Furnishing, ListingKind } from './types';
import { BHK_OPTIONS, FURNISHING_OPTIONS, LISTING_KINDS } from './types';
import { isInMumbaiBounds } from './geo';

export interface NewListingInput {
  kind: ListingKind;
  title: string;
  description?: string;
  rent: number;
  deposit?: number;
  bhk_type: BhkType;
  furnishing: Furnishing;
  area_name?: string;
  lat: number;
  lng: number;
  tags?: string[];
  contact_whatsapp?: string;
}

export interface NewRentPointInput {
  lat: number;
  lng: number;
  rent: number;
  bhk_type: BhkType;
  area_name?: string;
  notes?: string;
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function s(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function n(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function validateListing(raw: unknown): ValidationResult<NewListingInput> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid body' };
  const b = raw as Record<string, unknown>;

  const kind = (s(b.kind) ?? 'flat') as ListingKind;
  if (!LISTING_KINDS.includes(kind)) return { ok: false, error: 'Invalid kind' };

  const title = s(b.title);
  if (!title || title.length > 140) return { ok: false, error: 'Title is required (max 140 chars)' };

  const description = s(b.description);
  if (description && description.length > 2000) return { ok: false, error: 'Description too long' };

  const rent = n(b.rent);
  if (rent === undefined || rent < 1000 || rent > 5_000_000) {
    return { ok: false, error: 'Rent must be between 1,000 and 50,00,000' };
  }

  const deposit = n(b.deposit);
  if (deposit !== undefined && (deposit < 0 || deposit > 50_000_000)) {
    return { ok: false, error: 'Invalid deposit' };
  }

  const bhk_type = s(b.bhk_type) as BhkType | undefined;
  if (!bhk_type || !BHK_OPTIONS.includes(bhk_type)) return { ok: false, error: 'Invalid BHK type' };

  const furnishing = (s(b.furnishing) ?? 'semi') as Furnishing;
  if (!FURNISHING_OPTIONS.includes(furnishing)) return { ok: false, error: 'Invalid furnishing' };

  const lat = n(b.lat);
  const lng = n(b.lng);
  if (lat === undefined || lng === undefined) return { ok: false, error: 'Lat/lng are required' };
  if (!isInMumbaiBounds(lat, lng)) return { ok: false, error: 'Location must be within Mumbai metropolitan area' };

  const area_name = s(b.area_name);
  const contact_whatsapp = s(b.contact_whatsapp)?.replace(/\D/g, '');
  if (contact_whatsapp && (contact_whatsapp.length < 10 || contact_whatsapp.length > 15)) {
    return { ok: false, error: 'Invalid WhatsApp number' };
  }

  let tags: string[] | undefined;
  if (Array.isArray(b.tags)) {
    tags = b.tags.filter((t): t is string => typeof t === 'string' && t.length <= 30).slice(0, 10);
  }

  return {
    ok: true,
    data: {
      kind,
      title,
      description,
      rent,
      deposit,
      bhk_type,
      furnishing,
      area_name,
      lat,
      lng,
      tags,
      contact_whatsapp,
    },
  };
}

export function validateRentPoint(raw: unknown): ValidationResult<NewRentPointInput> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid body' };
  const b = raw as Record<string, unknown>;

  const lat = n(b.lat);
  const lng = n(b.lng);
  if (lat === undefined || lng === undefined) return { ok: false, error: 'Lat/lng are required' };
  if (!isInMumbaiBounds(lat, lng)) return { ok: false, error: 'Location must be within Mumbai metropolitan area' };

  const rent = n(b.rent);
  if (rent === undefined || rent < 1000 || rent > 5_000_000) {
    return { ok: false, error: 'Rent must be between 1,000 and 50,00,000' };
  }

  const bhk_type = s(b.bhk_type) as BhkType | undefined;
  if (!bhk_type || !BHK_OPTIONS.includes(bhk_type)) return { ok: false, error: 'Invalid BHK type' };

  const area_name = s(b.area_name);
  const notes = s(b.notes);
  if (notes && notes.length > 500) return { ok: false, error: 'Notes too long' };

  return { ok: true, data: { lat, lng, rent, bhk_type, area_name, notes } };
}
