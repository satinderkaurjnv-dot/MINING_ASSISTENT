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
};


/*
==================================================
CONFIGURATION
==================================================
*/

const SOURCE_TIMEOUT = 12000;

const MAX_SOURCE_TEXT = 30000;

const MAX_REGISTERED_SOURCES = 8;

const MAX_GLOBAL_SEARCH_RESULTS = 5;

const MAX_FINAL_SOURCES = 8;

const MAX_SEARCH_QUERIES = 1;


/*
==================================================
COMMODITY PRICE QUERY
==================================================

Used for questions such as:

- What is the current gold price?
- Gold price today
- Current silver price
- Copper spot price
- Latest gold price
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


/*
==================================================
ALLOWED COMMODITY DOMAINS
==================================================

Only use these domains when a commodity
price fallback search is required.
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
        name: source.name,

        url: source.url,

        domain: source.domain,

        type: source.type,

        priority: source.priority,

        status: "failed",

        httpStatus:
          response.status,

        text: "",

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
        name: source.name,

        url: source.url,

        domain: source.domain,

        type: source.type,

        priority: source.priority,

        status: "failed",

        httpStatus:
          response.status,

        text: "",

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
        name: source.name,

        url: source.url,

        domain: source.domain,

        type: source.type,

        priority: source.priority,

        status: "success",

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
        name: source.name,

        url: source.url,

        domain: source.domain,

        type: source.type,

        priority: source.priority,

        status: "failed",

        httpStatus:
          response.status,

        text: "",

        fetchedAt,

        error:
          "Source contains insufficient readable text",
      };
    }


    return {
      name: source.name,

      url: source.url,

      domain: source.domain,

      type: source.type,

      priority: source.priority,

      status: "success",

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
      name: source.name,

      url: source.url,

      domain: source.domain,

      type: source.type,

      priority: source.priority,

      status: "failed",

      text: "",

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

  Fetch all sources concurrently.

  Do NOT change this to a sequential loop.
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

Used only when trusted sources are not enough.

No DuckDuckGo.
No separate search API key.

The existing OPENAI_API_KEY is used.
==================================================
*/

export async function searchWeb(
  query: string,
  maxResults = MAX_GLOBAL_SEARCH_RESULTS
): Promise<SearchResult[]> {

  try {

    console.log(
      `[WEB SEARCH] ${query}`
    );


    const response =
      await openai.responses.create({

        model: MODEL,

        tools: [
          {
            type: "web_search",
          } as any,
        ],

        input: `
You are the research layer for Mining Discovery AI.

Search the live web for:

${query}

Find the most relevant factual sources.

Prioritize:

1. Official company websites
2. Government websites
3. Regulators
4. Stock exchanges
5. Geological surveys
6. Reputable financial/news organizations
7. Reputable mining publications

Focus specifically on the mining question.

Do not invent information.

Return concise factual research.
        `.trim(),
      });


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
    REMOVE DUPLICATES
    ==================================================
    */

    const unique =
      new Map<
        string,
        SearchResult
      >();


    for (
      const result of discovered
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
      ).slice(
        0,
        maxResults
      );


    console.log(
      `[WEB SEARCH] Found ${results.length} URLs`
    );


    return results;

  } catch (error) {

    console.error(
      "[WEB SEARCH] ERROR:",
      error
    );

    return [];
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
        getDomain(url);


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
        getDomain(url);


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
        getDomain(url);


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
    isCommodityPriceQuery(
      message
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
      source => source.name
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
  FAST PATH
  CURRENT COMMODITY PRICE
  ==================================================

  THIS IS THE IMPORTANT PART.

  If trusted commodity sources work,
  DO NOT perform global web search.
  */

  if (
    commodityPriceQuery &&
    successfulRegistered.length > 0
  ) {

    console.log(
      "=========================================="
    );

    console.log(
      "[FAST PATH] Trusted commodity sources found."
    );

    console.log(
      "[FAST PATH] Skipping global web search."
    );

    console.log(
      "[FAST PATH] Sources:",
      successfulRegistered.map(
        source => source.name
      )
    );

    console.log(
      "=========================================="
    );


    return successfulRegistered
      .sort(
        (a, b) =>
          a.priority -
          b.priority
      )
      .slice(
        0,
        MAX_FINAL_SOURCES
      );
  }


  /*
  ==================================================
  STEP 3
  BUILD SEARCH QUERIES
  ==================================================

  Only reached when the fast path did not
  return.
  */

  let searchQueries:
    string[] = [];


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


  /*
  ==================================================
  STEP 4
  GLOBAL SEARCH FALLBACK
  ==================================================
  */

  const allSearchResults:
    SearchResult[] = [];


  for (
    const query of searchQueries
  ) {

    const results =
      await searchWeb(
        query,
        MAX_GLOBAL_SEARCH_RESULTS
      );


    allSearchResults.push(
      ...results
    );


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
      uniqueCount >=
      MAX_GLOBAL_SEARCH_RESULTS
    ) {

      break;
    }
  }


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

  If this is a commodity price query,
  do not allow random domains such as:

  - BTCC
  - unrelated PDFs
  - random blogs
  - unrelated news
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
  CONVERT TO SOURCES
  ==================================================
  */

  const discoveredSources:
    SourceDefinition[] =
      discoveredResults.map(
        (
          result,
          index
        ): SourceDefinition => ({

          name:
            result.title ||
            result.domain,

          url:
            result.url,

          domain:
            result.domain,

          type:
            "news",

          priority:
            50 + index,
        })
      );


  /*
  ==================================================
  STEP 7
  FETCH GLOBAL SOURCES
  ==================================================
  */

  const discoveredFetched =
    await fetchSources(
      discoveredSources
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

      ...discoveredFetched,

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
      unique.get(key);


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
    the higher priority source.
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
    Array.from(
      unique.values()
    )
      .filter(
        source =>
          source.status === "success" &&
          source.text.trim().length > 50
      )
      .sort(
        (a, b) =>
          a.priority -
          b.priority
      )
      .slice(
        0,
        MAX_FINAL_SOURCES
      );


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
      new URL(value);


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
      new URL(value);


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