import "./style.css";
import { categoryLabel, people, type Person } from "./data";

const MIN_AGE = 8;
const MAX_AGE = 100;
const params = new URLSearchParams(location.search);
let age = clamp(Number(params.get("age")) || 41, MIN_AGE, MAX_AGE);
let seed = Number(params.get("seed")) || Math.floor(Math.random() * 2_147_483_647);

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `
<section class="hero" id="top">
  <header class="site-head"><a class="brand" href="#top">DIED YOUNGER<br>THAN YOU</a><button class="shuffle">Shuffle</button></header>
  <div class="hero-copy"><p class="kicker">SAME TIME. DIFFERENT LIVES.</p><h1>How old<br>are you?</h1></div>
  <div class="age-control">
    <input id="age-number" class="age-number" type="number" min="8" max="100" inputmode="numeric" aria-label="Your age">
    <input id="age-range" class="age-range" type="range" min="8" max="100" step="1" aria-label="Your age slider">
    <div class="range-labels"><span>8</span><span>100</span></div>
  </div>
  <button class="explore">Explore <span>→</span></button>
  <p class="hero-note">Discover remarkable people who didn't live as long as you.</p>
  <div class="horizon"></div>
</section>
<section class="timeline-wrap" id="timeline"><header class="timeline-head"><p>Remarkable lives, arranged by age.</p><button class="shuffle">Shuffle</button></header><div class="timeline" id="timeline-list"></div></section>`;

const ageNumber = document.querySelector<HTMLInputElement>("#age-number")!;
const ageRange = document.querySelector<HTMLInputElement>("#age-range")!;
const timeline = document.querySelector<HTMLElement>("#timeline-list")!;

setAge(age, false);
render();

ageNumber.addEventListener("input", () => setAge(Number(ageNumber.value), false));
ageNumber.addEventListener("change", () => setAge(Number(ageNumber.value), true));
ageRange.addEventListener("input", () => setAge(Number(ageRange.value), false));
ageRange.addEventListener("change", () => setAge(Number(ageRange.value), true));
document.querySelector<HTMLButtonElement>(".explore")!.addEventListener("click", () => {
  setAge(Number(ageNumber.value), true);
  document.querySelector("#timeline")?.scrollIntoView({ behavior: "smooth" });
});
document.querySelectorAll<HTMLButtonElement>(".shuffle").forEach((button) => button.addEventListener("click", () => {
  seed = Math.floor(Math.random() * 2_147_483_647);
  updateUrl();
  render();
}));

function setAge(value: number, commit: boolean) {
  age = clamp(Math.round(value || 41), MIN_AGE, MAX_AGE);
  ageNumber.value = String(age);
  ageRange.value = String(age);
  ageRange.style.setProperty("--progress", `${((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`);
  if (commit) { updateUrl(); render(); }
}

function render() {
  const grouped = new Map<number, Person[]>();
  for (const person of selectPeople()) {
    if (person.deathAge > Math.max(age + 28, 60)) continue;
    const group = grouped.get(person.deathAge) ?? [];
    group.push(person);
    grouped.set(person.deathAge, group);
  }

  let inserted = false;
  const html: string[] = [];
  for (const deathAge of [...grouped.keys()].sort((a, b) => a - b)) {
    if (!inserted && deathAge >= age) { html.push(userMarker()); inserted = true; }
    html.push(ageBlock(deathAge, grouped.get(deathAge)!, deathAge > age));
  }
  if (!inserted) html.push(userMarker());
  timeline.innerHTML = html.join("");
  requestAnimationFrame(() => timeline.querySelectorAll(".age-block,.user-marker").forEach((el) => el.classList.add("is-visible")));
}

function ageBlock(deathAge: number, entries: Person[], beyond: boolean) {
  return `<section class="age-block${beyond ? " age-block--beyond" : ""}"><div class="age-rail"><span class="rail-dot"></span></div><div class="age-content"><div class="chapter-age">${deathAge}</div><div class="people">${entries.map(personCard).join("")}</div></div></section>`;
}

function personCard(person: Person) {
  return `<article class="person"><h3>${person.name}</h3><div class="meta"><span class="country">${person.country}</span><span class="category category--${person.category}"><i></i>${categoryLabel[person.category]}</span></div><p>${person.summary}</p></article>`;
}

function userMarker() {
  return `<section class="user-marker"><div class="age-rail"><span class="rail-dot rail-dot--you"></span></div><div class="user-content"><div class="chapter-age chapter-age--you">${age}</div><div><strong>YOU ARE HERE</strong><p>You have already lived longer than every life above this line.</p></div></div></section>`;
}

function selectPeople() {
  const byAge = new Map<number, Person[]>();
  for (const person of people) { const group = byAge.get(person.deathAge) ?? []; group.push(person); byAge.set(person.deathAge, group); }
  const chosen: Person[] = [];
  for (const [deathAge, group] of byAge) {
    const rng = mulberry32(hash(`${seed}:${deathAge}`));
    const pool = [...group];
    for (let i = 0; i < Math.min(3, pool.length); i++) {
      const index = Math.floor(rng() * pool.length);
      chosen.push(pool.splice(index, 1)[0]);
    }
  }
  return chosen;
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("age", String(age));
  url.searchParams.set("seed", String(seed));
  history.replaceState(null, "", url);
}
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function hash(value: string) { let h = 2166136261; for (const c of value) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a: number) { return () => { a |= 0; a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
