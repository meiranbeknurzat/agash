import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Ruler,
  ShieldCheck,
  Shirt,
  Timer,
} from "lucide-react";

/* ───────────────────────── Данные компании ───────────────────────── */

const COMPANY = {
  name: "Ағаш",
  tagline: "мебель на заказ",
  whatsapp: "77001234567", // номер для заявок: только цифры, с кодом страны
  phone: "+7 700 123-45-67",
  address: "Астана, пр. Кабанбай батыра, 15",
  hours: "Ежедневно с 9:00 до 20:00",
};

/* ───────────────────────── Ставки и справочники ─────────────────────────
   Чтобы поменять цены, ассортимент или каталог, достаточно отредактировать
   объекты ниже: калькулятор, каталог и чертёж читают их напрямую. */

const TYPES = {
  kitchen: {
    id: "kitchen",
    label: "Кухня",
    accusative: "кухню",
    view: "Кухня, вид спереди",
    icon: ChefHat,
    caseRate: 70000, // ₸ за м² фронтальной площади
    countertopRate: 32000, // ₸ за погонный метр
    unitForms: ["модуль", "модуля", "модулей"],
    unitPer: "за модуль",
    dims: {
      length: { min: 120, max: 600, def: 300, hint: "вдоль стены" },
      height: { min: 210, max: 260, def: 220, hint: "до верха навесных шкафов" },
      depth: { min: 45, max: 70, def: 60, hint: "нижних шкафов" },
    },
  },
  wardrobe: {
    id: "wardrobe",
    label: "Шкаф-купе",
    accusative: "шкаф-купе",
    view: "Шкаф-купе, вид спереди",
    icon: Shirt,
    caseRate: 45000,
    countertopRate: 0,
    unitForms: ["дверь", "двери", "дверей"],
    unitPer: "за дверь",
    dims: {
      length: { min: 100, max: 400, def: 220, hint: "ширина ниши" },
      height: { min: 200, max: 280, def: 240, hint: "от пола" },
      depth: { min: 40, max: 70, def: 60, hint: "вместе с дверями" },
    },
  },
};

const DIM_KEYS = ["length", "height", "depth"];
const DIM_LABELS = { length: "Длина", height: "Высота", depth: "Глубина" };

const MATERIALS = [
  { id: "white", name: "Белый глянец", color: "#F3F3EF", rate: 42000, finish: "gloss" },
  { id: "oak", name: "Дуб натуральный", color: "#C8A07A", rate: 52000, finish: "wood" },
  { id: "graphite", name: "Тёмный графит", color: "#3A3E43", rate: 46000, finish: "matte" },
  { id: "sage", name: "Шалфей", color: "#9AAE97", rate: 44000, finish: "matte" },
  { id: "cashmere", name: "Кашемир", color: "#D9CCBA", rate: 40000, finish: "matte" },
  { id: "walnut", name: "Орех", color: "#6E4A33", rate: 58000, finish: "wood" },
];
const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

const FITTING_LEVELS = {
  standard: {
    id: "standard",
    label: "Стандарт",
    handle: "#8D9399",
    profile: "#A9AEB3",
    kitchen: { price: 9000, desc: "Петли и направляющие с доводчиком" },
    wardrobe: { price: 18000, desc: "Стальная система купе, ролики на подшипниках" },
  },
  premium: {
    id: "premium",
    label: "Премиум",
    handle: "#B08D57",
    profile: "#BFA77B",
    kitchen: { price: 28000, desc: "Австрийская фурнитура: тихое закрывание, ящики полного выдвижения" },
    wardrobe: { price: 42000, desc: "Алюминиевый профиль цвета шампань, плавный бесшумный ход" },
  },
};

const INSTALL = { rate: 0.07, min: 25000 }; // доставка и монтаж: 7 %, не меньше 25 000 ₸
const ROUND_TO = 1000;
const STANDARD_DEPTH = 60;
const KITCHEN_MODULE = 60; // см
const WARDROBE_DOOR = 90; // см

const CATALOG = [
  {
    id: "modern",
    name: "Кухня «Модерн»",
    badge: "Чаще всего заказывают",
    description:
      "Белый глянец и латунные ручки. Светлые фасады визуально расширяют даже небольшую кухню.",
    config: { type: "kitchen", length: 320, height: 230, depth: 60, material: "white", fittings: "premium" },
  },
  {
    id: "loft",
    name: "Шкаф-купе «Лофт»",
    description:
      "Графитовые фасады в профиле цвета шампань. Вмещает гардероб семьи из трёх человек.",
    config: { type: "wardrobe", length: 270, height: 250, depth: 60, material: "graphite", fittings: "premium" },
  },
  {
    id: "scandi",
    name: "Кухня «Сканди»",
    description: "Матовый шалфей со светлой столешницей. Спокойная кухня, которая не надоедает с годами.",
    config: { type: "kitchen", length: 260, height: 220, depth: 60, material: "sage", fittings: "standard" },
  },
  {
    id: "classic",
    name: "Шкаф-купе «Классик»",
    description: "Тёплый дуб в серебристом профиле. Подходит и для спальни, и для прихожей.",
    config: { type: "wardrobe", length: 200, height: 240, depth: 55, material: "oak", fittings: "standard" },
  },
];

const HERO_SAMPLE = { type: "kitchen", length: 320, height: 230, depth: 60, material: "graphite", fittings: "premium" };
const INITIAL_CONFIG = { type: "kitchen", length: 300, height: 220, depth: 60, material: "oak", fittings: "standard" };

/* ───────────────────────── Расчёт цены ───────────────────────── */

function unitCount(type, length) {
  const L = Math.round(length);
  return type === "kitchen" ? Math.ceil(L / KITCHEN_MODULE) : Math.max(2, Math.round(L / WARDROBE_DOOR));
}

function defaultDims(type) {
  const d = TYPES[type].dims;
  return { length: d.length.def, height: d.height.def, depth: d.depth.def };
}

function calcPrice({ type, length, height, depth, material, fittings }) {
  const t = TYPES[type];
  const m = MATERIAL_BY_ID[material];
  const f = FITTING_LEVELS[fittings];
  const area = (length / 100) * (height / 100);
  const depthCoef = 0.7 + (0.3 * depth) / STANDARD_DEPTH;
  const units = unitCount(type, length);
  const unitPrice = f[type].price;

  const body = area * t.caseRate * depthCoef;
  const facades = area * m.rate;
  const hardware = units * unitPrice;
  const countertop = (length / 100) * t.countertopRate;
  const subtotal = body + facades + hardware + countertop;
  const install = Math.max(INSTALL.min, subtotal * INSTALL.rate);
  const total = Math.round((subtotal + install) / ROUND_TO) * ROUND_TO;

  return {
    area,
    depthCoef,
    units,
    unitPrice,
    body,
    facades,
    hardware,
    countertop,
    subtotal,
    install,
    installIsMin: subtotal * INSTALL.rate < INSTALL.min,
    total,
  };
}

/* ───────────────────────── Утилиты ───────────────────────── */

const NBSP = " ";

function groupDigits(n, sep = NBSP) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function formatMoney(n) {
  return `${groupDigits(n)}${NBSP}₸`;
}

function formatDecimal(n, digits = 2, fixed = false) {
  const s = fixed ? n.toFixed(digits) : String(+n.toFixed(digits));
  return s.replace(".", ",");
}

