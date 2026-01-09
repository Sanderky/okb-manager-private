import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const allowedOriginsStr = Deno.env.get('ALLOWED_ORIGINS') ?? '';

  const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map((o) => o.trim());

  const origin = req.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const HOSTINGER_API_URL = Deno.env.get('HOSTINGER_API_URL') ?? '';
    const HOSTINGER_TOKEN = Deno.env.get('HOSTINGER_API_TOKEN') ?? '';
    const PLAN_LIMIT_GB = Number(
      Deno.env.get('HOSTINGER_PLAN_LIMIT_GB') || 100
    );

    if (!HOSTINGER_API_URL || !HOSTINGER_TOKEN) {
      throw new Error('Hostingera API configuration error');
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const urlWithParams = new URL(HOSTINGER_API_URL);

    urlWithParams.searchParams.append('date_from', yesterday.toISOString());
    urlWithParams.searchParams.append('date_to', now.toISOString());

    console.log(`Fetching: ${urlWithParams.toString()}`);

    const response = await fetch(urlWithParams.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${HOSTINGER_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hostinger API Error: ${response.status} - ${errorText}`);
      throw new Error(`Hostinger API: ${response.status} ${errorText}`);
    }

    const externalData = await response.json();

    const getLastValue = (obj: any) => {
      if (!obj || !obj.usage) return 0;
      const entries = Object.entries(obj.usage);
      if (entries.length === 0) return 0;

      entries.sort((a, b) => Number(a[0]) - Number(b[0]));

      const latestEntry = entries[entries.length - 1];
      return Number(latestEntry[1]);
    };

    const usedBytes = getLastValue(externalData.disk_space);
    const totalBytes = PLAN_LIMIT_GB * 1024 * 1024 * 1024;
    const freeBytes = totalBytes - usedBytes;
    const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    const result = {
      total: totalBytes,
      used: usedBytes,
      free: freeBytes,
      percentage: Number(percentage.toFixed(2)),
      cpu_percent: getLastValue(externalData.cpu_usage),
      ram_bytes: getLastValue(externalData.ram_usage),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
