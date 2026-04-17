import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Mock implementation of a Twilio/WhatsApp notification pipeline
// Can be triggered via Cron (Edge Functions) or database Webhook

const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

async function sendWhatsApp(to: string, body: string) {
  if (!twilioSid || !twilioAuthToken) {
    console.log(`[Mock] Sending WhatsApp to ${to}: ${body}`);
    return;
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const data = new URLSearchParams();
  data.append("To", `whatsapp:${to}`);
  data.append("From", twilioFrom);
  data.append("Body", body);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(`${twilioSid}:${twilioAuthToken}`),
    },
    body: data,
  });
  return response.json();
}

/**
 * Triggered by Supabase Cron every hour.
 * Finds all 'saved_searches' and matches them against listings created in the last hour.
 */
serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Mock processing logic
    // 1. Fetch saved searches
    const { data: searches } = await supabaseClient.from('saved_searches').select('*, users(phone_number)');
    
    // 2. Query new listings
    const { data: newListings } = await supabaseClient
      .from('listings')
      .select('*')
      .gt('created_at', new Date(Date.now() - 3600000).toISOString());

    if (!newListings || newListings.length === 0) {
      return new Response(JSON.stringify({ msg: "No new listings" }), { status: 200 });
    }

    // 3. Match and Send Notifications
    let sentCount = 0;
    if (searches) {
      for (const search of searches) {
        for (const listing of newListings) {
          // Add complex bounds/bbox radius checking logic here
          if (listing.rent <= search.max_rent && listing.bhk_type === search.bhk_type) {
            await sendWhatsApp(
              search.users?.phone_number || "+919999999999", 
              `🚨 Match Alert! A new ${listing.bhk_type} in ${listing.area_name} was just listed for ₹${listing.rent}. View it: https://flatx.in/listings/${listing.id}`
            );
            sentCount++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: sentCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