function roundTo(n, step = ROUND_TO) {
  return Math.round(n / step) * step;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Осветляет (amount > 0) или затемняет (amount < 0) цвет на долю от 0 до 1. */
function shade(hex, amount) {
  const ch = hexToRgb(hex).map((c) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)));
  return `#${ch.map((c) => clamp(c, 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

/** Относительная яркость по WCAG, 0…1. */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function swatchBackground(m) {
  const light = shade(m.color, 0.12);
  const dark = shade(m.color, -0.14);
  if (m.finish === "gloss") {
    return [
      "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.95) 0 10%, rgba(255,255,255,0) 34%)",
      "linear-gradient(135deg, rgba(255,255,255,0) 52%, rgba(255,255,255,0.7) 58%, rgba(255,255,255,0) 64%)",
      `linear-gradient(145deg, ${light}, ${m.color} 50%, ${shade(m.color, -0.1)})`,
    ].join(", ");
  }
  if (m.finish === "wood") {
    return [
      "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.13) 3px 4px, rgba(0,0,0,0) 4px 8px, rgba(255,255,255,0.09) 8px 10px, rgba(0,0,0,0) 10px 13px)",
      `linear-gradient(160deg, ${light}, ${m.color} 55%, ${dark})`,
    ].join(", ");
  }
  return `linear-gradient(145deg, ${shade(m.color, 0.08)}, ${shade(m.color, -0.08)})`;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function scrollToId(id) {
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  if (id === "top") {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
}

/** Маска телефона Казахстана: +7 (701) 234-56-78. */
function formatPhone(raw) {
  const s = String(raw).trim();
  const d = s.replace(/\D/g, "");
  if (!d) return "";

  let national;
  if (s.startsWith("+")) national = d.slice(1); // «+7 …»: первая цифра — код страны
  else if (d[0] === "8" || (d[0] === "7" && d.length >= 11)) national = d.slice(1);
  else national = d; // 10 цифр без «+» — код страны добавим сами

  if (national[0] === "8") national = national.slice(1); // «+7 8701…» → «+7 701…»
  if (national.length > 10 && national[0] === "7") national = national.slice(1);
  national = national.slice(0, 10);

  if (!national) return s.length < 3 ? "" : "+7 ";
  let out = "+7 (" + national.slice(0, 3);
  if (national.length > 3) out += ") " + national.slice(3, 6);
  if (national.length > 6) out += "-" + national.slice(6, 8);
  if (national.length > 8) out += "-" + national.slice(8, 10);
  return out;
}

function isValidName(v) {
  return v.trim().length >= 2;
}

function isValidPhone(v) {
  const d = v.replace(/\D/g, "");
  return d.length === 11 && d[0] === "7";
}

function buildMessage({ config, total, name, phone }) {
  const t = TYPES[config.type];
  return [
    `Здравствуйте! Хочу заказать ${t.accusative}.`,
    `Габариты: ${config.length}×${config.height}×${config.depth} см (длина × высота × глубина).`,
    `Цвет фасада: ${MATERIAL_BY_ID[config.material].name}.`,
    `Фурнитура: ${FITTING_LEVELS[config.fittings].label}.`,
    `Примерная цена в калькуляторе: ${groupDigits(total, " ")} тенге.`,
    `Меня зовут ${name}, мой WhatsApp: ${phone}. Жду обратной связи.`,
  ].join("\n");
}

function waLink(text) {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;
}

/* ───────────────────────── Хуки ───────────────────────── */

/** Плавно догоняет target за ms (кубическое замедление). При смене resetKey — мгновенно. */
function useTweened(target, ms = 380, resetKey) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const keyRef = useRef(resetKey);

  useEffect(() => {
    const jump = keyRef.current !== resetKey || ms <= 0 || prefersReducedMotion();
    keyRef.current = resetKey;
    const from = valueRef.current;
    if (jump || from === target) {
      valueRef.current = target;
      setValue(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - p) ** 3;
      const v = p === 1 ? target : from + (target - from) * eased;
      valueRef.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Страховка: если rAF не тикает (вкладка в фоне), всё равно приходим к цели
    const fallback = setTimeout(() => {
      cancelAnimationFrame(raf);
      valueRef.current = target;
      setValue(target);
    }, ms + 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [target, ms, resetKey]);

  return value;
}

/** Разница цены после паузы в изменениях и «устоявшееся» значение для aria-live. */
function useSettledDelta(total, delay = 350, visibleFor = 1800) {
  const [settled, setSettled] = useState(total);
  const [delta, setDelta] = useState(null);
  const lastRef = useRef(total);

  useEffect(() => {
    const t = setTimeout(() => {
      const diff = total - lastRef.current;
      lastRef.current = total;
      setSettled(total);
      if (diff !== 0) setDelta({ value: diff, key: Date.now() });
    }, delay);
    return () => clearTimeout(t);
  }, [total, delay]);

  useEffect(() => {
    if (!delta) return undefined;
    const t = setTimeout(() => setDelta(null), visibleFor);
    return () => clearTimeout(t);
  }, [delta, visibleFor]);

  return { settled, delta };
}

/** Панель видна, пока конфигуратор в зоне видимости, а блок цены — нет. */
function useMobilePriceBar() {
  const [state, setState] = useState({ configurator: false, price: false });

  useEffect(() => {
    const configurator = document.getElementById("configurator");
    const price = document.getElementById("price");
    if (!configurator || !price || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        setState((prev) => {
          const next = { ...prev };
          entries.forEach((e) => {
            if (e.target === configurator) next.configurator = e.isIntersecting;
            if (e.target === price) next.price = e.isIntersecting;
          });
          return next;
        });
      },
      { rootMargin: "0px 0px -90px 0px" }
    );
    io.observe(configurator);
    io.observe(price);
    return () => io.disconnect();
  }, []);

  return state.configurator && !state.price;
}

/* ───────────────────────── Стили, которых нет в Tailwind ───────────────────────── */

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@500;600&display=swap");

:root {
  color-scheme: light;
  --paper: #FFFFFF;
  --grid: rgba(37, 99, 235, 0.06);
  --grid-major: rgba(37, 99, 235, 0.11);
  --dim: #1D4ED8;
  --edge: rgba(28, 25, 23, 0.5);
  --apron: #EFEDEA;
  --track: #E7E5E4;
  --accent: #2563EB;
  --focus: #2563EB;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --paper: #1C1917;
    --grid: rgba(96, 165, 250, 0.06);
    --grid-major: rgba(96, 165, 250, 0.12);
    --dim: #60A5FA;
    --edge: rgba(231, 229, 228, 0.4);
    --apron: #2E2A27;
    --track: #44403C;
    --focus: #60A5FA;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --paper: #1C1917;
  --grid: rgba(96, 165, 250, 0.06);
  --grid-major: rgba(96, 165, 250, 0.12);
  --dim: #60A5FA;
  --edge: rgba(231, 229, 228, 0.4);
  --apron: #2E2A27;
  --track: #44403C;
  --focus: #60A5FA;
}

html { -webkit-text-size-adjust: 100%; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }

.font-body { font-family: "Onest", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.font-display { font-family: "Unbounded", "Onest", system-ui, sans-serif; letter-spacing: -0.02em; }
.agash :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.agash [tabindex="-1"]:focus-visible { outline: none; }

.grid-paper {
  background-color: var(--paper);
  background-image:
    linear-gradient(var(--grid-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-major) 1px, transparent 1px),
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
  background-position: -1px -1px;
}

/* Подписи размеров в единицах viewBox: на узких экранах чертёж сжимается, поэтому шрифт крупнее */
.dim-label { font-size: 16px; }
@media (max-width: 639px) { .dim-label { font-size: 22px; } }

/* Ползунок: дорожка 6 px, бегунок 28 px, зона касания 44 px */
.range {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 44px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}
.range:focus { outline: none; }
.range::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--accent) 0 var(--p, 0%), var(--track) var(--p, 0%) 100%);
}
.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  margin-top: -11px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3px solid var(--accent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.range:active::-webkit-slider-thumb { transform: scale(1.14); }
.range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.3); }
.range::-moz-range-track { height: 6px; border-radius: 999px; background: var(--track); }
.range::-moz-range-progress { height: 6px; border-radius: 999px; background: var(--accent); }
.range::-moz-range-thumb {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3px solid var(--accent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.range:active::-moz-range-thumb { transform: scale(1.14); }
.range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.3); }

@keyframes agash-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes agash-swap { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes agash-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes agash-draw { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes agash-pop { 0% { opacity: 0; transform: scale(0.4); } 70% { opacity: 1; transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes agash-delta { 0% { opacity: 0; transform: translateY(4px); } 12% { opacity: 1; transform: none; } 82% { opacity: 1; } 100% { opacity: 0; } }
@keyframes agash-success { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.anim-fade { animation: agash-fade 0.35s ease-out both; }
.anim-swap { animation: agash-swap 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.anim-success { animation: agash-success 0.4s ease-out both; }
.check-pop { animation: agash-pop 0.25s ease-out both; }
.delta-badge { animation: agash-delta 1.8s ease both; }
.intro-rise { animation: agash-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.intro-draw { transform-box: fill-box; transform-origin: center; animation: agash-draw 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) 0.6s both; }
.intro-label { animation: agash-fade 0.4s ease-out 1.15s both; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
`;

