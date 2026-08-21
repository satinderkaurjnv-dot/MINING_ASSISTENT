import {
  SourceDefinition,
} from "./source-registry";

import {
  buildMiningSearchQueries,
  getSourcesForQuestion,
} from "./topic-detector";

import {
  openai,
  MODEL,
} from "./openai";


/*
==================================================
FETCHED SOURCE
==================================================
*/

export type FetchedSource = {
  name: string;
  url: string;
  domain: string;
  type: string;
  priority: number;

  status: "success" | "failed";

  httpStatus?: number;

  text: string;

  fetchedAt: string;

  error?: string;

  /*
  Optional title from search result.
  Useful when direct HTTP fetch is blocked.
  */
  title?: string;
};


/*
==================================================
SEARCH RESULT
==================================================
*/

type SearchResult = {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  research?: string;
};


/*
==================================================
CONFIGURATION
==================================================
*/

const SOURCE_TIMEOUT = 12000;

const MAX_SOURCE_TEXT = 90000;

const MAX_REGISTERED_SOURCES = 8;

const MAX_GLOBAL_SEARCH_RESULTS = 8;

const MAX_FINAL_SOURCES = 8;





/*
IMPORTANT

Previously this was 1.

For questions such as:

"What is BHP's latest copper production guidance?"

we want at least two search queries.
*/

const MAX_SEARCH_QUERIES = 2;


/*
==================================================
BLOCKED DOMAINS
==================================================
*/

const BLOCKED_DOMAINS = [
  "wikipedia.org",
  "en.wikipedia.org",
];


function isBlockedDomain(
  domain: string
): boolean {

  const normalized =
    domain
      .toLowerCase()
      .replace(/^www\./, "")
      .trim();

  return BLOCKED_DOMAINS.some(
    blocked =>
      normalized === blocked ||
      normalized.endsWith(`.${blocked}`)
  );
}


/*
==================================================
COMMODITY PRICE QUERY
==================================================
*/

function isCommodityPriceQuery(
  message: string
): boolean {

  const text =
    message.toLowerCase();

  const pricePatterns = [

    /\bprice\b/,

    /\bspot price\b/,

    /\bcurrent price\b/,

    /\btoday\b/,

    /\blatest price\b/,

    /\bmarket price\b/,

    /\bprice today\b/,

    /\bcurrent market\b/,

    /\bper ounce\b/,

    /\bper kg\b/,

    /\bper tonne\b/,

    /\bper ton\b/,

    /\bxau\b/,

    /\bxag\b/,

  ];

  return pricePatterns.some(
    pattern =>
      pattern.test(text)
  );
}






type RankingType =
  | "market_cap"
  | "production"
  | "revenue"
  | "reserves"
  | "resources"
  | "mine"
  | "country"
  | "generic"
  | null;


  
function detectRankingType(
  message: string
): RankingType {

  const text =
    message
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

const isRanking =
  /\btop\s+\d+\b/.test(text) ||
  /\btop\b/.test(text) ||
  /\blargest\b/.test(text) ||
  /\bbiggest\b/.test(text) ||
  /\branking\b/.test(text) ||
  /\branked\b/.test(text);

  if (!isRanking) {
    return null;
  }

  // Most specific first
if (
  /\bmarket\s+cap\b/.test(text) ||
  /\bmarket\s+capitalization\b/.test(text) ||
  /\bmarket\s+value\b/.test(text)
) {
  return "market_cap";
}

  if (
    /\bproduction\b/.test(text) ||
    /\bproducer\b/.test(text) ||
    /\bproducing\b/.test(text) ||
    /\boutput\b/.test(text)
  ) {
    return "production";
  }

  if (
    /\brevenue\b/.test(text) ||
    /\bsales\b/.test(text)
  ) {
    return "revenue";
  }

  if (
    /\breserves?\b/.test(text)
  ) {
    return "reserves";
  }

  if (
    /\bresources?\b/.test(text)
  ) {
    return "resources";
  }

  if (
    /\bmines?\b/.test(text) ||
    /\bmining\s+operations?\b/.test(text)
  ) {
    return "mine";
  }

  if (
    /\bcountries?\b/.test(text) ||
    /\bnations?\b/.test(text)
  ) {
    return "country";
  }

  return "generic";
}

