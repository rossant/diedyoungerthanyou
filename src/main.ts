import "./style.css";
import { categoryLabel, people, type Person } from "./data";

const MIN_AGE = 8;
const MAX_AGE = 100;
const MAX_PER_AGE = 3;
const params = new URLSearchParams(location.search);
let age = clamp(Number(params.get("age")) || 41, MIN_AGE, MAX_AGE);
let seed = Number(params.get("seed")) || Math.floor(Math.random() * 2_147_483_647);

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `
<section class="hero" id="top">
  <header class="site-head"><a class="brand" href="#top">DIED YOUNGER<br>THAN YOU</a><button class="shuffle" type="button">Shuffle</button></header>
  <div class="hero-copy"><p class="kicker">SAME TIME. DIFFERENT LIVES.</p><h1>How old<br>are you?</h1></div>
  <div class="age-control">
    <input id="age-number" class="age-number" type="number" min="8" max="100" inputmode="numeric" autocomplete="off" aria-label="Your age">
    <input id="age-range" class="age-range" type="range" min="8" max="100" step="1" aria-label="Your age slider">
    <div class="range-labels" aria-hidden="true"><span>8</span><span>100</span></div>
  </div>
  <button class="explore" type="button">Explore <span aria-hidden="true">→</span></button>
  <p class="hero-note">Discover remarkable people who didn't live as long as you.</p>
  <div class="horizon" aria-hidden="true"></div>
</section>
<section class="timeline-wrap" id="timeline" aria-label="Remarkable lives arranged by age"><header class="timeline-head"><p>Remarkable lives, arranged by age.</p><button class="shuffle" type="button">Shuffle</button></header><div class="timeline" id="timeline-list"></div></section>`;

const ageNumber = document.querySelector<HTMLInputElement>("#age-number")!;
const ageRange = document.querySelector<HTMLInputElement>("#age-range")!;
const timeline = document.querySelector<HTMLElement>("#timeline-list")!;

syncAgeControls();
render();

ageNumber.addEventListener("input", previewTypedAge);
ageNumber.addEventListener("change", commitTypedAge);
ageNumber.addEventListener("keydown", (event) => {
  if (event.key === "Enter") explore();
});
ageRange.addEventListener("input", () => {
  age = Number(ageRange.value);
  ageNumber.value = String(age);
  updateRangeProgress();
});
ageRange.addEventListener("change", () => {
  age = Number(ageRange.value);
  syncAgeControls();
  updateUrl();
  render();
});
document.querySelector<HTMLButtonElement>(".explore")!.addEventListener("click", explore);
document.querySelectorAll<HTMLButtonElement>(".shuffle").forEach((button) => button.addEventListener("click", () => {
  seed = Math.floor(Math.random() * 2_147_483_647);
  updateUrl();
  render();
}));

function previewTypedAge() {
  if (ageNumber.value.trim() === "") return;
  const value = Number(ageNumber.value);
  if (!Number.isFinite(value)) return;
  age = clamp(Math.round(value), MIN_AGE, MAX_AGE);
  ageRange.value = String(age);
  updateRangeProgress();
}

function commitTypedAge() {
  const value = Number(ageNumber.value);
  age = clamp(Number.isFinite(value) && ageNumber.value.trim() !== "" ? Math.round(value) : age, MIN_AGE, MAX_AGE);
  syncAgeControls();
  updateUrl();
  render();
}

function explore() {
  commitTypedAge();
  document.querySelector("#timeline")?.scrollIntoView({ behavior: "smooth" });
}

function syncAgeControls() {
  ageNumber.value = String(age);
  ageRange.value = String(age);
  updateRangeProgress();
}

function updateRangeProgress() {
  ageRange.style.setProperty("--progress", `${((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`);
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
    if (!inserted && deathAge >= age) {
      html.push(userMarker());
      inserted = true;
    }
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
  return `<article class="person"><h3>${person.name}</h3><div class="meta"><span class="country">${person.nationality}</span><span class="category category--${person.category}"><i></i>${categoryLabel[person.category]}</span></div><p>${person.summary}</p></article>`;
}

function userMarker() {
  return `<section class="user-marker"><div class="age-rail"><span class="rail-dot rail-dot--you"></span></div><div class="user-content"><div class="chapter-age chapter-age--you">${age}</div><div><strong>YOU ARE HERE</strong><p>You have already lived longer than every life above this line.</p></div></div></section>`;
}

function selectPeople() {
  const byAge = new Map<number, Person[]>();
  for (const person of people) {
    const group = byAge.get(person.deathAge) ?? [];
    group.push(person);
    byAge.set(person.deathAge, group);
  }

  const chosen: Person[] = [];
  const genderCount = { woman: 0, man: 0 };
  const recentCategories: string[] = [];
  const recentNationalities: string[] = [];

  for (const deathAge of [...byAge.keys()].sort((a, b) => a - b)) {
    const pool = [...byAge.get(deathAge)!];
    const atThisAge: Person[] = [];
    for (let slot = 0; slot < Math.min(MAX_PER_AGE, pool.length); slot++) {
      let best = pool[0];
      let bestScore = -Infinity;
      for (const candidate of pool) {
        const rng = mulberry32(hash(`${seed}:${deathAge}:${slot}:${candidate.id}`));
        let score = rng();
        if (candidate.featured) score += 0.22;

        const total = genderCount.woman + genderCount.man;
        const womanShare = total ? genderCount.woman / total : 0.5;
        if (candidate.gender === "woman" && womanShare < 0.42) score += 0.25;
        if (candidate.gender === "man" && womanShare > 0.58) score += 0.12;

        score -= recentCategories.filter((value) => value === candidate.category).length * 0.16;
        score -= atThisAge.filter((person) => person.category === candidate.category).length * 0.32;
        score -= recentNationalities.filter((value) => value === candidate.nationality).length * 0.06;

        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      }

      chosen.push(best);
      atThisAge.push(best);
      genderCount[best.gender]++;
      recentCategories.push(best.category);
      recentNationalities.push(best.nationality);
      if (recentCategories.length > 8) recentCategories.shift();
      if (recentNationalities.length > 8) recentNationalities.shift();
      pool.splice(pool.indexOf(best), 1);
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

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function hash(value: string) {
  let h = 2166136261;
  for (const c of value) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