/* ───────────────────────── Чертёж ─────────────────────────
   Вид спереди в косоугольной проекции: глубина уходит вправо-вверх
   под углом 35° с коэффициентом 0,45. Все размеры — в сантиметрах. */

const VB_W = 640;
const VB_H = 420;
const OBLIQUE_ANGLE = (35 * Math.PI) / 180;
const OX = 0.45 * Math.cos(OBLIQUE_ANGLE);
const OY = 0.45 * Math.sin(OBLIQUE_ANGLE);
const PAD_DIMS = { l: 100, r: 70, t: 28, b: 76 };
const PAD_PLAIN = { l: 26, r: 26, t: 26, b: 26 };
const KITCHEN_FIXED_SCALE_LENGTH = 420; // до этой длины кухня рисуется в постоянном масштабе

function footprint(L, H, D) {
  return { w: L + D * OX, h: H + D * OY };
}

function fixedScale(type, pad) {
  const d = TYPES[type].dims;
  const maxL = type === "kitchen" ? KITCHEN_FIXED_SCALE_LENGTH : d.length.max;
  const f = footprint(maxL, d.height.max, d.depth.max);
  return Math.min((VB_W - pad.l - pad.r) / f.w, (VB_H - pad.t - pad.b) / f.h);
}

const r1 = (n) => Math.round(n * 10) / 10;
const toPoints = (ps) => ps.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ");
const frontQuad = (P, x1, x2, y1, y2, z) => [P(x1, y1, z), P(x2, y1, z), P(x2, y2, z), P(x1, y2, z)];
const topQuad = (P, x1, x2, y, z1, z2) => [P(x1, y, z1), P(x2, y, z1), P(x2, y, z2), P(x1, y, z2)];
const sideQuad = (P, x, y1, y2, z1, z2) => [P(x, y1, z1), P(x, y1, z2), P(x, y2, z2), P(x, y2, z1)];

function Face({ points, fill, overlays = [] }) {
  const p = toPoints(points);
  return (
    <>
      <polygon points={p} style={{ fill }} />
      {overlays.map((o) => (
        <polygon key={o} points={p} style={{ fill: o, stroke: "none" }} />
      ))}
    </>
  );
}

function Block({ P, x1, x2, y1, y2, z1, z2, color, overlays, top = true }) {
  return (
    <g>
      <Face points={sideQuad(P, x2, y1, y2, z1, z2)} fill={shade(color, -0.18)} />
      {top && <Face points={topQuad(P, x1, x2, y2, z1, z2)} fill={shade(color, 0.2)} />}
      <Face points={frontQuad(P, x1, x2, y1, y2, z1)} fill={color} overlays={overlays} />
    </g>
  );
}

function Seg({ a, b }) {
  return <line x1={r1(a[0])} y1={r1(a[1])} x2={r1(b[0])} y2={r1(b[1])} />;
}

function KitchenFigure({ P, s, x0, y0, L, H, D, mat, level, overlays }) {
  const n = Math.max(2, unitCount("kitchen", L));
  const w = L / n;
  const upperDepth = Math.min(35, D - 8);
  const zU = D - upperDepth;
  const counter = luminance(mat.color) > 0.8 ? "#57524C" : "#E7E2D9";
  const drawerIdx = Math.min(n - 1, 2);
  const premium = level.id === "premium";
  const handle = (cx, y, width, z) => {
    const hl = premium ? width * 0.62 : Math.min(12, width * 0.3);
    return <Face points={frontQuad(P, cx - hl / 2, cx + hl / 2, y - 1, y + 1, z)} fill={level.handle} />;
  };
  // Матрица плоскости столешницы: (x, z) → экран, чтобы мойка и конфорки лежали в проекции
  const topPlane = `matrix(${s} 0 ${OX * s} ${-OY * s} ${x0} ${y0 - 90 * s})`;
  const hobX1 = drawerIdx * w + w * 0.1;
  const hobX2 = (drawerIdx + 1) * w - w * 0.1;
  const hobZ1 = 7;
  const hobZ2 = D - 12;
  const burnerR = Math.min(6, (hobX2 - hobX1) * 0.17, (hobZ2 - hobZ1) * 0.24);
  const sinkX = w / 2;
  const modules = Array.from({ length: n }, (_, i) => i);

  return (
    <g>
      {/* Фартук на стене */}
      <Face points={frontQuad(P, 0, L, 90, 150, D)} fill="var(--apron)" />

      {/* Навесные шкафы */}
      <Block P={P} x1={0} x2={L} y1={150} y2={H} z1={zU} z2={D} color={mat.color} overlays={overlays} />
      {modules.slice(1).map((i) => (
        <Seg key={`u${i}`} a={P(i * w, 150, zU)} b={P(i * w, H, zU)} />
      ))}
      {modules.map((i) => (
        <g key={`uh${i}`}>{handle(i * w + w / 2, 154.5, w, zU)}</g>
      ))}

      {/* Цоколь и нижние шкафы */}
      <Block P={P} x1={0} x2={L} y1={0} y2={10} z1={5} z2={D} color={shade(mat.color, -0.4)} top={false} />
      <Block P={P} x1={0} x2={L} y1={10} y2={86} z1={0} z2={D} color={mat.color} overlays={overlays} top={false} />
      {modules.slice(1).map((i) => (
        <Seg key={`b${i}`} a={P(i * w, 10, 0)} b={P(i * w, 86, 0)} />
      ))}
      {modules.map((i) =>
        i === drawerIdx ? (
          <g key={`bd${i}`}>
            <Seg a={P(i * w, 40, 0)} b={P((i + 1) * w, 40, 0)} />
            <Seg a={P(i * w, 68, 0)} b={P((i + 1) * w, 68, 0)} />
            {handle(i * w + w / 2, 80.5, w, 0)}
            {handle(i * w + w / 2, 63, w, 0)}
            {handle(i * w + w / 2, 35, w, 0)}
          </g>
        ) : (
          <g key={`bd${i}`}>{handle(i * w + w / 2, 80.5, w, 0)}</g>
        )
      )}

      {/* Столешница со свесом 2 см */}
      <Block P={P} x1={0} x2={L} y1={86} y2={90} z1={-2} z2={D} color={counter} />

      {/* Мойка и варочная панель в плоскости столешницы */}
      <g transform={topPlane}>
        <rect x={w * 0.17} y={7} width={w * 0.66} height={Math.max(8, D - 21)} rx={4} fill="#B9BDC1" vectorEffect="non-scaling-stroke" />
        <rect x={w * 0.17 + 2.5} y={9.5} width={w * 0.66 - 5} height={Math.max(3, D - 26)} rx={3} fill="#8F959B" stroke="none" />
        <rect x={hobX1} y={hobZ1} width={hobX2 - hobX1} height={hobZ2 - hobZ1} rx={2} fill="#202326" vectorEffect="non-scaling-stroke" />
        {[0.3, 0.7].flatMap((fx) =>
          [0.3, 0.72].map((fz) => (
            <circle
              key={`${fx}-${fz}`}
              cx={hobX1 + (hobX2 - hobX1) * fx}
              cy={hobZ1 + (hobZ2 - hobZ1) * fz}
              r={burnerR}
              fill="none"
              stroke="#71777D"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          ))
        )}
      </g>
      <path
        d={`M${toPoints([P(sinkX, 90, D - 6)])} L${toPoints([P(sinkX, 113, D - 6)])} Q${toPoints([P(sinkX, 117, D - 12)])} ${toPoints([P(sinkX, 108, D - 18)])}`}
        fill="none"
        style={{ stroke: "#9AA0A6" }}
        strokeWidth={Math.max(2, 2.4 * s)}
        strokeLinecap="round"
      />
    </g>
  );
}

