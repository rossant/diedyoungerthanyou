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
app.innerHTML = `<section class="hero" id="top"><header class="site-head"><a class="brand" href="#top">DIED YOUNGER<br> THAN YOU</a><button class="shuffle" type="button" aria-label="Shuffle the people shown">Shuffle</button></header><div class="hero-copy"><p class="kicker">SAME TIME. DIFFERENT LIVES.</p><h1>How old<br> are you?</h1></div><div class="age-control"><label class="sr-only" for="age-number">Your age</label><input id="age-number" class="age-number" type="number" min="8" max="100" inputmode="numeric" autocomplete="off"><input id="age-range" class="age-range" type="range" min="8" max="100" step="1" aria-label="Your age slider"><div class="range-labels" aria-hidden="true"><span>8</span><span>100</span></div></div><button class="explore" type="button">Explore <span aria-hidden="true">→</span></button><p class="hero-note">Discover remarkable people who didn't live as long as you.</p><div class="horizon" aria-hidden="true"></div></section><section class="timeline-wrap" id="timeline" aria-labelledby="timeline-title"><header class="timeline-head"><div><h2 id="timeline-title">Remarkable lives, arranged by age.</h2><p>Start near your age, then travel backward.</p></div><button class="shuffle" type="button" aria-label="Shuffle the people shown">Shuffle</button></header><p class="sensitivity"><strong>A gentle note:</strong> this is a reflection on time and possibility, not a ranking of lives. Some entries involve illness, violence, or loss.</p><label class="beyond-toggle"><input id="beyond-toggle" type="checkbox"> Also show lives beyond my age</label><p class="sr-only" id="timeline-status" aria-live="polite"></p><div class="timeline" id="timeline-list"></div><aside class="about"><h2>About this timeline</h2><p>Birth and death dates come from the linked sources. Ages are calculated from exact dates, and the selection is a seeded shuffle designed to keep the journey varied. It is a snapshot, not a complete measure of a life.</p></aside></section>`;
const ageNumber = document.querySelector<HTMLInputElement>("#age-number")!,
  ageRange = document.querySelector<HTMLInputElement>("#age-range")!,
  timeline = document.querySelector<HTMLElement>("#timeline-list")!,
  status = document.querySelector<HTMLElement>("#timeline-status")!,
  beyondToggle = document.querySelector<HTMLInputElement>("#beyond-toggle")!;
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
document.querySelectorAll<HTMLButtonElement>(".shuffle").forEach((b) =>
  b.addEventListener("click", () => {
    seed = randomSeed();
    updateUrl();
    render();
  }),
);
beyondToggle.addEventListener("change", () => {
  showBeyond = beyondToggle.checked;
  updateUrl();
  render();
});
function previewTypedAge() {
  if (!ageNumber.value.trim()) return;
  const value = Number(ageNumber.value);
  if (!Number.isFinite(value)) return;
  age = clamp(Math.round(value), MIN_AGE, MAX_AGE);
  ageRange.value = String(age);
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
  updateRangeProgress();
}
function updateRangeProgress() {
  ageRange.style.setProperty(
    "--progress",
    `${((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`,
  );
}
function render() {
  timeline.replaceChildren();
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
  article.append(dates);
  const summary = document.createElement("p");
  summary.textContent = person.summary;
  article.append(summary);
  const source = document.createElement("a");
  source.className = "source";
  source.href = person.source;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.textContent = "Source ↗";
  source.setAttribute("aria-label", `Wikipedia source for ${person.name}`);
  article.append(source);
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
