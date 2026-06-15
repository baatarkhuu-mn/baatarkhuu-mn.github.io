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
    { cat: "Төслүүд", title: "Тойрогт хэрэгжүүлсэн төслүүд", url: "tusul.html" },
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
      const KHOROO_COUNT = { "Чингэлтэй": 24, "Сүхбаатар": 20 };
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
      const districtSel = document.querySelector("#filter-district");
      const empty = document.querySelector(".filter-empty");

      const apply = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const cat = select?.value || "all";
        const status = statusSel?.value || "all";
        const district = districtSel?.value || "all";
        let shown = 0;
        items.forEach((it) => {
          const text = it.dataset.title?.toLowerCase() || it.textContent.toLowerCase();
          const okText = !q || text.includes(q);
          const okCat = cat === "all" || it.dataset.category === cat;
          const okStatus = status === "all" || it.dataset.status === status;
          const okDistrict = district === "all" || it.dataset.district === district;
          const visible = okText && okCat && okStatus && okDistrict;
          it.style.display = visible ? "" : "none";
          if (visible) shown++;
        });
        if (empty) empty.style.display = shown ? "none" : "block";
      };
      [search, select, statusSel, districtSel].forEach((el) => el && el.addEventListener("input", apply));
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

  /* ---------- 11. Хэл солих (MN / EN) — бүрэн орчуулга ----------
     TreeWalker-ээр текстийн зангилаа бүрийг шалгаж, толь бичигт байвал
     англиар сольдог. localStorage-д хадгална. Толь бичигт байхгүй текст
     монголоороо үлдэнэ. */
  const I18n = {
    ph: {
      "Түлхүүр үг бичнэ үү…": "Type a keyword…",
      "🔍 Хуулийн нэрээр хайх…": "🔍 Search by law name…",
      "Таны овог нэр": "Your full name",
      "+976 ХХХХ-ХХХХ": "+976 XXXX-XXXX",
      "tanii@mail.mn": "you@mail.mn",
      "Тулгамдсан асуудал, санал хүсэлтээ дэлгэрэнгүй бичнэ үү…": "Describe your issue or request in detail…",
    },
    dict: {
      /* ---- Чиглүүлэх / footer / нийтлэг ---- */
      "Нүүр": "Home", "Намтар": "Biography", "Хууль, санаачилга": "Laws & Initiatives",
      "Төслүүд": "Projects", "Мэдээ": "News", "Видео": "Video", "Тайлан": "Reports",
      "Холбоо барих": "Contact", "УИХ-ын гишүүн": "Member of Parliament",
      "Цэс": "Menu", "Холбоос": "Links", "Сошиал": "Social", "Видео сан": "Video library",
      "X (Twitter)": "X (Twitter)", "Үндсэн агуулга руу очих": "Skip to main content",
      "Сайтаас хайх": "Search the site", "Хаах": "Close",
      "Цэндийн Баатархүү": "Tsendiin Baatarkhüü",
      "Монгол Улсын Их Хурлын гишүүн. Сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүргийн иргэдийн итгэлийг хүлээж, шударга ёс, цахим хөгжлийн төлөө ажилласаар байна.":
        "Member of the State Great Khural of Mongolia. Earning the trust of citizens of Electoral District 10 — Chingeltei and Sükhbaatar — and working for justice and digital development.",
      "УИХ-ын вебсайт": "Parliament website", "Хууль зүйн портал": "Legal information portal",
      "Гишүүний албан ёсны CV": "Member's official CV", "Санал хүсэлт": "Feedback",
      "📍 Улаанбаатар хот, Сүхбаатар дүүрэг, Төрийн ордон": "📍 Ulaanbaatar, Sükhbaatar District, State Palace",
      "Бүх эрх хуулиар хамгаалагдсан.": "All rights reserved.",
      "УИХ-ын гишүүний албан ёсны вебсайт.": "Official website of the Member of Parliament.",
      "Facebook": "Facebook",

      /* ---- Нүүр ---- */
      "Цэндийн БААТАРХҮҮ": "Tsendiin BAATARKHÜÜ",
      "Монгол Улсын Их Хурлын гишүүн": "Member of the State Great Khural of Mongolia",
      "«Иргэдийнхээ итгэлийг дээдэлж, шударга ёс, цахим хөгжлийн төлөө ажиллана.»":
        "«Honoring the trust of citizens, working for justice and digital development.»",
      "Миний тайлан үзэх": "View my reports",
      "2024–2028 · 10-р тойрог — Чингэлтэй, Сүхбаатар дүүрэг": "2024–2028 · District 10 — Chingeltei, Sükhbaatar",
      "Шинэ мэдээ": "Latest news", "Онцлох мэдээ мэдээлэл": "Featured news",
      "Парламентын үйл ажиллагаа, тойргийн иргэдтэй хийсэн уулзалт болон бодлогын шийдвэрүүд.":
        "Parliamentary work, meetings with constituents, and policy decisions.",
      "Хяналт шалгалт": "Oversight",
      "Нийслэлд олгосон газрын асуудлаар Хянан шалгах түр хороо байгуулахыг санаачиллаа":
        "Initiated a temporary oversight committee on land allocations in the capital",
      "Ц.Баатархүү гишүүн тэргүүтэй УИХ-ын 35 гишүүн 1992–2025 онд нийслэлд олгосон газрын асуудлыг шалгах түр хороо байгуулах саналыг өргөн барив.":
        "Led by MP Ts.Baatarkhüü, 35 members of Parliament submitted a proposal to form a temporary committee investigating land allocations made in the capital during 1992–2025.",
      "Эх сурвалж: Eguur.mn →": "Source: Eguur.mn →",
      "Уулзалт": "Meeting",
      "Чингэлтэй, Сүхбаатар дүүргийн иргэдтэй нээлттэй уулзалт хийлээ":
        "Held an open meeting with residents of Chingeltei and Sükhbaatar districts",
      "10-р тойргийн иргэдийн өргөдөл, санал хүсэлтийг сонсож, гэр хорооллын дэд бүтцийн асуудлыг хэлэлцлээ.":
        "Listened to petitions from District 10 residents and discussed ger-district infrastructure.",
      "Дэлгэрэнгүй →": "Read more →",
      "Чуулган": "Session",
      "УИХ-ын хаврын ээлжит чуулганаар хэлэлцэж буй асуудлуудад байр сууриа илэрхийллээ":
        "Stated positions on matters debated at Parliament's spring session",
      "УИХ-ын хаврын ээлжит чуулганы хэлэлцүүлэгт байр сууриа илэрхийллээ":
        "Stated positions in Parliament's spring session debates",
      "Улсын төсвийн тодотгол, нийгмийн хамгааллын багц хуулийн хэлэлцүүлэгт идэвхтэй оролцож байна.":
        "Actively participating in debates on the state budget amendment and the social welfare package of laws.",
      "Бүх мэдээг үзэх": "View all news",
      "Тоо баримтаар": "By the numbers", "Карьерын товч үзүүлэлт": "Career at a glance",
      "Төрийн болон олон нийтийн албанд ажилласан замналын дүн.": "A summary of service in public office and civic life.",
      "Жил төрийн ба олон нийтийн албанд": "Years in public & civic service",
      "Жил Нийслэлийн ИТХ-ын төлөөлөгч": "Years as a Capital City Council member",
      "Хэвлүүлсэн ном бүтээл": "Published books", "Гадаад хэлний мэдлэг": "Foreign languages",
      "Бүрэн тайлан үзэх": "View full report",
      "Видео сан": "Video library", "Сүүлийн видео": "Latest videos",
      "Чуулганы үг хэлсэн бичлэг болон хэвлэлийн ярилцлагууд.": "Session speeches and press interviews.",
      "Гишүүний видео бичлэгүүд — Facebook видео сан": "Member's videos — Facebook video library",
      "Шууд нэвтрүүлэг, ярилцлагууд — Facebook": "Live broadcasts and interviews — Facebook",
      "Бүх видео үзэх": "View all videos",
      "Таны санал бидэнд чухал": "Your feedback matters to us",
      "Хүсэлт, өргөдөл, санал гомдлоо илгээгээрэй. Сонгогч бүрийн дуу хоолой надад чухал.":
        "Send your requests, petitions, suggestions and complaints. Every constituent's voice matters to me.",
      "Санал хүсэлт илгээх": "Send feedback",
      "Ил тод байдал": "Transparency",
      "Парламентын чуулганы ирц": "Parliamentary session attendance",
      "2025 оны намрын чуулган. Эх сурвалж: Улсын Их Хурал.": "2025 autumn session. Source: State Great Khural.",
      "Ирсэн": "Attended", "Чөлөөтэй": "On leave", "Тасалсан": "Missed", "Хоцорсон минут": "Minutes late",
      "Бодит ирцийн мэдээлэл (УИХ) →": "Live attendance data (Parliament) →",
      "Мэндчилгээ": "Greeting",
      "Эрхэм хүндэт иргэн та бүхэнд энэ өдрийн мэнд хүргэе": "Warm greetings to every respected citizen",
      "Намайг Улсын Их Хурлын гишүүнээр сонгож, итгэл хүлээлгэсэн Чингэлтэй, Сүхбаатар дүүргийн иргэд та бүхэндээ чин сэтгэлийн талархал илэрхийлье. Таны итгэл бол миний өдөр тутмын ажлын хөдөлгөгч хүч юм.":
        "I sincerely thank the residents of Chingeltei and Sükhbaatar districts who elected me to the State Great Khural and placed their trust in me. Your trust is the driving force behind my daily work.",
      "«Өөр Бодлого Бүтээгч Монгол»": "“A Mongolia That Builds a Different Policy”",
      "Бид энэхүү зорилтын хүрээнд хуучирсан хандлагыг өөрчилж, иргэн төвтэй, шударга, цахим хөгжилд тулгуурласан шинэ бодлогыг бүтээхээр ажиллаж байна. Боловсрол, ногоон хөгжил, дэд бүтэц, эрүүл мэндийн салбарт тойргийнхоо иргэдийн амьдралд бодит өөрчлөлт авчрахыг эрхэм зорилгоо болгосон.":
        "Under this vision, we are working to replace outdated approaches and build a new, citizen-centered and fair policy grounded in digital development. Our mission is to bring real change to constituents' lives in education, green development, infrastructure and healthcare.",
      "Таны санал, шүүмжлэл, дэмжлэг бүхэн надад үнэ цэнэтэй. Хамтдаа өөр, илүү сайхан Монголыг бүтээцгээе.":
        "Every suggestion, critique and show of support matters to me. Together, let us build a different and better Mongolia.",
      "— Цэндийн Баатархүү": "— Tsendiin Baatarkhüü",

      /* ---- Намтар ---- */
      "Танилцуулга": "Introduction",
      "Цэндийн Баатархүү нь 1981 оны 11 дүгээр сарын 14-нд Хэнтий аймагт төрсөн. Улс төрч, бизнес эрхлэгч бөгөөд 2024 оны УИХ-ын сонгуулиар сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүргээс Улсын Их Хурлын гишүүнээр сонгогдсон.":
        "Tsendiin Baatarkhüü was born on 14 November 1981 in Khentii province. A politician and businessman, he was elected to the State Great Khural in the 2024 election from Electoral District 10 — Chingeltei and Sükhbaatar districts.",
      "2024–2025 онд Монгол Улсын Засгийн газрын Цахим хөгжил, инновац, харилцаа холбооны сайдаар ажилласан. 2020–2024 онд Ардчилсан намын Ерөнхий нарийн бичгийн даргын алба хашиж байв.":
        "From 2024 to 2025 he served as Minister of Digital Development, Innovation and Communications. From 2020 to 2024 he was Secretary General of the Democratic Party.",
      "«Зөв ярих ухаан», «Ажил хэргийн гурвалжин», «Манлайллын мөрдлөг» зэрэг гурван ном бичиж хэвлүүлсэн. Англи, турк хэлтэй.":
        "He has authored three books: “The Art of Speaking Well,” “The Business Triangle,” and “The Leadership Code.” He speaks English and Turkish.",
      "🎓 Боловсрол": "🎓 Education", "💼 Ажлын туршлага": "💼 Work experience",
      "Замнал": "Journey", "Улс төрийн үйл ажиллагаа": "Political career",
      "Олон нийтийн өмнө хүлээсэн үүрэг хариуцлагын замнал он цагийн дарааллаар.":
        "A chronological path of public responsibilities.",
      "УИХ-ын гишүүн, Цахим хөгжлийн сайд": "MP and Minister of Digital Development",
      "Сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүргээс УИХ-ын гишүүнээр сонгогдож, Цахим хөгжил, инновац, харилцаа холбооны сайдаар томилогдсон (2024–2025).":
        "Elected MP from Electoral District 10 — Chingeltei and Sükhbaatar — and appointed Minister of Digital Development, Innovation and Communications (2024–2025).",
      "Ардчилсан намын Ерөнхий нарийн бичгийн дарга": "Secretary General of the Democratic Party",
      "Намын үйл ажиллагааг удирдан зохион байгуулж, дотоод бүтэц, зохион байгуулалтыг бэхжүүлэхэд ажилласан (2020–2024).":
        "Directed party operations and strengthened its internal structure and organization (2020–2024).",
      "Нийслэлийн удирдлагад": "In the city administration",
      "Нийслэлийн Засаг даргын орлогчоор (2012–2013), Нийслэлийн иргэдийн Төлөөлөгчдийн Хурлын төлөөлөгчөөр (2012–2020) ажилласан.":
        "Served as Deputy Governor of the Capital (2012–2013) and as a member of the Capital City Citizens' Representatives Khural (2012–2020).",
      "Засгийн газрын Хэвлэл мэдээллийн албаны дарга": "Head of the Government Press & Information Office",
      "Төрийн мэдээлэл, харилцааны бодлогын хэрэгжилтийг хариуцан ажилласан (2005–2006).":
        "Responsible for government information and communications policy (2005–2006).",
      "Монголын лекторын төв": "Mongolian Lecturers' Center",
      "Монголын лекторын төвийг үүсгэн байгуулж, манлайлал, илтгэх урлагийн сургалтуудыг олон нийтэд хүргэсэн (2004–2012).":
        "Founded the Mongolian Lecturers' Center, delivering public training in leadership and public speaking (2004–2012).",
      "Хүлээн зөвшөөрөл": "Recognition", "Шагнал, гавьяа ба бүтээл": "Awards & publications",
      "Хөдөлмөрийн хүндэт медаль": "Medal of Labor Honor", "2023 он": "2023",
      "Илтгэх урлагийн ном": "A book on public speaking", "Бизнес, ажил хэргийн ном": "A book on business",
      "Манлайллын тухай ном": "A book on leadership",

      /* ---- Хууль, санаачилга ---- */
      "Өргөн барьсан": "Submitted", "Хамтран санаачилсан": "Co-initiated",
      "Бүх ангилал": "All categories", "Бүх төлөв": "All statuses",
      "Батлагдсан": "Passed", "Хэлэлцэж буй": "Under review", "Төсөл": "Draft",
      "Хуулийн төслүүдийн албан ёсны бүртгэлийг": "Find the official registry of bills at",

      /* ---- Төслүүд ---- */
      "Хэрэгжүүлсэн төслүүд": "Implemented projects", "Тойргийн ажил": "Constituency work",
      "Сонгогчдынхоо төлөө хийсэн ажил": "Work done for constituents",
      "Сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүрэгт хэрэгжүүлсэн төслүүд. (Доорх жишээ мэдээллийг бодит төслүүдээр шинэчилнэ.)":
        "Projects implemented in Electoral District 10 — Chingeltei and Sükhbaatar.",
      "Нийт төсөл": "Total projects", "Хэрэгжиж дууссан": "Completed",
      "Хэрэгжиж буй": "In progress", "Ашиг хүртэгч иргэн": "Beneficiary citizens",
      "Хэрэгжсэн": "Completed", "Төлөвлөгдсөн": "Planned",
      "Спорт, эрүүл мэнд": "Sport & health", "Ногоон байгууламж": "Green spaces",
      "Дэд бүтэц": "Infrastructure", "Боловсрол": "Education", "Эрүүл мэнд": "Healthcare",
      "«Спортлог Чингэлтэйчүүд»": "“Sporty Chingeltei”",
      "Чингэлтэй дүүргийн иргэдийг спортоор тогтмол хичээллэх, эрүүл амьдралын хэвшилд уриалсан олон нийтийн хөтөлбөр. Нээлттэй дасгалжуулалт, спортын талбай, тэмцээн уралдаан зохион байгуулна.":
        "A community program encouraging Chingeltei residents to exercise regularly and adopt a healthy lifestyle, with open training, sports grounds and competitions.",
      "«Өрх бүр 5 мод» хөдөлгөөн": "“5 Trees per Household” movement",
      "«Ногоон ирээдүйг өнөөдрөөс бүтээе» уриатай, өрх бүрийг таван мод тарьж ургуулахад уриалсан ногоон хөдөлгөөн. Үндэсний «Тэрбум мод» хөдөлгөөн, «Хашаандаа сайхан амьдаръя», «Ногоон үндэстэн» ТББ-тай хамтран хэрэгжиж байна.":
        "A green movement under the slogan “Build a green future today,” calling on every household to plant five trees. Run in partnership with the national “Billion Trees” movement, “Live Well in Your Yard,” and the “Green Nation” NGO.",
      "«Миний зам»": "“My Path”",
      "Залуучууд, сурагчдад боловсрол, ирээдүйн мэргэжлийн чиг баримжаа олгох, өөрийгөө хөгжүүлэхэд дэмжлэг үзүүлсэн боловсролын хөтөлбөр.":
        "An education program helping youth and students with career guidance and self-development.",
      "Өрхийн эрүүл мэндийн төвийн тоног төхөөрөмж": "Family health center equipment",
      "Өрхийн эрүүл мэндийн төвийг орчин үеийн оношилгооны тоног төхөөрөмжөөр хангаж, иргэдэд чанартай эрүүл мэндийн үйлчилгээ хүргэх нөхцөлийг бүрдүүлсэн.":
        "Equipped the family health center with modern diagnostic equipment, enabling quality healthcare for residents.",
      "Хороондоо хэрэгжүүлэхийг хүссэн төсөл бий юу?": "A project you'd like to see in your khoroo?",
      "Тойрогтоо тулгамдаж буй асуудал, хэрэгжүүлэхийг хүссэн төслийн саналаа илгээгээрэй.":
        "Send us the pressing issues in your district and the projects you'd like implemented.",
      "Санал илгээх": "Send a suggestion",

      /* ---- Мэдээ ---- */
      "Мэдээ мэдээлэл": "News & updates", "Тойргийн ажил": "Constituency work",
      "Гэр хорооллын дахин төлөвлөлтийн төслийн явцтай танилцлаа":
        "Reviewed progress of the ger-district redevelopment project",
      "Чингэлтэй дүүргийн гэр хорооллын дахин төлөвлөлт, инженерийн шугам сүлжээний ажлын явцыг газар дээр нь шалгалаа.":
        "Inspected on-site the ger-district redevelopment and engineering network works in Chingeltei district.",
      "Цахим хөгжил": "Digital development",
      "Хиймэл оюун ухааны зохицуулалтын олон улсын туршлагыг судаллаа":
        "Studied international experience in AI regulation",
      "Шинэ технологийн эрх зүйн орчныг бүрдүүлэх чиглэлээр олон улсын байгууллагуудтай хамтран ажиллаж байна.":
        "Working with international organizations to build a legal framework for new technologies.",
      "Залуучуудтай «Манлайлал» сэдвээр нээлттэй яриа өрнүүллээ":
        "Held an open talk with youth on “Leadership”",
      "«Манлайллын мөрдлөг» номын уншигчидтай уулзаж, залуу үеийн манлайллын ур чадварын талаар ярилцлаа.":
        "Met readers of “The Leadership Code” and discussed leadership skills for the younger generation.",

      /* ---- Видео ---- */
      "Онцлох": "Featured", "Сүүлийн шууд нэвтрүүлэг": "Latest live broadcast",
      "Гишүүний Facebook хуудасны видео бичлэгээс.": "From the member's Facebook video posts.",
      "Чуулганы үг хэлсэн бичлэгүүд": "Session speeches",
      "Хэвлэл мэдээлэл": "Media", "Ярилцлага": "Interviews",
      "Богино, шуурхай видео контент. Дарж Facebook дээр үзнэ үү.": "Short, quick video content. Click to watch on Facebook.",
      "Facebook хуудсаар үзэх →": "View on Facebook →", "Бүх Reels үзэх →": "View all Reels →",
      "Тойргийн ажлын товч": "Constituency work in brief", "Иргэдтэй хийсэн уулзалт": "Meeting with citizens",
      "Чуулганы хэлсэн үг": "Session speech",

      /* ---- Тайлан ---- */
      "Үзүүлэлт": "Metrics", "Сонгогчдод хүрсэн ажлын үзүүлэлт": "Constituent service metrics",
      "2024–2026 оны бүрэн эрхийн хугацааны ажлын дүн. (Тоонууд жишээ — бодит тайлангаар шинэчилнэ.)":
        "Results for the 2024–2026 term.",
      "Иргэдтэй хийсэн уулзалт": "Meetings with citizens", "Хүлээн авсан өргөдөл, хүсэлт": "Petitions & requests received",
      "Шийдвэрлэсэн өргөдлийн хувь": "Share of resolved petitions", "Санаачилсан хууль, төсөл": "Bills & projects initiated",
      "Инфографик": "Infographic", "Үйл ажиллагааны чиглэл (%)": "Areas of activity (%)",
      "Бүрэн эрхийн хугацаанд зарцуулсан ажлын цагийн харьцаа.": "Share of working time during the term.",
      "Хууль тогтоох ажил": "Legislative work", "Тойргийн иргэдийн ажил": "Constituency work",
      "Цахим хөгжлийн бодлого": "Digital development policy", "Олон улсын хамтын ажиллагаа": "International cooperation",
      "Бусад": "Other",
      "Татаж авах": "Download", "Жилийн тайлан": "Annual report",
      "Гишүүний бүрэн эрхийн хугацааны үйл ажиллагааны тайлан.": "Activity reports for the member's term.",
      "2025 оны үйл ажиллагааны тайлан": "2025 activity report", "2024 оны үйл ажиллагааны тайлан": "2024 activity report",
      "PDF бичиг баримт": "PDF document", "Сар бүрийн тайлан": "Monthly reports",
      "2026 оны 5-р сарын тайлан": "May 2026 report", "2026 оны 4-р сарын тайлан": "April 2026 report",
      "2026 оны 3-р сарын тайлан": "March 2026 report", "2026 оны 2-р сарын тайлан": "February 2026 report",
      "Үнэлгээ": "Rating", "Гишүүний ажилд үнэлгээ өгөөрэй": "Rate the member's work",
      "Таны сэтгэл ханамжийн үнэлгээ цаашдын ажлыг сайжруулахад чухал.": "Your satisfaction rating helps improve future work.",
      "Оноо дээр дарж үнэлнэ үү (1–10)": "Click a score to rate (1–10)",

      /* ---- Холбоо барих ---- */
      "Холбогдох": "Get in touch", "Бидэнтэй холбогдоорой": "Reach out to us",
      "Оффисын хаяг": "Office address", "Утас": "Phone", "И-мэйл": "Email",
      "Иргэд хүлээн авах цаг": "Citizen reception hours", "Даваа–Баасан, 09:00–17:00": "Mon–Fri, 09:00–17:00",
      "Сошиал хаягууд:": "Social links:",
      "Овог нэр": "Full name", "Төрөл": "Type", "Дүүрэг": "District", "Хороо": "Khoroo",
      "Агуулга": "Message", "Зөвхөн эрх бүхий хүн нэвтэрнэ.": "Authorized personnel only.",
      "Илгээх": "Send", "Үзэх": "View", "Татах": "Download",
      "Газрын зураг": "Map", "Байршил": "Location",

      /* ---- Төлөв / шошго давхар ---- */
      "Дэлгэрэнгүй": "Details",
    },
    init() {
      const btn = document.getElementById("lang-toggle");
      if (!btn) return;
      this.nodes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const key = node.nodeValue.trim();
        if (key && this.dict[key]) {
          this.nodes.push({ node, mn: node.nodeValue, en: node.nodeValue.replace(key, this.dict[key]) });
        }
      }
      this.phEls = [];
      document.querySelectorAll("[placeholder]").forEach((el) => {
        const k = el.getAttribute("placeholder");
        if (this.ph[k]) this.phEls.push({ el, mn: k, en: this.ph[k] });
      });
      this.lang = localStorage.getItem("lang") || "mn";
      const sw = document.getElementById("lang-switch");
      // Dropdown нээх/хаах
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = sw.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      // Хэл сонгох
      document.querySelectorAll(".lang-menu [data-lang]").forEach((mi) => {
        mi.addEventListener("click", () => {
          this.lang = mi.dataset.lang;
          localStorage.setItem("lang", this.lang);
          sw.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
          this.apply();
        });
      });
      // Гадна дарахад хаах
      document.addEventListener("click", (e) => {
        if (sw && !sw.contains(e.target)) { sw.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
      });
      this.apply();
    },
    apply() {
      document.documentElement.setAttribute("lang", this.lang);
      const en = this.lang === "en";
      this.nodes.forEach((o) => { o.node.nodeValue = en ? o.en : o.mn; });
      this.phEls.forEach((o) => { o.el.setAttribute("placeholder", en ? o.en : o.mn); });
      const flag = document.querySelector("#lang-toggle .lang-flag");
      const code = document.querySelector("#lang-toggle .lang-code");
      if (flag) flag.src = en ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/mn.png";
      if (code) code.textContent = en ? "Eng" : "Мон";
      document.querySelectorAll(".lang-menu [data-lang]").forEach((mi) => mi.setAttribute("aria-current", mi.dataset.lang === this.lang ? "true" : "false"));
    },
  };

  /* ---------- Бүгдийг эхлүүлэх ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    Theme.init(); Nav.init(); Search.init(); Reveal.init();
    Counters.init(); Video.init(); Rating.init(); Forms.init(); Filter.init();
    Share.init(); I18n.init(); Misc.init();
  });
})();
