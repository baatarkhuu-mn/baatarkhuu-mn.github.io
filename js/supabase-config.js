/* ============================================================
   Supabase холболтын тохиргоо (нийтэд ил байж болно — RLS хамгаална)
   Энэ нь танай eCanvasser CRM-тэй ижил Supabase төсөл.
   ============================================================ */
window.SB_URL = "https://ezzjmwqfqmpskfqyukpj.supabase.co";
window.SB_KEY = "sb_publishable_f4y0uLlASHzPadXFBX8MMw_C1MWOLIQ";

// Supabase client (supabase-js CDN ачаалагдсаны дараа үүснэ)
window.getSB = function () {
  if (!window.supabase || !window.SB_URL || !window.SB_KEY) return null;
  if (!window._sbClient) window._sbClient = window.supabase.createClient(window.SB_URL, window.SB_KEY);
  return window._sbClient;
};
