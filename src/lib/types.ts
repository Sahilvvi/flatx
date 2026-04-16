export type BhkType = '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK+' | 'Room' | 'Shared';
export type Furnishing = 'unfurnished' | 'semi' | 'furnished';
export type ListingKind = 'flat' | 'room' | 'flatmate';

export interface Listing {
  id: string;
  user_id: string | null;
  kind: ListingKind;
  title: string;
  description: string | null;
  rent: number;
  deposit: number | null;
  bhk_type: BhkType;
  furnishing: Furnishing;
  area_name: string | null;
  lat: number;
  lng: number;
  images: string[];
  tags: string[];
  contact_whatsapp: string | null;
  distance_m?: number;
  is_owner_verified?: boolean;
  created_at: string;
}

export interface RentDataPoint {
  id: string;
  lat: number;
  lng: number;
  rent: number;
  bhk_type: BhkType;
  area_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface RentInsightResult {
  sample_size: number;
  avg_rent: number | null;
  median_rent: number | null;
  p25_rent: number | null;
  p75_rent: number | null;
  min_rent: number | null;
  max_rent: number | null;
}

export interface Filters {
  minRent?: number;
  maxRent?: number;
  bhk?: BhkType[];
  furnishing?: Furnishing[];
  radiusM?: number;
}

export const BHK_OPTIONS: BhkType[] = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+', 'Room', 'Shared'];
export const FURNISHING_OPTIONS: Furnishing[] = ['unfurnished', 'semi', 'furnished'];
export const LISTING_KINDS: ListingKind[] = ['flat', 'room', 'flatmate'];