function requiresFreshData(
  message: string
): boolean {
  const text = message
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const freshPatterns = [
    // Explicit freshness
    /\blatest\b/,
    /\bcurrent\b/,
    /\btoday\b/,
    /\bnow\b/,
    /\brecent\b/,
    /\bmost recent\b/,
    /\bup to date\b/,
    /\bupdated\b/,
    /\blive\b/,

    // Time periods
    /\bthis year\b/,
    /\bthis month\b/,
    /\bthis quarter\b/,
    /\bthis week\b/,
    /\b\d{4}\b/,
    /\bq[1-4]\b/,
    /\bfy\d{2,4}\b/,
    /\bfiscal year\b/,
    /\bfinancial year\b/,

    // Current-data language
    /\bproduction\b/,
    /\boutput\b/,
    /\bguidance\b/,
    /\bforecast\b/,
    /\bestimate\b/,
    /\bmarket cap\b/,
    /\bmarket capitalization\b/,
    /\bmarket value\b/,
    /\bprice\b/,
    /\brates?\b/,
    /\bvaluation\b/,
    /\brevenue\b/,
    /\bsales\b/,
    /\breserves?\b/,
    /\bresources?\b/,
    /\bownership\b/,
    /\bceo\b/,
    /\bexecutive\b/,
    /\bacquisition\b/,
    /\bmerger\b/,
    /\bnews\b/,
    /\bpress release\b/,
  ];

  return freshPatterns.some(
    pattern => pattern.test(text)
  );
}

/*
==================================================
ALLOWED COMMODITY DOMAINS
==================================================
*/

function isAllowedCommodityDomain(
  domain: string
): boolean {

  const allowedDomains = [

    "kitco.com",

    "tradingeconomics.com",

    "investing.com",

    "lbma.org.uk",

    "reuters.com",

    "cmegroup.com",

    "lme.com",

  ];

  const normalized =
    domain
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );

  return allowedDomains.some(
    allowedDomain =>
      normalized === allowedDomain ||
      normalized.endsWith(
        `.${allowedDomain}`
      )
  );
}


/*
==================================================
FETCH ONE SOURCE
==================================================
*/

