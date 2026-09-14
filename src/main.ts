import "./style.css";
import { categoryLabel, people, type Person } from "./data";
import {
  clamp,
  MAX_AGE,
  MIN_AGE,
  parseAge,
  parseSeed,
  randomSeed,
  selectPeople,
} from "./selection";

const JOURNEY_SIZE = 16;
const params = new URLSearchParams(location.search);
let age = parseAge(params.get("age"));
let seed = parseSeed(params.get("seed"), randomSeed());
let showBeyond = params.get("beyond") === "1";
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `
  ${siteHeader("global-nav")}
  <section class="hero" id="top">
    <div class="hero-stage">
      <div class="hero-copy">
        <span class="kicker-rule" aria-hidden="true"></span>
        <p class="kicker">SAME SKY.<br>DIFFERENT TIMELINES.</p>
        <h1>How old<br> are you?</h1>
        <p class="hero-promise">Discover famous people who died younger than you—and what they achieved in the time they had.</p>
      </div>
      <div class="age-control">
        <label class="sr-only" for="age-number">Your age</label>
        <div class="age-entry"><input id="age-number" class="age-number" type="number" min="${MIN_AGE}" max="${MAX_AGE}" inputmode="numeric" autocomplete="off"></div>
        <input id="age-range" class="age-range" type="range" min="${MIN_AGE}" max="${MAX_AGE}" step="1" aria-label="Your age slider">
        <div class="range-labels" aria-hidden="true"><span>${MIN_AGE}</span><span>${MAX_AGE}</span></div>
      </div>
      <button class="explore" type="button">See who died younger than you <span aria-hidden="true">⟶</span></button>
    </div>
  </section>
  <section class="timeline-wrap" id="timeline" aria-labelledby="timeline-title">
    <header class="timeline-head">
      <h2 id="timeline-title">People who died before age <span id="timeline-age"></span></h2>
      <p>Different lives. A wider perspective.</p>
    </header>
    <p class="sr-only" id="timeline-status" aria-live="polite"></p>
    <div class="timeline" id="timeline-list"></div>
    <aside class="about" id="about">
      <span class="about-rule" aria-hidden="true"></span>
      <h2>Different lives.<br>A wider perspective.</h2>
      <p><strong>A gentle note:</strong> this is a reflection on time and possibility, not a ranking of lives. Some entries involve illness, violence, or loss.</p>
      <p>Birth and death dates come from the linked sources. Ages are calculated from exact dates, and the seeded selection is designed to keep the journey varied.</p>
    </aside>
  </section>
  <div class="menu-backdrop" hidden></div>
  <nav class="site-menu" id="site-menu" aria-label="Site menu" hidden>
    <button class="menu-close" type="button" aria-label="Close menu">×</button>
    <p class="menu-eyebrow">DIED YOUNGER THAN YOU</p>
    <a href="#top">Change your age</a>
    <button class="menu-shuffle" type="button">Shuffle the people shown</button>
    <label class="beyond-toggle"><input id="beyond-toggle" type="checkbox"> Show lives beyond my age</label>
    <a href="#about">About this timeline</a>
  </nav>`;

function siteHeader(extraClass = "") {
  return `<header class="site-head ${extraClass}"><a class="brand" href="#top">DIED YOUNGER<br> THAN YOU</a><button class="menu-toggle" type="button" aria-label="Open menu" aria-controls="site-menu" aria-expanded="false"><span></span><span></span><span></span></button></header>`;
}

const ageNumber = document.querySelector<HTMLInputElement>("#age-number")!,
  ageRange = document.querySelector<HTMLInputElement>("#age-range")!,
  timeline = document.querySelector<HTMLElement>("#timeline-list")!,
  timelineAge = document.querySelector<HTMLElement>("#timeline-age")!,
  status = document.querySelector<HTMLElement>("#timeline-status")!,
  beyondToggle = document.querySelector<HTMLInputElement>("#beyond-toggle")!,
  siteMenu = document.querySelector<HTMLElement>("#site-menu")!,
  menuBackdrop = document.querySelector<HTMLElement>(".menu-backdrop")!,
  globalNav = document.querySelector<HTMLElement>(".global-nav")!;
