/* =========================================================
   main.js — Сайтын бүх интерактив үйлдэл
   Модулиуд: Theme, Nav, Search, Reveal, Counters,
             Video, Forms, Filters, Share, BackToTop
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. Dark / Light Theme ---------- */
  const Theme = {
    init() {
      // Үндсэн горим — хар хөх (dark). Хэрэглэгч light сонговол хадгална.
      const saved = localStorage.getItem("theme");
      const theme = saved || "dark";
      document.documentElement.setAttribute("data-theme", theme);

      const btn = document.querySelector(".theme-toggle");
      if (btn) {
        btn.addEventListener("click", () => {
          const cur = document.documentElement.getAttribute("data-theme");
          const next = cur === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", next);
          localStorage.setItem("theme", next);
          btn.setAttribute("aria-pressed", next === "dark");
        });
      }
    },
  };

  /* ---------- 2. Mobile Navigation ---------- */
  const Nav = {
    init() {
      const toggle = document.querySelector(".nav-toggle");
      const nav = document.querySelector(".main-nav");
      if (!toggle || !nav) return;

      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open);
      });
      // Цэс дээр дарахад хаах
      nav.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          nav.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        })
      );

      // Header scroll shadow
      const header = document.querySelector(".site-header");
      if (header) {
        const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }
    },
  };

  /* ---------- 3. Хайлт (Search) ---------- */
  // CMS/Admin-аас динамикаар дүүргэх боломжтой — одоогоор статик индекс
  const SEARCH_INDEX = (window.SITE_SEARCH_INDEX) || [
    { cat: "Нүүр", title: "Нүүр хуудас", url: "index.html" },
    { cat: "Намтар", title: "Гишүүний намтар, боловсрол, туршлага", url: "namtar.html" },
    { cat: "Хууль", title: "Өргөн барьсан болон хамтран санаачилсан хуулиуд", url: "huuli.html" },
    { cat: "Мэдээ", title: "Сүүлийн үеийн мэдээ мэдээлэл", url: "medee.html" },
    { cat: "Видео", title: "Ярилцлага, чуулганы үг хэлсэн бичлэгүүд", url: "video.html" },
    { cat: "Тайлан", title: "Сар бүрийн ба жилийн тайлан, инфографик", url: "tailan.html" },
    { cat: "Холбоо барих", title: "Хаяг, утас, и-мэйл, санал хүсэлт", url: "holboo.html" },
  ];

  const Search = {
    init() {
      const openBtn = document.querySelector(".search-open");
      const overlay = document.querySelector(".search-overlay");
      if (!openBtn || !overlay) return;
      const input = overlay.querySelector("input[type=search]");
      const results = overlay.querySelector(".search-results");

      const open = () => { overlay.classList.add("open"); setTimeout(() => input.focus(), 50); };
      const close = () => { overlay.classList.remove("open"); input.value = ""; render(""); };

      openBtn.addEventListener("click", open);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      });
      const closeBtn = overlay.querySelector(".search-close");
      if (closeBtn) closeBtn.addEventListener("click", close);

      function render(q) {
        const query = q.trim().toLowerCase();
        if (!query) { results.innerHTML = ""; return; }
        const matches = SEARCH_INDEX.filter(
          (i) => i.title.toLowerCase().includes(query) || i.cat.toLowerCase().includes(query)
        );
        results.innerHTML = matches.length
          ? matches.map((m) => `<a href="${m.url}"><div class="res-cat">${m.cat}</div><div class="res-title">${m.title}</div></a>`).join("")
          : `<div class="search-empty">"${q}" гэсэн илэрц олдсонгүй.</div>`;
      }
      input.addEventListener("input", (e) => render(e.target.value));
    },
  };

  /* ---------- 4. Reveal on scroll ---------- */
  const Reveal = {
    init() {
      const els = document.querySelectorAll(".reveal");
      if (!els.length || !("IntersectionObserver" in window)) {
        els.forEach((e) => e.classList.add("visible"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
        }),
        { threshold: 0.12 }
      );
      els.forEach((e) => io.observe(e));
    },
  };

  /* ---------- 5. Тоолуур (Counters) ---------- */
  const Counters = {
    init() {
      const nums = document.querySelectorAll("[data-count]");
      if (!nums.length) return;
      const animate = (el) => {
        const target = parseFloat(el.dataset.count);
        const dur = 1400; const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target).toLocaleString("mn-MN");
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString("mn-MN");
        };
        requestAnimationFrame(step);
      };
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
      }), { threshold: 0.5 });
      nums.forEach((n) => io.observe(n));
    },
  };

  /* ---------- 6. Видео thumbnail → embed / гадаад линк ----------
     data-yt="ID"   → дарахад YouTube embed болж тоглоно
     data-href="…"  → дарахад гадаад линк (жишээ нь Facebook видео) шинэ цонхонд нээнэ */
  const Video = {
    init() {
      document.querySelectorAll(".video-thumb[data-yt], .video-thumb[data-href]").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          if (thumb.dataset.href) { window.open(thumb.dataset.href, "_blank", "noopener"); return; }
          const id = thumb.dataset.yt;
          const wrap = document.createElement("div");
          wrap.className = "video-embed";
          wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="YouTube видео" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          thumb.replaceWith(wrap);
        });
        thumb.setAttribute("role", "button");
        thumb.setAttribute("tabindex", "0");
        thumb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); thumb.click(); } });
      });
    },
  };

  /* ---------- 7. Санал хүсэлтийн форм ----------
     Дүүрэг/хороо сонголт, зураг хавсаргах, GPS байршил */
  const Forms = {
    init() {
      const form = document.querySelector("#contact-form");
      if (!form) return;
      const success = form.querySelector(".form-success");

      /* --- Дүүрэг → хороо сонголт --- */
      const district = form.querySelector("#f-district");
      const khoroo = form.querySelector("#f-khoroo");
      const KHOROO_COUNT = { "Чингэлтэй": 19, "Сүхбаатар": 20 };
      const resetKhoroo = () => {
        if (!khoroo) return;
        khoroo.disabled = true;
        khoroo.innerHTML = '<option value="">Эхлээд дүүргээ сонгоно уу</option>';
      };
      if (district && khoroo) {
        district.addEventListener("change", () => {
          const n = KHOROO_COUNT[district.value];
          if (!n) { resetKhoroo(); return; }
          khoroo.disabled = false;
          khoroo.innerHTML = '<option value="">Хороо сонгох…</option>' +
            Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1}-р хороо</option>`).join("");
        });
      }

      /* --- Зураг хавсаргах (камер/файл/чирэх) --- */
      const MAX_FILES = 5, MAX_MB = 8;
      const fileInput = form.querySelector("#f-photos");
      const previews = form.querySelector("#photo-previews");
      const zone = form.querySelector(".upload-zone");
      let files = [];

      const renderPreviews = () => {
        if (!previews) return;
        previews.innerHTML = "";
        files.forEach((f, idx) => {
          const url = URL.createObjectURL(f);
          const div = document.createElement("div");
          div.className = "ph";
          div.innerHTML = `<img src="${url}" alt="Хавсаргасан зураг ${idx + 1}" /><button type="button" aria-label="Зураг устгах">✕</button>`;
          div.querySelector("button").addEventListener("click", () => { files.splice(idx, 1); renderPreviews(); });
          previews.appendChild(div);
        });
      };
      const addFiles = (list) => {
        for (const f of list) {
          if (!f.type.startsWith("image/")) continue;
          if (f.size > MAX_MB * 1024 * 1024) { alert(`"${f.name}" хэт том байна — ${MAX_MB}MB-аас бага зураг оруулна уу.`); continue; }
          if (files.length >= MAX_FILES) { alert(`Дээд тал нь ${MAX_FILES} зураг хавсаргах боломжтой.`); break; }
          files.push(f);
        }
        renderPreviews();
      };
      if (fileInput) {
        fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
      }
      if (zone) {
        ["dragover", "dragenter"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("drag"); }));
        ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("drag"); }));
        zone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
      }

      /* --- GPS байршил тогтоох --- */
      const geoBtn = form.querySelector("#geo-btn");
      const geoStatus = form.querySelector("#geo-status");
      const geoMap = form.querySelector("#geo-map");
      const latIn = form.querySelector("#f-lat");
      const lngIn = form.querySelector("#f-lng");
      const resetGeo = () => {
        if (geoStatus) geoStatus.textContent = "Байршил тогтоогоогүй";
        if (geoMap) { geoMap.style.display = "none"; geoMap.innerHTML = ""; }
        if (latIn) latIn.value = ""; if (lngIn) lngIn.value = "";
      };
      if (geoBtn) {
        geoBtn.addEventListener("click", () => {
          if (!navigator.geolocation) { geoStatus.textContent = "⚠ Таны төхөөрөмж байршил тогтоохыг дэмжихгүй байна."; return; }
          geoStatus.textContent = "⏳ Байршил тогтоож байна…";
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng, accuracy } = pos.coords;
              latIn.value = lat.toFixed(6);
              lngIn.value = lng.toFixed(6);
              geoStatus.innerHTML = `✅ Тогтоогдлоо: <strong>${lat.toFixed(5)}, ${lng.toFixed(5)}</strong> (±${Math.round(accuracy)}м)`;
              if (geoMap) {
                geoMap.style.display = "block";
                geoMap.innerHTML = `<iframe src="https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed" title="Таны тогтоосон байршил" loading="lazy" style="width:100%;height:240px;border:0;display:block"></iframe>`;
              }
            },
            (err) => {
              geoStatus.textContent = err.code === 1
                ? "⚠ Байршлын зөвшөөрөл олгогдоогүй. Хөтчийн тохиргооноос зөвшөөрнө үү."
                : "⚠ Байршил авч чадсангүй. Дахин оролдоно уу.";
            },
            { enableHighAccuracy: true, timeout: 12000 }
          );
        });
      }

      /* --- Илгээх --- */
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        // Backend/CMS руу илгээх цэг — зураг + байршил FormData-д багтана:
        // const data = new FormData(form);
        // files.forEach((f) => data.append("photos[]", f));
        // fetch("/api/feedback", { method: "POST", body: data });
        if (success) {
          const parts = [];
          if (files.length) parts.push(`${files.length} зураг`);
          if (latIn && latIn.value) parts.push("GPS байршил");
          success.classList.add("show");
          success.textContent = "✓ Таны санал хүсэлт" + (parts.length ? ` (${parts.join(", ")} хавсралттай)` : "") + " амжилттай илгээгдлээ. Бид удахгүй хариу өгөх болно.";
        }
        form.reset();
        files = []; renderPreviews();
        resetGeo(); resetKhoroo();
        setTimeout(() => success && success.classList.remove("show"), 8000);
      });
    },
  };

  /* ---------- 8. Шүүлтүүр (Хууль / Мэдээ) ---------- */
  const Filter = {
    init() {
      const container = document.querySelector("[data-filterable]");
      if (!container) return;
      const items = Array.from(container.querySelectorAll("[data-item]"));
      const search = document.querySelector("#filter-search");
      const select = document.querySelector("#filter-category");
      const statusSel = document.querySelector("#filter-status");
      const empty = document.querySelector(".filter-empty");

      const apply = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const cat = select?.value || "all";
        const status = statusSel?.value || "all";
        let shown = 0;
        items.forEach((it) => {
          const text = it.dataset.title?.toLowerCase() || it.textContent.toLowerCase();
          const okText = !q || text.includes(q);
          const okCat = cat === "all" || it.dataset.category === cat;
          const okStatus = status === "all" || it.dataset.status === status;
          const visible = okText && okCat && okStatus;
          it.style.display = visible ? "" : "none";
          if (visible) shown++;
        });
        if (empty) empty.style.display = shown ? "none" : "block";
      };
      [search, select, statusSel].forEach((el) => el && el.addEventListener("input", apply));
    },
  };

  /* ---------- 9. Social Share ---------- */
  const Share = {
    init() {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      document.querySelectorAll("[data-share]").forEach((a) => {
        const type = a.dataset.share;
        const map = {
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
          twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
          telegram: `https://t.me/share/url?url=${url}&text=${title}`,
        };
        if (map[type]) { a.href = map[type]; a.target = "_blank"; a.rel = "noopener"; }
      });
      // Native share / хуулах
      const copyBtn = document.querySelector("[data-share='copy']");
      if (copyBtn) copyBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          if (navigator.share) await navigator.share({ title: document.title, url: window.location.href });
          else { await navigator.clipboard.writeText(window.location.href); copyBtn.setAttribute("title", "Холбоос хуулагдлаа!"); }
        } catch (_) {}
      });
    },
  };

  /* ---------- 10. Back to top + он шинэчлэх ---------- */
  const Misc = {
    init() {
      const btn = document.querySelector(".to-top");
      if (btn) {
        const onScroll = () => btn.classList.toggle("show", window.scrollY > 400);
        window.addEventListener("scroll", onScroll, { passive: true });
        btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      }
      document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

      // Идэвхтэй цэсийг тэмдэглэх
      const path = location.pathname.split("/").pop() || "index.html";
      document.querySelectorAll(".main-nav a").forEach((a) => {
        if (a.getAttribute("href") === path) a.classList.add("active");
      });
    },
  };

  /* ---------- Бүгдийг эхлүүлэх ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    Theme.init(); Nav.init(); Search.init(); Reveal.init();
    Counters.init(); Video.init(); Forms.init(); Filter.init();
    Share.init(); Misc.init();
  });
})();
