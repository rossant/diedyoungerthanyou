# Dataset curation

The dataset is curated, not exhaustive. The goal is an interesting human journey through age, not a ranking of fame.

## Include

A person should have a durable, independently recognizable contribution in at least one displayed category. Prefer people for whom a concise sentence can say what they actually accomplished.

Mix canonical figures with less obvious discoveries. Maintain meaningful representation across gender, geography, era and field rather than allowing music, film or the English-speaking world to dominate the experience.

## Record

Each row contains an ID, name, birth and death dates, a short nationality label, one primary display category, an editorial gender grouping for selection balancing, one concise significance sentence, a traceable source slug, and an editorial popularity tier. The popularity tier is one of `iconic`, `well-known`, or `discovery`; it supports a recognizable but varied journey rather than claiming an objective ranking of fame. The schema accepts `woman`, `man`, `nonbinary`, and `unknown`; these are editorial classifications, not a claim that gender is binary or that an identity has been inferred. Use `unknown` when reliable information is unavailable, and never fabricate identities to meet a quota.

For a full 16-person journey, selection targets eight `iconic`, five `well-known`, and three `discovery` entries. Sparse younger-age pools adapt that mix so a small tier cannot force the same names into every result. Shuffle searches deterministic seeds for at most 35% overlap with the current journey when the eligible pool makes that mathematically possible.

Age at death is computed from dates. Do not enter age manually.

The browser loader and `npm run validate` share date, age, category, gender, required-field and Wikipedia-slug rules in `src/data-schema.js`. The validator also prints coverage metrics for categories, nationality labels (a deliberately rough geography proxy), birth eras, and age bands.

Run `npm run validate:sources` during editorial review to check every Wikipedia slug against the live MediaWiki API. It is intentionally not part of CI because publication should not depend on an external service being available.

Summary length has an editorial target of 40–180 characters and is reported as a warning rather than a hard gate, so a particularly useful sentence can be reviewed manually. The same principle applies to coverage metrics: they are monitoring signals, not fabricated quotas. Keep all ten categories represented, and use the metrics to notice concentration across fields, labels, eras and age bands during curation.

Use nationality as compact historical context, not as a strict claim about modern citizenship. Multiple labels are acceptable when a single label would be misleading.

## Editorial tone

State accomplishments concretely. Avoid inspirational clichés, rankings, moral judgments and language that romanticizes an early death. The point is what a person did in the time they had.

A person's appearance in the dataset is not an endorsement of their politics, conduct or historical legacy.

## Before public launch

Every record should receive a source-by-source factual check for dates, nationality wording and the significance sentence. Ambiguous historical dates should eventually be represented explicitly as approximate rather than silently converted to exact dates.
