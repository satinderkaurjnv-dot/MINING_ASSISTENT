import {
  openai,
  MODEL,
} from "./openai";

import type {
  FetchedSource,
} from "./source-fetcher";

/*
==================================================
EXTRACTED DATA TYPE
==================================================
*/

export type ExtractedData = {
  source: string;

  url: string;

  domain: string;

  title: string;

  sourceType:
    | "official_company"
    | "government"
    | "regulator"
    | "exchange"
    | "news"
    | "financial"
    | "commodity"
    | "mining_publication"
    | "other";

  information: string;

  informationDate: string | null;

  publicationDate: string | null;

  reportingPeriod: string | null;

  confidence:
    | "high"
    | "medium"
    | "low";
};

/*
==================================================
SOURCE TYPE
==================================================
*/

const SOURCE_TYPES = [
  "official_company",
  "government",
  "regulator",
  "exchange",
  "news",
  "financial",
  "commodity",
  "mining_publication",
  "other",
] as const;

/*
==================================================
CONFIDENCE
==================================================
*/

const CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
] as const;

/*
==================================================
EXTRACT DATA FROM SOURCES
==================================================
*/

export async function extractSourceData(
  question: string,
  sources: FetchedSource[]
): Promise<ExtractedData[]> {

  /*
  --------------------------------------------------
  ONLY SUCCESSFUL SOURCES
  --------------------------------------------------
  */

  const usableSources =
    sources.filter(
      (source) =>
        source.status === "success" &&
        source.text.trim().length > 0
    );

  if (
    usableSources.length === 0
  ) {
    console.log(
      "SOURCE EXTRACTION: No usable sources"
    );

    return [];
  }

  /*
  --------------------------------------------------
  LIMIT SOURCE CONTENT
  --------------------------------------------------
  */

  const sourceText =
    usableSources
      .map(
        (source, index) => `
==================================================
SOURCE ${index + 1}
==================================================

SOURCE NAME:
${source.name}

EXACT FETCHED URL:
${source.url}

DOMAIN:
${source.domain}

SOURCE TYPE:
${source.type}

FETCHED AT:
${source.fetchedAt}

SOURCE CONTENT:
${source.text}
`
      )
      .join("\n");

  /*
  --------------------------------------------------
  SYSTEM INSTRUCTIONS
  --------------------------------------------------
  */

  const instructions = `
You are the source extraction engine for
Mining Discovery AI.

Your job is ONLY to extract factual information
from the supplied source content.

==================================================
ABSOLUTE RULES
==================================================

Use ONLY the supplied source content.

DO NOT browse the web.

DO NOT use external knowledge.

DO NOT use your training knowledge to fill gaps.

DO NOT guess.

DO NOT invent facts.

DO NOT invent dates.

DO NOT invent URLs.

DO NOT invent page titles.

DO NOT combine unrelated sources into one fact.

If a fact is not supported by the supplied source,
DO NOT return it.

==================================================
USER QUESTION
==================================================

${question}

==================================================
SOURCE URL RULE
==================================================

The "url" field MUST correspond to one of the
EXACT FETCHED URL values supplied below.

Never create a URL.

Never modify a URL.

Never replace a specific page URL with a homepage.

For example:

If supplied URL is:

https://example.com/news/botswana-copper-expansion

return:

https://example.com/news/botswana-copper-expansion

NOT:

https://example.com

==================================================
TITLE RULE
==================================================

Return the exact page title if it is explicitly
available in the supplied source.

Do not create a title.

Do not shorten a title.

If the title cannot be determined:

"title": ""

==================================================
RELEVANCE RULE
==================================================

Only return sources that actually contain
information relevant to the user's question.

Do not return unrelated sources.

==================================================
LATEST / CURRENT QUESTIONS
==================================================

If the user asks:

latest
current
today
now
recent
most recent

select only the newest relevant information
that is actually supported by the supplied sources.

Do not assume that the newest-looking source
is automatically current.

Use the dates present in the source.



==================================================
LATEST GUIDANCE DATE LOGIC
==================================================

For production guidance questions, determine
whether the reporting period has already ended.

If the current date is after the end of the
guidance period, do NOT present that completed
period's guidance as the "latest guidance".

For example:

If the question is asked in August 2026 and
FY2026 ended on June 30, 2026:

FY2026 guidance is historical.

If FY2027 guidance is available in the supplied
sources, use FY2027 guidance instead.

Always prefer the newest FUTURE or CURRENT
guidance period when the user asks for "latest"
guidance.

Do not confuse:

- actual production
- historical guidance
- current guidance
- future guidance

For production guidance, the answer must identify
the financial year or reporting period.

Never return a historical guidance range as the
latest guidance when a newer guidance period is
available.


==================================================
DATES
==================================================

Carefully distinguish:

informationDate

publicationDate

reportingPeriod

Example:

Publication date:
2026-08-13

Reporting period:
Q2 2026

Then:

publicationDate = "2026-08-13"

reportingPeriod = "Q2 2026"

Do NOT set informationDate to the publication
date unless the information itself applies
to that date.

If the exact information date is unavailable:

informationDate = null

If the publication date is unavailable:

publicationDate = null

If there is no reporting period:

reportingPeriod = null

==================================================
MINING NEWS
==================================================

For mining news extract:

- what happened
- company/project involved
- location
- commodity if explicitly stated
- production information if explicitly stated
- investment/capital expenditure if explicitly stated
- announcement date
- relevant reporting period
- exact source URL

Do not add information that is not in the source.

==================================================
WEB SEARCH RESEARCH
==================================================

Some supplied source content may come from the
live web-search research layer.

Treat that research as supplied source material.

Extract facts ONLY when the supplied research
explicitly supports them.

Do not use your own knowledge.

Do not infer missing numbers.

For production guidance questions, preserve:

- exact production figure
- commodity
- unit
- financial year
- reporting period
- publication date
- guidance wording

If the exact production guidance is not explicitly
supported by the supplied material, return no
source rather than guessing.

==================================================
COMPANY QUESTIONS
==================================================

If the question concerns a mining company,
prefer official company information when supplied.

Do not replace one company with another.

Do not combine two companies into one result.

==================================================
PROJECT QUESTIONS
==================================================

Do not substitute another mining project.

For example:

Khoemacau

must not be replaced with:

Motheo

unless the source itself discusses both.
==================================================
COMMODITY QUESTIONS
==================================================

Distinguish carefully between:

- spot price
- official/benchmark price
- futures
- ETF
- company stock
- CFD

==================================================
GOLD
==================================================

When the user asks:

"latest gold price"
"gold price"
"current gold price"
"gold price today"

return the GOLD SPOT PRICE.

Use the supplied Gold Spot source.

Never treat:

GLD

as:

gold spot price.

Never treat a mining company's share price
as:

gold price.

==================================================
COPPER
==================================================

When the user asks:

"latest copper price"
"copper price"
"current copper price"
"copper price today"

return the current COPPER SPOT PRICE if the
supplied source explicitly provides a spot price.

If spot price is not available but the supplied
source provides an explicitly identified official
or benchmark copper price, return that price and
describe it using the exact terminology of the
source.

For copper, prefer the LME Copper Official Price
when it is supplied.

The LME Official Price is the benchmark price
for copper.

Do NOT automatically return:

- copper futures
- copper futures contract
- copper options
- copper ETF
- mining company stock
- copper CFD

Do NOT describe a CFD as a copper spot price.

Do NOT describe futures as a copper spot price.

Do NOT describe an LME 3-month price as spot.

If the source explicitly identifies the price as:

"futures"

describe it as futures.

If the source explicitly identifies the price as:

"CFD"

describe it as CFD.

If the source explicitly identifies the price as:

"benchmark"

describe it as benchmark.

If the source explicitly identifies the price as:

"Official Price"

describe it as the official/benchmark price.

If the source does not clearly identify the type
of copper price, do not guess.

==================================================
SOURCE PRIORITY
==================================================

For commodity prices, prefer the most appropriate
dedicated commodity source supplied to you.

For gold:

Kitco Gold Spot

For copper:

LME Copper Official Price

Do not use another source merely because it is
easier to access if doing so changes the meaning
of the requested price.

==================================================
PRICE ACCURACY
==================================================

Never invent a commodity price.

Never convert a price into another unit unless
the conversion is explicitly requested or can be
performed reliably from supplied data.

Preserve the source's:

- price
- currency
- unit
- price type
- timestamp/date

When the user asks for the "latest" or "current"
price, use the newest relevant price supported by
the supplied source.

Do not combine different commodity sources into
one price.

If the supplied sources disagree, do not average
them or create a new value.

Return the price from the preferred source and
identify the source and timestamp when available.
==================================================


==================================================
RANKING QUESTIONS
==================================================

If the question asks for a ranking:

Only use rankings explicitly supported by
the supplied sources.

Do not create a ranking yourself.

Do not convert a global ranking into a
country-specific ranking.

Do not guess company nationality.

Do not substitute:

revenue

for:

market capitalization.

Do not substitute:

production

for:

market capitalization.

==================================================
SOURCE TYPE
==================================================

Use exactly one of:

official_company
government
regulator
exchange
news
financial
commodity
mining_publication
other

==================================================
CONFIDENCE
==================================================

high:

The source directly and clearly supports
the information.

medium:

The source supports the information but
some details are incomplete.

low:

The source is indirect or weak.

==================================================
OUTPUT
==================================================

Return ONLY JSON.

The JSON must have this structure:

{
  "sources": [
    {
      "source": "",
      "url": "",
      "domain": "",
      "title": "",
      "sourceType": "other",
      "information": "",
      "informationDate": null,
      "publicationDate": null,
      "reportingPeriod": null,
      "confidence": "low"
    }
  ]
}

If no supplied source contains useful information:

{
  "sources": []
}
`;

  /*
  --------------------------------------------------
  OPENAI EXTRACTION
  --------------------------------------------------
  */

  try {

    console.log(
      "=========================================="
    );

    console.log(
      "OPENAI SOURCE EXTRACTION"
    );

    console.log(
      "QUESTION:",
      question
    );

    console.log(
      "SOURCES:",
      usableSources.length
    );

    const response =
      await openai.responses.create({
        model: MODEL,

        instructions,

        input: `
USER QUESTION:
${question}

==================================================
SUPPLIED SOURCES
==================================================

${sourceText}
`,

        text: {
          format: {
            type: "json_schema",

            name: "mining_source_extraction",

            strict: true,

            schema: {
              type: "object",

              additionalProperties: false,

              properties: {
                sources: {
                  type: "array",

                  items: {
                    type: "object",

                    additionalProperties: false,

                    properties: {
                      source: {
                        type: "string",
                      },

                      url: {
                        type: "string",
                      },

                      domain: {
                        type: "string",
                      },

                      title: {
                        type: "string",
                      },

                      sourceType: {
                        type: "string",

                        enum: [
                          "official_company",
                          "government",
                          "regulator",
                          "exchange",
                          "news",
                          "financial",
                          "commodity",
                          "mining_publication",
                          "other",
                        ],
                      },

                      information: {
                        type: "string",
                      },

                      informationDate: {
                        type: [
                          "string",
                          "null",
                        ],
                      },

                      publicationDate: {
                        type: [
                          "string",
                          "null",
                        ],
                      },

                      reportingPeriod: {
                        type: [
                          "string",
                          "null",
                        ],
                      },

                      confidence: {
                        type: "string",

                        enum: [
                          "high",
                          "medium",
                          "low",
                        ],
                      },
                    },

                    required: [
                      "source",
                      "url",
                      "domain",
                      "title",
                      "sourceType",
                      "information",
                      "informationDate",
                      "publicationDate",
                      "reportingPeriod",
                      "confidence",
                    ],
                  },
                },
              },

              required: [
                "sources",
              ],
            },
          },
        },
      });

    /*
    --------------------------------------------------
    RAW RESPONSE
    --------------------------------------------------
    */

    const raw =
      response.output_text?.trim() || "";

    if (!raw) {

      console.error(
        "SOURCE EXTRACTION RETURNED EMPTY RESPONSE"
      );

      return [];
    }

    console.log(
      "OPENAI EXTRACTION COMPLETED"
    );

    /*
    --------------------------------------------------
    PARSE JSON
    --------------------------------------------------
    */

    let parsed: unknown;

    try {

      parsed =
        JSON.parse(raw);

    } catch (error) {

      console.error(
        "SOURCE EXTRACTION JSON PARSE ERROR:",
        error
      );

      console.error(
        "RAW RESPONSE:",
        raw
      );

      return [];
    }

    /*
    --------------------------------------------------
    CHECK STRUCTURE
    --------------------------------------------------
    */

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(
        (parsed as {
          sources?: unknown;
        }).sources
      )
    ) {

      console.error(
        "SOURCE EXTRACTION INVALID FORMAT"
      );

      return [];
    }

    const rawSources =
      (
        parsed as {
          sources: unknown[];
        }
      ).sources;

    /*
    --------------------------------------------------
    NORMALIZE
    --------------------------------------------------
    */

    const extracted =
      rawSources
        .filter(
          (
            source
          ): source is Record<
            string,
            unknown
          > =>
            Boolean(source) &&
            typeof source ===
              "object"
        )
        .map(
          (
            source
          ): ExtractedData => {

            return {
              source:
                typeof source.source ===
                  "string"
                  ? source.source
                  : "",

              url:
                typeof source.url ===
                  "string"
                  ? source.url
                  : "",

              domain:
                typeof source.domain ===
                  "string"
                  ? source.domain
                  : "",

              title:
                typeof source.title ===
                  "string"
                  ? source.title
                  : "",

              sourceType:
                isValidSourceType(
                  source.sourceType
                )
                  ? source.sourceType
                  : "other",

              information:
                typeof source.information ===
                  "string"
                  ? source.information
                  : "",

              informationDate:
                typeof source.informationDate ===
                  "string"
                  ? source.informationDate
                  : null,

              publicationDate:
                typeof source.publicationDate ===
                  "string"
                  ? source.publicationDate
                  : null,

              reportingPeriod:
                typeof source.reportingPeriod ===
                  "string"
                  ? source.reportingPeriod
                  : null,

              confidence:
                isValidConfidence(
                  source.confidence
                )
                  ? source.confidence
                  : "low",
            };
          }
        );

    /*
    --------------------------------------------------
    PROTECT EXACT SOURCE URL
    --------------------------------------------------
    */

    const normalized =
      extracted
        .map(
          (item) => {

            /*
            ------------------------------------------------
            FIRST: EXACT URL MATCH
            ------------------------------------------------
            */

            let matchingSource =
              usableSources.find(
                (source) =>
                  normalizeUrl(
                    source.url
                  ) ===
                  normalizeUrl(
                    item.url
                  )
              );

            /*
            ------------------------------------------------
            SECOND: DOMAIN MATCH
            ------------------------------------------------
            */

            if (
              !matchingSource &&
              item.domain
            ) {

              matchingSource =
                usableSources.find(
                  (source) =>
                    normalizeDomain(
                      source.domain
                    ) ===
                    normalizeDomain(
                      item.domain
                    )
                );
            }

            /*
            ------------------------------------------------
            THIRD: URL CONTAINS DOMAIN
            ------------------------------------------------
            */

            if (
              !matchingSource &&
              item.url
            ) {

              matchingSource =
                usableSources.find(
                  (source) =>
                    item.url.includes(
                      source.domain
                    )
                );
            }

            /*
            ------------------------------------------------
            RESTORE EXACT FETCHED URL
            ------------------------------------------------
            */

            if (
              matchingSource
            ) {

              /*
              Always use the actual fetched
              URL instead of trusting a URL
              generated by the model.
              */

              item.url =
                matchingSource.url;

              item.domain =
                matchingSource.domain;

              if (
                !item.source
              ) {
                item.source =
                  matchingSource.name;
              }

              if (
                !item.title &&
                "title" in
                  matchingSource
              ) {

                const sourceWithTitle =
                  matchingSource as
                    FetchedSource & {
                      title?: string;
                    };

                item.title =
                  sourceWithTitle.title ||
                  "";
              }
            }

            return item;
          }
        );

    /*
    --------------------------------------------------
    REMOVE EMPTY INFORMATION
    --------------------------------------------------
    */

    const finalResults =
      normalized.filter(
        (item) =>
          item.information
            .trim()
            .length > 0 &&
          item.url
            .trim()
            .length > 0
      );

   console.log(
  "EXTRACTED SOURCES:",
  finalResults.length
);

console.log(
  "EXTRACTED SOURCE DETAILS:"
);

console.log(
  finalResults.map(
    (item) => ({
      source: item.source,
      title: item.title,
      url: item.url,
      information: item.information,
      informationDate: item.informationDate,
      publicationDate: item.publicationDate,
      reportingPeriod: item.reportingPeriod,
      confidence: item.confidence,
    })
  )
);

return finalResults;

  } catch (error) {

    console.error(
      "SOURCE EXTRACTION FAILED:",
      error
    );

    return [];
  }
}

