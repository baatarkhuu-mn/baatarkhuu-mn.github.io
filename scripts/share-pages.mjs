// Facebook/Telegram-д хуваалцахад зурагтай урьдчилсан харагдац (preview) гаргах
//  1) Бүх хуудсанд og:/twitter: тэмдэглэгээг нэг загвараар оруулна (дахин ажиллуулахад аюулгүй)
//  2) Нийтэлсэн мэдээ бүрт /s/<id>/index.html — тухайн мэдээний гарчиг, тайлбар, зурагтай;
//     хүн нээвэл /medee-delgerengui/?id=<id> руу шууд шилжинэ
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (NEWS_FIXTURE=file.json — туршилтад)
import fs from "node:fs";
import path from "node:path";

const SITE = "https://baatarkhuu.mn";
const SB_URL = (process.env.SUPABASE_URL || "https://qtmueuyxqfgekbacymiu.supabase.co").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ROOT = process.env.SITE_ROOT || process.cwd();
const IMG = `${SITE}/assets/img/og-share.jpg`;
const SITE_NAME = "Ц.Баатархүү — УИХ-ын гишүүн";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const plain = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/https?:\/\/\S+/g, " ")
  .replace(/[#>*`_\[\]]/g, "").replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

// ---------- 1) Хуудсуудын og тэмдэглэгээ ----------
const PAGES = ["index.html", "namtar", "huuli", "tusul", "medee", "video", "tailan", "holboo",
  "medee-delgerengui", "huuli-delgerengui", "tusul-delgerengui", "arga-delgerengui", "tailan-delgerengui"];

function ogBlock({ title, desc, url, type }) {
  return [
    "  <!-- og:auto (scripts/share-pages.mjs) -->",
    `  <meta property="og:type" content="${type}" />`,
    `  <meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `  <meta property="og:locale" content="mn_MN" />`,
    `  <meta property="og:title" content="${esc(title)}" />`,
    `  <meta property="og:description" content="${esc(desc)}" />`,
    `  <meta property="og:url" content="${esc(url)}" />`,
    `  <meta property="og:image" content="${IMG}" />`,
    `  <meta property="og:image:width" content="1200" />`,
    `  <meta property="og:image:height" content="628" />`,
    `  <meta property="og:image:alt" content="Ц.Баатархүү — УИХ-ын гишүүн" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    "  <!-- /og:auto -->",
  ].join("\n");
}

function injectOg(rel) {
  const file = path.join(ROOT, rel.endsWith(".html") ? rel : `${rel}/index.html`);
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const get = (re) => (html.match(re) || [])[1];
  const title = get(/<meta property="og:title" content="([^"]*)"/) || get(/<title>([^<]*)<\/title>/) || SITE_NAME;
  const desc = get(/<meta property="og:description" content="([^"]*)"/) || get(/<meta name="description" content="([^"]*)"/) || "";
  const url = get(/<link rel="canonical" href="([^"]*)"/) || (rel === "index.html" ? `${SITE}/` : `${SITE}/${rel}/`);
  // Хуучин тэмдэглэгээг арилгана (утгыг дээр уншиж авсан) — HTML entity-г дахин escape хийхгүйн тулд decode
  const dec = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  html = html.replace(/\n  <!-- og:auto[\s\S]*?<!-- \/og:auto -->/g, "");
  html = html.replace(/\n[ \t]*<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/g, "");
  const block = ogBlock({ title: dec(title), desc: dec(desc), url, type: rel === "index.html" ? "website" : "website" });
  const anchor = html.match(/\n[ \t]*<meta name="description"[^>]*>/) || html.match(/\n[ \t]*<title>[^<]*<\/title>/);
  if (!anchor) return false;
  html = html.replace(anchor[0], anchor[0] + "\n" + block);
  if (html !== before) fs.writeFileSync(file, html);
  return html !== before;
}

// ---------- 2) Мэдээ бүрийн хуваалцах хуудас ----------
function sharePage(n) {
  const id = String(n.id);
  const title = clip(plain(n.title) || "Мэдээ", 110);
  const desc = clip(plain(n.excerpt || n.body || ""), 200) || "Ц.Баатархүү — УИХ-ын гишүүний албан ёсны мэдээ";
  const img = /^https?:\/\//.test(n.image || "") ? n.image : IMG;
  const target = `/medee-delgerengui/?id=${encodeURIComponent(id)}`;
  const self = `${SITE}/s/${encodeURIComponent(id)}/`;
  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} — Ц.Баатархүү</title>
  <meta name="description" content="${esc(desc)}" />
  <meta name="robots" content="noindex, follow" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${esc(SITE_NAME)}" />
  <meta property="og:locale" content="mn_MN" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${esc(self)}" />
  <meta property="og:image" content="${esc(img)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 16px">
  <p><a href="${esc(target)}">${esc(title)}</a></p>
</body>
</html>
`;
}

async function loadNews() {
  if (process.env.NEWS_FIXTURE) return JSON.parse(fs.readFileSync(process.env.NEWS_FIXTURE, "utf8"));
  if (!SB_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY хэрэгтэй");
  const r = await fetch(`${SB_URL}/rest/v1/news?published=eq.true&select=id,title,excerpt,body,image&order=created_at.desc&limit=1000`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) throw new Error(`news ${r.status}: ${await r.text()}`);
  return r.json();
}

async function main() {
  let ogChanged = 0;
  for (const p of PAGES) if (injectOg(p)) ogChanged++;

  const news = await loadNews();
  const dir = path.join(ROOT, "s");
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set();
  let written = 0, removed = 0;
  for (const n of news) {
    if (!n || !n.id) continue;
    const id = String(n.id);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) continue;
    keep.add(id);
    const f = path.join(dir, id, "index.html");
    const html = sharePage(n);
    if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== html) {
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, html);
      written++;
    }
  }
  // Нуусан/устгасан мэдээний хуудсыг арилгана
  for (const d of fs.readdirSync(dir)) {
    if (!keep.has(d) && fs.statSync(path.join(dir, d)).isDirectory()) { fs.rmSync(path.join(dir, d), { recursive: true }); removed++; }
  }
  console.log(`og: ${ogChanged} хуудас шинэчлэв · хуваалцах хуудас: ${written} шинэ/засвар, ${removed} устгав, нийт ${keep.size}`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
