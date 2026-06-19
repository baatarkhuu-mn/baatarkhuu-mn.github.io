/* ============================================================
   Supabase холболтын тохиргоо (нийтэд ил байж болно — RLS хамгаална)
   Баатархүүгийн сайтын тусдаа Supabase төсөл (2026-06, шинэ аккаунт).
   ============================================================ */
window.SB_URL = "https://qtmueuyxqfgekbacymiu.supabase.co";
window.SB_KEY = "sb_publishable_HGHc9XSJ0AOVO4Jo9ZLoRw_3iVFLLxH";

// Supabase client (supabase-js CDN ачаалагдсаны дараа үүснэ)
// Нэвтрэлт нь sessionStorage-д хадгалагдана → таб хаах хүртэл идэвхтэй,
// шинэ таб/цонх нээх бүрд дахин нэвтрэх шаардлагатай (refresh-д гарахгүй).
window.getSB = function () {
  if (!window.supabase || !window.SB_URL || !window.SB_KEY) return null;
  if (!window._sbClient) {
    var store = null;
    try { store = window.sessionStorage; } catch (e) { store = undefined; }
    window._sbClient = window.supabase.createClient(window.SB_URL, window.SB_KEY, {
      auth: { storage: store, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return window._sbClient;
};
