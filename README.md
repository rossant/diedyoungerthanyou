# Died Younger Than You

A mobile-first interactive timeline showing remarkable people by the age at which they died, centered on the visitor's own age.

The site is intentionally small: Vite + TypeScript + plain HTML/CSS, with no framework, no runtime API and no image-heavy UI.

## Development

```bash
npm ci
npm run dev
```

## Validation and build

```bash
npm run validate
npm run validate:sources
npm test
npm run check
npm run build
```

`npm ci` uses the committed lockfile for reproducible installs. The test suite covers date-at-death edge cases and verifies that every curated record's derived age matches its source dates.

`npm run validate:sources` optionally checks all curated Wikipedia links against the live MediaWiki API; it is kept out of CI to avoid an external availability dependency.

`npm run check` runs formatting, linting, tests, data validation, TypeScript, and the production build—the same gate used for pull requests.

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
