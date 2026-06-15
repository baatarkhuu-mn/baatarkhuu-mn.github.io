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

  /* ---------- 6.1 Сэтгэл ханамжийн үнэлгээ (1–10 оноо) ----------
     <div data-rating="нэр"> доторх .rating-д 1–10 оноо үүсгэнэ.
     data-persist байвал localStorage-д хадгална (нэг хөтөчид нэг үнэлгээ).
     Доторх hidden input-д утга бичигдэх тул форм дотор шууд ажиллана. */
  const Rating = {
    MAX: 10,
    label(n) {
      if (n <= 2) return "Маш муу";
      if (n <= 4) return "Муу";
      if (n <= 6) return "Дунд зэрэг";
      if (n <= 8) return "Сайн";
      return "Маш сайн";
    },
    init() {
      document.querySelectorAll("[data-rating]").forEach((box) => {
        const wrap = box.querySelector(".rating");
        if (!wrap) return;
        const msg = box.querySelector(".rating-msg");
        const hidden = box.querySelector('input[type="hidden"]');
        const persist = box.hasAttribute("data-persist");
        const key = "rating-" + box.dataset.rating;
        let current = persist ? parseInt(localStorage.getItem(key), 10) || 0 : 0;
        if (current > Rating.MAX) current = Rating.MAX;
        const scores = [];
        const paint = (n) => scores.forEach((s, i) => s.classList.toggle("on", i < n));
        const show = (n, saved) => {
          if (!msg) return;
          msg.textContent = n
            ? "Таны үнэлгээ: " + n + "/10 — " + Rating.label(n) + (saved ? ". Баярлалаа! 🙏" : "")
            : "Оноо дээр дарж үнэлнэ үү (1–10)";
        };
        for (let i = 1; i <= Rating.MAX; i++) {
          const b = document.createElement("button");
          b.type = "button"; b.className = "score"; b.textContent = i;
          b.setAttribute("aria-label", i + " оноо — " + Rating.label(i));
          b.addEventListener("mouseenter", () => paint(i));
          b.addEventListener("focus", () => paint(i));
          b.addEventListener("mouseleave", () => paint(current));
          b.addEventListener("blur", () => paint(current));
          b.addEventListener("click", () => {
            current = i;
            if (hidden) hidden.value = i;
            if (persist) localStorage.setItem(key, i);
            paint(i); show(i, true);
          });
          scores.push(b); wrap.appendChild(b);
        }
        if (hidden && current) hidden.value = current;
        box._resetRating = () => { current = 0; if (hidden) hidden.value = ""; paint(0); show(0, false); };
        paint(current); show(current, current > 0);
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

      /* --- Илгээх (Supabase руу хадгална) --- */
      const submitBtn = form.querySelector('button[type="submit"]');
      const honeypot = form.querySelector("#f-website"); // спам шүүлтүүр
      const showError = (txt) => {
        if (!success) return;
        success.classList.add("show");
        success.style.background = "rgba(240,98,98,.12)";
        success.style.borderColor = "rgba(240,98,98,.4)";
        success.style.color = "var(--color-danger)";
        success.textContent = txt;
      };
      const resetSuccessStyle = () => {
        if (!success) return;
        success.style.background = ""; success.style.borderColor = ""; success.style.color = "";
      };

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (honeypot && honeypot.value) return; // бот бол чимээгүй таслана

        const sb = window.getSB && window.getSB();
        const ratingIn = form.querySelector("#f-rating");

        // Supabase холбогдоогүй бол (демо горим) — хуучнаар амжилттай гэж харуулна
        if (!sb) {
          const parts = [];
          if (files.length) parts.push(`${files.length} зураг`);
          if (latIn && latIn.value) parts.push("GPS байршил");
          if (ratingIn && ratingIn.value) parts.push(`үнэлгээ ${ratingIn.value}/10`);
          resetSuccessStyle();
          success && success.classList.add("show");
          if (success) success.textContent = "✓ Таны санал хүсэлт" + (parts.length ? ` (${parts.join(", ")} хавсралттай)` : "") + " амжилттай илгээгдлээ. (Демо горим — backend холбогдоогүй)";
          form.reset(); files = []; renderPreviews(); resetGeo(); resetKhoroo();
          const rb = form.querySelector("[data-rating]"); if (rb && rb._resetRating) rb._resetRating();
          setTimeout(() => success && success.classList.remove("show"), 8000);
          return;
        }

        // Жинхэнэ илгээлт
        const origBtnText = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Илгээж байна…"; }
        resetSuccessStyle();
        try {
          // 1) Зургуудыг storage руу хуулах
          const photoPaths = [];
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
            const path = `${Date.now()}-${i}-${Math.round(performance.now())}.${ext}`;
            const { error: upErr } = await sb.storage.from("feedback-photos").upload(path, f, { contentType: f.type });
            if (upErr) throw upErr;
            photoPaths.push(path);
          }
          // 2) Мөр оруулах
          const fd = new FormData(form);
          const row = {
            name: (fd.get("name") || "").toString().trim(),
            email: (fd.get("email") || "").toString().trim(),
            phone: (fd.get("phone") || "").toString().trim() || null,
            subject: (fd.get("subject") || "").toString(),
            district: (fd.get("district") || "").toString() || null,
            khoroo: (fd.get("khoroo") || "").toString() || null,
            message: (fd.get("message") || "").toString().trim(),
            lat: latIn && latIn.value ? parseFloat(latIn.value) : null,
            lng: lngIn && lngIn.value ? parseFloat(lngIn.value) : null,
            rating: ratingIn && ratingIn.value ? parseInt(ratingIn.value, 10) : null,
            photos: photoPaths,
          };
          const { error: insErr } = await sb.from("feedback").insert(row);
          if (insErr) throw insErr;

          // Амжилт
          const parts = [];
          if (photoPaths.length) parts.push(`${photoPaths.length} зураг`);
          if (row.lat) parts.push("GPS байршил");
          if (row.rating) parts.push(`үнэлгээ ${row.rating}/10`);
          success && success.classList.add("show");
          if (success) success.textContent = "✓ Таны санал хүсэлт" + (parts.length ? ` (${parts.join(", ")} хавсралттай)` : "") + " амжилттай хүлээн авлаа. Бид удахгүй хариу өгөх болно.";
          form.reset(); files = []; renderPreviews(); resetGeo(); resetKhoroo();
          const rb = form.querySelector("[data-rating]"); if (rb && rb._resetRating) rb._resetRating();
          setTimeout(() => { success && success.classList.remove("show"); resetSuccessStyle(); }, 9000);
        } catch (err) {
          showError("⚠ Илгээхэд алдаа гарлаа: " + (err.message || "сүлжээний асуудал") + ". Дахин оролдох эсвэл утсаар холбогдоно уу.");
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origBtnText; }
        }
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
    Counters.init(); Video.init(); Rating.init(); Forms.init(); Filter.init();
    Share.init(); Misc.init();
  });
})();
