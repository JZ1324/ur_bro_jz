declare module 'jsr:@supabase/functions-js/edge-runtime.d.ts';

declare module 'npm:@supabase/supabase-js@2' {
  import * as supabase from '@supabase/supabase-js';
  export = supabase;
}

// Provide a simple fallback for Deno globals used by Supabase edge functions.
declare const Deno: any;

// Allow importing JSON in TS files if needed
declare module '*.json' {
  const value: any;
  export default value;
}
