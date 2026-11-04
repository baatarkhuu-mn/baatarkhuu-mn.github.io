// Facebook → baatarkhuu.mn автомат синк
// Apify (facebook-posts-scraper) → Supabase: news (пост) + videos (reel/видео)
// Зураг FB CDN-ээс хуулж news-photos сан руу хадгална (FB линк хугацаа дуусдаг тул).
// Шаардлагатай env: APIFY_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Сонголттой: FB_PAGE_URL, RESULTS_LIMIT, DRY_RUN=1

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const SB_URL = (process.env.SUPABASE_URL || "https://qtmueuyxqfgekbacymiu.supabase.co").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAGE = process.env.FB_PAGE_URL || "https://www.facebook.com/ts.baatarkhuu";
const LIMIT = Number(process.env.RESULTS_LIMIT || 10);
const DRY = process.env.DRY_RUN === "1";
const ACTOR = "apify~facebook-posts-scraper";

const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

// ---------- Telegram мэдэгдэл ----------
// Нийтэлсэн → мэдэгдэл; Ноорог → "Нийтлэх / Нуух" товчтой (товчийг webhook хүлээн авна)
async function tgNotify(row, reason) {
  if (!TG_TOKEN || !TG_CHAT || DRY) return;
  const head = reason ? `⏸ Ноорог — ${reason}` : "✅ Сайтад нийтлэгдлээ";
  const text = `${head}\n\n<b>${row.title.replace(/[<&>]/g, "")}</b>\n${row.date || ""}\n${row.link}`;
  const body = { chat_id: TG_CHAT, text, parse_mode: "HTML", disable_web_page_preview: false };
  if (reason) body.reply_markup = { inline_keyboard: [[
    { text: "✅ Нийтлэх", callback_data: `pub:${row.fb_post_id}` },
    { text: "❌ Нуух", callback_data: `hide:${row.fb_post_id}` },
  ]] };
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) console.warn("telegram:", r.status, await r.text());
  } catch (e) { console.warn("telegram алдаа:", e.message); }
}

// ---------- Apify ----------
async function fetchPosts() {
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=240`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startUrls: [{ url: PAGE }], resultsLimit: LIMIT }),
  });
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// ---------- Helpers ----------
const ubDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return { dot: `${g("year")}.${g("month")}.${g("day")}`, dash: `${g("year")}-${g("month")}-${g("day")}` };
};

// Гарчиг = эх бичвэрийн эхний мөр/өгүүлбэр (үгийг өөрчлөхгүй), урт бол үгийн хилээр тасална
export function makeTitle(text) {
  const first = text.split(/\n+/).map((s) => s.trim()).find(Boolean) || "";
  const sentence = first.split(/(?<=[.!?…])\s/)[0];
  const t = sentence.length >= 25 ? sentence : first;
  if (t.length <= 90) return t;
  const cut = t.slice(0, 90);
  return cut.slice(0, cut.lastIndexOf(" ") > 50 ? cut.lastIndexOf(" ") : 90).replace(/[,;:\s]+$/, "") + "…";
}

export function firstImage(post) {
  for (const m of post.media || []) {
    const u = m?.photo_image?.uri || m?.image?.uri || m?.thumbnail || m?.photo?.uri;
    if (u) return u;
  }
  return post.thumbnail || post.image || null;
}

export function isVideo(post) {
  const u = String(post.url || post.topLevelUrl || "");
  return /\/(reel|videos|watch)\b/.test(u) || (post.media || []).some((m) => m?.__typename === "Video" || m?.__isMedia === "Video");
}

// Сэжигтэй эсэх — тийм бол ноорог (админ шалгана), үгүй бол шууд нийтэлнэ
export function holdReason(text) {
  if (!text || text.trim().length < 15) return "текст хэт богино/хоосон";
  const ext = (text.match(/https?:\/\/[^\s]+/g) || []).filter((u) => !/facebook\.com|fb\.watch|baatarkhuu\.mn|parliament\.mn|gov\.mn/.test(u));
  if (ext.length) return "гадны холбоос агуулсан";
  return null;
}

// ---------- Supabase ----------
async function exists(table, col, val) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}&select=id&limit=1`, { headers: sbHeaders });
  if (!r.ok) throw new Error(`exists ${table}: ${r.status} ${await r.text()}`);
  return (await r.json()).length > 0;
}

async function insert(table, row) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`insert ${table}: ${r.status} ${await r.text()}`);
}

async function copyImage(src, key) {
  try {
    const img = await fetch(src);
    if (!img.ok) return null;
    const type = (img.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
    const ext = type.split("/")[1].replace("jpeg", "jpg");
    const path = `fb/${key}.${ext}`;
    const up = await fetch(`${SB_URL}/storage/v1/object/news-photos/${path}`, {
      method: "POST",
      headers: { ...sbHeaders, "Content-Type": type, "x-upsert": "true" },
      body: Buffer.from(await img.arrayBuffer()),
    });
    if (!up.ok) { console.warn("зураг upload алдаа:", up.status, await up.text()); return null; }
    return `${SB_URL}/storage/v1/object/public/news-photos/${path}`;
  } catch (e) { console.warn("зураг татаж чадсангүй:", e.message); return null; }
}

// ---------- Main ----------
async function main() {
  if (!APIFY_TOKEN || (!SB_KEY && !DRY)) throw new Error("APIFY_TOKEN болон SUPABASE_SERVICE_ROLE_KEY хэрэгтэй.");
  const posts = await fetchPosts();
  console.log(`Apify: ${posts.length} пост ирлээ`);
  let added = 0, held = 0, videos = 0, skipped = 0;

  for (const p of posts.reverse()) { // хуучнаас шинэ рүү
    const id = String(p.postId || p.id || "").trim();
    const link = p.url || p.topLevelUrl;
    const text = (p.text || p.postText || "").trim();
    if (!id || !link) { skipped++; continue; }
    if (!text && !firstImage(p)) { skipped++; continue; }
    const d = ubDate(p.time || p.timestamp * 1000);

    if (!DRY && (await exists("news", "fb_post_id", id))) { skipped++; continue; }

    const reason = holdReason(text);
    const imgSrc = firstImage(p);
    const image = imgSrc && !DRY ? await copyImage(imgSrc, id) : imgSrc;
    const row = {
      fb_post_id: id,
      date: d?.dot ?? null,
      category: "tsahim",
      title: text ? makeTitle(text) : "Шинэ нийтлэл",
      excerpt: text.replace(/\s+/g, " ").slice(0, 220) || null,
      body: text || null,
      link,
      image,
      published: !reason,
    };

    if (DRY) console.log(JSON.stringify(row, null, 2));
    else { await insert("news", row); await tgNotify(row, reason); }
    reason ? held++ : added++;
    if (reason) console.log(`⏸  ноорог (${reason}): ${link}`);

    if (isVideo(p) && !DRY && !(await exists("videos", "url", link))) {
      await insert("videos", {
        title: row.title,
        url: link,
        platform: "facebook",
        video_date: d?.dash ?? null,
        orientation: /\/reel\//.test(link) ? "vertical" : "landscape",
        published: !reason,
      });
      videos++;
    }
  }
  console.log(`✅ нийтэлсэн ${added} · ноорог ${held} · видео ${videos} · алгассан ${skipped}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error("❌", e.message); process.exit(1); });
}
