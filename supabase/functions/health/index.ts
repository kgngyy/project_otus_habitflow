import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const client = createClient(url, key);

  let db = 'ok';
  try {
    const { error } = await client
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    if (error) db = 'error: ' + error.message;
  } catch (e) {
    db = 'error: ' + (e instanceof Error ? e.message : 'unknown');
  }

  const ok = db === 'ok';
  return new Response(
    JSON.stringify({ status: ok ? 'ok' : 'degraded', db, ts: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' }, status: ok ? 200 : 503 },
  );
});
