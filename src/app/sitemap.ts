import { MetadataRoute } from 'next';
import { MOCK_LISTINGS } from '@/lib/mock-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mumbai-rent-intelligence.vercel.app'; // Replace with actual domain

  // We realistically would fetch all static area pages and top listings from Supabase here
  const listings = MOCK_LISTINGS.map((listing) => ({
    url: `${baseUrl}/listings/${listing.id}`,
    lastModified: new Date(listing.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const areas = ['bandra-west', 'powai', 'andheri-east', 'juhu'].map((area) => ({
    url: `${baseUrl}/${area}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/commute`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...areas,
    ...listings,
  ];
}
