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
      // Үндсэн горим — хар хөх (dark, брэнд өнгө). Хэрэглэгч light сонговол хадгална.
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
      // Зэрэгцээ элементүүдийг дараалан (stagger) гаргах
      els.forEach((e) => {
        const parent = e.parentElement;
        if (!parent) return;
        const sibs = Array.prototype.filter.call(parent.children, (c) => c.classList && c.classList.contains("reveal"));
        const i = sibs.indexOf(e);
        if (i > 0) e.style.transitionDelay = Math.min(i * 80, 400) + "ms";
      });
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
            ? "Таны үнэлгээ: " + n + "/10 — " + Rating.label(n) + (saved ? ". Баярлалаа!" : "")
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

      const VID_MB = 50;
      const renderPreviews = () => {
        if (!previews) return;
        previews.innerHTML = "";
        files.forEach((f, idx) => {
          const url = URL.createObjectURL(f);
          const div = document.createElement("div");
          div.className = "ph";
          const media = f.type.startsWith("video/")
            ? `<video src="${url}" muted playsinline></video>`
            : `<img src="${url}" alt="Хавсралт ${idx + 1}" />`;
          div.innerHTML = `${media}<button type="button" aria-label="Устгах">✕</button>`;
          div.querySelector("button").addEventListener("click", () => { files.splice(idx, 1); renderPreviews(); });
          previews.appendChild(div);
        });
      };
      const addFiles = (list) => {
        for (const f of list) {
          const isImg = f.type.startsWith("image/"), isVid = f.type.startsWith("video/");
          if (!isImg && !isVid) continue;
          const lim = isVid ? VID_MB : MAX_MB;
          if (f.size > lim * 1024 * 1024) { alert(`"${f.name}" хэт том байна — ${lim}MB-аас бага байх ёстой.`); continue; }
          if (files.length >= MAX_FILES) { alert(`Дээд тал нь ${MAX_FILES} файл хавсаргах боломжтой.`); break; }
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
      let leafMap = null, leafMarker = null;
      const UB = [47.9187, 106.9178];
      const setLL = (lat, lng) => { latIn.value = (+lat).toFixed(6); lngIn.value = (+lng).toFixed(6); };
      const pinMsg = (lat, lng) => { if (geoStatus) geoStatus.innerHTML = `Pin: <strong>${(+lat).toFixed(5)}, ${(+lng).toFixed(5)}</strong> — газрын зураг дээр чирж засна уу`; };
      const resetGeo = () => {
        if (geoStatus) geoStatus.textContent = "Байршил тогтоогоогүй";
        if (geoMap) { geoMap.style.display = "none"; geoMap.innerHTML = ""; }
        if (latIn) latIn.value = ""; if (lngIn) lngIn.value = "";
        leafMap = null; leafMarker = null;
      };
      const showMap = (lat, lng) => {
        if (!geoMap) return;
        geoMap.style.display = "block";
        if (typeof L === "undefined") {
          geoMap.innerHTML = `<iframe src="https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed" title="Байршил" loading="lazy" style="width:100%;height:100%;border:0;display:block"></iframe>`;
          return;
        }
        if (!leafMap) {
          geoMap.innerHTML = "";
          leafMap = L.map(geoMap, { scrollWheelZoom: false }).setView([lat, lng], 16);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(leafMap);
          leafMarker = L.marker([lat, lng], { draggable: true }).addTo(leafMap);
          leafMarker.on("dragend", () => { const p = leafMarker.getLatLng(); setLL(p.lat, p.lng); pinMsg(p.lat, p.lng); });
          leafMap.on("click", (e) => { leafMarker.setLatLng(e.latlng); setLL(e.latlng.lat, e.latlng.lng); pinMsg(e.latlng.lat, e.latlng.lng); });
          setTimeout(() => leafMap.invalidateSize(), 250);
        } else { leafMap.setView([lat, lng], 16); leafMarker.setLatLng([lat, lng]); }
      };
      if (geoBtn) {
        geoBtn.addEventListener("click", () => {
          if (!navigator.geolocation) {
            if (geoStatus) geoStatus.textContent = "Газрын зураг дээр дарж pin тавина уу.";
            showMap(UB[0], UB[1]); return;
          }
          geoStatus.textContent = "⏳ Байршил тогтоож байна…";
          navigator.geolocation.getCurrentPosition(
            (pos) => { const { latitude: lat, longitude: lng } = pos.coords; setLL(lat, lng); showMap(lat, lng); pinMsg(lat, lng); },
            (err) => {
              geoStatus.textContent = err.code === 1
                ? "Зөвшөөрөл олгоогүй — газрын зураг дээр дарж pin тавина уу."
                : "GPS аваагүй — газрын зураг дээр дарж pin тавина уу.";
              showMap(UB[0], UB[1]);
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
          // Иргэн нийтэд харуулахыг зөвшөөрсөн эсэх
          const publicChk = form.querySelector("#f-public");
          const isPublic = !!(publicChk && publicChk.checked);
          // Зөвшөөрсөн бол нийтийн (public) сан руу, эс бөгөөс хаалттай сан руу
          const bucket = isPublic ? "feedback-public" : "feedback-photos";

          // EXIF/GPS metadata цэвэрлэх (нийтэд харагдах зургаас) — хувийн нууцлал
          const stripExif = (file) => new Promise((res) => {
            if (!file.type.startsWith("image/")) return res(file);
            const img = new Image(); const url = URL.createObjectURL(file);
            img.onload = () => {
              let w = img.naturalWidth, h = img.naturalHeight; const max = 1600;
              if (Math.max(w, h) > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
              const c = document.createElement("canvas"); c.width = w; c.height = h;
              c.getContext("2d").drawImage(img, 0, 0, w, h);
              URL.revokeObjectURL(url);
              c.toBlob((blob) => res(blob ? new File([blob], (file.name.replace(/\.\w+$/, "") || "img") + ".jpg", { type: "image/jpeg" }) : file), "image/jpeg", 0.85);
            };
            img.onerror = () => { URL.revokeObjectURL(url); res(file); };
            img.src = url;
          });
          // 1) Зургуудыг storage руу хуулах
          const photoPaths = [];
          for (let i = 0; i < files.length; i++) {
            const f = isPublic ? await stripExif(files[i]) : files[i]; // нийтэд бол metadata устгана
            const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
            const path = `${Date.now()}-${i}-${Math.round(performance.now())}.${ext}`;
            const { error: upErr } = await sb.storage.from(bucket).upload(path, f, { contentType: f.type });
            if (upErr) throw upErr;
            photoPaths.push(path);
          }
          // 2) Мөр оруулах — submit_feedback RPC дараалсан дугаар буцаана
          const fd = new FormData(form);
          const message = (fd.get("message") || "").toString().trim();
          const lat = latIn && latIn.value ? parseFloat(latIn.value) : null;
          const rating = ratingIn && ratingIn.value ? parseInt(ratingIn.value, 10) : null;
          const { data: ticketNo, error: insErr } = await sb.rpc("submit_feedback", {
            p_name: (fd.get("name") || "").toString().trim(),
            p_phone: (fd.get("phone") || "").toString().trim() || null,
            p_subject: (fd.get("subject") || "").toString(),
            p_message: message,
            p_lat: lat,
            p_lng: lngIn && lngIn.value ? parseFloat(lngIn.value) : null,
            p_rating: rating,
            p_photos: photoPaths,
            p_is_public: isPublic,
          });
          if (insErr) throw insErr;
          const trackRef = ticketNo || "—";
          // Дугаарыг энэ төхөөрөмжид хадгална (иргэн дугаараа мартсан ч саналаа олох)
          if (ticketNo) {
            try {
              const mine = JSON.parse(localStorage.getItem("at_tickets") || "[]");
              mine.unshift({ t: ticketNo, s: (fd.get("subject") || "").toString(), d: Date.now() });
              localStorage.setItem("at_tickets", JSON.stringify(mine.slice(0, 30)));
            } catch (_) {}
          }

          // Амжилт
          const parts = [];
          if (photoPaths.length) parts.push(`${photoPaths.length} зураг`);
          if (lat) parts.push("GPS байршил");
          if (rating) parts.push(`үнэлгээ ${rating}/10`);
          success && success.classList.add("show");
          if (success) success.innerHTML = "✓ Таны санал <strong>#" + trackRef + "</strong> дугаартай бүртгэгдлээ" + (parts.length ? ` (${parts.join(", ")})` : "") + ". Энэ дугаараа тэмдэглэж аваарай — «Явц шалгах» хэсэгт оруулж явцаа хянана. Бид удахгүй хариу өгнө.";
          form.reset(); files = []; renderPreviews(); resetGeo(); resetKhoroo();
          const rb = form.querySelector("[data-rating]"); if (rb && rb._resetRating) rb._resetRating();
          setTimeout(() => { success && success.classList.remove("show"); resetSuccessStyle(); }, 12000);
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
      "Хуулийн нэрээр хайх…": "Search by law name…",
      "Таны овог нэр": "Your full name",
      "+976 ХХХХ-ХХХХ": "+976 XXXX-XXXX",
      "tanii@mail.mn": "you@mail.mn",
      "Тулгамдсан асуудал, санал хүсэлтээ дэлгэрэнгүй бичнэ үү…": "Describe your issue or request in detail…",
    },
    dict: {
      /* ---- Чиглүүлэх / footer / нийтлэг ---- */
      "Нүүр": "Home", "Намтар": "Biography", "Хууль": "Laws",
      "Төслүүд": "Projects", "Мэдээ": "News", "Видео": "Video", "Тайлан": "Reports",
      "Холбоо барих": "Contact", "УИХ-ын гишүүн": "Member of Parliament",
      "Цэс": "Menu", "Холбоос": "Links", "Сошиал": "Social", "Видео сан": "Video library",
      "X (Twitter)": "X (Twitter)", "Үндсэн агуулга руу очих": "Skip to main content",
      "Сайтаас хайх": "Search the site", "Хаах": "Close",
      "Ил тод байдал": "Transparency",
      "Иргэдийн нийтэлсэн санал": "Citizens' published feedback",
      "Иргэд өөрсдөө зөвшөөрсний дагуу нийтэлсэн асуудлууд. Саналыг дэмжиж, коммент хэлбэрээр үлдээгээрэй.":
        "Issues published with citizens' own consent. Show your support and leave your thoughts as a comment.",
      "Цэндийн Баатархүү": "Tsendiin Baatarkhuu",
      "Монгол Улсын Их Хурлын гишүүн. Сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүргийн иргэдийн итгэлийг хүлээж, шударга ёс, цахим хөгжлийн төлөө ажилласаар байна.":
        "Member of the Parliament of Mongolia. Earning the trust of citizens of Electoral District 10 — Chingeltei and Sukhbaatar — and working for justice and digital development.",
      "УИХ-ын вебсайт": "Parliament website", "Хууль зүйн портал": "Legal information portal",
      "Гишүүний албан ёсны CV": "Member's official CV", "Санал хүсэлт": "Feedback",
      "Улаанбаатар хот, Сүхбаатар дүүрэг, Төрийн ордон": "Ulaanbaatar, Sukhbaatar District, State Palace",
      "Бүх эрх хуулиар хамгаалагдсан.": "All rights reserved.",
      "УИХ-ын гишүүний албан ёсны вебсайт.": "Official website of the Member of Parliament.",
      "Facebook": "Facebook",

      /* ---- Нүүр ---- */
      "Цэндийн БААТАРХҮҮ": "Tsendiin BAATARKHUU",
      "✓ Албан ёсны вебсайт": "✓ Official website",
      "Монгол Улсын Их Хурлын гишүүн": "Member of the Parliament of Mongolia",
      "«Иргэдийнхээ итгэлийг дээдэлж, шударга ёс, цахим хөгжлийн төлөө ажиллана.»":
        "«Honoring the trust of citizens, working for justice and digital development.»",
      "Миний тайлан үзэх": "View my reports",
      "2024–2028 · 10-р тойрог — Чингэлтэй, Сүхбаатар дүүрэг": "2024–2028 · District 10 — Chingeltei, Sukhbaatar",
      "Шинэ мэдээ": "Latest news", "Онцлох мэдээ мэдээлэл": "Featured news",
      "Парламентын үйл ажиллагаа, тойргийн иргэдтэй хийсэн уулзалт болон бодлогын шийдвэрүүд.":
        "Parliamentary work, meetings with constituents, and policy decisions.",
      "Хяналт шалгалт": "Oversight",
      "Нийслэлд олгосон газрын асуудлаар Хянан шалгах түр хороо байгуулахыг санаачиллаа":
        "Initiated a temporary oversight committee on land allocations in the capital",
      "Ц.Баатархүү гишүүн тэргүүтэй УИХ-ын 35 гишүүн 1992–2025 онд нийслэлд олгосон газрын асуудлыг шалгах түр хороо байгуулах саналыг өргөн барив.":
        "Led by MP Ts.Baatarkhuu, 35 members of Parliament submitted a proposal to form a temporary committee investigating land allocations made in the capital during 1992–2025.",
      "Эх сурвалж: Eguur.mn →": "Source: Eguur.mn →",
      "Уулзалт": "Meeting",
      "Чингэлтэй, Сүхбаатар дүүргийн иргэдтэй нээлттэй уулзалт хийлээ":
        "Held an open meeting with residents of Chingeltei and Sukhbaatar districts",
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
      "2025 оны намрын чуулган. Эх сурвалж: Улсын Их Хурал.": "2025 autumn session. Source: Parliament of Mongolia.",
      "Ирсэн": "Attended", "Чөлөөтэй": "On leave", "Тасалсан": "Missed", "Хоцорсон минут": "Minutes late",
      "Бодит ирцийн мэдээлэл (УИХ) →": "Live attendance data (Parliament) →",
      "Мэндчилгээ": "Greeting",
      "Эрхэм хүндэт иргэн та бүхэнд энэ өдрийн мэнд хүргэе": "Warm greetings to every respected citizen",
      "Намайг Улсын Их Хурлын гишүүнээр сонгож, итгэл хүлээлгэсэн Чингэлтэй, Сүхбаатар дүүргийн иргэд та бүхэндээ чин сэтгэлийн талархал илэрхийлье. Таны итгэл бол миний өдөр тутмын ажлын хөдөлгөгч хүч юм.":
        "I sincerely thank the residents of Chingeltei and Sukhbaatar districts who elected me to the Parliament of Mongolia and placed their trust in me. Your trust is the driving force behind my daily work.",
      "«Өөр Бодлого Бүтээгч Монгол»": "“A Mongolia That Builds a Different Policy”",
      "Бид энэхүү зорилтын хүрээнд хуучирсан хандлагыг өөрчилж, иргэн төвтэй, шударга, цахим хөгжилд тулгуурласан шинэ бодлогыг бүтээхээр ажиллаж байна. Боловсрол, ногоон хөгжил, дэд бүтэц, эрүүл мэндийн салбарт тойргийнхоо иргэдийн амьдралд бодит өөрчлөлт авчрахыг эрхэм зорилгоо болгосон.":
        "Under this vision, we are working to replace outdated approaches and build a new, citizen-centered and fair policy grounded in digital development. Our mission is to bring real change to constituents' lives in education, green development, infrastructure and healthcare.",
      "Таны санал, шүүмжлэл, дэмжлэг бүхэн надад үнэ цэнэтэй. Хамтдаа өөр, илүү сайхан Монголыг бүтээцгээе.":
        "Every suggestion, critique and show of support matters to me. Together, let us build a different and better Mongolia.",
      "— Цэндийн Баатархүү": "— Tsendiin Baatarkhuu",

      /* ---- Намтар ---- */
      "Танилцуулга": "Introduction",
      "Цэндийн Баатархүү нь 1981 оны 11 дүгээр сарын 14-нд Хэнтий аймагт төрсөн. Улс төрч, бизнес эрхлэгч бөгөөд 2024 оны УИХ-ын сонгуулиар сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүргээс Улсын Их Хурлын гишүүнээр сонгогдсон.":
        "Tsendiin Baatarkhuu was born on 14 November 1981 in Khentii province. A politician and businessman, he was elected to the Parliament of Mongolia in the 2024 election from Electoral District 10 — Chingeltei and Sukhbaatar districts.",
      "2024–2025 онд Монгол Улсын Засгийн газрын Цахим хөгжил, инновац, харилцаа холбооны сайдаар ажилласан. 2020–2024 онд Ардчилсан намын Ерөнхий нарийн бичгийн даргын алба хашиж байв.":
        "From 2024 to 2025 he served as Minister of Digital Development, Innovation and Communications. From 2020 to 2024 he was Secretary General of the Democratic Party.",
      "«Зөв ярих ухаан», «Ажил хэргийн гурвалжин», «Манлайллын мөрдлөг» зэрэг гурван ном бичиж хэвлүүлсэн. Англи, турк хэлтэй.":
        "He has authored three books: “The Art of Speaking Well,” “The Business Triangle,” and “The Leadership Code.” He speaks English and Turkish.",
      "Боловсрол": "Education", "Ажлын туршлага": "Work experience",
      "Замнал": "Journey", "Улс төрийн үйл ажиллагаа": "Political career",
      "Олон нийтийн өмнө хүлээсэн үүрэг хариуцлагын замнал он цагийн дарааллаар.":
        "A chronological path of public responsibilities.",
      "УИХ-ын гишүүн, Цахим хөгжлийн сайд": "MP and Minister of Digital Development",
      "Сонгуулийн 10-р тойрог — Чингэлтэй, Сүхбаатар дүүргээс УИХ-ын гишүүнээр сонгогдож, Цахим хөгжил, инновац, харилцаа холбооны сайдаар томилогдсон (2024–2025).":
        "Elected MP from Electoral District 10 — Chingeltei and Sukhbaatar — and appointed Minister of Digital Development, Innovation and Communications (2024–2025).",
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
        "Projects implemented in Electoral District 10 — Chingeltei and Sukhbaatar.",
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

  /* ---------- 12. Ил тод санал самбар (public feed) ---------- */
  const PublicFeed = {
    SUBJ: { gerel: "Гэрэлтүүлэг", zam: "Зам, нүх, эвдрэл", yavgan: "Явган хүний зам", hog: "Хог, орчны бохирдол", buudal: "Автобусны буудал", surguuli: "Сургууль, цэцэрлэг", emnelg: "Эмнэлэг, өрхийн эмнэлэг", soh: "СӨХ, байрны орчин", hurteemj: "Ахмад, ХБИ хүртээмж", huuli: "Хууль, бодлогын санал", urgudul: "Хувийн өргөдөл, тусламж", sanal: "Санал", gomdol: "Гомдол", asuudal: "Тулгамдсан асуудал", uulzalt: "Уулзалтын хүсэлт", busad: "Бусад" },
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    fmt(s) { try { return new Date(s).toLocaleString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (_) { return ""; } },

    clientId() {
      let id = localStorage.getItem("fb_client");
      if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.round(performance.now())); localStorage.setItem("fb_client", id); }
      return id;
    },
    likedSet() { try { return new Set(JSON.parse(localStorage.getItem("fb_liked") || "[]")); } catch (_) { return new Set(); } },
    saveLiked(set) { localStorage.setItem("fb_liked", JSON.stringify([...set])); },

    async init() {
      const wrap = document.querySelector("[data-feed]");
      if (!wrap) return;
      const sb = window.getSB && window.getSB();
      if (!sb) { wrap.innerHTML = '<p class="feed-state">Самбар одоогоор боломжгүй байна.</p>'; return; }
      this._wrap = wrap; this._sb = sb;
      try {
        const { data: rows, error } = await sb
          .from("public_feedback").select("*").order("created_at", { ascending: false }).limit(100);
        if (error) throw error;
        if (!rows || !rows.length) {
          wrap.innerHTML = '<p class="feed-state">Одоогоор нийтэлсэн санал алга. Та формоор санал илгээж, «олон нийтэд харуулах»-ыг сонгож болно.</p>';
          return;
        }
        // Дэмжлэгийн тоо + коммент (нэг дор)
        const likeMap = {};
        try { const { data: lc } = await sb.rpc("like_counts"); (lc || []).forEach((r) => { likeMap[r.feedback_id] = r.cnt; }); } catch (_) {}
        const cmtMap = {};
        try {
          const { data: cm } = await sb.from("feedback_comments").select("*").in("feedback_id", rows.map((r) => r.id)).order("created_at", { ascending: true });
          (cm || []).forEach((c) => { (cmtMap[c.feedback_id] = cmtMap[c.feedback_id] || []).push(c); });
        } catch (_) {}
        this._rows = rows; this._likeMap = likeMap; this._cmtMap = cmtMap; this._liked = this.likedSet();
        this._active = "all"; this._q = ""; this._sort = "new"; this._show = 6;
        this.buildFilter();
        this.render();
      } catch (err) {
        wrap.innerHTML = '<p class="feed-state">Самбар ачаалахад алдаа гарлаа.</p>';
      }
    },

    buildFilter() {
      const anchor = this._wrap;
      let bar = document.querySelector("[data-feed-filter]");
      if (!bar) { bar = document.createElement("div"); bar.setAttribute("data-feed-filter", ""); anchor.parentNode.insertBefore(bar, anchor); }
      bar.className = "feed-filter";
      const counts = {}; this._rows.forEach((r) => { counts[r.subject] = (counts[r.subject] || 0) + 1; });
      const subjects = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      const pill = (key, label, n) => `<button type="button" class="ff-pill${this._active === key ? " active" : ""}" data-subj="${this.esc(key)}">${this.esc(label)}<span class="ff-n">${n}</span></button>`;
      let pills = pill("all", "Бүгд", this._rows.length);
      subjects.forEach((s) => { pills += pill(s, this.SUBJ[s] || s, counts[s]); });
      bar.innerHTML =
        `<div class="ff-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input type="text" placeholder="Асуудлаас хайх…" aria-label="Хайх" /></div>
         <div class="ff-pills">${pills}</div>
         <div class="ff-sort"><button type="button" class="ff-s${this._sort === "new" ? " active" : ""}" data-sort="new">Шинэ</button><button type="button" class="ff-s${this._sort === "support" ? " active" : ""}" data-sort="support">Хамгийн их дэмжсэн</button></div>`;
      bar.querySelectorAll(".ff-pill").forEach((b) => b.addEventListener("click", () => { this._active = b.dataset.subj; this._show = 6; this.buildFilter(); this.render(); }));
      bar.querySelectorAll(".ff-s").forEach((b) => b.addEventListener("click", () => { this._sort = b.dataset.sort; this._show = 6; this.buildFilter(); this.render(); }));
      const si = bar.querySelector(".ff-search input");
      if (si) { si.value = this._q; si.addEventListener("input", () => { this._q = si.value.trim().toLowerCase(); this._show = 6; this.render(); }); }
    },

    render() {
      let list = this._rows.slice();
      if (this._active !== "all") list = list.filter((r) => r.subject === this._active);
      if (this._q) list = list.filter((r) => (r.message || "").toLowerCase().includes(this._q));
      if (this._sort === "support") list.sort((a, b) => (this._likeMap[b.id] || 0) - (this._likeMap[a.id] || 0));
      this._wrap.innerHTML = "";
      if (!list.length) { this._wrap.innerHTML = '<p class="feed-state">Илэрц алга.</p>'; return; }
      list.forEach((r) => this._wrap.appendChild(this.card(this._sb, r, this._likeMap[r.id] || 0, this._cmtMap[r.id] || [], this._liked)));
      this._wrap.scrollTop = 0;
    },

    card(sb, r, likeCount, comments, liked) {
      const el = document.createElement("article");
      el.className = "feed-row reveal visible";
      const loc = [r.district ? r.district + " дүүрэг" : "", r.khoroo ? r.khoroo + "-р хороо" : ""].filter(Boolean).join(", ");
      const isLiked = liked.has(r.id);
      const statusBadge = r.status === "done"
        ? '<span class="fc-status fc-done">✓ Шийдвэрлэсэн</span>'
        : (r.status === "in_progress" ? '<span class="fc-status fc-prog">Шийдвэрлэж байна</span>' : "");
      // Эхний зураг (нийтийн сангаас) — зүүн талын thumbnail
      let photoUrl = "";
      const photos = r.photos || [];
      if (photos.length) { try { photoUrl = sb.storage.from("feedback-public").getPublicUrl(photos[0]).data.publicUrl; } catch (_) {} }
      const thumb = photoUrl
        ? `<a class="fr-thumb" href="${photoUrl}" target="_blank" rel="noopener" aria-label="Хавсаргасан зураг"><img src="${photoUrl}" alt="Иргэний хавсаргасан зураг" loading="lazy"></a>`
        : `<div class="fr-thumb fr-thumb-ph"><img src="assets/img/logo.svg" alt=""></div>`;
      el.innerHTML =
        thumb +
        `<div class="fr-main">
           <div class="fr-head">
             <span class="fr-subject">${this.esc(this.SUBJ[r.subject] || r.subject || "Санал")}</span>
             ${statusBadge}
           </div>
           <h3 class="fr-title">${this.esc(r.message)}</h3>
           <div class="fr-meta">
             <span>${this.fmt(r.created_at)}</span>
             ${loc ? `<span>${this.esc(loc)}</span>` : ""}
             ${r.rating != null ? `<span>Үнэлгээ ${r.rating}/10</span>` : ""}
           </div>
           ${r.response ? `<div class="fc-response"><span class="fcr-label">Албаны хариу</span><p>${this.esc(r.response)}</p></div>` : ""}
           <div class="fc-actions">
             <button class="fc-like${isLiked ? " liked" : ""}" type="button" aria-pressed="${isLiked}" title="Танд бас ийм асуудал тулгарч байвал дэмжинэ үү">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
               <span class="sup-label">${isLiked ? "Дэмжсэн" : "Надад бас ийм асуудал байна"}</span><span class="cnt">${likeCount}</span>
             </button>
             <button class="fc-comment-toggle" type="button">Коммент <span class="ccnt">(${comments.length})</span></button>
           </div>
           <div class="fc-comments">
             <div class="fc-comment-box"></div>
             <form class="fc-comment-form">
               <textarea placeholder="Зочин болж сэтгэгдэл бичих…" maxlength="1000" required></textarea>
               <button type="submit" class="btn btn-gold btn-sm">Илгээх</button>
             </form>
           </div>
         </div>`;

      // Лайк
      const likeBtn = el.querySelector(".fc-like");
      likeBtn.addEventListener("click", async () => {
        likeBtn.disabled = true;
        try {
          const { data, error } = await sb.rpc("toggle_like", { p_feedback: r.id, p_client: this.clientId() });
          if (error) throw error;
          const set = this.likedSet();
          const nowLiked = !set.has(r.id);
          if (nowLiked) set.add(r.id); else set.delete(r.id);
          this.saveLiked(set);
          likeBtn.classList.toggle("liked", nowLiked);
          likeBtn.setAttribute("aria-pressed", String(nowLiked));
          const lbl = likeBtn.querySelector(".sup-label"); if (lbl) lbl.textContent = nowLiked ? "Дэмжсэн" : "Надад бас ийм асуудал байна";
          likeBtn.querySelector(".cnt").textContent = (typeof data === "number" ? data : likeCount);
        } catch (_) {} finally { likeBtn.disabled = false; }
      });

      // Коммент нээх/хаах
      const cWrap = el.querySelector(".fc-comments");
      const cBox = el.querySelector(".fc-comment-box");
      const renderComments = (list) => {
        cBox.innerHTML = list.length
          ? list.map((c) => `<div class="fc-comment"><div class="who">Зочин<span class="when">${this.fmt(c.created_at)}</span></div><div class="body">${this.esc(c.body)}</div></div>`).join("")
          : '<p class="fc-comment-empty">Хараахан сэтгэгдэл алга. Эхэлж бичээрэй.</p>';
      };
      renderComments(comments);
      el.querySelector(".fc-comment-toggle").addEventListener("click", () => cWrap.classList.toggle("open"));

      // Коммент илгээх
      const cForm = el.querySelector(".fc-comment-form");
      cForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const ta = cForm.querySelector("textarea");
        const body = ta.value.trim();
        if (!body) return;
        const btn = cForm.querySelector("button");
        btn.disabled = true;
        try {
          const { data, error } = await sb.from("feedback_comments").insert({ feedback_id: r.id, body }).select().single();
          if (error) throw error;
          comments.push(data);
          renderComments(comments);
          el.querySelector(".ccnt").textContent = `(${comments.length})`;
          ta.value = "";
        } catch (_) { alert("Сэтгэгдэл илгээхэд алдаа гарлаа. Дахин оролдоно уу."); } finally { btn.disabled = false; }
      });

      return el;
    },
  };

  /* ---------- 13. Намтар таб (segmented tabs) ---------- */
  const Tabs = {
    init() {
      const bar = document.querySelector("[data-tabs]");
      if (!bar) return;
      const tabs = Array.from(bar.querySelectorAll(".bio-tab"));
      const panels = Array.from(document.querySelectorAll(".bio-panel"));
      const activate = (key) => {
        tabs.forEach((t) => { const on = t.dataset.tab === key; t.classList.toggle("active", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
        panels.forEach((p) => {
          const on = p.dataset.panel === key;
          p.classList.toggle("active", on);
          // Нуугдсан панель нээгдэхэд reveal анимэйшнийг шуурхай харуулна
          if (on) p.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
        });
      };
      tabs.forEach((t) => t.addEventListener("click", () => activate(t.dataset.tab)));
    },
  };

  /* ---------- 14. Парламентын ирц (чуулган сонгох) ---------- */
  const Attendance = {
    init() {
      const sel = document.querySelector("#att-session");
      const dataEl = document.querySelector("#att-data");
      if (!sel || !dataEl) return;
      let data;
      try { data = JSON.parse(dataEl.textContent); } catch (_) { return; }
      const apply = (key) => {
        const d = data[key]; if (!d) return;
        document.querySelectorAll(".attendance [data-att]").forEach((el) => {
          const k = el.dataset.att;
          if (d[k] != null) el.textContent = d[k];
        });
      };
      sel.addEventListener("change", () => apply(sel.value));
      apply(sel.value);
    },
  };

  /* ---------- 15. Мэдээ (CMS-ээс уншина) ---------- */
  const NewsFeed = {
    CAT: { chuulgan: "Чуулган", uulzalt: "Уулзалт", toirog: "Тойргийн ажил", tsahim: "Цахим хөгжил", hyanalt: "Хяналт шалгалт", busad: "Бусад" },
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    async init() {
      const grid = document.querySelector("[data-news-feed]");
      const home = document.querySelector("[data-news-home]");
      if (!grid && !home) return;
      const sb = window.getSB && window.getSB();
      if (sb) {
        try {
          const { data, error } = await sb.from("news").select("*").eq("published", true).order("date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(60);
          if (!error && data && data.length) {
            if (grid) { grid.innerHTML = data.map((n) => this.card(n)).join(""); }
            if (home) { home.innerHTML = data.slice(0, 4).map((n) => this.homeItem(n)).join(""); }
          }
        } catch (_) { /* алдаа гарвал статик хэвээр үлдээнэ */ }
      }
    },

    // Нүүрний мэдээг автоматаар сольж харуулах (нэг нэгээр, fade)
    rotateHome(home) {
      const items = Array.prototype.filter.call(home.children, (n) => n.nodeType === 1);
      if (items.length <= 1) return;
      let cur = 0, timer = null;
      let dots = (home.nextElementSibling && home.nextElementSibling.classList && home.nextElementSibling.classList.contains("news-dots")) ? home.nextElementSibling : null;
      if (!dots) { dots = document.createElement("div"); dots.className = "news-dots"; home.after(dots); }
      const show = (n) => {
        items.forEach((el, i) => { el.style.display = i === n ? "" : "none"; });
        const a = items[n]; a.classList.remove("nf-in"); void a.offsetWidth; a.classList.add("nf-in");
        Array.prototype.forEach.call(dots.children, (d, i) => d.classList.toggle("active", i === n));
      };
      const start = () => { if (!timer) timer = setInterval(() => { cur = (cur + 1) % items.length; show(cur); }, 5000); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      const restart = () => { stop(); start(); };
      dots.innerHTML = "";
      items.forEach((_, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Мэдээ " + (i + 1)); b.addEventListener("click", () => { cur = i; show(cur); restart(); }); dots.appendChild(b); });
      show(0); start();
      home.addEventListener("mouseenter", stop);
      home.addEventListener("mouseleave", start);
      document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
    },
    homeItem(n) {
      const meta = n.date ? this.esc(n.date) : "";
      const img = n.image
        ? `<img src="${this.esc(n.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/img/logo.svg';this.className='ni-ph'">`
        : `<div class="ni-cover"><img src="assets/img/logo.svg" alt="" /></div>`;
      const cal = '<svg class="ni-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
      const dateLine = meta ? `<div class="ni-date">${cal}${meta}</div>` : "";
      const inner = `<div class="ni-img">${img}</div><div class="ni-text"><h3 class="ni-title">${this.esc(n.title)}</h3>${dateLine}</div>`;
      return `<a class="news-item" href="medee-delgerengui.html?id=${encodeURIComponent(n.id)}">${inner}</a>`;
    },
    card(n) {
      const title = this.esc(n.title);
      const img = n.image ? `<img src="${this.esc(n.image)}" alt="" loading="lazy" onerror="this.remove()">` : "";
      return `<a class="card news-card-clean reveal visible" href="medee-delgerengui.html?id=${encodeURIComponent(n.id)}" data-item data-title="${title}">
        <div class="card-media">${img}<span class="placeholder"><img src="assets/img/logo.svg" alt="" style="width:46%;opacity:.4"></span></div>
        <div class="card-body">${n.date ? `<div class="card-date">${this.esc(n.date)}</div>` : ""}<h3>${title}</h3></div>
      </a>`;
    },
  };

  /* ---------- Мэдээний дэлгэрэнгүй хуудас (medee-delgerengui.html?id=…) ---------- */
  const NewsPost = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    CAL: '<svg class="ni-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    async init() {
      const wrap = document.querySelector("[data-news-post]");
      if (!wrap) return;
      const id = new URLSearchParams(location.search).get("id");
      const sb = window.getSB && window.getSB();
      if (!id || !sb) { wrap.innerHTML = NewsPost.notFound(); return; }
      try {
        const { data, error } = await sb.from("news").select("*").eq("id", id).single();
        if (error || !data) { wrap.innerHTML = NewsPost.notFound(); return; }
        document.title = data.title + " | Ц.Баатархүү";
        const md = document.querySelector('meta[name="description"]');
        if (md && data.excerpt) md.setAttribute("content", data.excerpt);
        wrap.innerHTML = NewsPost.render(data);
        window.scrollTo(0, 0);
      } catch (_) { wrap.innerHTML = NewsPost.notFound(); }
    },
    notFound() {
      return '<div class="np-state"><h2>Мэдээ олдсонгүй</h2><p>Энэ мэдээ устсан эсвэл хаяг буруу байж магадгүй.</p><a class="btn btn-primary" href="medee.html">← Бүх мэдээ</a></div>';
    },
    render(n) {
      const esc = NewsPost.esc;
      const meta = n.date ? `<div class="np-datum">${NewsPost.CAL}${esc(n.date)}</div>` : "";
      const cover = n.image
        ? `<figure class="np-cover"><img src="${esc(n.image)}" alt="${esc(n.title)}" onerror="this.closest('.np-cover').remove()"></figure>`
        : "";
      const lead = (n.body && n.excerpt) ? `<p class="np-lead">${esc(n.excerpt)}</p>` : "";
      const bodyText = n.body || n.excerpt || "";
      const src = n.link
        ? `<div class="np-sources"><span class="np-src-label">Эх сурвалж:</span><a class="btn btn-primary btn-sm" href="${esc(n.link)}" target="_blank" rel="noopener">Эх сурвалжийг үзэх →</a></div>`
        : "";
      return `<nav class="breadcrumb" aria-label="Замчлал"><a href="index.html">Нүүр</a><span>/</span><a href="medee.html">Мэдээ</a></nav>
        ${meta}
        <h1 class="np-title">${esc(n.title)}</h1>
        ${cover}
        ${lead}
        <div class="np-body article-body">${articleBodyHtml(bodyText, esc)}</div>
        ${src}
        <a class="np-back" href="medee.html">← Бүх мэдээ рүү буцах</a>`;
    },
  };

  /* ---------- Арга хэмжээний дэлгэрэнгүй хуудас (arga-delgerengui.html?id=…) ---------- */
  const EventPost = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    CAL: '<svg class="ni-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    async init() {
      const wrap = document.querySelector("[data-event-post]");
      if (!wrap) return;
      const id = new URLSearchParams(location.search).get("id");
      const sb = window.getSB && window.getSB();
      if (!id || !sb) { wrap.innerHTML = EventPost.notFound(); return; }
      try {
        const { data, error } = await sb.from("events").select("*").eq("id", id).single();
        if (error || !data) { wrap.innerHTML = EventPost.notFound(); return; }
        document.title = data.title + " | Ц.Баатархүү";
        const md = document.querySelector('meta[name="description"]');
        if (md && data.description) md.setAttribute("content", data.description);
        wrap.innerHTML = EventPost.render(data);
        const regSlot = wrap.querySelector(".ep-reg");
        if (regSlot) regSlot.appendChild(EventsCMS.buildReg(sb, data));
        window.scrollTo(0, 0);
      } catch (_) { wrap.innerHTML = EventPost.notFound(); }
    },
    notFound() {
      return '<div class="np-state"><h2>Арга хэмжээ олдсонгүй</h2><p>Энэ арга хэмжээ устсан эсвэл хаяг буруу байж магадгүй.</p><a class="btn btn-primary" href="index.html">← Нүүр</a></div>';
    },
    render(ev) {
      const esc = EventPost.esc;
      let dateStr = "";
      if (ev.event_date) { try { dateStr = new Date(ev.event_date).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "."); } catch (_) {} }
      const metaItems = [dateStr, ev.location, ev.time_label].filter(Boolean).map(esc);
      const meta = metaItems.length ? `<div class="np-datum">${EventPost.CAL}${metaItems.join(' <span style="opacity:.45">·</span> ')}</div>` : "";
      const tag = ev.badge ? `<div class="am-tags" style="margin-bottom:12px"><span class="am-tag">${esc(ev.badge)}</span></div>` : "";
      const cover = ev.image_url
        ? `<figure class="np-cover"><img src="${esc(ev.image_url)}" alt="${esc(ev.title)}" onerror="this.closest('.np-cover').remove()"></figure>`
        : "";
      const lead = (ev.body && ev.description) ? `<p class="np-lead">${esc(ev.description)}</p>` : "";
      const bodyText = ev.body || ev.description || "";
      return `<nav class="breadcrumb" aria-label="Замчлал"><a href="index.html">Нүүр</a><span>/</span>Арга хэмжээ</nav>
        ${tag}
        ${meta}
        <h1 class="np-title">${esc(ev.title)}</h1>
        ${cover}
        ${lead}
        <div class="np-body article-body">${articleBodyHtml(bodyText, esc)}</div>
        <div class="ep-reg np-sources"></div>
        <a class="np-back" href="index.html">← Нүүр рүү буцах</a>`;
    },
  };

  /* ---------- 16. Хуудаслалт (pagination) ---------- */
  const Pager = {
    apply(grid) {
      if (!grid) return;
      // өмнөх pager / resize listener-ийг цэвэрлэх (динамик дахин ачаалалд)
      if (grid._pagerNav) { grid._pagerNav.remove(); grid._pagerNav = null; }
      if (grid._pagerResize) { window.removeEventListener("resize", grid._pagerResize); grid._pagerResize = null; }
      const sizeLg = parseInt(grid.dataset.pageSize || "6", 10);
      const sizeSm = parseInt(grid.dataset.pageSizeSm || "0", 10) || sizeLg;
      const items = Array.prototype.filter.call(grid.children, (c) => c.nodeType === 1);
      const sizeNow = () => (window.innerWidth <= 640 ? sizeSm : sizeLg);
      let cur = 1;
      const build = () => {
        const size = sizeNow();
        if (items.length <= size) { // нэг хуудас — pager хэрэггүй
          if (grid._pagerNav) { grid._pagerNav.remove(); grid._pagerNav = null; }
          items.forEach((el) => { el.style.display = ""; });
          return;
        }
        const pages = Math.ceil(items.length / size);
        if (cur > pages) cur = pages;
        if (!grid._pagerNav) { const nav = document.createElement("nav"); nav.className = "pager"; nav.setAttribute("aria-label", "Хуудаслалт"); grid.after(nav); grid._pagerNav = nav; }
        const pager = grid._pagerNav;
        const draw = (scroll) => {
          items.forEach((el, i) => { el.style.display = (i >= (cur - 1) * size && i < cur * size) ? "" : "none"; });
          pager.innerHTML = "";
          const mk = (label, target, dis, active) => {
            const b = document.createElement("button");
            b.type = "button"; b.textContent = label;
            if (active) b.classList.add("active");
            if (dis) b.disabled = true;
            else b.addEventListener("click", () => { cur = target; draw(true); });
            pager.appendChild(b);
          };
          mk("«", 1, cur === 1);
          mk("‹", cur - 1, cur === 1);
          for (let i = 1; i <= pages; i++) mk(String(i), i, false, i === cur);
          mk("›", cur + 1, cur === pages);
          mk("»", pages, cur === pages);
          if (scroll) grid.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        draw(false);
      };
      build();
      grid._pagerResize = () => { clearTimeout(grid._pagerT); grid._pagerT = setTimeout(build, 200); };
      window.addEventListener("resize", grid._pagerResize);
    },
    init() {
      document.querySelectorAll("[data-paginate]").forEach((grid) => Pager.apply(grid));
    },
  };

  /* ---------- 17. Карусель (хажуу гүйлгэх + дугаар) ---------- */
  const Carousel = {
    init() {
      document.querySelectorAll("[data-carousel]").forEach((track) => {
        const wrap = track.parentElement;
        const prev = wrap.querySelector("[data-car-prev]");
        const next = wrap.querySelector("[data-car-next]");
        const dots = (wrap.nextElementSibling && wrap.nextElementSibling.matches && wrap.nextElementSibling.matches("[data-car-dots]"))
          ? wrap.nextElementSibling : document.querySelector("[data-car-dots]");
        const pageW = () => track.clientWidth || 1;
        const pageCount = () => Math.max(1, Math.ceil(track.scrollWidth / pageW()));
        const curPage = () => Math.round(track.scrollLeft / pageW());
        const go = (p) => track.scrollTo({ left: p * pageW(), behavior: "smooth" });
        const update = () => {
          const pc = pageCount(), cp = curPage();
          if (prev) prev.disabled = cp <= 0;
          if (next) next.disabled = cp >= pc - 1;
          if (dots) {
            dots.style.display = pc <= 1 ? "none" : "";
            dots.innerHTML = "";
            for (let i = 0; i < pc; i++) {
              const b = document.createElement("button");
              b.type = "button"; b.textContent = String(i + 1);
              if (i === cp) b.classList.add("active");
              b.addEventListener("click", () => go(i));
              dots.appendChild(b);
            }
          }
        };
        if (prev) prev.addEventListener("click", () => go(Math.max(0, curPage() - 1)));
        if (next) next.addEventListener("click", () => go(curPage() + 1));
        let st; track.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(update, 120); });
        let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(update, 200); });
        update();

        // Автоматаар гүйх (data-autoplay) — hover/хүрэлт дээр түр зогсоно, төгсгөлд эхлэл рүү
        if (track.hasAttribute("data-autoplay")) {
          const delay = parseInt(track.dataset.autoplay, 10) || 5000;
          let timer = null;
          const tick = () => { const pc = pageCount(); if (pc <= 1) return; let n = curPage() + 1; if (n >= pc) n = 0; go(n); };
          const start = () => { if (!timer && pageCount() > 1) timer = setInterval(tick, delay); };
          const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
          start();
          ["mouseenter", "touchstart", "focusin"].forEach((ev) => track.addEventListener(ev, stop, { passive: true }));
          ["mouseleave", "touchend"].forEach((ev) => track.addEventListener(ev, start, { passive: true }));
          document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
        }
      });
    },
  };

  /* ---------- 18. Хууль — chip + pill шүүлтүүр ---------- */
  const Laws = {
    ORDER: ["passed", "discussed", "support", "review", "notstarted", "withdrawn"],
    LABEL: { passed: "Батлагдсан", discussed: "Хэлэлцүүлэг хийсэн", support: "Хэлэлцэх эсэхийг дэмжсэн", review: "Хэлэлцэж буй", notstarted: "Хэлэлцэж эхлээгүй", withdrawn: "Татаж авсан" },
    init() {
      const list = document.querySelector("[data-laws]");
      if (!list) return;
      const items = Array.from(list.querySelectorAll(".law-item"));
      const pillsBox = document.querySelector("[data-law-pills]");
      const chipsBox = document.querySelector("[data-law-chips]");
      const search = document.querySelector("#filter-search");
      const empty = document.querySelector(".filter-empty");
      let active = "all";
      const counts = {};
      items.forEach((it) => { const s = it.dataset.status; counts[s] = (counts[s] || 0) + 1; });
      const total = items.length;
      // Статистик chip
      if (chipsBox) {
        const chip = (label, n) => `<span class="law-chip"><b>${n}</b> ${label}</span>`;
        let h = chip("Нийт", total);
        if (counts.passed) h += chip("Батлагдсан", counts.passed);
        const inProc = (counts.review || 0) + (counts.support || 0) + (counts.discussed || 0);
        if (inProc) h += chip("Хэлэлцэж буй", inProc);
        chipsBox.innerHTML = h;
      }
      const apply = () => {
        const q = (search ? search.value : "").trim().toLowerCase();
        let shown = 0;
        items.forEach((it) => {
          const okStatus = active === "all" || it.dataset.status === active;
          const text = (it.dataset.title || it.textContent).toLowerCase();
          const okText = !q || text.includes(q);
          const vis = okStatus && okText;
          it.style.display = vis ? "" : "none";
          if (vis) shown++;
        });
        if (empty) empty.style.display = shown ? "none" : "block";
      };
      const buildPills = () => {
        if (!pillsBox) return;
        const mk = (key, label, n) => `<button class="law-pill${active === key ? " active" : ""}" type="button" data-pill="${key}">${label}<span class="lp-n">${n}</span></button>`;
        let html = mk("all", "Бүгд", total);
        this.ORDER.forEach((k) => { if (counts[k]) html += mk(k, this.LABEL[k], counts[k]); });
        pillsBox.innerHTML = html;
        pillsBox.querySelectorAll(".law-pill").forEach((b) => b.addEventListener("click", () => { active = b.dataset.pill; buildPills(); apply(); }));
      };
      buildPills();
      if (search) search.addEventListener("input", apply);
      apply();

      // Карт дээр дарж дэлгэрэнгүй цонх нээх (унших / үзэх / татах)
      const modal = document.querySelector("#law-modal");
      if (modal) {
        const openModal = (it) => {
          const titleEl = it.querySelector("h4");
          const badge = it.querySelector(".badge-status");
          const metaEl = it.querySelector(".meta");
          const pdfLink = it.querySelector(".law-actions a[href]");
          const pdf = pdfLink ? pdfLink.getAttribute("href") : "";
          modal.querySelector(".lm-badges").innerHTML = badge ? `<span class="${badge.className}">${badge.textContent}</span>` : "";
          modal.querySelector(".lm-title").textContent = titleEl ? titleEl.textContent : "";
          modal.querySelector(".lm-meta").innerHTML = metaEl ? metaEl.innerHTML : "";
          const sumBox = modal.querySelector(".lm-summary");
          sumBox.innerHTML = "";
          const p = document.createElement("p");
          if (it.dataset.summary) p.textContent = it.dataset.summary;
          else { p.className = "lm-empty"; p.textContent = "Дэлгэрэнгүй тайлбар оруулаагүй байна."; }
          sumBox.appendChild(p);
          modal.querySelector(".lm-actions").innerHTML = pdf
            ? `<a class="btn btn-primary" href="${pdf}" target="_blank" rel="noopener">Үзэх</a><a class="btn btn-ghost" href="${pdf}" download>Татах</a>`
            : '<span class="lm-empty">Хавсралт файл алга.</span>';
          modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
        };
        items.forEach((it) => {
          it.setAttribute("tabindex", "0");
          it.addEventListener("click", (e) => { if (e.target.closest("a")) return; openModal(it); });
          it.addEventListener("keydown", (e) => { if (e.key === "Enter") openModal(it); });
        });
        if (!modal._wired) {
          modal._wired = true;
          const close = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); };
          modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".lm-close")) close(); });
          document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
        }
      }
    },
  };

  /* ---------- Бүгдийг эхлүүлэх ---------- */
  /* ---------- Саналын явц шалгах (#AT-... дугаараар) ---------- */
  const Tracker = {
    STATUS: {
      new: { label: "Хүлээн авсан", cls: "tr-new" },
      in_progress: { label: "Шийдвэрлэж байна", cls: "tr-prog" },
      done: { label: "Шийдвэрлэсэн", cls: "tr-done" },
    },
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    fmtDate(s) { try { return new Date(s).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }); } catch (_) { return ""; } },
    init() {
      document.querySelectorAll("[data-track]").forEach((box) => {
        const input = box.querySelector("input");
        const btn = box.querySelector("[data-track-btn]");
        const out = box.querySelector("[data-track-result]");
        if (!input || !btn || !out) return;
        const run = async () => {
          const t = (input.value || "").trim();
          if (!t) { input.focus(); return; }
          out.style.display = "block";
          out.innerHTML = '<p class="tr-loading">Шалгаж байна…</p>';
          const sb = window.getSB && window.getSB();
          if (!sb) { out.innerHTML = '<p class="tr-bad">Холболт алга. Дараа дахин оролдоно уу.</p>'; return; }
          try {
            const { data, error } = await sb.rpc("track_feedback", { p_ticket: t });
            if (error) throw error;
            if (!data || !data.length) {
              out.innerHTML = '<p class="tr-bad">Ийм дугаартай санал олдсонгүй. Дугаараа (жишээ: AT-2026-000001) шалгаад дахин оруулна уу.</p>';
              return;
            }
            const r = data[0];
            const st = Tracker.STATUS[r.status] || { label: r.status, cls: "tr-new" };
            const subj = (PublicFeed.SUBJ && PublicFeed.SUBJ[r.subject]) || r.subject || "—";
            const upd = r.updated_at && r.updated_at !== r.created_at ? Tracker.fmtDate(r.updated_at) : null;
            out.innerHTML =
              '<div class="tr-card">' +
                '<div class="tr-top"><span class="tr-no">#' + Tracker.esc(r.ticket) + '</span>' +
                  '<span class="tr-badge ' + st.cls + '">' + st.label + '</span></div>' +
                '<div class="tr-rows">' +
                  '<div><span>Ангилал</span><b>' + Tracker.esc(subj) + '</b></div>' +
                  '<div><span>Хүлээн авсан</span><b>' + Tracker.fmtDate(r.created_at) + '</b></div>' +
                  (upd ? '<div><span>Сүүлд шинэчилсэн</span><b>' + upd + '</b></div>' : '') +
                '</div>' +
                (r.response ? '<div class="tr-resp"><span>Албаны хариу:</span><p>' + Tracker.esc(r.response) + '</p></div>' : '') +
              '</div>';
          } catch (e) {
            out.innerHTML = '<p class="tr-bad">Шалгахад алдаа гарлаа: ' + Tracker.esc(e.message || "сүлжээ") + '</p>';
          }
        };
        btn.addEventListener("click", run);
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(); } });

        // Миний илгээсэн саналууд (энэ төхөөрөмжид хадгалсан) — дугаараа мартсан ч олно
        let mine = [];
        try { mine = JSON.parse(localStorage.getItem("at_tickets") || "[]"); } catch (_) {}
        if (mine.length) {
          const wrap = document.createElement("div");
          wrap.className = "track-mine";
          wrap.innerHTML = '<div class="tm-label">Миний илгээсэн саналууд (энэ төхөөрөмжөөс):</div>';
          const chips = document.createElement("div"); chips.className = "tm-chips";
          mine.forEach((m) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "tm-chip";
            const subj = (PublicFeed.SUBJ && PublicFeed.SUBJ[m.s]) || "";
            b.innerHTML = "#" + Tracker.esc(m.t) + (subj ? ' <span>· ' + Tracker.esc(subj) + "</span>" : "");
            b.addEventListener("click", () => { input.value = m.t; run(); });
            chips.appendChild(b);
          });
          wrap.appendChild(chips);
          box.appendChild(wrap);
        }
      });
    },
  };

  /* ---------- Видео (CMS) — admin-аас нэмсэн видеог ачаална ---------- */
  const VideoCMS = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    init() {
      const listEl = document.querySelector("[data-video-list]");   // видео хуудасны grid
      const reelsEl = document.querySelector("[data-video-reels]"); // нүүрний reels карусель
      if (!listEl && !reelsEl) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      sb.from("videos").select("*").eq("published", true)
        .order("sort", { ascending: true }).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error || !data || !data.length) return; // хоосон/алдаа → жишээ хэвээр
          if (listEl) { // Видео хуудас — fb-video карт (жинхэнэ хэмжээ)
            const featuredEl = document.querySelector("[data-video-featured]");
            let arr = data;
            if (featuredEl) { // онцлох хэсэг байвал тусгаарлана; үгүй бол бүгдийг жагсаана
              const feat = data.find((v) => v.featured) || data[0];
              featuredEl.innerHTML = VideoCMS.card(feat, true);
              const rest = data.filter((v) => v !== feat);
              arr = rest.length ? rest : data;
            }
            const lim = parseInt(listEl.dataset.videoLimit || "0", 10);
            if (lim) arr = arr.slice(0, lim);
            listEl.innerHTML = arr.map((v) => VideoCMS.card(v)).join("");
            VideoCMS.parseFB();
            if (!lim) { // видео хуудас — 10-аар хуудаслана
              Pager.apply(listEl);
              if (listEl._pagerNav) listEl._pagerNav.addEventListener("click", () => setTimeout(() => VideoCMS.parseFB(), 200));
            }
          }
          if (reelsEl) { // Нүүрний карусель — reel плагин (тогтсон хэмжээ, гүйдэг)
            reelsEl.innerHTML = data.map((v) => VideoCMS.reelEmbed(v)).join("");
            window.dispatchEvent(new Event("resize")); // каруселийн цэгийг шинэчлэх
          }
        });
    },
    ytId(url) { const m = String(url).match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/); return m ? m[1] : ""; },
    reelEmbed(v) {
      const esc = VideoCMS.esc;
      const src = v.platform === "youtube"
        ? "https://www.youtube.com/embed/" + VideoCMS.ytId(v.url)
        : "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(v.url) + "&show_text=false&width=320";
      return `<div class="reel-embed reveal visible"><iframe src="${src}" title="${esc(v.title || "Видео")}" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    },
    card(v, featured) {
      const esc = VideoCMS.esc;
      const title = v.title ? `<h3>${esc(v.title)}</h3>` : "";
      const exc = v.excerpt ? `<p>${esc(v.excerpt)}</p>` : "";
      const body = (title || exc) ? `<div class="vc-body">${title}${exc}</div>` : "";
      let media;
      if (v.platform === "youtube") {
        media = `<div class="video-embed video-wide"><iframe src="https://www.youtube.com/embed/${VideoCMS.ytId(v.url)}" title="${esc(v.title || "Видео")}" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
      } else {
        // Facebook — fb-video SDK видеог АВТОМАТААР жинхэнэ хэмжээгээр нь дүрсэлнэ (хар зайгүй).
        // SDK гаргаж чадахгүй бол parseFB доторх нөөц iframe рүү шилжинэ (data-ar = нөөц харьцаа).
        const ar = v.orientation === "landscape" ? "16 / 9" : (v.orientation === "square" ? "1 / 1" : "9 / 16");
        media = `<div class="fb-wrap" data-href="${esc(v.url)}" data-ar="${ar}"><div class="fb-video" data-href="${esc(v.url)}" data-show-text="false" data-width="auto"></div></div>`;
      }
      return `<article class="video-card${featured ? " video-featured" : ""} reveal visible">${media}${body}</article>`;
    },
    parseFB() {
      let n = 0;
      const iv = setInterval(() => {
        if (window.FB && window.FB.XFBML) { try { window.FB.XFBML.parse(); } catch (_) {} clearInterval(iv); }
        else if (++n > 25) clearInterval(iv);
      }, 300);
    },
  };

  /* ---------- Нүүрний видео карусель (coverflow) ---------- */
  const VideoHero = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    fmtDate(s) { try { return new Date(s).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-"); } catch (_) { return ""; } },
    async init() {
      const wrap = document.querySelector("[data-vhero]");
      if (!wrap) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      try {
        const { data, error } = await sb.from("videos").select("*").eq("published", true)
          .order("sort", { ascending: true }).order("created_at", { ascending: false }).limit(15);
        if (error || !data || !data.length) { wrap.innerHTML = '<p class="feed-state">Видео одоогоор алга.</p>'; return; }
        this._vids = data; this._i = 0; this._wrap = wrap;
        wrap.innerHTML =
          `<div class="vhero-stage">
             <div class="vhs peek peek-left" aria-hidden="true"></div>
             <div class="vhs vhs-main" data-vhs-main></div>
             <div class="vhs peek peek-right" aria-hidden="true"></div>
           </div>
           <div class="vhero-ctrl">
             <button type="button" class="vhero-arrow vh-prev" aria-label="Өмнөх">‹</button>
             <span class="vh-count"></span>
             <button type="button" class="vhero-arrow vh-next" aria-label="Дараах">›</button>
           </div>
           <div class="vhero-cap"><h4 class="vh-title"></h4><span class="vh-date"></span></div>`;
        wrap.querySelector(".vh-prev").addEventListener("click", () => this.go(-1));
        wrap.querySelector(".vh-next").addEventListener("click", () => this.go(1));
        this.render();
      } catch (_) { wrap.innerHTML = '<p class="feed-state">Видео ачаалахад алдаа гарлаа.</p>'; }
    },
    go(d) { const n = this._vids.length; this._i = (this._i + d + n) % n; this.render(); },
    src(v) {
      if (v.platform === "youtube") return "https://www.youtube.com/embed/" + VideoCMS.ytId(v.url) + "?rel=0";
      return "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(v.url) + "&show_text=false&width=400";
    },
    render() {
      const v = this._vids[this._i], esc = VideoHero.esc, w = this._wrap;
      const main = w.querySelector("[data-vhs-main]");
      main.style.aspectRatio = v.orientation === "landscape" ? "16 / 9" : (v.orientation === "square" ? "1 / 1" : "9 / 16");
      main.innerHTML = `<iframe src="${this.src(v)}" title="${esc(v.title || "Видео")}" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen scrolling="no" loading="lazy"></iframe>`;
      w.querySelector(".vh-count").textContent = (this._i + 1) + " / " + this._vids.length;
      w.querySelector(".vh-title").textContent = v.title || "";
      w.querySelector(".vh-date").textContent = v.created_at ? this.fmtDate(v.created_at) : "";
    },
  };

  /* ---------- Тайлан (CMS) — admin-аас нэмсэн тайланг ачаална ---------- */
  const ReportsCMS = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    init() {
      const monthGrid = document.querySelector('[data-reports="month"]');
      const yearWrap = document.querySelector('[data-reports="year"]');
      if (!monthGrid && !yearWrap) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      sb.from("reports").select("*").eq("published", true)
        .order("sort", { ascending: true }).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error || !data || !data.length) return; // хоосон/алдаа → жишээ хэвээр
          const months = data.filter((r) => r.kind !== "year");
          const years = data.filter((r) => r.kind === "year");
          if (monthGrid && months.length) {
            monthGrid.innerHTML = months.map((r) => ReportsCMS.card(r)).join("");
            ReportsCMS.wire(monthGrid);
            Pager.apply(monthGrid);
          }
          if (yearWrap && years.length) {
            yearWrap.innerHTML = years.map((r) => ReportsCMS.card(r, true)).join("");
            ReportsCMS.wire(yearWrap);
          }
        });
    },
    wire(container) {
      container.querySelectorAll(".report-card[data-href]").forEach((el) => {
        el.addEventListener("click", (e) => { if (e.target.closest("a,button")) return; location.href = el.dataset.href; });
      });
    },
    card(r, year) {
      const esc = ReportsCMS.esc;
      const url = "tailan-delgerengui.html?id=" + encodeURIComponent(r.id);
      const pdf = r.pdf_url ? esc(r.pdf_url) : "";
      const cover = r.cover_url
        ? `<img src="${esc(r.cover_url)}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()" /><span class="rc-hover"><span class="rc-hint">Дэлгэрэнгүй</span></span>`
        : `<span class="rc-cover-brand"><img class="rc-emblem" src="assets/img/logo.svg" alt="" /><span class="rc-policy">Өөр Бодлого Бүтээгч Монгол</span><span class="rc-month">${esc(r.title)}</span><span class="rc-hint">Дэлгэрэнгүй</span></span>`;
      const w = year ? ' style="width:100%;max-width:300px"' : '';
      const actions = `<a class="btn btn-primary btn-sm" href="${url}">Дэлгэрэнгүй →</a>` +
        (pdf ? `<a class="btn btn-ghost btn-sm" href="${pdf}" target="_blank" rel="noopener">PDF</a>` : "");
      return `<article class="report-card reveal visible is-clickable"${w} data-href="${url}">
        <a class="rc-cover" href="${url}">${cover}</a>
        <div class="rc-body">
          <div class="rc-cat">${esc(r.category || "")}</div>
          <h4>${esc(r.title)}</h4>
          <div class="rc-meta">${esc(r.meta || "")}</div>
          <div class="rc-actions">${actions}</div>
        </div>
      </article>`;
    },
  };

  /* ---------- Тайлангийн дэлгэрэнгүй хуудас (tailan-delgerengui.html?id=…) ---------- */
  const ReportPost = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    async init() {
      const wrap = document.querySelector("[data-report-post]");
      if (!wrap) return;
      const id = new URLSearchParams(location.search).get("id");
      const sb = window.getSB && window.getSB();
      if (!id || !sb) { wrap.innerHTML = ReportPost.notFound(); return; }
      try {
        const { data, error } = await sb.from("reports").select("*").eq("id", id).single();
        if (error || !data) { wrap.innerHTML = ReportPost.notFound(); return; }
        document.title = data.title + " | Ц.Баатархүү";
        wrap.innerHTML = ReportPost.render(data);
        window.scrollTo(0, 0);
      } catch (_) { wrap.innerHTML = ReportPost.notFound(); }
    },
    notFound() {
      return '<div class="np-state"><h2>Тайлан олдсонгүй</h2><p>Энэ тайлан устсан эсвэл хаяг буруу байж магадгүй.</p><a class="btn btn-primary" href="tailan.html">← Тайлан</a></div>';
    },
    render(r) {
      const esc = ReportPost.esc;
      const tag = r.category ? `<div class="am-tags" style="margin-bottom:12px"><span class="am-tag">${esc(r.category)}</span></div>` : "";
      const meta = r.meta ? `<div class="np-datum">${esc(r.meta)}</div>` : "";
      const cover = r.cover_url
        ? `<figure class="np-cover"><img src="${esc(r.cover_url)}" alt="${esc(r.title)}" onerror="this.closest('.np-cover').remove()"></figure>`
        : "";
      const bodyText = r.body || "";
      const src = r.pdf_url
        ? `<div class="np-sources"><span class="np-src-label">Бичиг баримт:</span><a class="btn btn-primary btn-sm" href="${esc(r.pdf_url)}" target="_blank" rel="noopener">PDF үзэх</a><a class="btn btn-ghost btn-sm" href="${esc(r.pdf_url)}" download>Татах</a></div>`
        : "";
      return `<nav class="breadcrumb" aria-label="Замчлал"><a href="index.html">Нүүр</a><span>/</span><a href="tailan.html">Тайлан</a></nav>
        ${tag}${meta}
        <h1 class="np-title">${esc(r.title)}</h1>
        ${cover}
        <div class="np-body article-body">${articleBodyHtml(bodyText, esc)}</div>
        ${src}
        <a class="np-back" href="tailan.html">← Бүх тайлан руу буцах</a>`;
    },
  };

  /* ---------- Төслүүд (CMS) — admin-аас нэмсэн төслийг ачаална ---------- */
  const ProjectsCMS = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    STATUS: {
      ongoing: { label: "Хэрэгжиж буй", style: "background:rgba(240,164,55,.92);color:#2a1c03" },
      done: { label: "Хэрэгжсэн", style: "background:rgba(52,201,124,.9);color:#06281a" },
      planned: { label: "Төлөвлөж буй", style: "background:rgba(120,144,180,.55);color:#fff" },
    },
    init() {
      const grid = document.querySelector("[data-projects]");
      if (!grid) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      sb.from("projects").select("*").eq("published", true)
        .order("sort", { ascending: true }).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error || !data || !data.length) return; // хоосон/алдаа → жишээ хэвээр
          grid.innerHTML = data.map((p) => ProjectsCMS.card(p)).join("");
          const kids = Array.prototype.filter.call(grid.children, (c) => c.nodeType === 1);
          kids.forEach((el, i) => {
            const p = data[i]; if (!p) return;
            const url = "tusul-delgerengui.html?id=" + encodeURIComponent(p.id);
            el.classList.add("is-clickable");
            el.addEventListener("click", (e) => { if (e.target.closest("a,button")) return; location.href = url; });
          });
        });
    },
    card(p) {
      const esc = ProjectsCMS.esc;
      const st = ProjectsCMS.STATUS[p.status] || ProjectsCMS.STATUS.ongoing;
      const media = (p.image_url
        ? `<img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()" />`
        : "") + `<span class="placeholder"><img src="assets/img/logo.svg" alt="" style="width:46%;opacity:.4" /></span>`;
      return `<article class="card reveal visible" data-item data-title="${esc(p.title)}">
        <div class="card-media"><span class="tag">${esc(p.category || "Төсөл")}</span><span class="tag status-tag badge-status" style="${st.style}">${st.label}</span>${media}</div>
        <div class="card-body">
          <div class="card-date">${esc(p.date_label || "")}</div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description || "")}</p>
          <span class="card-link">Дэлгэрэнгүй →</span>
        </div>
      </article>`;
    },
    payload(p) {
      const st = ProjectsCMS.STATUS[p.status] || ProjectsCMS.STATUS.ongoing;
      return {
        cover: p.image_url || "",
        tags: [p.category || "Төсөл", st.label],
        title: p.title,
        meta: [p.date_label],
        lead: p.body ? p.description : "",
        body: p.body || p.description,
        sources: p.link ? [{ href: p.link, label: "Дэлгэрэнгүй холбоос →" }] : [],
      };
    },
  };

  /* ---------- Төслийн дэлгэрэнгүй хуудас (tusul-delgerengui.html?id=…) ---------- */
  const ProjectPost = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    CAL: '<svg class="ni-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    async init() {
      const wrap = document.querySelector("[data-project-post]");
      if (!wrap) return;
      const id = new URLSearchParams(location.search).get("id");
      const sb = window.getSB && window.getSB();
      if (!id || !sb) { wrap.innerHTML = ProjectPost.notFound(); return; }
      try {
        const { data, error } = await sb.from("projects").select("*").eq("id", id).single();
        if (error || !data) { wrap.innerHTML = ProjectPost.notFound(); return; }
        document.title = data.title + " | Ц.Баатархүү";
        const md = document.querySelector('meta[name="description"]');
        if (md && data.description) md.setAttribute("content", data.description);
        wrap.innerHTML = ProjectPost.render(data);
        window.scrollTo(0, 0);
      } catch (_) { wrap.innerHTML = ProjectPost.notFound(); }
    },
    notFound() {
      return '<div class="np-state"><h2>Төсөл олдсонгүй</h2><p>Энэ төсөл устсан эсвэл хаяг буруу байж магадгүй.</p><a class="btn btn-primary" href="tusul.html">← Төслүүд</a></div>';
    },
    render(p) {
      const esc = ProjectPost.esc;
      const st = ProjectsCMS.STATUS[p.status] || ProjectsCMS.STATUS.ongoing;
      const tags = [p.category || "Төсөл", st.label].filter(Boolean).map((t) => `<span class="am-tag">${esc(t)}</span>`).join("");
      const tagWrap = tags ? `<div class="am-tags" style="margin-bottom:12px">${tags}</div>` : "";
      const meta = p.date_label ? `<div class="np-datum">${ProjectPost.CAL}${esc(p.date_label)}</div>` : "";
      const cover = p.image_url
        ? `<figure class="np-cover"><img src="${esc(p.image_url)}" alt="${esc(p.title)}" onerror="this.closest('.np-cover').remove()"></figure>`
        : "";
      const lead = (p.body && p.description) ? `<p class="np-lead">${esc(p.description)}</p>` : "";
      const bodyText = p.body || p.description || "";
      const src = p.link
        ? `<div class="np-sources"><span class="np-src-label">Холбоос:</span><a class="btn btn-primary btn-sm" href="${esc(p.link)}" target="_blank" rel="noopener">Дэлгэрэнгүй →</a></div>`
        : "";
      return `<nav class="breadcrumb" aria-label="Замчлал"><a href="index.html">Нүүр</a><span>/</span><a href="tusul.html">Төслүүд</a></nav>
        ${tagWrap}${meta}
        <h1 class="np-title">${esc(p.title)}</h1>
        ${cover}${lead}
        <div class="np-body article-body">${articleBodyHtml(bodyText, esc)}</div>
        ${src}
        <a class="np-back" href="tusul.html">← Бүх төсөл рүү буцах</a>`;
    },
  };

  /* ---------- Сайтын тохиргоо (холбоо барих, сошиал) ---------- */
  const Settings = {
    async init() {
      const els = document.querySelectorAll("[data-setting]");
      if (!els.length) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      let map = {};
      try {
        const { data, error } = await sb.from("site_settings").select("*");
        if (error || !data) return;
        data.forEach((r) => { map[r.key] = r.value; });
      } catch (_) { return; }
      els.forEach((el) => {
        const val = map[el.dataset.setting];
        if (val == null || val === "") return; // хоосон бол одоогийнхыг хэвээр
        const mode = el.dataset.settingType || "text";
        if (mode === "tel") { el.setAttribute("href", "tel:" + val.replace(/\s+/g, "")); if (el.dataset.settingText !== "no") el.textContent = val; }
        else if (mode === "mailto") { el.setAttribute("href", "mailto:" + val); if (el.dataset.settingText !== "no") el.textContent = val; }
        else if (mode === "href") { el.setAttribute("href", val); }
        else { el.textContent = val; }
      });
    },
  };

  /* ---------- Арга хэмжээ (CMS) + бүртгэл ---------- */
  const EventsCMS = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    init() {
      const box = document.querySelector("[data-events]");
      if (!box) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      sb.from("events").select("*").eq("published", true)
        .order("event_date", { ascending: true, nullsFirst: false }).order("sort", { ascending: true })
        .then(async ({ data, error }) => {
          if (error || !data || !data.length) return; // хоосон → жишээ хэвээр
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const upcoming = data.filter((e) => !e.event_date || new Date(e.event_date) >= today);
          // Ирээдүйн арга хэмжээ байвал тэдгээрийг (ойрынх нь түрүүнд); үгүй бол хамгийн сүүлийнхийг
          // Зөвхөн 1 — ойрын ирэх (үгүй бол хамгийн сүүлийн) арга хэмжээ
          const ev = (upcoming.length ? upcoming[0] : data[data.length - 1]);
          if (!ev) return;
          let regCount = 0;
          try { const { data: rc } = await sb.rpc("event_reg_counts"); (rc || []).forEach((r) => { if (r.event_id === ev.id) regCount = r.cnt; }); } catch (_) {}
          box.className = "";
          box.innerHTML = "";
          box.appendChild(EventsCMS.featureCard(sb, ev, regCount));
        });
    },
    // Онцлох арга хэмжээ — зурагтай карт + бүртгүүлэх товч; дарахад дэлгэрэнгүй нээгдэнэ
    featureCard(sb, ev, regCount) {
      const esc = EventsCMS.esc;
      const el = document.createElement("article");
      el.className = "event-feature reveal visible";
      let day = "", mon = "";
      if (ev.event_date) { const d = new Date(ev.event_date); day = d.getDate(); mon = (d.getMonth() + 1) + "-р сар"; }
      const meta = [ev.location, ev.time_label].filter(Boolean).map(esc).join(" · ");
      el.innerHTML =
        `<div class="ef-img${ev.image_url ? "" : " ef-noimg"}">
           ${ev.image_url ? `<img src="${esc(ev.image_url)}" alt="${esc(ev.title)}" onerror="this.style.display='none';this.parentNode.classList.add('ef-noimg')" />` : ""}
           <span class="ef-tag">${esc(ev.badge || "Зарлал")}</span>
           ${day ? `<span class="ef-date"><b>${day}</b>${esc(mon)}</span>` : ""}
         </div>
         <div class="ef-body">
           <h3>${esc(ev.title)}</h3>
           ${meta ? `<p class="ef-meta">${meta}</p>` : ""}
           ${regCount ? `<p class="ef-count">${regCount} иргэн бүртгүүлсэн</p>` : ""}
           <div class="ef-cta"></div>
         </div>`;
      const url = "arga-delgerengui.html?id=" + encodeURIComponent(ev.id);
      const cta = el.querySelector(".ef-cta");
      if (ev.register_url) {
        const a = document.createElement("a");
        a.className = "btn btn-gold"; a.href = ev.register_url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Бүртгүүлэх";
        cta.appendChild(a);
      } else if (ev.register_enabled) {
        const a = document.createElement("a");
        a.className = "btn btn-gold"; a.href = url; a.textContent = "Бүртгүүлэх";
        cta.appendChild(a);
      }
      const more = document.createElement("a"); more.className = "ef-more"; more.href = url; more.textContent = "Дэлгэрэнгүй →";
      cta.appendChild(more);
      // Картыг дарахад дэлгэрэнгүй хуудас руу (товч/линкээс бусад)
      el.classList.add("is-clickable");
      el.addEventListener("click", (e) => { if (e.target.closest("a,button")) return; location.href = url; });
      return el;
    },
    // Бүртгэлийн UI — дэлгэрэнгүй цонхны дотор шинээр үүсгэнэ
    buildReg(sb, ev) {
      const esc = EventsCMS.esc;
      const wrap = document.createElement("div");
      wrap.className = "ef-reg";
      if (ev.register_url) {
        wrap.innerHTML = `<a href="${esc(ev.register_url)}" target="_blank" rel="noopener" class="btn btn-gold">Бүртгүүлэх</a>`;
        return wrap;
      }
      if (!ev.register_enabled) return wrap;
      wrap.innerHTML =
        `<button type="button" class="btn btn-gold ev-reg-open">Бүртгүүлэх</button>
         <form class="ev-reg-form" hidden>
           <input type="text" name="name" placeholder="Таны нэр" required />
           <input type="tel" name="phone" placeholder="Утасны дугаар" required />
           <button type="submit" class="btn btn-gold btn-sm">Бүртгүүлэх</button>
           <p class="ev-reg-msg" role="status"></p>
         </form>`;
      const openBtn = wrap.querySelector(".ev-reg-open");
      const form = wrap.querySelector(".ev-reg-form");
      const msg = wrap.querySelector(".ev-reg-msg");
      openBtn.addEventListener("click", () => { form.hidden = false; openBtn.style.display = "none"; form.querySelector("input").focus(); });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = form.querySelector('[name="name"]').value.trim();
        const phone = form.querySelector('[name="phone"]').value.trim();
        if (!name || !phone) return;
        const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
        try {
          const { error } = await sb.from("event_registrations").insert({ event_id: ev.id, name, phone });
          if (error) throw error;
          form.innerHTML = '<p class="ev-reg-ok">✓ Бүртгэл амжилттай хүлээн авлаа. Баярлалаа!</p>';
        } catch (err) { msg.textContent = "Алдаа: " + (err.message || "дахин оролдоно уу"); msg.style.color = "var(--color-danger)"; btn.disabled = false; }
      });
      return wrap;
    },
    payload(sb, ev) {
      const date = ev.event_date ? Article.fmtDate(ev.event_date) : "";
      return {
        cover: ev.image_url || "",
        tags: [ev.badge || "Зарлал"],
        title: ev.title,
        meta: [date, ev.location, ev.time_label],
        lead: ev.body ? ev.description : "",
        body: ev.body || ev.description,
        extra: EventsCMS.buildReg(sb, ev),
      };
    },
  };

  /* ---------- Санал хүсэлтийн тойм (dashboard) ---------- */
  const FeedbackStats = {
    async init() {
      const box = document.querySelector("[data-fb-stats]");
      if (!box) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      try {
        const { data, error } = await sb.rpc("feedback_stats");
        if (error || !data) return;
        const s = data;
        const cards = [
          ["Нийт санал", s.total], ["Энэ сард ирсэн", s.month],
          ["Шийдвэрлэсэн", s.resolved], ["Иргэдийн дэмжлэг", s.supports],
        ];
        box.innerHTML = cards.map(([l, n]) => `<div class="fbs-card"><div class="fbs-n">${n == null ? 0 : n}</div><div class="fbs-l">${l}</div></div>`).join("");
      } catch (_) {}
    },
  };

  /* ---------- Хууль (CMS) — admin-аас нэмсэн хуулийг ачаална ---------- */
  const LawsCMS = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    ICON: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="26" height="26"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>',
    LABEL: { passed: "Батлагдсан", review: "Хэлэлцэж буй", support: "Хэлэлцэх эсэхийг дэмжсэн", discussed: "Хэлэлцүүлэг хийсэн", notstarted: "Хэлэлцэж эхлээгүй", withdrawn: "Татаж авсан" },
    CLS: { passed: "status-passed", review: "status-review", support: "status-support", discussed: "status-review", notstarted: "status-notstarted", withdrawn: "status-draft" },
    init() {
      const list = document.querySelector("[data-laws]");
      if (!list) return;
      const sb = window.getSB && window.getSB();
      if (!sb) return;
      sb.from("laws").select("*").eq("published", true)
        .order("sort", { ascending: true }).order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error || !data || !data.length) return; // хоосон/алдаа → жишээ хэвээр
          list.innerHTML = data.map((l) => LawsCMS.item(l)).join("");
          Laws.init(); // чипс / пилл / хайлтыг шинэ өгөгдлөөр дахин үүсгэх
        });
    },
    item(l) {
      const esc = LawsCMS.esc;
      const status = l.status || "review";
      const role = l.category === "co" ? "Хамтран санаачилсан" : "Өргөн барьсан";
      const meta = [l.date_label, role, l.topic].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join("");
      const pdf = l.pdf_url ? `<a class="btn btn-ghost btn-sm" href="${esc(l.pdf_url)}" target="_blank" rel="noopener">PDF</a>` : "";
      return `<article class="law-item" data-item data-title="${esc(l.title)}" data-category="${esc(l.category || "own")}" data-status="${esc(status)}" data-summary="${esc(l.summary || "")}">
        <div class="law-icon">${LawsCMS.ICON}</div>
        <div><h4>${esc(l.title)}</h4><div class="meta">${meta}</div></div>
        <div class="law-actions"><span class="badge-status ${LawsCMS.CLS[status] || "status-review"}">${esc(LawsCMS.LABEL[status] || status)}</span>${pdf}<span class="law-more">Дэлгэрэнгүй →</span></div>
      </article>`;
    },
  };

  /* ---------- Баялаг агуулга рендерлэх (нийтлэг) ----------
     Энгийн текстийг догол мөр болгоно. Дотор нь:
       • тусдаа мөрөнд бичсэн зургийн холбоос (http…jpg/png/webp) → зураг
       • "## Дэд гарчиг" хэлбэрийн мөр → дэд гарчиг
     болж харагдана. */
  function articleBodyHtml(text, esc) {
    const t = (text == null ? "" : String(text)).trim();
    if (!t) return '<p class="a-empty">Дэлгэрэнгүй агуулга оруулаагүй байна.</p>';
    // Мөр доторх Word-маягийн хэлбэр: **тод**, *налуу*, [текст](холбоос)
    const inline = (raw) => esc(raw)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const out = []; let list = null;
    const flush = () => { if (list) { out.push("<ul>" + list.join("") + "</ul>"); list = null; } };
    lines.forEach((l) => {
      if (/^https?:\/\/\S+\.(?:jpe?g|png|webp|gif|avif)(?:\?\S*)?$/i.test(l)) {
        flush(); out.push(`<figure class="a-fig"><img src="${esc(l)}" alt="" loading="lazy"></figure>`); return;
      }
      if (/^#{1,3}\s+/.test(l)) { flush(); out.push(`<h2 class="a-sub">${inline(l.replace(/^#{1,3}\s+/, ""))}</h2>`); return; }
      if (/^[-•]\s+/.test(l)) { (list = list || []).push(`<li>${inline(l.replace(/^[-•]\s+/, ""))}</li>`); return; }
      if (/^>\s+/.test(l)) { flush(); out.push(`<blockquote class="a-quote">${inline(l.replace(/^>\s+/, ""))}</blockquote>`); return; }
      flush(); out.push(`<p>${inline(l)}</p>`);
    });
    flush();
    return out.join("");
  }

  /* ---------- Дэлгэрэнгүй харагдац (Article overlay) — төсөл/арга хэмжээ ---------- */
  const Article = {
    esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    CAL: '<svg class="am-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    ensure() {
      if (this._el) return this._el;
      const m = document.createElement("div");
      m.className = "article-modal"; m.setAttribute("aria-hidden", "true");
      m.innerHTML = '<div class="am-box" role="dialog" aria-modal="true"><button type="button" class="am-close" aria-label="Хаах">✕</button><div class="am-cover-slot"></div><div class="am-content"></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".am-close")) this.close(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && m.classList.contains("open")) this.close(); });
      this._el = m;
      return m;
    },
    paras(text) { return articleBodyHtml(text, this.esc.bind(this)); },
    open(o) {
      const m = this.ensure(); const esc = this.esc.bind(this);
      const coverSlot = m.querySelector(".am-cover-slot");
      if (o.cover) {
        const img = document.createElement("img");
        img.className = "am-cover"; img.src = o.cover; img.alt = o.title || ""; img.loading = "lazy";
        img.onerror = () => { coverSlot.innerHTML = '<div class="am-cover-ph"><img src="assets/img/logo.svg" alt=""></div>'; };
        coverSlot.innerHTML = ""; coverSlot.appendChild(img);
      } else {
        coverSlot.innerHTML = '<div class="am-cover-ph"><img src="assets/img/logo.svg" alt=""></div>';
      }
      const tags = (o.tags || []).filter(Boolean).map((t) => `<span class="am-tag">${esc(t)}</span>`).join("");
      const meta = (o.meta || []).filter(Boolean);
      const metaHtml = meta.length ? `<div class="am-meta">${this.CAL}${meta.map(esc).join(' <span style="opacity:.45">·</span> ')}</div>` : "";
      const lead = o.lead ? `<p class="am-lead">${esc(o.lead)}</p>` : "";
      const sources = (o.sources || []).filter(Boolean).map((s) =>
        `<a class="btn ${s.ghost ? "btn-ghost" : "btn-primary"} btn-sm" href="${esc(s.href)}"${s.download ? " download" : ' target="_blank" rel="noopener"'}>${esc(s.label)}</a>`
      ).join("");
      const content = m.querySelector(".am-content");
      content.innerHTML =
        (tags ? `<div class="am-tags">${tags}</div>` : "") +
        `<h1 class="am-title">${esc(o.title || "")}</h1>` + metaHtml + lead +
        `<div class="am-body article-body">${this.paras(o.body)}</div>` +
        '<div class="am-extra"></div>' +
        (sources ? `<div class="am-sources">${sources}</div>` : "");
      const extra = content.querySelector(".am-extra");
      if (o.extra instanceof Node) extra.appendChild(o.extra);
      else if (typeof o.extra === "string" && o.extra) extra.innerHTML = o.extra;
      else extra.remove();
      m.classList.add("open"); m.setAttribute("aria-hidden", "false");
      document.body.classList.add("am-lock"); m.scrollTop = 0;
      m.querySelector(".am-close").focus();
    },
    close() {
      if (!this._el) return;
      this._el.classList.remove("open"); this._el.setAttribute("aria-hidden", "true");
      document.body.classList.remove("am-lock");
    },
    fmtDate(s) { try { return new Date(s).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "."); } catch (_) { return ""; } },
    // Картыг дарж нээдэг болгох — дотор линк/товч/форм дарвал үл хамаарна
    wire(el, payloadFn) {
      if (!el) return;
      el.classList.add("is-clickable");
      el.setAttribute("tabindex", "0"); el.setAttribute("role", "button");
      const fire = () => Article.open(payloadFn());
      el.addEventListener("click", (e) => { if (e.target.closest("a,button,input,textarea,form,.ef-reg")) return; fire(); });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === el) { e.preventDefault(); fire(); } });
    },
  };

  // Хөвөгч "Санал хүсэлт" товч — холбоо барих хуудаснаас бусад бүх хуудсанд
  function injectFeedbackFab() {
    if (location.pathname.includes("holboo")) return;
    const a = document.createElement("a");
    a.href = "holboo.html";
    a.className = "fab-feedback";
    a.setAttribute("aria-label", "Санал хүсэлт илгээх");
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="fab-label">Санал хүсэлт</span>';
    document.body.appendChild(a);
  }

  document.addEventListener("DOMContentLoaded", () => {
    Theme.init(); Nav.init(); Search.init(); Reveal.init();
    Counters.init(); Video.init(); Rating.init(); Forms.init(); Filter.init();
    Share.init(); injectFeedbackFab(); I18n.init(); Misc.init(); PublicFeed.init(); Tabs.init(); Attendance.init(); NewsFeed.init(); NewsPost.init(); EventPost.init(); Pager.init(); Carousel.init(); Laws.init(); Tracker.init(); VideoCMS.init(); VideoHero.init(); ReportsCMS.init(); ReportPost.init(); ProjectsCMS.init(); ProjectPost.init(); LawsCMS.init(); FeedbackStats.init(); EventsCMS.init(); Settings.init();
  });
})();