let lastMenuTrigger: HTMLButtonElement | null = null;
syncAgeControls();
updateUrl();
render();
ageNumber.addEventListener("input", previewTypedAge);
ageNumber.addEventListener("change", commitTypedAge);
ageNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") explore();
});
ageRange.addEventListener("input", () => {
  age = Number(ageRange.value);
  ageNumber.value = String(age);
  updateRangeProgress();
});
ageRange.addEventListener("change", commitRangeAge);
document
  .querySelector<HTMLButtonElement>(".explore")!
  .addEventListener("click", explore);
document
  .querySelector<HTMLButtonElement>(".menu-shuffle")!
  .addEventListener("click", () => {
    seed = randomSeed();
    updateUrl();
    render();
    closeMenu();
  });
beyondToggle.addEventListener("change", () => {
  showBeyond = beyondToggle.checked;
  updateUrl();
  render();
});
document
  .querySelectorAll<HTMLButtonElement>(".menu-toggle")
  .forEach((button) =>
    button.addEventListener("click", () => openMenu(button)),
  );
document
  .querySelector<HTMLButtonElement>(".menu-close")!
  .addEventListener("click", closeMenu);
menuBackdrop.addEventListener("click", closeMenu);
siteMenu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    closeMenu();
  }),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !siteMenu.hidden) closeMenu();
  if (event.key === "Tab" && !siteMenu.hidden) containMenuFocus(event);
});
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

function updateHeader() {
  globalNav.classList.toggle("is-scrolled", scrollY > innerHeight * 0.72);
}

function openMenu(trigger: HTMLButtonElement) {
  lastMenuTrigger = trigger;
  siteMenu.hidden = false;
  menuBackdrop.hidden = false;
  document.body.classList.add("menu-open");
  document
    .querySelectorAll<HTMLButtonElement>(".menu-toggle")
    .forEach((button) => button.setAttribute("aria-expanded", "true"));
  document.querySelector<HTMLButtonElement>(".menu-close")!.focus();
}

function closeMenu() {
  const wasOpen = !siteMenu.hidden;
  siteMenu.hidden = true;
  menuBackdrop.hidden = true;
  document.body.classList.remove("menu-open");
  document
    .querySelectorAll<HTMLButtonElement>(".menu-toggle")
    .forEach((button) => button.setAttribute("aria-expanded", "false"));
  if (wasOpen) lastMenuTrigger?.focus();
}