/*
==================================================
VALID SOURCE TYPE
==================================================
*/


function isValidSourceType(
  value: unknown
): value is ExtractedData["sourceType"] {
  return (
    typeof value === "string" &&
    SOURCE_TYPES.includes(
      value as (typeof SOURCE_TYPES)[number]
    )
  );
}

/*
==================================================
VALID CONFIDENCE
==================================================
*/

function isValidConfidence(
  value: unknown
): value is ExtractedData["confidence"] {
  return (
    typeof value === "string" &&
    CONFIDENCE_LEVELS.includes(
      value as (typeof CONFIDENCE_LEVELS)[number]
    )
  );
}

/*
==================================================
NORMALIZE URL
==================================================
*/

function normalizeUrl(
  value: string
): string {

  try {

    const url =
      new URL(value);

    return (
      url.origin +
      url.pathname
        .replace(/\/+$/, "") +
      url.search
    ).toLowerCase();

  } catch {

    return value
      .trim()
      .toLowerCase()
      .replace(
        /\/+$/,
        ""
      );
  }
}

/*
==================================================
NORMALIZE DOMAIN
==================================================
*/

function normalizeDomain(
  value: string
): string {

  return value
    .replace(
      /^www\./i,
      ""
    )
    .trim()
    .toLowerCase();
}

/*
==================================================
HOMEPAGE CHECK
==================================================
*/

function isHomepageUrl(
  url: string,
  domain: string
): boolean {

  if (!url) {
    return true;
  }

  try {

    const parsed =
      new URL(url);

    const hostname =
      parsed.hostname
        .replace(
          /^www\./i,
          ""
        )
        .toLowerCase();

    const cleanDomain =
      domain
        .replace(
          /^www\./i,
          ""
        )
        .toLowerCase();

    if (
      hostname !==
      cleanDomain
    ) {
      return false;
    }

    const path =
      parsed.pathname
        .replace(
          /\/+$/,
          ""
        );

    return path === "";

  } catch {

    return false;
  }
}