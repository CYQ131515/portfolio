/* ============================================================
   交互层：渲染、固定的那一半、案例路由、放大、入场。
   没有框架，也没有构建步骤。
   ============================================================ */
(function () {
  'use strict';

  const S = window.SITE;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 内容渲染 ---------------- */

  // 关于
  const prose = $('#about-prose');
  S.about.forEach((text, i) => prose.appendChild(el('p', i === 0 ? 'rv is-lead' : 'rv', text)));

  // 简历入口（尺寸与文件名只写在一个地方）
  $$('a[download]').forEach((a) => {
    if (!/resume/.test(a.getAttribute('href') || '')) return;
    a.setAttribute('href', S.resume);
    const small = a.querySelector('small');
    if (small) small.textContent = 'PDF · ' + S.resumeSize;
  });

  // 作品账本
  const ledger = $('#ledger');
  const byId = {};
  S.projects.forEach((p, i) => { byId[p.id] = { p, i }; });

  S.projects.forEach((p, idx) => {
    const li = el('li', 'ledger__row rv');
    li.dataset.id = p.id;
    const btn = el('button');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML =
      '<span class="ledger__name">' + p.title + '</span>' +
      '<span class="ledger__year">' + p.year + '</span>' +
      '<span class="ledger__lead">' + p.lead + '</span>' +
      '<img class="ledger__thumb" src="' + p.stage + '" alt="' + p.title + ' 界面" loading="' + (idx < 3 ? 'eager' : 'lazy') + '" decoding="async" width="1600" height="1000">';
    btn.addEventListener('click', () => { location.hash = '#/work/' + p.id; });
    btn.addEventListener('focus', () => focusRow(li));
    btn.addEventListener('blur', () => li.classList.remove('is-focus'));
    li.appendChild(btn);
    li.addEventListener('mouseenter', () => focusRow(li));
    ledger.appendChild(li);
  });

  function focusRow(li) {
    $$('.ledger__row').forEach((r) => r.classList.remove('is-focus'));
    li.classList.add('is-focus');
    ledger.classList.add('is-hovering');
    const p = byId[li.dataset.id].p;
    setStage('p:' + p.id, p.title + ' · ' + p.subtitle);
  }
  ledger.addEventListener('mouseleave', () => {
    ledger.classList.remove('is-hovering');
    $$('.ledger__row').forEach((r) => r.classList.remove('is-focus'));
    syncStageToScroll();
  });

  // 筛选
  const filters = $('#filters');
  const cats = ['全部'].concat(Array.from(new Set(S.projects.map((p) => p.category))));
  cats.forEach((c, i) => {
    const b = el('button', null, c);
    b.type = 'button';
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.addEventListener('click', () => applyFilter(c, b));
    filters.appendChild(b);
  });

  function applyFilter(cat, activeBtn) {
    $$('button', filters).forEach((b) => b.setAttribute('aria-pressed', String(b === activeBtn)));
    const rows = $$('.ledger__row', ledger);
    let shown = 0;
    rows.forEach((r) => {
      const p = byId[r.dataset.id].p;
      const hit = cat === '全部' || p.category === cat;
      if (hit) shown++;
      if (hit) {
        r.hidden = false;
        r.classList.add('is-in');
        r.animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: reduced() ? 1 : 320, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
      } else {
        r.hidden = true;
      }
    });
    $('#ledger-empty').hidden = shown > 0;
  }
  $('#ledger-reset').addEventListener('click', () => applyFilter('全部', $('button', filters)));

  // 能力表
  const sheet = $('#skills-sheet');
  $('#skills-title').textContent = S.skills.title;
  $('#skills-note').textContent = S.skills.note;
  S.skills.groups.forEach((g) => {
    const box = el('div', 'sheet__group');
    box.appendChild(el('h3', null, g.name));
    g.items.forEach((it) => {
      const row = el('div', 'sheet__item');
      row.innerHTML = '<div><b>' + it.name + '</b><em>' + it.note + '</em></div><span>' + it.meta + '</span>';
      box.appendChild(row);
    });
    sheet.appendChild(box);
  });

  // 经历
  const exp = $('#experience-list');
  S.experience.forEach((e) => {
    const li = el('li', 'ledger__row rv');
    li.innerHTML =
      '<div>' +
        '<div class="ledger__name">' + e.org + '</div>' +
      '</div>' +
      '<div class="ledger__year">' + e.period + '</div>' +
      '<div class="ledger__meta">' + e.role + '</div>' +
      '<div class="ledger__note">' + e.note + '</div>';
    exp.appendChild(li);
  });

  // 联系
  $('#contact-lead').textContent = S.contactLead;
  const rows = $('#contact-rows');
  const contactItems = [
    { label: '写信', value: S.email, href: 'mailto:' + S.email },
    { label: '电话', value: S.phone, href: 'tel:' + S.phone },
    { label: '现居', value: S.city },
    { label: '看机会', value: '服饰行业的 AI 产品岗' },
  ];
  contactItems.forEach((it) => {
    const li = el('li');
    const inner =
      '<small class="rows__label">' + it.label + '</small><span class="rows__value">' + it.value + '</span>';
    if (it.href) {
      const a = el('a', null, inner);
      a.href = it.href;
      li.appendChild(a);
    } else if (it.copy) {
      const b = el('button', 'rowpad', inner);
      b.type = 'button';
      b.style.width = '100%';
      b.addEventListener('click', () => copy(it.value));
      li.appendChild(b);
    } else {
      li.appendChild(el('div', 'rowpad', inner));
    }
    rows.appendChild(li);
  });

  // 素材署名
  const cl = $('#credits-list');
  S.credits.forEach((c) => cl.appendChild(el('li', null, c)));

  /* ---------------- 固定的那一半 ---------------- */

  const stage = $('#stage');
  const frame = $('.stage__frame', stage);
  const cap = $('#stage-cap');
  const video = $('#stage-video');
  const stageCache = {};
  let currentKey = 'hero';
  let stageTimer = null;

  const stageMap = {
    hero: { src: 'assets/img/man-at-night.jpg', cap: S.name + ' · ' + S.city },
    about: { src: 'assets/img/man-in-fog.jpg', cap: '关于 · 怎么走到 AI 产品' },
    skills: { src: 'assets/img/skills-map.png', cap: '能力 · 三组能做的事' },
    experience: { src: 'assets/img/snow-field.jpg', cap: '经历 · 2023 至今' },
    video: { video: true, cap: '入夜 · 十一点之后的江面' },
  };

  function preload(key) {
    const cfg = stageMap[key];
    if (!cfg || !cfg.src || stageCache[key]) return stageCache[key];
    const img = el('img', 'stage__img' + (key.indexOf('p:') === 0 ? ' stage__img--print' : ''));
    img.alt = '';
    img.width = 1400; img.height = 1000;
    img.addEventListener('load', () => {
      if (currentKey === key) activate(img);
    });
    img.src = cfg.src;
    frame.insertBefore(img, video);
    stageCache[key] = img;
    return img;
  }

  function activate(node) {
    $$('.stage__img, .stage__video', frame).forEach((n) => {
      if (n !== node) n.classList.remove('is-on');
    });
    node.classList.add('is-on');
  }

  function setStage(key, capText) {
    if (!stage || key === currentKey) return;
    currentKey = key;

    // 文案先淡出，再换
    cap.classList.add('is-swap');
    clearTimeout(stageTimer);
    stageTimer = setTimeout(() => {
      cap.textContent = capText || (stageMap[key] && stageMap[key].cap) || '';
      cap.classList.remove('is-swap');
    }, 260);

    const isProject = key.indexOf('p:') === 0;
    stage.classList.toggle('is-print', isProject);
    if (isProject) {
      const p = byId[key.slice(2)].p;
      $('#stage-label-title').textContent = p.title;
      $('#stage-label-meta').textContent = p.kind + ' · ' + p.year;
    }

    if (key === 'video') {
      preload('skills');
      activate(video);
      if (!reduced()) { video.play().catch(() => {}); }
      return;
    }
    video.pause();
    const cfg = stageMap[key];
    if (!cfg) return;
    const img = preload(key);
    if (img && img.complete && img.naturalWidth) activate(img);
  }

  /* 滚动时：哪个节在视口里，就让它决定画面 */
  const stageSections = $$('[data-stage]');
  function syncStageToScroll() {
    if (detailOpen()) return;
    const mid = window.innerHeight * 0.46;
    let active = null;
    stageSections.forEach((sec) => {
      if (sec.getBoundingClientRect().top < mid) active = sec;
    });
    if (!active) { setStage('hero'); return; }

    if (active.dataset.stage === 'project') {
      // 账本里哪一行离视口中线最近，画面就是哪一件
      const rows = $$('.ledger__row', active);
      let best = rows[0], bestD = Infinity;
      rows.forEach((row) => {
        const r = row.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < bestD) { bestD = d; best = row; }
      });
      const p = best && byId[best.dataset.id] ? byId[best.dataset.id].p : S.projects[0];
      setStage('p:' + p.id);
      return;
    }
    setStage(active.dataset.stage);
  }
  // 每个项目一张图，注册进 stageMap
  S.projects.forEach((p) => {
    stageMap['p:' + p.id] = { src: p.stage, cap: p.title + ' · ' + p.subtitle };
  });

  /* 窄屏没有 hover：让滚动本身去聚焦视口中心那一件 */
  const narrow = window.matchMedia('(max-width: 900px)');
  const workSec = $('#work');
  function focusRowByScroll() {
    if (!narrow.matches || !workSec) {
      if (ledger.classList.contains('is-scrollfocus')) {
        ledger.classList.remove('is-scrollfocus');
        $$('.ledger__row', ledger).forEach((r) => r.classList.remove('is-focus'));
      }
      return;
    }
    const mid = window.innerHeight * 0.52;
    const rows = $$('.ledger__row', ledger).filter((r) => !r.hidden);
    let best = null;
    let bestD = Infinity;
    rows.forEach((row) => {
      const b = row.getBoundingClientRect();
      if (b.bottom < 0 || b.top > window.innerHeight) return;
      const d = Math.abs((b.top + b.bottom) / 2 - mid);
      if (d < bestD) { bestD = d; best = row; }
    });
    ledger.classList.add('is-scrollfocus');
    rows.forEach((r) => r.classList.toggle('is-focus', r === best));
    if (best) {
      const p = byId[best.dataset.id] && byId[best.dataset.id].p;
      if (p) setStage('p:' + p.id, p.title + ' · ' + p.subtitle);
    }
  }

  /* ---------------- 入场 ---------------- */

  const pending = new Set();
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          reveal(en.target);
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0 })
    : null;

  function reveal(node) {
    if (!node || node.classList.contains('is-in')) return;
    node.classList.add('is-in');
    pending.delete(node);
    io && io.unobserve(node);
  }
  function watch(node) {
    node.classList.add('rv');
    pending.add(node);
    io && io.observe(node);
  }
  // 兜底：任何滚动都可能补上（快速滚动时观察器会漏）
  function sweep() {
    if (!pending.size) return;
    const h = window.innerHeight;
    pending.forEach((n) => {
      const r = n.getBoundingClientRect();
      if (r.top < h * 0.94) reveal(n);
    });
  }

  revealAll();
  function revealAll() {
    // 已经有 .rv 的（账本行、关于段落）也要进观察队列
    $$('.rv').forEach((n) => { pending.add(n); io && io.observe(n); });
    $$('main > section').forEach((sec) => {
      $$('.sec-title, .work__head, .filters, .skills__note, .sheet, .contact__lead, .rows li, .contact__foot, .prose p', sec)
        .forEach((k, i) => {
          if (k.classList.contains('rv')) return;
          watch(k);
          k.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
        });
    });
    sweep();
  }

  /* ---------------- 导航状态 ---------------- */

  const navLinks = $$('[data-nav]');
  const navSections = navLinks.map((a) => ({ a, sec: document.querySelector(a.getAttribute('href')) })).filter((x) => x.sec);
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const hit = navSections.find((x) => x.sec === en.target);
        if (!hit) return;
        if (en.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove('is-here'));
          hit.a.classList.add('is-here');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    navSections.forEach((x) => navIO.observe(x.sec));
  }

  /* ---------------- 案例详情 ---------------- */

  const detail = $('#detail');
  const detailBody = $('#detail-body');
  const detailNav = $('#detail-nav');
  const detailPos = $('#detail-pos');
  let lastFocus = null;
  let openId = null;
  let closeTimer = null;
  const baseTitle = document.title;

  const detailOpen = () => !detail.hidden;

  function projectHTML(p) {
    let out = '';
    out += '<h1 class="detail__title" id="detail-title">' + p.title + '</h1>';
    out += '<p class="detail__sub">' + p.subtitle + '</p>';
    out += '<p class="detail__lead">' + p.lead + '</p>';
    out += '<dl class="detail__meta">' +
      '<div><dt>类型</dt><dd>' + p.kind + '</dd></div>' +
      '<div><dt>年份</dt><dd>' + p.year + '</dd></div>' +
      '<div><dt>周期</dt><dd>' + p.duration + '</dd></div>' +
      '<div><dt>分类</dt><dd>' + p.category + '</dd></div>' +
      '</dl>';

    p.body.forEach((b) => {
      if (b.t === 'h') out += '<h3>' + b.v + '</h3>';
      else if (b.t === 'p') out += '<p>' + b.v + '</p>';
      else if (b.t === 'q') out += '<blockquote>' + b.v + '</blockquote>';
      else if (b.t === 'fig') {
        const crop = b.crop ? ' crop crop--' + b.crop : '';
        out += '<figure class="' + crop.trim() + '">' +
          '<img src="' + b.img + '" alt="' + (b.cap || p.title) + '" loading="lazy" width="1600" height="1000" data-zoom="' + (b.cap || '') + '">' +
          (b.cap ? '<figcaption>' + b.cap + '</figcaption>' : '') +
          '</figure>';
      } else if (b.t === 'video') {
        out += '<figure><video controls preload="none" poster="' + b.still + '"><source src="' + b.src + '" type="video/webm"></video>' +
          (b.cap ? '<figcaption>' + b.cap + '</figcaption>' : '') + '</figure>';
      }
    });

    if (p.video) {
      out += '<figure><video controls preload="none" playsinline poster="' + p.video.poster + '">' +
        '<source src="' + p.video.src + '" type="video/webm"></video>' +
        (p.video.cap ? '<figcaption>' + p.video.cap + '</figcaption>' : '') + '</figure>';
    }

    if (p.attachments && p.attachments.length) {
      out += '<div class="attach"><h3>附件</h3><p>' + p.attachments.length + ' 份文件：PDF 可以在页面内预览，其余直接下载。</p>';
      p.attachments.forEach((a) => {
        const ext = (a.file.split('.').pop() || '').toUpperCase();
        out += '<a href="' + a.file + '" download>' +
          '<span><b>' + a.name + '</b><em>' + (a.note || '') + '</em></span>' +
          '<span>' + a.size + ' · ' + ext + '</span></a>';
      });
      out += '</div>';
    }
    return out;
  }

  function renderNav(p, idx) {
    const prev = S.projects[(idx - 1 + S.projects.length) % S.projects.length];
    const next = S.projects[(idx + 1) % S.projects.length];
    detailNav.innerHTML =
      '<a href="#/work/' + prev.id + '" data-prev><small>上一件</small><b>' + prev.title + '</b></a>' +
      '<a href="#/work/' + next.id + '" data-next><small>下一件</small><b>' + next.title + '</b></a>';
  }

  function openDetail(id) {
    const rec = byId[id];
    if (!rec) return;
    const { p, i } = rec;
    if (!detailOpen()) {
      lastFocus = document.activeElement;
      document.documentElement.style.overflow = 'hidden';
      detail.hidden = false;
      requestAnimationFrame(() => detail.classList.add('is-open'));
    }
    detail.scrollTop = 0;
    detailBody.innerHTML = projectHTML(p);
    renderNav(p, i);
    detailPos.textContent = p.category + ' · ' + p.year;
    document.title = p.title + ' · ' + p.subtitle + ' — ' + S.name;
    openId = id;
    clearTimeout(closeTimer);
    setTimeout(() => detail.focus({ preventScroll: true }), 60);
  }

  function closeDetail(instant) {
    if (!detailOpen()) return;
    detail.classList.remove('is-open');
    openId = null;
    document.title = baseTitle;
    const done = () => {
      detail.hidden = true;
      detailBody.innerHTML = '';
      document.documentElement.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (instant || reduced()) done();
    else { clearTimeout(closeTimer); closeTimer = setTimeout(done, 400); }
  }

  $('#detail-back').addEventListener('click', () => { location.hash = '#work'; });
  $('#detail-close').addEventListener('click', () => { location.hash = '#work'; });

  detailNav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    location.hash = a.getAttribute('href');
  });

  detail.addEventListener('click', (e) => {
    const att = e.target.closest('.attach a');
    if (att) {
      const href = att.getAttribute('href') || '';
      if (/\.pdf($|[?#])/i.test(href)) {
        e.preventDefault();
        openViewer(href, att.querySelector('b') ? att.querySelector('b').textContent : '附件');
      }
      return; // 非 PDF：按 download 属性直接下载
    }
    const img = e.target.closest('img[data-zoom]');
    if (!img) return;
    openLightbox(img.src, img.getAttribute('data-zoom'));
  });

  // 焦点锁在弹层里
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (viewerOpen()) { closeViewer(); return; }
      if (lightboxOpen()) { closeLightbox(); return; }
      if (detailOpen()) { location.hash = '#work'; return; }
    }
    if (detailOpen() && !lightboxOpen() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const rec = byId[openId];
      if (!rec) return;
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const target = S.projects[(rec.i + step + S.projects.length) % S.projects.length];
      location.hash = '#/work/' + target.id;
      return;
    }
    if (e.key !== 'Tab') return;
    const scope = viewerOpen() ? viewer : detailOpen() ? detail : null;
    if (!scope) return;
    const focusables = $$('a[href], button, video[controls], iframe, [tabindex]:not([tabindex="-1"])', scope)
      .filter((n) => n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // 路由
  function route() {
    const m = location.hash.match(/^#\/work\/([A-Za-z0-9_-]+)$/);
    if (m) openDetail(m[1]);
    else if (detailOpen()) closeDetail();
    else if (/^#[A-Za-z]/.test(location.hash)) {
      const t = document.querySelector(location.hash);
      if (t) t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------------- 附件查看 ---------------- */

  const viewer = $('#viewer');
  const viewerName = $('#viewer-name');
  const viewerFrame = $('#viewer-frame');
  const viewerDl = $('#viewer-dl');
  const viewerOpen = () => !viewer.hidden;

  let viewerTimer = null;
  function openViewer(src, name) {
    if (!src) return;
    viewerName.textContent = name || '附件';
    viewerDl.href = src;
    const hint = $('#viewer-hint');
    hint.hidden = true;
    let loaded = false;
    viewerFrame.onload = () => { loaded = true; hint.hidden = true; };
    viewerFrame.src = src;
    viewer.hidden = false;
    requestAnimationFrame(() => viewer.classList.add('is-open'));
    setTimeout(() => $('#viewer-close').focus({ preventScroll: true }), 60);
    // 有些环境（本地 file:// 直接打开）不允许内嵌 PDF，这时给一句说明
    clearTimeout(viewerTimer);
    viewerTimer = setTimeout(() => { if (!loaded) hint.hidden = false; }, 1600);
  }

  function closeViewer() {
    if (!viewerOpen()) return;
    viewer.classList.remove('is-open');
    const done = () => {
      viewer.hidden = true;
      viewerFrame.src = 'about:blank';
      viewerDl.href = '#';
      if (detailOpen()) $('#detail-back').focus({ preventScroll: true });
    };
    if (reduced()) done();
    else setTimeout(done, 320);
  }

  $('#viewer-close').addEventListener('click', closeViewer);

  /* ---------------- 图片放大 ---------------- */

  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxCap = $('#lightbox-cap');
  const lightboxOpen = () => !lightbox.hidden;

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCap.textContent = caption || '';
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    lightbox.focus({ preventScroll: true });
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    setTimeout(() => {
      lightbox.hidden = true;
      lightboxImg.src = '';
      if (detailOpen()) $('#detail-back').focus({ preventScroll: true });
    }, reduced() ? 0 : 320);
  }
  $('#lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxImg) closeLightbox();
  });

  /* ---------------- 复制 ---------------- */

  const toast = $('#copy-toast');
  let toastTimer = null;
  function copy(text) {
    const done = () => {
      toast.textContent = '已复制 ' + text;
      toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done));
    } else fallback(text, done);
  }
  function fallback(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (err) { /* 留空：复制失败时用户仍能看到文字 */ }
    document.body.removeChild(ta);
  }

  /* ---------------- 滚动驱动 ---------------- */

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncStageToScroll();
      focusRowByScroll();
      sweep();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---------------- 启动 ---------------- */

  // 首屏之外的照片，滚动到再加载
  ['about', 'skills', 'experience'].forEach((k) => { if ('requestIdleCallback' in window) requestIdleCallback(() => preload(k)); else setTimeout(() => preload(k), 1200); });

  syncStageToScroll();
  focusRowByScroll();
  narrow.addEventListener('change', focusRowByScroll);
  route();
  setTimeout(sweep, 400);
  setTimeout(sweep, 1200);

  // 焦点回到页面时恢复视频
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (currentKey === 'video' && !reduced()) video.play().catch(() => {});
  });
})();