function containMenuFocus(event: KeyboardEvent) {
  const focusable = [
    ...siteMenu.querySelectorAll<HTMLElement>("a,button,input"),
  ];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
function previewTypedAge() {
  if (!ageNumber.value.trim()) return;
  const value = Number(ageNumber.value);
  if (!Number.isFinite(value)) return;
  age = clamp(Math.round(value), MIN_AGE, MAX_AGE);
  ageRange.value = String(age);
  updateAgeDigits();
  updateRangeProgress();
}
function commitTypedAge() {
  const value = Number(ageNumber.value);
  age = clamp(
    Number.isFinite(value) && ageNumber.value.trim() ? Math.round(value) : age,
    MIN_AGE,
    MAX_AGE,
  );
  syncAgeControls();
  updateUrl();
  render();
}
function commitRangeAge() {
  age = clamp(Number(ageRange.value), MIN_AGE, MAX_AGE);
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
  beyondToggle.checked = showBeyond;
  updateAgeDigits();
  updateRangeProgress();
}
function updateAgeDigits() {
  ageNumber.style.setProperty("--age-digits", String(ageNumber.value.length));
}
function updateRangeProgress() {
  ageRange.style.setProperty(
    "--progress",
    `${((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`,
  );
}
function render() {
  timeline.replaceChildren();
  timelineAge.textContent = String(age);
  const younger = selectPeople(
    people.filter((p) => p.deathAge < age),
    seed,
    age,
    JOURNEY_SIZE,
  );
  timeline.append(userMarker());
  if (younger.length) {
    younger
      .sort((a, b) => b.deathAge - a.deathAge)
      .forEach((p) => timeline.append(ageBlock(p, false)));
  } else {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = `This collection has no entries below age ${age}. You can choose an older age or show lives beyond it.`;
    timeline.append(empty);
  }
  if (showBeyond) {
    const beyond = selectPeople(
      people.filter((p) => p.deathAge >= age),
      seed,
      age,
      5,
    );
    if (beyond.length) {
      const h = document.createElement("h3");
      h.className = "beyond-heading";
      h.textContent = "Beyond your age";
      timeline.append(h);
      beyond
        .sort((a, b) => a.deathAge - b.deathAge)
        .forEach((p) => timeline.append(ageBlock(p, true)));
    }
  }
  status.textContent = `${younger.length} lives shown before age ${age}${showBeyond ? ", with lives beyond your age below" : ""}.`;
  requestAnimationFrame(() =>
    timeline
      .querySelectorAll<HTMLElement>(".age-block,.user-marker")
      .forEach((el) => el.classList.add("is-visible")),
  );
}
function ageBlock(person: Person, beyond: boolean) {
  const section = document.createElement("section");
  section.className = `age-block${beyond ? " age-block--beyond" : ""}`;
  section.setAttribute("aria-labelledby", `age-${person.id}`);
  const rail = document.createElement("div");
  rail.className = "age-rail";
  const dot = document.createElement("span");
  dot.className = "rail-dot";
  rail.append(dot);
  section.append(rail);
  const content = document.createElement("div");
  content.className = "age-content";
  const heading = document.createElement("h3");
  heading.className = "chapter-age";
  heading.id = `age-${person.id}`;
  heading.textContent = String(person.deathAge);
  content.append(heading, personCard(person));
  section.append(content);
  return section;
}
function personCard(person: Person) {
  const article = document.createElement("article");
  article.className = "person";
  const name = document.createElement("h4");
  name.textContent = person.name;
  article.append(name);
  const meta = document.createElement("div");
  meta.className = "meta";
  const country = document.createElement("span");
  country.className = "country";
  country.textContent = person.nationality;
  const category = document.createElement("span");
  category.className = `category category--${person.category}`;
  const icon = document.createElement("i");
  icon.setAttribute("aria-hidden", "true");
  category.append(
    icon,
    document.createTextNode(categoryLabel[person.category]),
  );
  meta.append(country, category);
  article.append(meta);
  const dates = document.createElement("p");
  dates.className = "dates";
  dates.textContent = `${person.born.slice(0, 4)}–${person.died.slice(0, 4)}`;
  const summary = document.createElement("p");
  summary.textContent = person.summary;
  const source = document.createElement("a");
  source.className = "source";
  source.href = person.source;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.textContent = "Source ↗";
  source.setAttribute("aria-label", `Wikipedia source for ${person.name}`);
  const utility = document.createElement("div");
  utility.className = "person-utility";
  utility.append(dates, source);
  article.append(summary, utility);
  return article;
}
function userMarker() {
  const section = document.createElement("section");
  section.className = "user-marker";
  const rail = document.createElement("div");
  rail.className = "age-rail";
  const dot = document.createElement("span");
  dot.className = "rail-dot rail-dot--you";
  rail.append(dot);
  section.append(rail);
  const content = document.createElement("div");
  content.className = "user-content";
  const heading = document.createElement("h3");
  heading.className = "chapter-age chapter-age--you";
  heading.textContent = String(age);
  content.append(heading);
  const copy = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = "YOU ARE HERE";
  const text = document.createElement("p");
  text.className = "sr-only";
  text.textContent =
    "The younger lives in this journey ended before the age you are now.";
  copy.append(strong, text);
  content.append(copy);
  section.append(content);
  return section;
}
function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("age", String(age));
  url.searchParams.set("seed", String(seed));
  if (showBeyond) url.searchParams.set("beyond", "1");
  else url.searchParams.delete("beyond");
  history.replaceState(null, "", url);
}
