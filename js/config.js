/* =====================================================================
   config.js — public Supabase connection settings.
   The URL and anon key are SAFE to commit: the anon key is designed to
   be public, and Row-Level Security (see supabase/schema.sql) is what
   actually protects your data. NEVER put the service_role key here.

   Fill these in after creating your Supabase project:
     Dashboard → Project Settings → API
       - Project URL        -> url
       - Project API keys → anon / public -> anonKey
   ===================================================================== */
window.SUPA_CONFIG = {
    url: 'https://xzzuyheferfohhxqsyuo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6enV5aGVmZXJmb2hoeHFzeXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDYwMjEsImV4cCI6MjA5NTY4MjAyMX0.M1gobb4NOLjRKjdrCqbwhsuVTQ-QbkH3_wqHeQ3quBM',
    imagesBucket: 'images',
    modelsBucket: 'models'
};