function WardrobeFigure({ P, L, H, D, mat, level, overlays }) {
  const k = unitCount("wardrobe", L);
  const dw = L / k;
  const doors = Array.from({ length: k }, (_, i) => i);
  const profile = level.profile;

  return (
    <g>
      <Block P={P} x1={0} x2={L} y1={0} y2={8} z1={3} z2={D} color={shade(mat.color, -0.4)} top={false} />
      <Block P={P} x1={0} x2={L} y1={8} y2={H} z1={0} z2={D} color={mat.color} />
      {doors.map((i) => (
        <g key={i}>
          <Face points={frontQuad(P, i * dw, (i + 1) * dw, 11, H - 6, 0)} fill={mat.color} overlays={overlays} />
          {i % 2 === 1 && (
            <polygon points={toPoints(frontQuad(P, i * dw, (i + 1) * dw, 11, H - 6, 0))} style={{ fill: "rgba(0,0,0,0.1)", stroke: "none" }} />
          )}
        </g>
      ))}
      {/* Направляющие и вертикальные профили */}
      <Face points={frontQuad(P, 0, L, H - 6, H, 0)} fill={profile} />
      <Face points={frontQuad(P, 0, L, 8, 11, 0)} fill={profile} />
      <Face points={frontQuad(P, 0, 2.5, 11, H - 6, 0)} fill={profile} />
      <Face points={frontQuad(P, L - 2.5, L, 11, H - 6, 0)} fill={profile} />
      {doors.slice(1).map((i) => (
        <Face key={`p${i}`} points={frontQuad(P, i * dw - 1.5, i * dw + 1.5, 11, H - 6, 0)} fill={profile} />
      ))}
    </g>
  );
}

function Tick({ x, y }) {
  return <line x1={r1(x - 4.5)} y1={r1(y + 4.5)} x2={r1(x + 4.5)} y2={r1(y - 4.5)} strokeWidth={1.6} />;
}

