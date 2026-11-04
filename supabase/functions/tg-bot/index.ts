// Telegram бот — baatarkhuu.mn-ийн алсын удирдлага
//  /check (эсвэл "🔍 Шинэ пост шалгах") → Facebook-ийг шалгаж шинэ постыг сайтад нэмнэ
//  Ноорог постын [✅ Нийтлэх] [❌ Нуух] товч → сайтад шууд нөлөөлнө
// Secrets (Supabase → Edge Functions → Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, APIFY_TOKEN
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY автоматаар байдаг.
// Анх суулгахдаа: GET .../functions/v1/tg-bot?setup=1  (webhook + командуудыг тохируулна)
import { createClient } from "jsr:@supabase/supabase-js@2";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const TG = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const ADMIN = String(Deno.env.get("TELEGRAM_CHAT_ID") ?? "").trim();
const APIFY = Deno.env.get("APIFY_TOKEN") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAGE = Deno.env.get("FB_PAGE_URL") ?? "https://www.facebook.com/ts.baatarkhuu";
const CHECK_LIMIT = 5;
const BTN_CHECK = "🔍 Шинэ пост шалгах";

const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

// ---------- Telegram ----------
async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TG}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.warn("telegram", method, JSON.stringify(j).slice(0, 300));
  return j;
}
const say = (text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", { chat_id: ADMIN, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });
const esc = (s: string) => s.replace(/[<&>]/g, (c) => ({ "<": "&lt;", "&": "&amp;", ">": "&gt;" }[c]!));

// Webhook-ийн нууц түлхүүрийг ботын токеноос гаргана (тусдаа нууц хадгалах шаардлагагүй)
async function hookSecret() {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tg-hook:" + TG));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}

// ---------- Sync (GitHub-ийн fb-sync.mjs-тэй ижил дүрэм) ----------
const ubDate = (v: unknown) => {
  const d = new Date(typeof v === "number" ? v : String(v));
  if (isNaN(+d)) return null;
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return { dot: `${g("year")}.${g("month")}.${g("day")}`, dash: `${g("year")}-${g("month")}-${g("day")}` };
};
function makeTitle(text: string) {
  const first = text.split(/\n+/).map((s) => s.trim()).find(Boolean) || "";
  const sentence = first.split(/(?<=[.!?…])\s/)[0];
  const t = sentence.length >= 25 ? sentence : first;
  if (t.length <= 90) return t;
  const cut = t.slice(0, 90);
  return cut.slice(0, cut.lastIndexOf(" ") > 50 ? cut.lastIndexOf(" ") : 90).replace(/[,;:\s]+$/, "") + "…";
}
// deno-lint-ignore no-explicit-any
function firstImage(p: any): string | null {
  for (const m of p.media || []) {
    const u = m?.photo_image?.uri || m?.image?.uri || m?.thumbnail || m?.photo?.uri;
    if (u) return u;
  }
  return p.thumbnail || p.image || null;
}
// deno-lint-ignore no-explicit-any
const isVideo = (p: any) => /\/(reel|videos|watch)\b/.test(String(p.url || p.topLevelUrl || "")) ||
  // deno-lint-ignore no-explicit-any
  (p.media || []).some((m: any) => m?.__typename === "Video" || m?.__isMedia === "Video");
function holdReason(text: string) {
  if (!text || text.trim().length < 15) return "текст хэт богино/хоосон";
  const ext = (text.match(/https?:\/\/[^\s]+/g) || []).filter((u) => !/facebook\.com|fb\.watch|baatarkhuu\.mn|parliament\.mn|gov\.mn/.test(u));
  return ext.length ? "гадны холбоос агуулсан" : null;
}
async function copyImage(src: string, key: string) {
  try {
    const r = await fetch(src);
    if (!r.ok) return null;
    const type = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
    const path = `fb/${key}.${type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await sb.storage.from("news-photos").upload(path, new Uint8Array(await r.arrayBuffer()), { contentType: type, upsert: true });
    if (error) { console.warn("upload", error.message); return null; }
    return sb.storage.from("news-photos").getPublicUrl(path).data.publicUrl;
  } catch (e) { console.warn("image", String(e)); return null; }
}

async function runSync() {
  const res = await fetch(`https://api.apify.com/v2/acts/apify~facebook-posts-scraper/run-sync-get-dataset-items?token=${APIFY}&timeout=120`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startUrls: [{ url: PAGE }], resultsLimit: CHECK_LIMIT }),
  });
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 200)}`);
  // deno-lint-ignore no-explicit-any
  const posts: any[] = await res.json();
  let added = 0, held = 0, videos = 0;
  for (const p of posts.reverse()) {
    const id = String(p.postId || p.id || "").trim();
    const link = p.url || p.topLevelUrl;
    const text = String(p.text || p.postText || "").trim();
    if (!id || !link || (!text && !firstImage(p))) continue;
    const { data: ex } = await sb.from("news").select("id").eq("fb_post_id", id).limit(1);
    if (ex?.length) continue;
    const d = ubDate(p.time ?? (p.timestamp ? p.timestamp * 1000 : null));
    const reason = holdReason(text);
    const src = firstImage(p);
    const row = {
      fb_post_id: id, date: d?.dot ?? null, category: "tsahim",
      title: text ? makeTitle(text) : "Шинэ нийтлэл",
      excerpt: text.replace(/\s+/g, " ").slice(0, 220) || null, body: text || null,
      link, image: src ? await copyImage(src, id) : null, published: !reason,
    };
    const { error } = await sb.from("news").insert(row);
    if (error) { if (!/duplicate/i.test(error.message)) console.warn("insert", error.message); continue; }
    reason ? held++ : added++;
    await notifyPost(row, reason);
    if (isVideo(p)) {
      const { data: vx } = await sb.from("videos").select("id").eq("url", link).limit(1);
      if (!vx?.length) {
        await sb.from("videos").insert({ title: row.title, url: link, platform: "facebook", video_date: d?.dash ?? null,
          orientation: /\/reel\//.test(link) ? "vertical" : "landscape", published: !reason });
        videos++;
      }
    }
  }
  return { checked: posts.length, added, held, videos };
}

function notifyPost(row: { title: string; date: string | null; link: string; fb_post_id: string }, reason: string | null) {
  const head = reason ? `⏸ Ноорог — ${reason}` : "✅ Сайтад нийтлэгдлээ";
  const extra = reason ? { reply_markup: { inline_keyboard: [[
    { text: "✅ Нийтлэх", callback_data: `pub:${row.fb_post_id}` },
    { text: "❌ Нуух", callback_data: `hide:${row.fb_post_id}` },
  ]] } } : {};
  return say(`${head}\n\n<b>${esc(row.title)}</b>\n${row.date ?? ""}\n${esc(row.link)}`, { disable_web_page_preview: false, ...extra });
}

async function doCheck() {
  try {
    const r = await runSync();
    const msg = r.added + r.held === 0
      ? `✔️ Шалгалт дууслаа — шинэ пост алга.\n(Сүүлийн ${r.checked} постыг шалгав.)`
      : `✔️ Шалгалт дууслаа\nНийтэлсэн: ${r.added} · Ноорог: ${r.held} · Видео: ${r.videos}`;
    await say(msg);
  } catch (e) {
    await say(`❌ Шалгаж чадсангүй.\n<code>${esc(String((e as Error).message || e)).slice(0, 300)}</code>`);
  }
}

// ---------- Товч: Нийтлэх / Нуух ----------
async function setPublished(fbId: string, pub: boolean) {
  const { data, error } = await sb.from("news").update({ published: pub }).eq("fb_post_id", fbId).select("link,title");
  if (error || !data?.length) return null;
  await sb.from("videos").update({ published: pub }).eq("url", data[0].link);
  return data[0];
}

const menu = { reply_markup: { keyboard: [[{ text: BTN_CHECK }]], resize_keyboard: true, is_persistent: true } };

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Анхны тохиргоо: webhook + командын жагсаалт
  if (req.method === "GET" && url.searchParams.get("setup") === "1") {
    const hook = `${SB_URL}/functions/v1/tg-bot`;
    const a = await tg("setWebhook", { url: hook, secret_token: await hookSecret(), allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
    const b = await tg("setMyCommands", { commands: [
      { command: "check", description: "Facebook-оос шинэ пост шалгах" },
      { command: "menu", description: "Цэс харуулах" },
    ] });
    return Response.json({ webhook: a.ok === true, commands: b.ok === true, admin_set: ADMIN !== "", apify_set: APIFY !== "" });
  }

  if (req.method !== "POST") return new Response("ok");
  if (req.headers.get("x-telegram-bot-api-secret-token") !== await hookSecret()) return new Response("forbidden", { status: 403 });

  // deno-lint-ignore no-explicit-any
  const u: any = await req.json().catch(() => ({}));

  // Товч дарсан
  if (u.callback_query) {
    const cq = u.callback_query;
    if (String(cq.from?.id) !== ADMIN) { await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Эрхгүй" }); return new Response("ok"); }
    const [act, fbId] = String(cq.data || "").split(":");
    const row = await setPublished(fbId, act === "pub");
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: row ? (act === "pub" ? "Нийтэлсэн" : "Нуусан") : "Пост олдсонгүй" });
    if (row) {
      await tg("editMessageReplyMarkup", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
      await say(act === "pub" ? `✅ Сайтад нийтлэгдлээ:\n<b>${esc(row.title)}</b>` : `❌ Сайтаас нуугдлаа:\n<b>${esc(row.title)}</b>`, { reply_to_message_id: cq.message.message_id });
    }
    return new Response("ok");
  }

  // Мессеж / команд
  const m = u.message;
  if (!m || String(m.chat?.id) !== ADMIN) return new Response("ok");
  const text = String(m.text || "").trim();

  if (/^\/(start|menu)\b/.test(text)) {
    await say("baatarkhuu.mn — удирдлагын цэс.\nДоорх товчоор Facebook-оос шинэ пост шалгана.", menu);
  } else if (/^\/check\b/.test(text) || text === BTN_CHECK) {
    await say("⏳ Facebook-оос шалгаж байна… (30–60 секунд)", menu);
    EdgeRuntime.waitUntil(doCheck());
  }
  return new Response("ok");
});
