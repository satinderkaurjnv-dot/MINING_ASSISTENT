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

  /*
  EXACT PAGE URL
  */
  url: string;

  /*
  DOMAIN
  */
  domain: string;

  /*
  EXACT PAGE TITLE
  */
  title: string;

  /*
  TYPE OF SOURCE
  */
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

  /*
  RELEVANT INFORMATION
  */
  information: string;

  /*
  DATE WHEN THE INFORMATION ACTUALLY APPLIES
  */
  informationDate: string | null;

  /*
  DATE THE PAGE / ANNOUNCEMENT WAS PUBLISHED
  */
  publicationDate: string | null;

  /*
  REPORTING PERIOD
  */
  reportingPeriod: string | null;

  /*
  EXTRACTION CONFIDENCE
  */
  confidence:
    | "high"
    | "medium"
    | "low";
};


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
  ONLY USE SUCCESSFULLY FETCHED SOURCES
  --------------------------------------------------
  */

  const usableSources =
    sources.filter(
      (source) =>
        source.status === "success" &&
        source.text.trim().length > 0
    );


  /*
  --------------------------------------------------
  NO USABLE SOURCES
  --------------------------------------------------
  */

  if (
    usableSources.length === 0
  ) {
    return [];
  }


  /*
  --------------------------------------------------
  BUILD SOURCE CONTENT
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

EXACT URL:
${source.url}

DOMAIN:
${source.domain}

SOURCE TYPE:
${source.type}

FETCHED AT:
${source.fetchedAt}

CONTENT:
${source.text}
`
      )
      .join("\n");


  /*
  --------------------------------------------------
  OPENAI EXTRACTION
  --------------------------------------------------
  */

  const response =
    await openai.responses.create({

      model: MODEL,

      instructions: `
You are the DATA EXTRACTION ENGINE
for Mining Discovery AI.

==================================================
CRITICAL RULE
==================================================

You are NOT allowed to perform web searches.

You MUST use ONLY the source content supplied
in this request.

Do NOT use your own knowledge.

Do NOT invent facts.

Do NOT invent dates.

Do NOT invent URLs.

Do NOT invent titles.

==================================================
EXACT SOURCE URL
==================================================

The "url" field MUST contain the EXACT URL
of the source page containing the information.

NEVER replace a specific page URL with a
company homepage.

For example:

WRONG:

https://www.riotinto.com/

when the actual source page is:

https://www.riotinto.com/en/news/releases/2026/...

CORRECT:

Use the exact URL supplied in the source:

${usableSources
  .map((source) => source.url)
  .join("\n")}

If the source content provides a specific page URL,
return that URL.

Never construct a URL yourself.

==================================================
EXACT PAGE TITLE
==================================================

The "title" field MUST contain the exact page
title when it is available in the supplied source.

For example:

"Rio Tinto welcomes agreement to secure
long-term future of Tomago Aluminium"

Do NOT create a shortened title.

Do NOT invent a title.

If the exact title cannot be determined,
return:

""

==================================================
USER QUESTION
==================================================

${question}

==================================================
SOURCE CONTENT
==================================================

${sourceText}

==================================================
TASK
==================================================

Extract ONLY information relevant to the exact
user question.

Do NOT invent information.

Do NOT use your own knowledge to fill gaps.

Do NOT substitute another company.

Do NOT substitute another project.

Do NOT substitute another commodity.

Do NOT substitute another asset.

==================================================
COMPANY QUESTIONS
==================================================

If the question concerns a mining company:

Prefer information from the company's official
source when available.

Examples:

Rio Tinto
BHP
Newmont
Barrick Mining
Vale
Anglo American
Glencore
Freeport-McMoRan

Return the exact official page URL when that
source contains the answer.

==================================================
ANNOUNCEMENT QUESTIONS
==================================================

For questions such as:

"latest announcement from Rio Tinto"

extract:

1. Exact announcement title
2. Exact announcement URL
3. Announcement date
4. Relevant announcement information
5. Source name
6. Source type

The URL must point to the actual announcement.

NOT the company homepage.

==================================================
COMMODITY PRICES
==================================================

For commodity prices distinguish between:

- spot price
- futures price
- benchmark price
- ETF
- mining company stock

Never confuse:

Gold price

with:

Gold ETF price

or:

Gold mining company stock price.

==================================================
DATES
==================================================

Carefully distinguish:

informationDate

publicationDate

reportingPeriod

For example:

A report published on:

2026-08-13

may contain production data for:

Q2 2026

In that case:

publicationDate:
2026-08-13

reportingPeriod:
Q2 2026

Do NOT incorrectly label Q2 2026 production as
August 13, 2026 production.

==================================================
CURRENT INFORMATION
==================================================

If the user asks for:

latest
current
today
now
recent
most recent

return the newest relevant information contained
in the supplied sources.

Do NOT assume an old source is current.

==================================================
SOURCE TYPE
==================================================

Classify the source as one of:

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

Use:

high

when the source directly and clearly answers
the question.

Use:

medium

when the source provides relevant information
but some details are incomplete.

Use:

low

when the information is weak or indirect.

==================================================
IMPORTANT
==================================================

Only return a source if it contains information
relevant to the question.

Do not return unrelated sources merely because
they were supplied.

==================================================
OUTPUT
==================================================

Return JSON ONLY.

Do NOT use markdown.

Do NOT use code fences.

The JSON MUST have exactly this structure:

{
  "sources": [
    {
      "source": "source name",
      "url": "EXACT SOURCE PAGE URL",
      "domain": "domain",
      "title": "EXACT PAGE TITLE",
      "sourceType": "official_company",
      "information": "relevant information",
      "informationDate": "YYYY-MM-DD or null",
      "publicationDate": "YYYY-MM-DD or null",
      "reportingPeriod": "period or null",
      "confidence": "high"
    }
  ]
}

If there is no useful information:

{
  "sources": []
}
`,

      input: question,
    });


  /*
  --------------------------------------------------
  RAW RESPONSE
  --------------------------------------------------
  */

  const raw =
    response.output_text?.trim() || "";


  /*
  --------------------------------------------------
  EMPTY RESPONSE
  --------------------------------------------------
  */

  if (!raw) {

    console.error(
      "SOURCE EXTRACTION RETURNED EMPTY RESPONSE"
    );

    return [];
  }


  /*
  --------------------------------------------------
  PARSE JSON
  --------------------------------------------------
  */

  try {

    const parsed =
      JSON.parse(raw);


    /*
    --------------------------------------------------
    VALIDATE ARRAY
    --------------------------------------------------
    */

    if (
      !Array.isArray(
        parsed.sources
      )
    ) {

      console.error(
        "SOURCE EXTRACTION INVALID FORMAT"
      );

      return [];
    }


    /*
    --------------------------------------------------
    VALIDATE / NORMALIZE SOURCES
    --------------------------------------------------
    */

    const extracted: ExtractedData[] =
      parsed.sources
        .filter(
          (source: unknown) =>
            source &&
            typeof source === "object"
        )
        .map(
          (source: any): ExtractedData => ({

            source:
              typeof source.source === "string"
                ? source.source
                : "",

            url:
              typeof source.url === "string"
                ? source.url
                : "",

            domain:
              typeof source.domain === "string"
                ? source.domain
                : "",

            title:
              typeof source.title === "string"
                ? source.title
                : "",

            sourceType:
              isValidSourceType(
                source.sourceType
              )
                ? source.sourceType
                : "other",

            information:
              typeof source.information === "string"
                ? source.information
                : "",

            informationDate:
              typeof source.informationDate === "string"
                ? source.informationDate
                : null,

            publicationDate:
              typeof source.publicationDate === "string"
                ? source.publicationDate
                : null,

            reportingPeriod:
              typeof source.reportingPeriod === "string"
                ? source.reportingPeriod
                : null,

            confidence:
              isValidConfidence(
                source.confidence
              )
                ? source.confidence
                : "low",
          })
        );


    /*
    --------------------------------------------------
    EXACT URL PROTECTION
    --------------------------------------------------

    Do not allow the model to replace a specific
    source URL with a homepage.
    --------------------------------------------------
    */

    const normalized =
      extracted.map(
        (item) => {

          /*
          Find matching supplied source.
          */

          const matchingSource =
            usableSources.find(
              (source) =>
                source.url === item.url ||
                source.domain === item.domain ||
                item.url.includes(
                  source.domain
                )
            );


          /*
          If model returned a homepage but
          we have the actual fetched URL,
          restore the fetched URL.
          */

          if (
            matchingSource &&
            isHomepageUrl(
              item.url,
              matchingSource.domain
            ) &&
            !isHomepageUrl(
              matchingSource.url,
              matchingSource.domain
            )
          ) {

            item.url =
              matchingSource.url;
          }


          /*
          If URL is empty, use the exact
          fetched source URL.
          */

          if (
            !item.url &&
            matchingSource
          ) {

            item.url =
              matchingSource.url;
          }


          /*
          If title is empty, use fetched
          source title if available.
          */

          if (
            !item.title &&
            matchingSource &&
            "title" in matchingSource
          ) {

            const sourceWithTitle =
              matchingSource as
                FetchedSource & {
                  title?: string;
                };

            item.title =
              sourceWithTitle.title || "";
          }


          return item;
        }
      );


    return normalized;

  } catch (error) {

    console.error(
      "SOURCE EXTRACTION JSON ERROR:"
    );

    console.error(
      error
    );

    console.error(
      "RAW EXTRACTION:"
    );

    console.error(
      raw
    );

    return [];
  }
}


/*
==================================================
HELPERS
==================================================
*/

function isValidConfidence(
  value: unknown
): value is
  | "high"
  | "medium"
  | "low" {

  return (
    value === "high" ||
    value === "medium" ||
    value === "low"
  );
}


function isValidSourceType(
  value: unknown
): value is
  | "official_company"
  | "government"
  | "regulator"
  | "exchange"
  | "news"
  | "financial"
  | "commodity"
  | "mining_publication"
  | "other" {

  return (
    value === "official_company" ||
    value === "government" ||
    value === "regulator" ||
    value === "exchange" ||
    value === "news" ||
    value === "financial" ||
    value === "commodity" ||
    value === "mining_publication" ||
    value === "other"
  );
}


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
        .replace(/^www\./, "")
        .toLowerCase();

    const cleanDomain =
      domain
        .replace(/^www\./, "")
        .toLowerCase();

    if (
      hostname !== cleanDomain
    ) {
      return false;
    }

    const path =
      parsed.pathname
        .replace(/\/+$/, "");

    return (
      path === ""
    );

  } catch {

    return false;
  }
}