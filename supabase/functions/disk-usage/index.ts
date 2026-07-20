import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const allowedOriginsStr = Deno.env.get('ALLOWED_ORIGINS') ?? '';
  const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map((o) => o.trim());

  const origin = req.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_BASE = Deno.env.get('HOSTINGER_API_BASE') ?? 'https://api.hostinger.com/vps/v1';
    const VM_ID = Deno.env.get('HOSTINGER_VM_ID');
    const API_TOKEN = Deno.env.get('HOSTINGER_API_TOKEN');

    if (!VM_ID || !API_TOKEN) {
      throw new Error('Configuration error: HOSTINGER_VM_ID or HOSTINGER_API_TOKEN missing');
    }

    const infoUrl = `${API_BASE}/virtual-machines/${VM_ID}`;
    

    const statsUrlObj = new URL(`${API_BASE}/virtual-machines/${VM_ID}/metrics`);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    statsUrlObj.searchParams.append('date_from', yesterday.toISOString());
    statsUrlObj.searchParams.append('date_to', now.toISOString());

    console.log(`Info URL: ${infoUrl}`);
    console.log(`Stats URL: ${statsUrlObj.toString()}`);

    const headers = {
      Authorization: `Bearer ${API_TOKEN}`,
      Accept: 'application/json',
    };


    const [infoRes, statsRes] = await Promise.all([
      fetch(infoUrl, { method: 'GET', headers }),
      fetch(statsUrlObj.toString(), { method: 'GET', headers })
    ]);


    if (!infoRes.ok) {
        const err = await infoRes.text();
        throw new Error(`Info API Error (${infoRes.status}): ${err}`);
    }
    if (!statsRes.ok) {
        const err = await statsRes.text();
        throw new Error(`Stats API Error (${statsRes.status}): ${err}`);
    }


    const infoData = await infoRes.json();
    const statsData = await statsRes.json();

    const getLastValue = (obj: any) => {
      if (!obj || !obj.usage) return 0;
      const entries = Object.entries(obj.usage);
      if (entries.length === 0) return 0;

      entries.sort((a, b) => Number(a[0]) - Number(b[0]));
      return Number(entries[entries.length - 1][1]);
    };


    const totalBytes = (infoData.disk || 0) * 1024 * 1024;
    

    const usedBytes = getLastValue(statsData.disk_space);
    
    const freeBytes = totalBytes - usedBytes;
    const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    const result = {
      total: totalBytes,
      used: usedBytes,
      free: freeBytes,
      percentage: Number(percentage.toFixed(2)),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});