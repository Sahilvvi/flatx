import { NextResponse } from 'next/server';
import { createListing } from '@/lib/listings-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Twilio sends application/x-www-form-urlencoded data
    const text = await req.text();
    const data = new URLSearchParams(text);

    const from = data.get('From') || '';
    const body = data.get('Body') || '';
    const numMedia = parseInt(data.get('NumMedia') || '0', 10);

    const images = [];
    for (let i = 0; i < numMedia; i++) {
      images.push(data.get(`MediaUrl${i}`));
    }

    console.log(`[WhatsApp Bot] Received from ${from}: ${body} with ${numMedia} images`);

    // Extremely basic NLP/regex parsing. In a real app, use OpenAI to parse intent.
    const bhkMatch = body.match(/(\d)\s*(bhk)/i);
    const rentMatch = body.match(/rs\.?\s*(\d+)/i) || body.match(/rent[:\s]*(\d+)/i);
    const locMatch = body.match(/in\s+([a-zA-Z\s]+)/i);

    const rent = rentMatch ? parseInt(rentMatch[1], 10) : 0;
    const bhk = bhkMatch ? `${bhkMatch[1]}BHK` : '1BHK';
    const area = locMatch ? locMatch[1].trim() : 'Mumbai';

    // Save as unverified listing
    const listing = await createListing({
      title: `${bhk} in ${area}`,
      description: `Submitted via WhatsApp: ${body}`,
      rent: rent,
      deposit: rent * 3,
      bhk_type: bhk as any,
      furnishing: 'unfurnished',
      kind: 'flat',
      area_name: area,
      lat: 19.0760, // Default to center of Mumbai, requires geocoding in real app
      lng: 72.8777,
      contact_whatsapp: from.replace('whatsapp:', ''),
    });

    return new NextResponse(
      `<Response><Message>Thanks! Your ${bhk} property in ${area} has been listed on Mumbai Rent Intelligence. (Listing ID: ${listing.id.slice(0, 6)})</Message></Response>`, 
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  } catch (err) {
    console.error('[WhatsApp Bot] Error:', err);
    return new NextResponse(
      '<Response><Message>Sorry, our rent bot had an error parsing your listing. Please try again or use the website.</Message></Response>', 
      { status: 500, headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