function DimLabel({ x, y, children }) {
  return (
    <text
      x={r1(x)}
      y={r1(y)}
      textAnchor="middle"
      dominantBaseline="central"
      className="dim-label"
      style={{
        fill: "var(--dim)",
        stroke: "var(--paper)",
        strokeWidth: 7,
        strokeLinejoin: "round",
        paintOrder: "stroke",
        fontFamily: '"Onest", system-ui, sans-serif',
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </text>
  );
}

function Dimensions({ P, type, L, H, D, intro }) {
  const draw = intro ? "intro-draw" : undefined;
  const fade = intro ? "intro-label" : undefined;
  const cm = (v) => `${Math.round(v)} см`;

  // Длина — под мебелью
  const a = P(0, 0, 0);
  const b = P(L, 0, 0);
  const yL = a[1] + 38;

  // Высота — слева, в плоскости фасада верхней части
  const zH = type === "kitchen" ? D - Math.min(35, D - 8) : 0;
  const top = P(0, H, zH);
  const bot = P(0, 0, zH);
  const xH = a[0] - 42;

  // Глубина — по нижнему правому ребру, со сдвигом наружу
  const len = Math.hypot(OX, OY);
  const nx = OY / len;
  const ny = OX / len;
  const off = 32;
  const d0 = P(L, 0, 0);
  const d1 = P(L, 0, D);
  const q0 = [d0[0] + nx * off, d0[1] + ny * off];
  const q1 = [d1[0] + nx * off, d1[1] + ny * off];
  const ext = (p, from, to) => [
    [p[0] + nx * from, p[1] + ny * from],
    [p[0] + nx * to, p[1] + ny * to],
  ];
  const [e0a, e0b] = ext(d0, 6, off + 7);
  const [e1a, e1b] = ext(d1, 6, off + 7);

  return (
    <g fill="none" strokeLinecap="round" style={{ stroke: "var(--dim)" }}>
      <g className={draw}>
        <line x1={r1(a[0])} y1={r1(a[1] + 6)} x2={r1(a[0])} y2={r1(yL + 8)} strokeWidth={0.9} opacity={0.7} />
        <line x1={r1(b[0])} y1={r1(b[1] + 6)} x2={r1(b[0])} y2={r1(yL + 8)} strokeWidth={0.9} opacity={0.7} />
        <line x1={r1(a[0])} y1={r1(yL)} x2={r1(b[0])} y2={r1(yL)} strokeWidth={1.3} />
        <Tick x={a[0]} y={yL} />
        <Tick x={b[0]} y={yL} />
      </g>
      <g className={draw}>
        <line x1={r1(top[0] - 6)} y1={r1(top[1])} x2={r1(xH - 8)} y2={r1(top[1])} strokeWidth={0.9} opacity={0.7} />
        <line x1={r1(a[0] - 6)} y1={r1(bot[1])} x2={r1(xH - 8)} y2={r1(bot[1])} strokeWidth={0.9} opacity={0.7} />
        <line x1={r1(xH)} y1={r1(top[1])} x2={r1(xH)} y2={r1(bot[1])} strokeWidth={1.3} />
        <Tick x={xH} y={top[1]} />
        <Tick x={xH} y={bot[1]} />
      </g>
      <g className={draw}>
        <Seg a={e0a} b={e0b} />
        <Seg a={e1a} b={e1b} />
        <line x1={r1(q0[0])} y1={r1(q0[1])} x2={r1(q1[0])} y2={r1(q1[1])} strokeWidth={1.3} />
        <Tick x={q0[0]} y={q0[1]} />
        <Tick x={q1[0]} y={q1[1]} />
      </g>
      <g className={fade}>
        <DimLabel x={(a[0] + b[0]) / 2} y={yL}>{cm(L)}</DimLabel>
        <DimLabel x={xH} y={(top[1] + bot[1]) / 2}>{cm(H)}</DimLabel>
        <DimLabel x={(q0[0] + q1[0]) / 2} y={(q0[1] + q1[1]) / 2}>{cm(D)}</DimLabel>
      </g>
    </g>
  );
}

function drawingLabel(config) {
  const t = TYPES[config.type];
  const m = MATERIAL_BY_ID[config.material];
  const f = FITTING_LEVELS[config.fittings];
  const [l, h, d] = DIM_KEYS.map((k) => Math.round(config[k]));
  return `${t.label}, ${l} × ${h} × ${d} см, фасад «${m.name}», фурнитура ${f.label.toLowerCase()}`;
}

/**
 * fit=false — постоянный масштаб для типа мебели (конфигуратор),
 * fit=true — модель вписывается в рамку целиком (каталог, главный экран).
 */
function FurnitureDrawing({ config, fit = false, showDims = true, intro = false, label }) {
  const { type, length: L, height: H, depth: D } = config;
  const uid = `d${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const mat = MATERIAL_BY_ID[config.material];
  const level = FITTING_LEVELS[config.fittings];
  const pad = showDims ? PAD_DIMS : PAD_PLAIN;
  const availW = VB_W - pad.l - pad.r;
  const availH = VB_H - pad.t - pad.b;
  const foot = footprint(L, H, D);
  const fitScale = Math.min(availW / foot.w, availH / foot.h);

  let s;
  let floorH;
  if (fit) {
    s = fitScale;
    floorH = foot.h;
  } else {
    const d = TYPES[type].dims;
    s = Math.min(fixedScale(type, pad), fitScale);
    floorH = footprint(L, d.height.max, d.depth.max).h; // пол не прыгает при смене высоты
  }
  const x0 = pad.l + (availW - foot.w * s) / 2;
  const y0 = pad.t + (availH + floorH * s) / 2;
  const P = (x, y, z = 0) => [x0 + (x + z * OX) * s, y0 - (y + z * OY) * s];

  const lightFace = luminance(mat.color) > 0.6;
  const overlays =
    mat.finish === "wood" ? [`url(#${uid}g)`] : mat.finish === "gloss" ? [`url(#${uid}l)`, `url(#${uid}s)`] : [];
  const figureProps = { P, s, x0, y0, L, H, D, mat, level, overlays };

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={label || drawingLabel(config)} className="block h-auto w-full">
      <defs>
        <pattern id={`${uid}g`} patternUnits="userSpaceOnUse" width="13" height="80">
          <path d="M2 0V80" stroke={shade(mat.color, -0.35)} strokeOpacity="0.32" strokeWidth="1" />
          <path d="M6.5 0C7.4 20 5.6 46 6.6 80" fill="none" stroke={shade(mat.color, -0.3)} strokeOpacity="0.18" strokeWidth="1.4" />
          <path d="M10.4 0V80" stroke={shade(mat.color, 0.25)} strokeOpacity="0.28" strokeWidth="0.8" />
        </pattern>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="0.38" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity={lightFace ? 0.07 : 0.15} />
        </linearGradient>
        <pattern id={`${uid}s`} patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="rotate(-38)">
          <rect x="0" y="0" width="8" height="80" fill={lightFace ? "#000000" : "#FFFFFF"} fillOpacity={lightFace ? 0.035 : 0.14} />
          <rect x="14" y="0" width="2" height="80" fill={lightFace ? "#000000" : "#FFFFFF"} fillOpacity={lightFace ? 0.03 : 0.12} />
        </pattern>
      </defs>

      <g className={intro ? "intro-rise" : undefined} strokeLinejoin="round" style={{ stroke: "var(--edge)", strokeWidth: 0.9 }}>
        {type === "kitchen" ? <KitchenFigure {...figureProps} /> : <WardrobeFigure {...figureProps} />}
      </g>

      {showDims && <Dimensions P={P} type={type} L={L} H={H} D={D} intro={intro} />}
    </svg>
  );
}

/* ───────────────────────── Общие элементы ───────────────────────── */

const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900 transition-colors hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-600 dark:hover:bg-stone-800";

function LogoMark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#E2CBA2" />
      {[7, 12, 17, 22, 27].map((y, i) => (
        <rect key={y} x="1" y={y - 0.9} width="30" height={i % 2 ? 1.2 : 1.8} fill="#8A6A40" opacity={i % 2 ? 0.55 : 0.9} />
      ))}
      <rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="#8A6A40" strokeWidth="1.5" />
    </svg>
  );
}

function SectionTitle({ id, title, lead }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="font-display text-balance text-3xl font-semibold sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-4 text-pretty text-lg text-stone-600 dark:text-stone-400">{lead}</p>}
    </div>
  );
}

/* ───────────────────────── Шапка ───────────────────────── */

const NAV = [
  { id: "catalog", label: "Каталог" },
  { id: "configurator", label: "Конфигуратор" },
  { id: "contacts", label: "Контакты" },
];

function Header() {
  const go = (id) => (e) => {
    e.preventDefault();
    scrollToId(id);
  };
  return (
    <header
      className="sticky top-0 z-50 h-16 border-b border-stone-200 bg-stone-100/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <div className={`${container} flex h-full items-center gap-6`}>
        <a href="#top" onClick={go("top")} className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label={`${COMPANY.name} — наверх`}>
          <LogoMark />
          <span className="font-display text-xl font-semibold">{COMPANY.name}</span>
          <span className="hidden text-sm text-stone-500 sm:inline dark:text-stone-400">{COMPANY.tagline}</span>
        </a>
        <nav aria-label="Разделы" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={go(n.id)}
                  className="rounded-lg px-3 py-2 text-[15px] font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#configurator" onClick={go("configurator")} className={`${btnPrimary} ml-auto h-10 px-4 text-sm md:ml-0`}>
          <span className="hidden sm:inline">Рассчитать стоимость</span>
          <span className="sm:hidden">Рассчитать</span>
        </a>
      </div>
    </header>
  );
}

/* ───────────────────────── Главный экран ───────────────────────── */

const ADVANTAGES = [
  { icon: Timer, title: "От 14 дней", text: "от замера до установки" },
  { icon: ShieldCheck, title: "Гарантия 3 года", text: "на корпус и фурнитуру" },
  { icon: Ruler, title: "Любой размер", text: "шаг 1 см, без доплат за нестандарт" },
];