export async function fetchSource(
  source: SourceDefinition
): Promise<FetchedSource> {

  const fetchedAt =
    new Date().toISOString();

  try {

    console.log(
      `[SOURCE] Fetching: ${source.name}`
    );

    const response =
      await fetch(
        source.url,
        {
          method: "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (compatible; MiningDiscoveryAI/1.0; +https://miningdiscovery.com)",

            Accept:
              "text/html,application/xhtml+xml,text/plain,application/json",

            "Accept-Language":
              "en-US,en;q=0.9",

          },

          cache: "no-store",

          signal:
            AbortSignal.timeout(
              SOURCE_TIMEOUT
            ),
        }
      );


    /*
    ==================================================
    HTTP FAILURE
    ==================================================
    */

    if (!response.ok) {

      console.warn(
        `[SOURCE] HTTP ${response.status}: ${source.url}`
      );

      return {

        name:
          source.name,

        url:
          source.url,

        domain:
          source.domain,

        type:
          source.type,

        priority:
          source.priority,

        status:
          "failed",

        httpStatus:
          response.status,

        text:
          "",

        fetchedAt,

        error:
          `HTTP ${response.status}`,
      };
    }


    /*
    ==================================================
    CONTENT TYPE
    ==================================================
    */

    const contentType =
      (
        response.headers.get(
          "content-type"
        ) || ""
      ).toLowerCase();


    const raw =
      await response.text();


    if (!raw.trim()) {

      return {

        name:
          source.name,

        url:
          source.url,

        domain:
          source.domain,

        type:
          source.type,

        priority:
          source.priority,

        status:
          "failed",

        httpStatus:
          response.status,

        text:
          "",

        fetchedAt,

        error:
          "Empty response body",
      };
    }


    /*
    ==================================================
    JSON
    ==================================================
    */

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      return {

        name:
          source.name,

        url:
          source.url,

        domain:
          source.domain,

        type:
          source.type,

        priority:
          source.priority,

        status:
          "success",

        httpStatus:
          response.status,

        text:
          raw.slice(
            0,
            MAX_SOURCE_TEXT
          ),

        fetchedAt,
      };
    }


    /*
    ==================================================
    HTML / TEXT
    ==================================================
    */

    const text =
      contentType.includes("html")
        ? htmlToText(raw)
        : raw;


    const cleanedText =
      text
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    if (
      cleanedText.length < 50
    ) {

      return {

        name:
          source.name,

        url:
          source.url,

        domain:
          source.domain,

        type:
          source.type,

        priority:
          source.priority,

        status:
          "failed",

        httpStatus:
          response.status,

        text:
          "",

        fetchedAt,

        error:
          "Source contains insufficient readable text",
      };
    }


    return {

      name:
        source.name,

      url:
        source.url,

      domain:
        source.domain,

      type:
        source.type,

      priority:
        source.priority,

      status:
        "success",

      httpStatus:
        response.status,

      text:
        cleanedText.slice(
          0,
          MAX_SOURCE_TEXT
        ),

      fetchedAt,
    };


  } catch (error) {

    console.error(
      `[SOURCE] Failed: ${source.name}`,
      error
    );

    return {

      name:
        source.name,

      url:
        source.url,

      domain:
        source.domain,

      type:
        source.type,

      priority:
        source.priority,

      status:
        "failed",

      text:
        "",

      fetchedAt,

      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}


/*
==================================================
FETCH MULTIPLE SOURCES
==================================================
*/

export async function fetchSources(
  sources: SourceDefinition[]
): Promise<FetchedSource[]> {

  if (
    !Array.isArray(sources) ||
    sources.length === 0
  ) {

    return [];
  }


  const limitedSources =
    sources.slice(
      0,
      MAX_FINAL_SOURCES
    );


  /*
  IMPORTANT:

  Fetch concurrently.
  */

  const results =
    await Promise.all(
      limitedSources.map(
        source =>
          fetchSource(source)
      )
    );


  return results;
}


/*
==================================================
OPENAI WEB SEARCH
==================================================

IMPORTANT CHANGE:

The function now returns BOTH:

1. results
2. research

The research text is critical when a company
website returns HTTP 403 to the server.
==================================================
*/

export async function searchWeb(
  query: string,
  maxResults = MAX_GLOBAL_SEARCH_RESULTS
): Promise<{
  results: SearchResult[];
  research: string;
}> {

  try {

    console.log(
      `[WEB SEARCH] ${query}`
    );


    const response =
      await openai.responses.create({

        model:
          MODEL,

        tools: [
          {
            type:
              "web_search",
          } as any,
        ],

        input: `
You are the live research layer for Mining Discovery AI.

Search the live web for:

${query}

==================================================
OBJECTIVE
==================================================

Find the most relevant and newest factual
information answering the question.

==================================================
SOURCE PRIORITY
==================================================

Prioritize:

1. Official company websites
2. Government websites
3. Regulators
4. Stock exchanges
5. Geological surveys
6. Reputable financial/news organizations
7. Reputable mining publications

==================================================
MINING FOCUS
==================================================

Focus specifically on the mining question.

Do not return generic information.

==================================================
PRODUCTION GUIDANCE QUESTIONS
==================================================

If the question asks about production guidance,
look specifically for:

- production guidance
- production target
- production outlook
- production forecast
- expected production
- annual guidance
- quarterly guidance
- financial-year guidance
- copper production
- copper guidance
- reporting period
- financial year
- operational review

If an exact numerical production guidance figure
is available, include:

- exact number
- unit
- commodity
- reporting period
- financial year if stated
- publication date if stated
- company name

==================================================
LATEST INFORMATION
==================================================

When the question asks for:

latest
current
recent
most recent
today
now
this year

you MUST determine which source contains the newest
relevant data.

Do NOT select data merely because the webpage itself
is newer.

Compare the actual DATA PERIOD.

For example:

2026 Q2 actual
is newer than
2026 Q1 actual
which is newer than
FY2025 actual.

A newer publication containing older historical data
must NOT replace an older publication containing newer
reporting-period data.

==================================================
DATA STATUS PRIORITY
==================================================

When answering a request for latest ACTUAL data,
prefer:

1. actual
2. estimate
3. guidance
4. forecast

Do NOT replace actual historical/current production
with guidance or forecast unless the user explicitly
asks for guidance or forecast.

==================================================
REPORTING PERIOD
==================================================

Always identify:

- data year
- quarter/month/period
- fiscal year if stated
- publication date
- as-of date
- status: actual/guidance/forecast/estimate

When multiple values are found, compare their reporting
periods before selecting the answer.

==================================================
IMPORTANT
==================================================

A 2026 guidance figure is NOT automatically newer
actual production than 2025 actual production.

A 2026 publication date is NOT automatically evidence
that the data itself is from 2026.

Always distinguish:

PUBLICATION DATE
from
DATA PERIOD.


==================================================
IMPORTANT
==================================================

Do not invent information.

Do not estimate missing figures.

Do not substitute production with sales.

Do not substitute production guidance with
historical production.

Do not substitute another commodity.

Do not substitute another company.

Return concise factual research.
        `.trim(),
      });


    /*
    ==================================================
    PRESERVE LIVE WEB RESEARCH
    ==================================================
    */

    const research =
      response.output_text?.trim() || "";


    console.log(
      "[WEB SEARCH] Research length:",
      research.length
    );


    /*
    ==================================================
    EXTRACT URL CITATIONS
    ==================================================
    */

    const discovered =
      extractWebSources(
        response
      );


    /*
    ==================================================
    ADD RESEARCH TO EACH RESULT
    ==================================================
    */

    const enrichedResults =
      discovered.map(
        result => ({
          ...result,

          research,
        })
      );


    /*
    ==================================================
    REMOVE DUPLICATES
    ==================================================
    */

    const unique =
      new Map<
        string,
        SearchResult
      >();


    for (
      const result of enrichedResults
    ) {

      if (
        !isValidHttpUrl(
          result.url
        )
      ) {

        continue;
      }


      const key =
        normalizeUrl(
          result.url
        );


      if (
        !unique.has(key)
      ) {

        unique.set(
          key,
          result
        );
      }
    }


    const results =
      Array.from(
        unique.values()
      )
        .filter(
          result =>
            !isBlockedDomain(
              result.domain
            )
        )
        .slice(
          0,
          maxResults
        );


    console.log(
      `[WEB SEARCH] Found ${results.length} URLs`
    );


    console.log(
      "[WEB SEARCH] Research preview:",
      research.slice(
        0,
        1500
      )
    );


    return {

      results,

      research,
    };


  } catch (error) {

    console.error(
      "[WEB SEARCH] ERROR:",
      error
    );


    return {

      results: [],

      research: "",
    };
  }
}


/*
==================================================
EXTRACT WEB SOURCES
==================================================
*/

function extractWebSources(
  response: unknown
): SearchResult[] {

  const results:
    SearchResult[] = [];


  const visited =
    new Set<object>();


  function walk(
    value: unknown
  ): void {

    if (
      value === null ||
      value === undefined
    ) {

      return;
    }


    if (
      typeof value === "string"
    ) {

      return;
    }


    if (
      typeof value !== "object"
    ) {

      return;
    }


    if (
      visited.has(
        value as object
      )
    ) {

      return;
    }


    visited.add(
      value as object
    );


    if (
      Array.isArray(value)
    ) {

      for (
        const item of value
      ) {

        walk(item);
      }

      return;
    }


    const obj =
      value as Record<
        string,
        unknown
      >;


    /*
    ==================================================
    DIRECT URL
    ==================================================
    */

    if (
      typeof obj.url === "string" &&
      isValidHttpUrl(
        obj.url
      )
    ) {

      const url =
        obj.url;


      const domain =
        getDomain(
          url
        );


      if (domain) {

        results.push({

          title:
            typeof obj.title === "string"
              ? obj.title
              : domain,

          url,

          domain,

          snippet:
            typeof obj.snippet === "string"
              ? obj.snippet
              : typeof obj.text === "string"
                ? obj.text
                : "",
        });
      }
    }


    /*
    ==================================================
    URL CITATION
    ==================================================
    */

    if (
      obj.type === "url_citation" &&
      typeof obj.url === "string" &&
      isValidHttpUrl(
        obj.url
      )
    ) {

      const url =
        obj.url;


      const domain =
        getDomain(
          url
        );


      if (domain) {

        results.push({

          title:
            typeof obj.title === "string"
              ? obj.title
              : domain,

          url,

          domain,

          snippet:
            typeof obj.snippet === "string"
              ? obj.snippet
              : typeof obj.text === "string"
                ? obj.text
                : "",
        });
      }
    }


    /*
    ==================================================
    LINK FIELD
    ==================================================
    */

    if (
      typeof obj.link === "string" &&
      isValidHttpUrl(
        obj.link
      )
    ) {

      const url =
        obj.link;


      const domain =
        getDomain(
          url
        );


      if (domain) {

        results.push({

          title:
            typeof obj.title === "string"
              ? obj.title
              : domain,

          url,

          domain,

          snippet:
            typeof obj.snippet === "string"
              ? obj.snippet
              : typeof obj.text === "string"
                ? obj.text
                : "",
        });
      }
    }


    /*
    ==================================================
    RECURSIVE WALK
    ==================================================
    */

    for (
      const key of Object.keys(obj)
    ) {

      if (
        key === "url" ||
        key === "link" ||
        key === "title" ||
        key === "snippet"
      ) {

        continue;
      }


      try {

        walk(
          obj[key]
        );

      } catch {

        // Ignore malformed properties.
      }
    }
  }


  walk(
    response
  );


  /*
  ==================================================
  UNIQUE
  ==================================================
  */

  const unique =
    new Map<
      string,
      SearchResult
    >();


  for (
    const result of results
  ) {

    const key =
      normalizeUrl(
        result.url
      );


    if (
      !unique.has(key)
    ) {

      unique.set(
        key,
        result
      );
    }
  }


  return Array.from(
    unique.values()
  );
}


/*
==================================================
FETCH SOURCES FOR QUESTION
==================================================
*/

export async function fetchSourcesForQuestion(
  message: string
): Promise<FetchedSource[]> {

  console.log(
    "=========================================="
  );

  console.log(
    "MINING GLOBAL SOURCE PIPELINE"
  );

  console.log(
    "QUESTION:",
    message
  );

  console.log(
    "=========================================="
  );

  const commodityPriceQuery =
  isCommodityPriceQuery(message);

const rankingType =
  detectRankingType(message);

const freshDataRequired =
  requiresFreshData(message);

const forceLiveRefresh =
  commodityPriceQuery ||
  freshDataRequired ||
  rankingType !== null;

console.log(
  "FRESH DATA REQUIRED:",
  forceLiveRefresh
);

  console.log(
    "RANKING TYPE:",
    rankingType
  );

  console.log(
    "COMMODITY PRICE QUERY:",
    commodityPriceQuery
  );

  /*
  ==================================================
  STEP 1
  REGISTERED TRUSTED SOURCES
  ==================================================
  */

  let registeredSources:
    SourceDefinition[] = [];


  try {

    registeredSources =
      getSourcesForQuestion(
        message
      );

  } catch (error) {

    console.error(
      "REGISTERED SOURCE DISCOVERY ERROR:",
      error
    );
  }


  registeredSources =
    registeredSources.slice(
      0,
      MAX_REGISTERED_SOURCES
    );


  console.log(
    "REGISTERED SOURCES:",
    registeredSources.map(
      source =>
        source.name
    )
  );


  /*
  ==================================================
  STEP 2
  FETCH REGISTERED SOURCES
  ==================================================
  */

  const registeredResults =
    await fetchSources(
      registeredSources
    );


  const successfulRegistered =
    registeredResults.filter(
      source =>
        source.status === "success" &&
        source.text.length > 50
    );


  console.log(
    "TRUSTED SOURCES:",
    successfulRegistered.length
  );


  /*
  ==================================================
  STEP 3
  BUILD SEARCH QUERIES
  ==================================================
  */

 let searchQueries: string[] = [];

try {
  searchQueries =
    buildMiningSearchQueries(
      message
    );
} catch (error) {
  console.error(
    "SEARCH QUERY BUILD ERROR:",
    error
  );
}

if (forceLiveRefresh) {
  console.log(
    "[FRESHNESS] Forcing live web refresh for:",
    message
  );

  if (commodityPriceQuery) {
    searchQueries.unshift(
      `${message} latest current spot price official`
    );
  } else if (rankingType === "market_cap") {
    searchQueries.unshift(
      `${message} latest market capitalization current`
    );
  } else if (rankingType === "production") {
    searchQueries.unshift(
      `${message} latest production actual quarterly annual guidance official`
    );
  } else if (rankingType === "reserves") {
    searchQueries.unshift(
      `${message} latest reserves official technical report`
    );
  } else if (rankingType === "resources") {
    searchQueries.unshift(
      `${message} latest resources official technical report`
    );
  } else if (rankingType !== null) {
    searchQueries.unshift(
      `${message} latest official data`
    );
  } else {
    searchQueries.unshift(
      `${message} latest official data`
    );
  }
}


  searchQueries =
    searchQueries
      .filter(
        query =>
          typeof query === "string" &&
          query.trim().length > 0
      )
      .slice(
        0,
        MAX_SEARCH_QUERIES
      );


  console.log(
    "SEARCH QUERIES:",
    searchQueries
  );


  /*
  ==================================================
  STEP 4
  GLOBAL SEARCH FALLBACK
  ==================================================
  */

  const allSearchResults:
    SearchResult[] = [];


  /*
  IMPORTANT

  Preserve the complete research returned by
  OpenAI web search.

  This is used when the actual website returns
  HTTP 403.
  */

let globalResearch = "";
  const researchBlocks: string[] = [];


  for (
    const query of searchQueries
  ) {

    const searchResponse =
      await searchWeb(
        query,
        MAX_GLOBAL_SEARCH_RESULTS
      );


    allSearchResults.push(
      ...searchResponse.results
    );


    /*
    Keep the longest research response.
    */

  if (searchResponse.research?.trim()) {
  researchBlocks.push(
    `SEARCH QUERY:
${query}

LIVE WEB RESEARCH:
${searchResponse.research}`
  );
}


    const uniqueCount =
      new Set(
        allSearchResults.map(
          result =>
            normalizeUrl(
              result.url
            )
        )
      ).size;

if (
  !forceLiveRefresh &&
  uniqueCount >= MAX_GLOBAL_SEARCH_RESULTS
) {
  break;
}
  }

  globalResearch = researchBlocks.join("\n\n");


  console.log(
    "[WEB SEARCH] FINAL RESEARCH LENGTH:",
    globalResearch.length
  );


  /*
  ==================================================
  STEP 5
  UNIQUE SEARCH RESULTS
  ==================================================
  */

  const uniqueSearchResults =
    new Map<
      string,
      SearchResult
    >();


  for (
    const result of allSearchResults
  ) {

    const key =
      normalizeUrl(
        result.url
      );


    if (
      !uniqueSearchResults.has(key)
    ) {

      uniqueSearchResults.set(
        key,
        result
      );
    }
  }


  /*
  ==================================================
  FILTER COMMODITY FALLBACK RESULTS
  ==================================================
  */

  let discoveredResults =
    Array.from(
      uniqueSearchResults.values()
    );


  if (
    commodityPriceQuery
  ) {

    discoveredResults =
      discoveredResults.filter(
        result =>
          isAllowedCommodityDomain(
            result.domain
          )
      );


    console.log(
      "[COMMODITY FALLBACK] Allowed results:",
      discoveredResults.length
    );
  }


  discoveredResults =
    discoveredResults.slice(
      0,
      MAX_GLOBAL_SEARCH_RESULTS
    );


  /*
  ==================================================
  STEP 6
  CONVERT SEARCH RESULTS TO SOURCES
  ==================================================
  */

  const discoveredSources =
    discoveredResults.map(
      (
        result,
        index
      ) => ({

        result,

        source: {

          name:
            result.title ||
            result.domain,

          url:
            result.url,

          domain:
            result.domain,

          type:
            "news" as const,

          priority:
  forceLiveRefresh
    ? index
    : 50 + index,

        } satisfies SourceDefinition,
      })
    );


  /*
  ==================================================
  STEP 7
  FETCH GLOBAL SOURCES
  ==================================================
  */

  const discoveredFetched =
    await Promise.all(

      discoveredSources.map(
        async ({
          result,
          source,
        }) => {

          const fetched =
            await fetchSource(
              source
            );


          /*
          ==========================================
          DIRECT FETCH SUCCESS
          ==========================================
          */

          if (
            fetched.status === "success"
          ) {

            /*
            Preserve title from search result.
            */

            fetched.title =
              result.title ||
              source.name;

            return fetched;
          }


          /*
          ==========================================
          DIRECT FETCH FAILED
          ==========================================

          This is the critical BHP fix.

          If BHP / Rio Tinto / government /
          other sites block server-side requests,
          use the factual live-web research returned
          by OpenAI web search.

          Do NOT only use title + snippet.
          ==========================================
          */

          const searchText =
            [

              `SOURCE NAME:
${result.title || source.name}`,

              `EXACT SEARCH RESULT URL:
${result.url}`,

              `DOMAIN:
${result.domain}`,

              `SEARCH RESULT SNIPPET:
${result.snippet || ""}`,
`LIVE WEB RESEARCH:
${result.research || globalResearch || ""}`,

            ]
              .filter(
                value =>
                  typeof value === "string" &&
                  value.trim().length > 0
              )
              .join("\n\n")
              .trim();


          console.log(
            "[WEB FALLBACK] Source:",
            source.name
          );

          console.log(
            "[WEB FALLBACK] Domain:",
            source.domain
          );

          console.log(
            "[WEB FALLBACK] Research length:",
            (
              result.research ||
              globalResearch ||
              ""
            ).length
          );

          console.log(
            "[WEB FALLBACK] Final text length:",
            searchText.length
          );


          /*
          ==========================================
          USE SEARCH RESEARCH
          ==========================================
          */

          if (
            searchText.length > 100
          ) {

            return {

              ...source,

              title:
                result.title ||
                source.name,

              status:
                "success" as const,

              text:
                searchText.slice(
                  0,
                  MAX_SOURCE_TEXT
                ),

              fetchedAt:
                new Date().toISOString(),

              error:
                undefined,
            };
          }


          /*
          ==========================================
          NO USABLE SEARCH CONTENT
          ==========================================
          */

          console.warn(
            "[WEB FALLBACK] No usable research:",
            source.url
          );


          return null;
        }
      )
    );


  const usableDiscoveredSources =
    discoveredFetched.filter(
      (
        source
      ): source is FetchedSource =>
        source !== null
    );


  /*
  ==================================================
  STEP 8
  COMBINE
  ==================================================
  */

  const combined:
    FetchedSource[] = [

      ...registeredResults,

      ...usableDiscoveredSources,

    ];


  /*
  ==================================================
  STEP 9
  DEDUPLICATE
  ==================================================
  */

  const unique =
    new Map<
      string,
      FetchedSource
    >();


  for (
    const source of combined
  ) {

    const key =
      normalizeUrl(
        source.url
      );


    const existing =
      unique.get(
        key
      );


    if (!existing) {

      unique.set(
        key,
        source
      );

      continue;
    }


    /*
    Prefer successful source.
    */

    if (
      existing.status === "failed" &&
      source.status === "success"
    ) {

      unique.set(
        key,
        source
      );

      continue;
    }


    /*
    If both succeeded, prefer
    higher priority source.
    */

    if (
      existing.status === "success" &&
      source.status === "success" &&
      source.priority <
        existing.priority
    ) {

      unique.set(
        key,
        source
      );
    }
  }


  /*
  ==================================================
  STEP 10
  FINAL SOURCES
  ==================================================
  */

const finalResults =
  Array.from(unique.values())
    .filter(
      source =>
        source.status === "success" &&
        source.text.trim().length > 50
    )
    .sort((a, b) => {
      return a.priority - b.priority;
    })
    .slice(
      0,
      MAX_FINAL_SOURCES
    );

  /*
  ==================================================
  LOG FINAL SOURCES
  ==================================================
  */

  console.log(
    "=========================================="
  );

  console.log(
    "FINAL SOURCE COUNT:",
    finalResults.length
  );

  console.log(
    finalResults.map(
      source => ({

        name:
          source.name,

        domain:
          source.domain,

        type:
          source.type,

        priority:
          source.priority,

        url:
          source.url,

        textLength:
          source.text.length,

        status:
          source.status,

      })
    )
  );

  console.log(
    "=========================================="
  );


  return finalResults;
}


/*
==================================================
URL NORMALIZATION
==================================================
*/

function normalizeUrl(
  value: string
): string {

  try {

    const url =
      new URL(
        value
      );


    return (

      url.origin +

      url.pathname.replace(
        /\/+$/,
        ""
      ) +

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
VALID HTTP URL
==================================================
*/

function isValidHttpUrl(
  value: string
): boolean {

  try {

    const url =
      new URL(
        value
      );


    return (

      url.protocol === "http:" ||

      url.protocol === "https:"

    );


  } catch {

    return false;
  }
}


/*
==================================================
GET DOMAIN
==================================================
*/

function getDomain(
  value: string
): string {

  try {

    return new URL(
      value
    )
      .hostname
      .replace(
        /^www\./i,
        ""
      )
      .toLowerCase();

  } catch {

    return "";
  }
}


/*
==================================================
HTML -> TEXT
==================================================
*/

function htmlToText(
  html: string
): string {

  let text =
    html;


  /*
  Remove scripts.
  */

  text =
    text.replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    );


  /*
  Remove styles.
  */

  text =
    text.replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    );


  /*
  Remove SVG.
  */

  text =
    text.replace(
      /<svg[\s\S]*?<\/svg>/gi,
      " "
    );


  /*
  Remove comments.
  */

  text =
    text.replace(
      /<!--[\s\S]*?-->/g,
      " "
    );


  /*
  Block elements.
  */

  text =
    text.replace(
      /<\/(p|div|section|article|main|header|footer|h1|h2|h3|h4|h5|h6|li|tr|br|table)>/gi,
      "\n"
    );


  /*
  Remove remaining HTML.
  */

  text =
    text.replace(
      /<[^>]+>/g,
      " "
    );


  /*
  Decode HTML entities.
  */

  text =
    decodeHtmlEntities(
      text
    );


  /*
  Normalize spaces.
  */

  text =
    text.replace(
      /[ \t]+/g,
      " "
    );


  /*
  Normalize excessive newlines.
  */

  text =
    text.replace(
      /\n\s*\n\s*\n+/g,
      "\n\n"
    );


  return text.trim();
}


/*
==================================================
HTML ENTITY DECODER
==================================================
*/

function decodeHtmlEntities(
  text: string
): string {

  return text

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /&quot;/gi,
      '"'
    )

    .replace(
      /&#39;/gi,
      "'"
    )

    .replace(
      /&apos;/gi,
      "'"
    )

    .replace(
      /&lt;/gi,
      "<"
    )

    .replace(
      /&gt;/gi,
      ">"
    )

    .replace(
      /&#(\d+);/g,
      (
        _match,
        code
      ) =>
        String.fromCharCode(
          Number(code)
        )
    )

    .replace(
      /&#x([0-9a-f]+);/gi,
      (
        _match,
        code
      ) =>
        String.fromCharCode(
          parseInt(
            code,
            16
          )
        )
    );
}