"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * トップページの演出（2号店サイト CONNECT Studio と同じ動き）。
 * オープニング → ページが拡大して表示 / 慣性スクロール / カーソル / パララックス /
 * セクション番号 / 見出しの1文字ずつ表示 / ホバー時の文字スクランブル / スマホメニュー / FAQ / 写真スライド。
 * 対象の要素はサーバー側で描画済みの静的なマークアップなので、DOMを直接扱う。
 */
export function HomeEffects() {
  useEffect(() => {
    const body = document.body;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      addEventListener(type, fn, opts);
      cleanups.push(() => removeEventListener(type, fn));
    };
    const timers: number[] = [];
    let alive = true;
    const raf = (fn: FrameRequestCallback) => requestAnimationFrame((t) => alive && fn(t));

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!location.hash) window.scrollTo(0, 0);

    // ---------- smooth scroll (Lenis) ----------
    let lenis: Lenis | null = null;
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
      const loop = (t: number) => { lenis?.raf(t); raf(loop); };
      raf(loop);
    }
    let setMenu: (open: boolean) => void = () => {};
    document.querySelectorAll<HTMLAnchorElement>('.jf a[href^="#"]').forEach((a) => {
      const fn = (e: MouseEvent) => {
        const id = a.getAttribute("href")!;
        if (id.length < 2) return;
        const el = document.querySelector<HTMLElement>(id);
        if (!el) return;
        e.preventDefault();
        if (body.classList.contains("menu-open")) setMenu(false);
        const easing = (t: number) => 1 - Math.pow(1 - t, 4);
        if (lenis) {
          if (lenis.isStopped) lenis.start();
          if (id === "#top") lenis.scrollTo(0, { duration: 1.4, easing });
          else lenis.scrollTo(el, { offset: -40, duration: 1.4, easing });
        } else {
          window.scrollTo({ top: id === "#top" ? 0 : el.getBoundingClientRect().top + scrollY - 40, behavior: "smooth" });
        }
      };
      a.addEventListener("click", fn);
      cleanups.push(() => a.removeEventListener("click", fn));
    });

    // ---------- text helpers ----------
    const isJP = (ch: string) => /[぀-ヿ㐀-鿿＀-￯]/.test(ch);
    const textNodes = (el: Node) => {
      const out: Text[] = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = w.nextNode())) if (n.nodeValue?.trim()) out.push(n as Text);
      return out;
    };
    type Flagged = HTMLElement & { __cr?: boolean; __sc?: boolean; __tw?: boolean };

    // 見出し：1文字ずつ左からフェードイン
    const charReveal = (el: Flagged | null) => {
      if (!el || el.__cr || reduce) return;
      el.__cr = true;
      const nodes = textNodes(el);
      let i = 0;
      const total = nodes.reduce((n, t) => n + (t.nodeValue?.length ?? 0), 0);
      const step = Math.min(25, 1100 / Math.max(1, total));
      for (const n of nodes) {
        const frag = document.createDocumentFragment();
        let wd: HTMLSpanElement | null = null;
        for (const c of n.nodeValue ?? "") {
          if (c === " " || c === "\n") { wd = null; frag.appendChild(document.createTextNode(c)); continue; }
          const sp = document.createElement("span");
          sp.className = "ch";
          sp.textContent = c;
          sp.style.setProperty("--cd", `${i++ * step}ms`);
          if (isJP(c)) { wd = null; frag.appendChild(sp); continue; } // 日本語は1文字ずつ折り返し可
          if (!wd) { wd = document.createElement("span"); wd.style.whiteSpace = "nowrap"; frag.appendChild(wd); }
          wd.appendChild(sp);
        }
        const parent = n.parentNode as HTMLElement;
        if (/flex|grid/.test(getComputedStyle(parent).display)) {
          const w = document.createElement("span");
          w.appendChild(frag);
          parent.replaceChild(w, n);
        } else parent.replaceChild(frag, n);
      }
    };

    // ホバー時：文字が切り替わりながら確定していく
    const LAT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/*+-";
    const JP = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン録音完成予約";
    const scramble = (el: Flagged, dur = 500) => {
      if (reduce || el.__sc) return;
      el.__sc = true;
      // 元の文字は毎回読み直す（React が文言を差し替えるボタンもあるため）
      const nodes = textNodes(el).map((n) => ({ n, txt: n.nodeValue ?? "" }));
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        for (const { n, txt } of nodes) {
          let out = "";
          for (let i = 0; i < txt.length; i++) {
            const c = txt[i];
            if (c === " " || c === "\n") { out += c; continue; }
            out += i / txt.length < p * 1.15 - 0.05 ? c : isJP(c) ? JP[(Math.random() * JP.length) | 0] : LAT[(Math.random() * LAT.length) | 0];
          }
          n.nodeValue = out;
        }
        if (p < 1) raf(tick);
        else { for (const { n, txt } of nodes) n.nodeValue = txt; el.__sc = false; }
      };
      raf(tick);
    };
    document.querySelectorAll<Flagged>(".jf .gnav a, .jf .ft-col a, .jf .mnav a, .jf .wl a, .jf .cdirect a, .jf .btn, .jf .up").forEach((a) => {
      const fn = () => scramble(a);
      a.addEventListener("mouseenter", fn);
      cleanups.push(() => a.removeEventListener("mouseenter", fn));
    });

    // タイプライター（ヒーローの1行目）
    const typeReveal = (el: Flagged | null, ms = 38) => {
      if (!el || el.__tw) return;
      el.__tw = true;
      const spans: HTMLSpanElement[] = [];
      for (const n of textNodes(el)) {
        const w = document.createElement("span");
        for (const c of n.nodeValue ?? "") {
          const sp = document.createElement("span");
          sp.className = "tw";
          sp.textContent = c;
          w.appendChild(sp);
          spans.push(sp);
        }
        n.parentNode!.replaceChild(w, n);
      }
      const caret = document.createElement("span");
      caret.className = "caret";
      el.appendChild(caret);
      if (reduce) { spans.forEach((sp) => sp.classList.add("on")); caret.remove(); return; }
      let i = 0;
      const step = () => {
        if (!alive) return;
        if (i < spans.length) { spans[i++].classList.add("on"); timers.push(window.setTimeout(step, ms)); }
        else timers.push(window.setTimeout(() => caret.remove(), 900));
      };
      step();
    };
    const heroText = () => {
      typeReveal(document.querySelector<Flagged>(".jf .hero .hlead"));
      timers.push(window.setTimeout(() => charReveal(document.querySelector<Flagged>(".jf .hero .big")), 500));
    };

    // ---------- reveal ----------
    const SC_SEL = ".h2, .label, .h2ja, .step .t, .book .ready, #about .lead, #flow .total b";
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const t = e.target as Flagged;
        t.classList.add("in");
        io.unobserve(t);
        if (t.matches(SC_SEL)) charReveal(t);
        t.querySelectorAll<Flagged>(SC_SEL).forEach(charReveal);
      }),
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    const observeReveal = () => document.querySelectorAll(".jf .rv:not(.in), .jf .rv-img:not(.in)").forEach((el) => io.observe(el));
    observeReveal();
    // Works の「もっと見る」などで後から増えたカードも拾う
    const mo = new MutationObserver(observeReveal);
    const worksEl = document.getElementById("works");
    if (worksEl) mo.observe(worksEl, { childList: true, subtree: true });
    cleanups.push(() => { io.disconnect(); mo.disconnect(); });

    // ---------- cursor ----------
    const cur = document.getElementById("cursor")!;
    let mx = -100, my = -100, cx = -100, cy = -100;
    on("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    const tickCursor = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf(tickCursor);
    };
    raf(tickCursor);
    const hoverIn = (e: Event) => { if ((e.target as Element).closest?.("a, button, summary, input, select, textarea, .range")) cur.classList.add("is-hover"); };
    const hoverOut = (e: Event) => { if ((e.target as Element).closest?.("a, button, summary, input, select, textarea, .range")) cur.classList.remove("is-hover"); };
    document.addEventListener("mouseover", hoverIn);
    document.addEventListener("mouseout", hoverOut);
    cleanups.push(() => { document.removeEventListener("mouseover", hoverIn); document.removeEventListener("mouseout", hoverOut); });

    // ---------- parallax + hero + counter + 固定UIの色 ----------
    const heroBg = document.getElementById("heroBg")!;
    const hero = document.querySelector<HTMLElement>(".jf .hero")!;
    const pxEls = [...document.querySelectorAll<HTMLElement>(".jf [data-px]")];
    const secs = [...document.querySelectorAll<HTMLElement>(".jf [data-sec]")];
    const secNo = document.getElementById("secNo")!;
    const pgbar = document.getElementById("pgbar")!;
    const mcta = document.getElementById("mcta")!;
    const counter = document.querySelector<HTMLElement>(".jf .counter")!;
    const side = document.querySelector<HTMLElement>(".jf .side")!;
    const up = document.getElementById("up")!;
    const book = document.getElementById("book")!;
    const blends = [...document.querySelectorAll<HTMLElement>(".jf .blend")];
    let vh = innerHeight;
    on("resize", () => { vh = innerHeight; });
    const onScroll = () => {
      const y = scrollY;
      if (y < vh) {
        heroBg.style.transform = `translateY(${y * 0.25}px) scale(${1 + (y / vh) * 0.06})`;
        hero.style.opacity = String(1 - (y / vh) * 0.6);
      }
      if (!reduce) for (const el of pxEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const c = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translateY(${(-c * Number(el.dataset.px)).toFixed(1)}px)`;
      }
      let idx = 0;
      for (let i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top < vh * 0.5) idx = i;
      if (secs[idx]) secNo.textContent = secs[idx].dataset.sec ?? "";
      const docH = document.documentElement.scrollHeight;
      pgbar.style.setProperty("--pg", (y / Math.max(1, docH - vh)).toFixed(3));
      mcta.classList.toggle("show", y > vh * 0.6);
      counter.classList.toggle("hide", y + vh > docH - 420);
      side.classList.toggle("hide", y < vh * 0.7);
      up.classList.toggle("show", book.getBoundingClientRect().top < vh * 0.8);
      // 真下のセクションが明るければ黒、暗ければ白
      for (const el of blends) {
        const r = el.getBoundingClientRect();
        if (!r.width) continue;
        el.style.pointerEvents = "none";
        const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.left + r.width / 2), Math.min(innerHeight - 1, r.top + r.height / 2));
        el.style.pointerEvents = "";
        const sec = hit?.closest(".light, .dark, .hero, .band, .book, .ft, .mnav");
        el.classList.toggle("on-light", !!sec?.classList.contains("light"));
      }
    };
    on("scroll", onScroll, { passive: true });
    onScroll();

    // ---------- opening (カウンター → 左上からページが拡大) ----------
    const op = document.getElementById("opening");
    if (op && body.classList.contains("booting")) {
      try { sessionStorage.setItem("jf-open", "1"); } catch {}
      lenis?.stop();
      const cnt = document.getElementById("cnt")!;
      const bar = document.getElementById("bar")!;
      const finish = () => {
        lenis?.start();
        op.classList.add("done");
        body.classList.remove("booting");
        body.classList.add("reveal");
        timers.push(window.setTimeout(heroText, 900));
        timers.push(window.setTimeout(() => { op.remove(); body.classList.add("ready"); onScroll(); }, 1400));
      };
      const t0 = performance.now(), dur = 1500;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const n = Math.round((1 - Math.pow(1 - p, 3)) * 100);
        cnt.textContent = String(n).padStart(3, "0");
        bar.style.width = `${n}%`;
        if (p < 1) raf(step);
        else timers.push(window.setTimeout(finish, 250));
      };
      raf(step);
    } else {
      op?.remove();
      body.classList.remove("booting");
      body.classList.add("reveal", "ready");
      timers.push(window.setTimeout(heroText, 300));
    }

    // ---------- hero: 写真がゆっくり切り替わる + 粒子ノイズ ----------
    const sl = [...document.querySelectorAll<HTMLImageElement>("#slides .sl")];
    const dots = document.getElementById("dots")!;
    if (sl.length) {
      dots.innerHTML = "";
      sl.forEach((_, i) => { const d = document.createElement("i"); if (!i) d.className = "on"; dots.appendChild(d); });
      const load = (im?: HTMLImageElement) => { if (im && !im.getAttribute("src") && im.dataset.src) im.src = im.dataset.src; };
      timers.push(window.setTimeout(() => load(sl[1]), 1800));
      let i = 0;
      const iv = window.setInterval(() => {
        if (document.hidden || scrollY > innerHeight) return;
        sl[i].classList.remove("on");
        dots.children[i].classList.remove("on");
        i = (i + 1) % sl.length;
        load(sl[i]);
        sl[i].classList.add("on");
        dots.children[i].classList.add("on");
        load(sl[(i + 1) % sl.length]);
      }, 5600);
      cleanups.push(() => clearInterval(iv));
    }
    const g = document.getElementById("grain") as HTMLCanvasElement | null;
    const gc = g?.getContext("2d");
    if (g && gc && !reduce) {
      const mob = innerWidth < 800, GW = mob ? 160 : 260, GH = mob ? 300 : 150;
      g.width = GW; g.height = GH;
      const img = gc.createImageData(GW, GH), d = img.data;
      let f = 0;
      const grain = () => {
        raf(grain);
        if (f++ % (mob ? 3 : 2) || document.hidden || scrollY > innerHeight) return;
        for (let p = 0; p < d.length; p += 4) { const v = (80 + Math.random() * 160) | 0; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; }
        gc.putImageData(img, 0, 0);
      };
      grain();
    }

    // ---------- mobile nav ----------
    const mnav = document.getElementById("mnav")!;
    const burger = document.getElementById("burger")!;
    const bIcon = burger.querySelector("svg")!;
    const bOpen = bIcon.innerHTML, bClose = '<path d="M6 6l12 12M18 6L6 18"/>';
    setMenu = (o) => {
      mnav.classList.toggle("open", o);
      burger.classList.toggle("is-open", o);
      body.classList.toggle("menu-open", o);
      bIcon.innerHTML = o ? bClose : bOpen;
      burger.setAttribute("aria-expanded", String(o));
      if (lenis) { if (o) lenis.stop(); else lenis.start(); }
    };
    const toggleMenu = () => setMenu(!mnav.classList.contains("open"));
    burger.addEventListener("click", toggleMenu);
    cleanups.push(() => burger.removeEventListener("click", toggleMenu));

    // ---------- faq ----------
    document.querySelectorAll<HTMLButtonElement>(".jf .acc button").forEach((b) => {
      const fn = () => { const open = b.parentElement!.classList.toggle("open"); b.setAttribute("aria-expanded", String(open)); };
      b.addEventListener("click", fn);
      cleanups.push(() => b.removeEventListener("click", fn));
    });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      cleanups.forEach((fn) => fn());
      lenis?.destroy();
      body.classList.remove("booting", "reveal", "ready", "menu-open", "no-open");
    };
  }, []);

  return null;
}