function Hero() {
  const total = useMemo(() => calcPrice(HERO_SAMPLE).total, []);
  return (
    <section id="top" aria-labelledby="hero-title" className="scroll-mt-20">
      <div className={`${container} grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20`}>
        <div className="lg:col-span-6">
          <h1 id="hero-title" className="font-display text-balance text-4xl font-semibold leading-[1.1] lg:text-5xl">
            Кухни и шкафы под ваши размеры
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-stone-600 dark:text-stone-400">
            Проектируем, изготавливаем и устанавливаем в Астане. Задайте размеры в конфигураторе — цену увидите сразу, без
            звонков и ожидания.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => scrollToId("configurator")} className={`${btnPrimary} h-14 w-full px-7 text-base sm:w-auto`}>
              Собрать свою мебель
              <ArrowDown className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scrollToId("catalog")} className={`${btnSecondary} h-14 w-full px-7 text-base sm:w-auto`}>
              Смотреть каталог
            </button>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {ADVANTAGES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 sm:flex-col sm:gap-2">
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <figure className="overflow-hidden rounded-3xl border border-stone-200 bg-white lg:col-span-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="grid-paper">
            <FurnitureDrawing config={HERO_SAMPLE} fit intro />
          </div>
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-stone-200 px-5 py-4 dark:border-stone-800">
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Пример: кухня 320 × 230 × 60 см, тёмный графит, премиум-фурнитура
            </span>
            <span className="font-semibold tabular-nums">{formatMoney(total)}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ───────────────────────── Каталог ───────────────────────── */

function Catalog({ onPick }) {
  return (
    <section id="catalog" aria-labelledby="catalog-title" className="scroll-mt-20 py-14 sm:py-20">
      <div className={container}>
        <SectionTitle
          id="catalog-title"
          title="Готовые проекты"
          lead="С этих моделей обычно начинают. Любую можно открыть в конфигураторе и подогнать под свою кухню или нишу."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATALOG.map((item) => {
            const c = item.config;
            const m = MATERIAL_BY_ID[c.material];
            const total = calcPrice(c).total;
            return (
              <li key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                <div className="grid-paper border-b border-stone-200 dark:border-stone-800">
                  <FurnitureDrawing config={c} fit showDims={false} label={`Эскиз: ${item.name}, ${drawingLabel(c)}`} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {item.badge && (
                    <span className="mb-2 self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {item.badge}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{item.description}</p>
                  <p className="mt-3 text-sm tabular-nums text-stone-500 dark:text-stone-400">
                    {c.length} × {c.height} × {c.depth} см, {m.name.toLowerCase()}
                  </p>
                  <p className="mt-auto pt-4 text-lg font-semibold tabular-nums">от {formatMoney(total)}</p>
                  <button
                    type="button"
                    onClick={() => onPick(item)}
                    className={`${btnSecondary} mt-3 h-12 w-full text-[15px]`}
                    aria-label={`Настроить под себя: ${item.name}`}
                  >
                    Настроить под себя
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────── Конфигуратор ───────────────────────── */

function Step({ n, title, aside, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-900 text-sm font-semibold text-white dark:bg-stone-100 dark:text-stone-900"
          aria-hidden="true"
        >
          {n}
        </span>
        <h3 id={id} className="text-lg font-semibold">
          <span className="sr-only">Шаг {n}. </span>
          {title}
        </h3>
        {aside && <span className="ml-auto text-right text-sm tabular-nums text-stone-500 dark:text-stone-400">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function TypeSwitch({ value, onChange }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">Тип мебели</legend>
      <div className="relative grid h-14 grid-cols-2 rounded-2xl bg-stone-100 p-1 dark:bg-stone-800">
        <span
          aria-hidden="true"
          className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-xl bg-white ring-1 ring-stone-200 transition-transform duration-300 ease-out dark:bg-stone-700 dark:ring-stone-600 ${
            value === "wardrobe" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        {Object.values(TYPES).map((t) => {
          const Icon = t.icon;
          return (
            <label key={t.id} className="relative z-10 cursor-pointer">
              <input type="radio" name={name} value={t.id} checked={value === t.id} onChange={() => onChange(t.id)} className="peer sr-only" />
              <span className="flex h-full items-center justify-center gap-2 rounded-xl font-semibold text-stone-500 transition-colors peer-checked:text-stone-900 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-blue-600 dark:text-stone-400 dark:peer-checked:text-white dark:peer-focus-visible:outline-blue-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {t.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function DimensionControl({ dimKey, spec, value, onChange }) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const label = DIM_LABELS[dimKey];

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commit = () => {
    const n = parseInt(text, 10);
    const v = Number.isNaN(n) ? value : clamp(n, spec.min, spec.max);
    onChange(v);
    setText(String(v));
  };

  const handleText = (e) => {
    const t = e.target.value.replace(/\D/g, "").slice(0, 3);
    setText(t);
    const n = parseInt(t, 10);
    if (!Number.isNaN(n) && n >= spec.min && n <= spec.max) onChange(n);
  };

  const percent = ((value - spec.min) / (spec.max - spec.min)) * 100;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <label htmlFor={`${id}-range`} className="font-semibold">
            {label}
          </label>
          <p id={`${id}-hint`} className="text-sm text-stone-500 dark:text-stone-400">
            {spec.hint}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id={`${id}-num`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            autoComplete="off"
            value={text}
            aria-label={`${label}, точное значение в сантиметрах, от ${spec.min} до ${spec.max}`}
            onChange={handleText}
            onFocus={(e) => {
              setFocused(true);
              const el = e.target;
              requestAnimationFrame(() => el.select());
            }}
            onBlur={() => {
              setFocused(false);
              commit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
                e.currentTarget.select();
              }
            }}
            className="h-11 w-[4.5rem] rounded-xl border border-stone-300 bg-white text-center text-base font-semibold tabular-nums text-stone-900 transition-colors hover:border-stone-400 focus:border-blue-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-blue-400"
          />
          <span className="text-sm text-stone-500 dark:text-stone-400">см</span>
        </div>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={spec.min}
        max={spec.max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={`${id}-hint`}
        aria-valuetext={`${value} ${plural(value, ["сантиметр", "сантиметра", "сантиметров"])}`}
        className="range mt-1"
        style={{ "--p": `${percent}%` }}
      />
      <div className="flex justify-between text-xs tabular-nums text-stone-500 dark:text-stone-400" aria-hidden="true">
        <span>{spec.min}</span>
        <span>{spec.max}</span>
      </div>
    </div>
  );
}

function MaterialPicker({ value, onChange }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">Цвет фасада</legend>
      <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-6">
        {MATERIALS.map((m) => {
          const selected = m.id === value;
          return (
            <label key={m.id} className="flex min-w-0 cursor-pointer flex-col items-center gap-2 text-center">
              <input type="radio" name={name} value={m.id} checked={selected} onChange={() => onChange(m.id)} className="peer sr-only" />
              <span
                className={`grid h-14 w-14 place-items-center rounded-full ring-offset-2 ring-offset-white transition-shadow peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[6px] peer-focus-visible:outline-blue-600 dark:ring-offset-stone-900 dark:peer-focus-visible:outline-blue-400 ${
                  selected ? "ring-2 ring-blue-600 dark:ring-blue-400" : "ring-1 ring-black/10 hover:ring-black/25 dark:ring-white/15 dark:hover:ring-white/30"
                }`}
                style={{ background: swatchBackground(m) }}
              >
                {selected && (
                  <Check
                    className="check-pop h-6 w-6"
                    strokeWidth={3}
                    style={{ color: luminance(m.color) > 0.3 ? "#1C1917" : "#FFFFFF" }}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={`text-[13px] leading-tight ${
                  selected ? "font-semibold text-stone-900 dark:text-stone-100" : "text-stone-600 dark:text-stone-400"
                }`}
              >
                {m.name}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FittingsPicker({ type, value, onChange }) {
  const name = useId();
  const t = TYPES[type];
  return (
    <fieldset>
      <legend className="sr-only">Фурнитура</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.values(FITTING_LEVELS).map((f) => {
          const selected = f.id === value;
          const info = f[type];
          return (
            <label key={f.id} className="flex cursor-pointer">
              <input type="radio" name={name} value={f.id} checked={selected} onChange={() => onChange(f.id)} className="peer sr-only" />
              <span
                className={`flex w-full flex-col rounded-2xl border p-4 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 dark:peer-focus-visible:outline-blue-400 ${
                  selected
                    ? "border-blue-600 ring-1 ring-blue-600 dark:border-blue-400 dark:ring-blue-400"
                    : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{f.label}</span>
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                      selected ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500" : "border-stone-300 dark:border-stone-600"
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <Check className="check-pop h-3.5 w-3.5" strokeWidth={3.5} />}
                  </span>
                </span>
                <span className="mt-2 text-sm text-stone-600 dark:text-stone-400">{info.desc}</span>
                <span className="mt-auto pt-3 text-sm font-semibold tabular-nums">
                  {formatMoney(info.price)} {t.unitPer}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function DrawingCard({ config, total }) {
  const t = TYPES[config.type];
  const m = MATERIAL_BY_ID[config.material];
  const f = FITTING_LEVELS[config.fittings];
  const length = useTweened(config.length, 380, config.type);
  const height = useTweened(config.height, 380, config.type);
  const depth = useTweened(config.depth, 380, config.type);
  const shownTotal = useTweened(total, 520);

  return (
    <figure className="overflow-hidden rounded-3xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3 dark:border-stone-800">
        <span className="font-semibold">{t.view}</span>
        <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold tabular-nums text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          ≈ {formatMoney(roundTo(shownTotal))}
        </span>
      </div>
      <div className="grid-paper overflow-hidden">
        <div key={config.type} className="anim-swap">
          <FurnitureDrawing config={{ ...config, length, height, depth }} label={drawingLabel(config)} />
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone-200 px-5 py-3 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400">
        <span className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
          {config.length} × {config.height} × {config.depth} см
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/20" style={{ background: swatchBackground(m) }} aria-hidden="true" />
          {m.name}
        </span>
        <span>Фурнитура: {f.label.toLowerCase()}</span>
      </figcaption>
    </figure>
  );
}

function PriceCard({ config, price }) {
  const { total } = price;
  const shown = useTweened(total, 520);
  const { settled, delta } = useSettledDelta(total);
  const [open, setOpen] = useState(false);
  const t = TYPES[config.type];
  const m = MATERIAL_BY_ID[config.material];
  const f = FITTING_LEVELS[config.fittings];

  const rows = [
    {
      label: "Корпус",
      detail: `${formatDecimal(price.area)} м² × ${groupDigits(t.caseRate)} ₸, коэф. глубины ${formatDecimal(price.depthCoef, 2, true)}`,
      value: price.body,
    },
    { label: `Фасады: ${m.name.toLowerCase()}`, detail: `${formatDecimal(price.area)} м² × ${groupDigits(m.rate)} ₸`, value: price.facades },
    {
      label: `Фурнитура: ${f.label.toLowerCase()}`,
      detail: `${price.units} ${plural(price.units, t.unitForms)} × ${groupDigits(price.unitPrice)} ₸`,
      value: price.hardware,
    },
    ...(config.type === "kitchen"
      ? [{ label: "Столешница", detail: `${formatDecimal(config.length / 100)} пог. м × ${groupDigits(t.countertopRate)} ₸`, value: price.countertop }]
      : []),
    {
      label: "Доставка и монтаж",
      detail: price.installIsMin ? `минимальная стоимость` : `${Math.round(INSTALL.rate * 100)} % от суммы`,
      value: price.install,
    },
  ];

  return (
    <section
      id="price"
      aria-labelledby="price-title"
      className="scroll-mt-20 rounded-3xl bg-stone-900 p-5 text-white sm:p-7 dark:ring-1 dark:ring-stone-700"
    >
      <div className="relative inline-flex items-center">
        <h3 id="price-title" className="text-[15px] font-medium text-stone-300">
          Примерная стоимость
        </h3>
        {delta && (
          <span className="pointer-events-none absolute bottom-0 left-full top-0 ml-3 flex items-center" aria-hidden="true">
            <span
              key={delta.key}
              className={`delta-badge whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ${
                delta.value > 0 ? "bg-white/10 text-stone-100" : "bg-emerald-300/15 text-emerald-300"
              }`}
            >
              {delta.value > 0 ? "+" : "−"}
              {formatMoney(Math.abs(delta.value))}
            </span>
          </span>
        )}
      </div>
      <p className="font-display mt-2 whitespace-nowrap text-[clamp(1.75rem,9.5vw,2.25rem)] font-semibold leading-tight tabular-nums sm:text-5xl lg:text-4xl xl:text-5xl" aria-hidden="true">
        {formatMoney(roundTo(shown))}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Примерная стоимость: {groupDigits(settled, " ")} тенге
      </p>
      <p className="mt-2 text-sm text-stone-400">Точную цену назовём после бесплатного замера.</p>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="price-breakdown"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-semibold text-blue-300 transition-colors hover:text-blue-200"
      >
        Из чего складывается цена
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div
        id="price-breakdown"
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <dl className="mt-2 space-y-3 border-t border-white/10 pt-4 text-sm">
            {rows.map((r) => (
              <div key={r.label} className="flex items-start justify-between gap-4">
                <dt>
                  <span className="text-stone-100">{r.label}</span>
                  <span className="block text-xs tabular-nums text-stone-400">{r.detail}</span>
                </dt>
                <dd className="whitespace-nowrap font-semibold tabular-nums text-stone-100">{formatMoney(r.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 border-t border-white/10 pt-3 text-xs text-stone-400">Итог округлён до 1 000 ₸.</p>
        </div>
      </div>

      <div id="order" className="mt-6 scroll-mt-20 border-t border-white/10 pt-6">
        <LeadForm config={config} total={total} />
      </div>
    </section>
  );
}

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border bg-stone-800 px-4 text-base text-white placeholder:text-stone-500 transition-colors focus:border-blue-400";

function LeadForm({ config, total }) {
  const id = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const doneRef = useRef(null);

  const message = buildMessage({ config, total, name: name.trim(), phone });
  const href = waLink(message);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!isValidName(name)) next.name = "Укажите имя — хотя бы две буквы.";
    if (!isValidPhone(phone)) next.phone = "Введите номер полностью: +7 и ещё 10 цифр.";
    setErrors(next);
    if (next.name) {
      nameRef.current?.focus();
      return;
    }
    if (next.phone) {
      phoneRef.current?.focus();
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
    setDone(true);
  };

  const edit = () => {
    setDone(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  if (done) {
    return (
      <div role="status" ref={doneRef} tabIndex={-1} className="anim-success rounded-xl outline-none">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-300/15 text-emerald-300">
            <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          </span>
          <h4 className="text-lg font-semibold">Заявка готова</h4>
        </div>
        <p className="mt-3 text-sm text-stone-300">
          Мы открыли WhatsApp с вашим расчётом — осталось нажать «Отправить». Если чат не открылся, воспользуйтесь кнопкой ниже.
        </p>
        <div className="mt-4 whitespace-pre-line rounded-2xl rounded-br-md bg-stone-800 p-4 text-sm leading-relaxed text-stone-100">
          {message}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <a href={href} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} h-12 flex-1 px-5`}>
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Открыть WhatsApp
          </a>
          <button
            type="button"
            onClick={edit}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-600 px-5 font-semibold text-stone-100 transition-colors hover:border-stone-400 hover:bg-white/5"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Изменить данные
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-title`}>
      <h4 id={`${id}-title`} className="text-lg font-semibold">
        Оставить заявку
      </h4>
      <p className="mt-1 text-sm text-stone-400">
        Откроется WhatsApp с готовым сообщением: размеры, фасад, фурнитура и цена уже будут в тексте.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-medium text-stone-200">
            Ваше имя
          </label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            type="text"
            autoComplete="given-name"
            maxLength={40}
            placeholder="Айгерим"
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              if (errors.name && isValidName(v)) setErrors((er) => ({ ...er, name: undefined }));
            }}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            className={`${fieldClass} ${errors.name ? "border-red-300" : "border-stone-700"}`}
          />
          {errors.name && (
            <p id={`${id}-name-error`} className="mt-1.5 text-sm text-red-300">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="text-sm font-medium text-stone-200">
            Номер WhatsApp
          </label>
          <input
            ref={phoneRef}
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (700) 000-00-00"
            value={phone}
            onFocus={() => {
              if (!phone) setPhone("+7 ");
            }}
            onBlur={() => {
              if (phone.replace(/\D/g, "").length <= 1) setPhone("");
            }}
            onChange={(e) => {
              const v = formatPhone(e.target.value);
              setPhone(v);
              if (errors.phone && isValidPhone(v)) setErrors((er) => ({ ...er, phone: undefined }));
            }}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
            className={`${fieldClass} tabular-nums ${errors.phone ? "border-red-300" : "border-stone-700"}`}
          />
          {errors.phone && (
            <p id={`${id}-phone-error`} className="mt-1.5 text-sm text-red-300">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <button type="submit" className={`${btnPrimary} mt-5 h-12 w-full text-base`}>
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Оставить заявку
      </button>
      <p className="mt-3 text-xs text-stone-400">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p>
    </form>
  );
}

function Configurator({ config, price, setType, update }) {
  const t = TYPES[config.type];
  const m = MATERIAL_BY_ID[config.material];
  return (
    <section id="configurator" aria-labelledby="configurator-title" className="scroll-mt-20 py-14 sm:py-20">
      <div className={container}>
        <SectionTitle
          id="configurator-title"
          title="Соберите свою мебель"
          lead="Выберите тип, задайте размеры и фасад. Чертёж и цена пересчитываются сразу, пока вы двигаете ползунки."
        />
        <div className="mt-10 grid items-start gap-4 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-7">
            <Step n={1} title="Тип мебели">
              <TypeSwitch value={config.type} onChange={setType} />
            </Step>
            <DrawingCard config={config} total={price.total} />
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Step n={2} title="Габариты" aside="в сантиметрах">
              <div key={config.type} className="anim-fade space-y-5">
                {DIM_KEYS.map((k) => (
                  <DimensionControl key={k} dimKey={k} spec={t.dims[k]} value={config[k]} onChange={(v) => update({ [k]: v })} />
                ))}
              </div>
            </Step>
            <Step n={3} title="Фасад" aside={`${groupDigits(m.rate)} ₸ за м²`}>
              <MaterialPicker value={config.material} onChange={(material) => update({ material })} />
            </Step>
            <Step n={4} title="Фурнитура" aside={`${price.units} ${plural(price.units, t.unitForms)}`}>
              <FittingsPicker type={config.type} value={config.fittings} onChange={(fittings) => update({ fittings })} />
            </Step>
            <PriceCard config={config} price={price} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Контакты и подвал ───────────────────────── */

function Contacts() {
  const tel = `tel:+${COMPANY.phone.replace(/\D/g, "")}`;
  const items = [
    { icon: Phone, label: "Телефон", value: COMPANY.phone, href: tel },
    { icon: MapPin, label: "Шоурум", value: COMPANY.address },
    { icon: Clock, label: "Часы работы", value: COMPANY.hours },
  ];
  return (
    <footer id="contacts" className="scroll-mt-20 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className={`${container} grid gap-10 py-14 sm:py-20 lg:grid-cols-12`}>
        <div className="lg:col-span-7">
          <h2 className="font-display text-balance text-3xl font-semibold sm:text-4xl">Замер — бесплатно</h2>
          <p className="mt-4 max-w-xl text-pretty text-lg text-stone-600 dark:text-stone-400">
            Замерщик приедет с образцами фасадов, проверит стены и углы и уточнит проект на месте.
          </p>
          <a
            href={waLink("Здравствуйте! Хочу записаться на бесплатный замер.")}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnPrimary} mt-8 h-14 w-full px-7 text-base sm:w-auto`}
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Записаться на замер
          </a>
        </div>
        <ul className="space-y-6 lg:col-span-5">
          {items.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-blue-700 dark:bg-stone-800 dark:text-blue-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
                {href ? (
                  <a href={href} className="text-lg font-semibold tabular-nums text-blue-700 hover:underline dark:text-blue-400">
                    {value}
                  </a>
                ) : (
                  <p className="text-lg font-semibold">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-stone-200 dark:border-stone-800">
        <div
          className={`${container} flex flex-col gap-2 py-6 text-sm text-stone-500 sm:flex-row sm:justify-between dark:text-stone-400`}
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <p>
            © {new Date().getFullYear()} {COMPANY.name}, {COMPANY.tagline}
          </p>
          <p>Цены в конфигураторе ориентировочные и не являются офертой.</p>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── Плавающая панель цены ───────────────────────── */

function MobilePriceBar({ total }) {
  const visible = useMobilePriceBar();
  const shown = useTweened(total, 520);
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 backdrop-blur-md transition-[transform,visibility] duration-300 ease-out lg:hidden dark:border-stone-800 dark:bg-stone-900/90 ${
        visible ? "visible translate-y-0" : "pointer-events-none invisible translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={`${container} flex items-center justify-between gap-3 py-3`}>
        <div className="min-w-0">
          <p className="text-xs text-stone-500 dark:text-stone-400">Примерная цена</p>
          <p className="font-display whitespace-nowrap text-lg font-semibold tabular-nums">{formatMoney(roundTo(shown))}</p>
        </div>
        <button type="button" tabIndex={visible ? 0 : -1} onClick={() => scrollToId("price")} className={`${btnPrimary} h-12 shrink-0 px-5`}>
          Оставить заявку
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Приложение ───────────────────────── */

export default function App() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const price = useMemo(() => calcPrice(config), [config]);

  const update = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const setType = (type) => setConfig((c) => (c.type === type ? c : { ...c, type, ...defaultDims(type) }));
  const applyPreset = (item) => {
    setConfig({ ...item.config });
    scrollToId("configurator");
  };

  return (
    <div className="agash font-body min-h-screen overflow-x-clip bg-stone-100 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
      <style>{STYLES}</style>
      <Header />
      <main>
        <Hero />
        <Catalog onPick={applyPreset} />
        <Configurator config={config} price={price} setType={setType} update={update} />
      </main>
      <Contacts />
      <MobilePriceBar total={price.total} />
    </div>
  );
}
