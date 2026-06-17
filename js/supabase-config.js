/* ============================================================
   Supabase холболтын тохиргоо (нийтэд ил байж болно — RLS хамгаална)
   Баатархүүгийн сайтын тусдаа Supabase төсөл (2026-06, шинэ аккаунт).
   ============================================================ */
window.SB_URL = "https://qtmueuyxqfgekbacymiu.supabase.co";
window.SB_KEY = "sb_publishable_HGHc9XSJ0AOVO4Jo9ZLoRw_3iVFLLxH";

// Supabase client (supabase-js CDN ачаалагдсаны дараа үүснэ)
window.getSB = function () {
  if (!window.supabase || !window.SB_URL || !window.SB_KEY) return null;
  if (!window._sbClient) window._sbClient = window.supabase.createClient(window.SB_URL, window.SB_KEY);
  return window._sbClient;
};
