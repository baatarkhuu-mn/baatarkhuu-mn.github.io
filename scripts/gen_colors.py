# -*- coding: utf-8 -*-
# Нүүр хуудсаар жишээлсэн акцент өнгөний харьцуулах хуудас үүсгэнэ.
OUT = r"C:/Users/azzay/OneDrive/Desktop/parliament-website/preview-colors.html"

colors = [
    ("Номин (Teal)",            "#0FB5AD", "#0A8F88"),
    ("Час улаан (Crimson)",     "#E11D48", "#BE1740"),
    ("Алтан шар (Amber-gold)",  "#E0A128", "#C08415"),
    ("Мөнгөн ногоон (Emerald)", "#0FA877", "#0B8A61"),
    ("Тэнгэрийн номин (Cyan)",  "#0AB4D4", "#0794B0"),
    ("Одоогийн — Улбар шар",    "#FF7A2E", "#E85E0C"),
]

TILE_ICONS = [
    ('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', "Намтар"),
    ('<path d="M12 3v18M5 7h14M7 7l-3 6a3 3 0 0 0 6 0zm10 0l-3 6a3 3 0 0 0 6 0z"/>', "Хууль"),
    ('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>', "Төслүүд"),
    ('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>', "Мэдээ"),
    ('<circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z"/>', "Видео"),
    ('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>', "Тайлан"),
]

def tiles():
    out = ""
    for path, label in TILE_ICONS:
        out += ('<div class="tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                'stroke-width="1.8" width="22" height="22">' + path + '</svg><span>' + label + '</span></div>')
    return out

def mock(name, acc, accd):
    return f'''
  <div class="mock" style="--acc:{acc}; --accd:{accd}">
    <div class="clabel"><span class="dot"></span>{name} <b>{acc}</b>
      <button class="pick" onclick="sendPrompt && sendPrompt('{name} ({acc}) өнгийг сонголоо, сайтад буулгаарай')">Сонгох</button>
    </div>
    <div class="hero">
      <div class="topbar">
        <div class="tools"><span class="tbtn">🇲🇳</span><span class="tbtn">⌕</span><span class="tbtn">☾</span></div>
        <span class="tbtn burger">≡</span>
      </div>
      <div class="hbody">
        <div class="left">
          <div class="brand"><img src="/assets/img/logo.svg" alt=""/><div class="bt"><span class="role">Монгол Улсын Их Хурлын гишүүн</span><span class="name">Цэндийн БААТАРХҮҮ</span></div></div>
          <p class="tag">Иргэдийн оролцоо, нээлттэй байдал, ил тод байдлыг дээдэлнэ.</p>
          <a class="cta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M3 11l16-6v14L3 15v-4z"/><path d="M11 17.6a3 3 0 0 1-5.7-1.3"/></svg>ИРГЭДЭЭ СОНСОХ, САНАЛ ХҮСЭЛТ ИЛГЭЭХ</a>
        </div>
        <div class="photo"></div>
      </div>
      <div class="tiles">{tiles()}</div>
    </div>
  </div>'''

mocks = "\n".join(mock(*c) for c in colors)

html = f'''<!DOCTYPE html>
<html lang="mn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Акцент өнгөний саналууд</title>
<style>
  body {{ margin:0; background:#070d1a; color:#e8eef8; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; padding:30px 20px 60px; }}
  .wrap {{ max-width:1080px; margin:0 auto; }}
  h1 {{ font-size:24px; margin:0 0 6px; }}
  .sub {{ color:#8a98b0; font-size:13px; margin:0 0 28px; }}
  .mock {{ margin-bottom:34px; }}
  .clabel {{ display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; margin-bottom:10px; }}
  .clabel b {{ color:var(--acc); font-family:ui-monospace,monospace; font-weight:600; }}
  .clabel .dot {{ width:14px; height:14px; border-radius:50%; background:var(--acc); }}
  .pick {{ margin-left:auto; background:transparent; border:1px solid var(--acc); color:var(--acc); font:inherit; font-size:12px; font-weight:700; padding:6px 14px; border-radius:8px; cursor:pointer; }}
  .pick:hover {{ background:var(--acc); color:#fff; }}
  .hero {{ position:relative; overflow:hidden; border-radius:16px; border:1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(60% 80% at 92% 0%, color-mix(in srgb, var(--acc) 26%, transparent), transparent 60%),
      radial-gradient(70% 90% at 0% 100%, rgba(56,108,195,.20), transparent 60%),
      linear-gradient(150deg,#0b1430,#0c1838); }}
  .topbar {{ display:flex; justify-content:space-between; align-items:center; padding:12px 16px; position:relative; z-index:3; }}
  .tools {{ display:flex; gap:6px; }}
  .tbtn {{ width:30px; height:30px; border-radius:8px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); display:grid; place-items:center; font-size:14px; }}
  .hbody {{ display:grid; grid-template-columns:1.05fr 1fr; gap:20px; align-items:center; padding:8px 20px 6px; position:relative; z-index:2; }}
  .brand {{ display:inline-flex; align-items:center; gap:13px; margin-bottom:12px; }}
  .brand img {{ width:60px; height:60px; object-fit:contain; }}
  .bt {{ display:flex; flex-direction:column; gap:2px; }}
  .role {{ color:#93a5c0; font-size:.8rem; font-weight:600; }}
  .name {{ color:#eef3fb; font-size:1.7rem; font-weight:800; letter-spacing:.02em; line-height:1.05; }}
  .tag {{ color:#93a5c0; font-size:.9rem; font-weight:500; margin:0 0 16px; max-width:32ch; }}
  .cta {{ display:inline-flex; align-items:center; gap:9px; background:var(--acc); color:#fff; font-weight:700; font-size:.9rem;
    padding:14px 24px; border-radius:12px; box-shadow:0 14px 30px -12px color-mix(in srgb, var(--acc) 70%, transparent); }}
  .photo {{ height:210px; border-radius:12px;
    background:url("/assets/img/member-hero.jpg") center right / cover no-repeat;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, #000 40%); mask-image:linear-gradient(to right, transparent 0%, #000 40%); }}
  .tiles {{ display:grid; grid-template-columns:repeat(6,1fr); gap:10px; padding:14px 20px 20px; position:relative; z-index:2; }}
  .tile {{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:14px 6px; border-radius:12px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); font-size:.78rem; color:#c8d3e8; }}
  .tile svg {{ color:var(--acc); }}
  @media (max-width:760px) {{ .hbody {{ grid-template-columns:1fr; }} .photo {{ height:150px; }} .tiles {{ grid-template-columns:repeat(3,1fr); }} .name {{ font-size:1.3rem; }} }}
</style></head>
<body><div class="wrap">
  <h1>Акцент өнгөний саналууд — нүүр хуудсаар жишээлсэн</h1>
  <p class="sub">Одоогийн улбар шарыг сольж болох 5 өвөрмөц хувилбар (+ доор нь одоогийн). Аль нь таалагдсаныг «Сонгох» дарж эсвэл нэрийг нь бичээд хэлээрэй.</p>
  {mocks}
</div></body></html>'''

open(OUT, "w", encoding="utf-8").write(html)
print("written:", OUT, len(html), "chars,", len(colors), "options")
