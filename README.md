# Died Younger Than You

A mobile-first interactive timeline showing remarkable people by the age at which they died, centered on the visitor's own age.

The site is intentionally small: Vite + TypeScript + plain HTML/CSS, with no framework, no runtime API and no image-heavy UI.

## Development

```bash
npm install
npm run dev
```

## Validation and build

```bash
npm run validate
npm run build
```

The build validates the curated dataset before TypeScript and Vite run. It checks row shape, unique IDs, categories, dates, plausible ages and a minimum representation threshold.

Ages at death are derived from birth and death dates rather than entered manually.

## Data

The curated records live in four TSV files under `src/`. Each row contains:

```text
id | name | born | died | nationality | category | gender | summary | Wikipedia slug
```

The current dataset is deliberately editorial rather than exhaustive. Wikipedia links are retained as traceable references; factual/editorial review should happen before treating the dataset as publication-grade.

## Selection

A deterministic seed chooses up to three people for each age. Selection favors a mix of categories, nationalities and genders while keeping some canonical figures more likely to appear.

The URL stores `age` and `seed`, so the same selection can be revisited or shared.

## Deployment

`.github/workflows/pages.yml` builds and deploys with GitHub Pages. The repository's Pages source must be enabled for **GitHub Actions** in the repository settings before deployment can complete.
