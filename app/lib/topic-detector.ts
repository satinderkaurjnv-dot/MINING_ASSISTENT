import {
  COMMODITIES,
  COMPANY_DOMAINS,
  SOURCE_REGISTRY,
  SourceDefinition,
} from "./source-registry";

export type Topic =
  | "commodity"
  | "company"
  | "companyRanking"
  | "financial"
  | "exploration"
  | "regulation"
  | "government"
  | "miningNews";

export function needsCurrentData(
  message: string
): boolean {

  const q =
    message.toLowerCase();

  const currentWords = [
    "latest",
    "current",
    "today",
    "now",
    "currently",
    "live",
    "recent",
    "recently",
    "newest",
    "updated",
    "update",
    "this week",
    "this month",
    "this year",
    "as of",
    "up to date",
    "up-to-date",
    "latest available",
    "most recent",
  ];

const matchedWord =
  currentWords.find(
    word =>
      new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      ).test(q)
  );

console.log(
  "CURRENT WORD MATCH:",
  matchedWord
);

const isUS =
  q.includes("usa") ||
  q.includes("u.s.") ||
  q.includes("united states") ||
  q.includes("america");

const isRanking =
  /\btop\s+\d+\s+mining\s+compan/i.test(q) ||
  /\btop\s+ten\s+mining\s+compan/i.test(q) ||
  q.includes("top mining compan") ||
  q.includes("largest mining compan") ||
  q.includes("biggest mining compan") ||
  q.includes("leading mining compan") ||
  q.includes("mining companies ranked") ||
  q.includes("ranking of mining compan") ||
  q.includes("ranked mining compan");

const companyRanking =
  isRanking && isUS;

console.log(
  "COMPANY RANKING:",
  companyRanking
);

return Boolean(matchedWord) || companyRanking;
}


export function detectCommodity(
  message: string
): string | null {

  const q =
    message.toLowerCase();

  /*
  Handle aluminum spelling.
  */

  if (q.includes("aluminum")) {
    return "aluminium";
  }

  /*
  Longest first.
  */

  const sorted =
    [...COMMODITIES].sort(
      (a, b) =>
        b.length - a.length
    );

  for (const commodity of sorted) {

    if (q.includes(commodity)) {
      return commodity;
    }
  }

  return null;
}


export function detectCompany(
  message: string
): string | null {

  const q =
    message.toLowerCase();

  const companies =
    Object.keys(
      COMPANY_DOMAINS
    ).sort(
      (a, b) =>
        b.length - a.length
    );

  for (const company of companies) {

    if (q.includes(company)) {
      return company;
    }
  }

  return null;
}


export function detectTopic(
  message: string
): Topic {

  const q = message.toLowerCase();

  console.log("========== DETECT TOPIC DEBUG ==========");
  console.log("MESSAGE:", message);
  console.log("HAS TOP MINING COMPAN:", q.includes("top mining compan"));
  console.log("HAS USA:", q.includes("usa"));
  console.log("HAS LARGEST:", q.includes("largest mining compan"));
  console.log("HAS BIGGEST:", q.includes("biggest mining compan"));
  console.log("HAS LEADING:", q.includes("leading mining compan"));
  console.log("========================================");

  const commodity = detectCommodity(message);



/*
==================================================
COMPANY RANKING
==================================================
*/

const isUS =
  q.includes("usa") ||
  q.includes("u.s.") ||
  q.includes("united states") ||
  q.includes("america");

const isRanking =
  /\btop\s+\d+\s+mining\s+compan/i.test(q) ||
  /\btop\s+ten\s+mining\s+compan/i.test(q) ||
  q.includes("top mining compan") ||
  q.includes("largest mining compan") ||
  q.includes("biggest mining compan") ||
  q.includes("leading mining compan") ||
  q.includes("mining companies ranked") ||
  q.includes("ranking of mining compan") ||
  q.includes("ranked mining compan");

console.log("IS US:", isUS);
console.log("IS RANKING:", isRanking);

if (isRanking && isUS) {
  console.log(">>> COMPANY RANKING DETECTED <<<");
  return "companyRanking";
}

  /*
  Commodity price
  */

  if (
    commodity &&
    (
      q.includes("price") ||
      q.includes("rate") ||
      q.includes("value") ||
      q.includes("spot") ||
      q.includes("futures") ||
      q.includes("cost")
    )
  ) {
    return "commodity";
  }

  /*
  Regulation
  */

  if (
    q.includes("regulation") ||
    q.includes("regulations") ||
    q.includes("law") ||
    q.includes("legislation") ||
    q.includes("permit") ||
    q.includes("environmental rule") ||
    q.includes("policy")
  ) {
    return "regulation";
  }

  /*
  Exploration
  */

  if (
    q.includes("exploration") ||
    q.includes("drilling") ||
    q.includes("drill result") ||
    q.includes("discovery") ||
    q.includes("assay") ||
    q.includes("resource estimate")
  ) {
    return "exploration";
  }

  /*
  Financial
  */

  if (
    q.includes("revenue") ||
    q.includes("profit") ||
    q.includes("earnings") ||
    q.includes("financial") ||
    q.includes("ebitda") ||
    q.includes("cash flow") ||
    q.includes("quarterly results")
  ) {
    return "financial";
  }

  /*
  Company
  */

  if (
    detectCompany(message) ||
    q.includes("ceo") ||
    q.includes("chief executive") ||
    q.includes("president") ||
    q.includes("chairman") ||
    q.includes("director") ||
    q.includes("shareholder") ||
    q.includes("ownership") ||
    q.includes("acquisition") ||
    q.includes("acquired") ||
    q.includes("merger") ||
    q.includes("production") ||
    q.includes("reserves") ||
    q.includes("resources") ||
    q.includes("project status")
  ) {
    return "company";
  }

  /*
  Government / geology
  */

  if (
    q.includes("geology") ||
    q.includes("geological") ||
    q.includes("mineral statistics") ||
    q.includes("mineral production") ||
    q.includes("mineral resources")
  ) {
    return "government";
  }

  return "miningNews";
}


export function getSourcesForQuestion(
  message: string
): SourceDefinition[] {

  const topic =
    detectTopic(message);

  const commodity =
    detectCommodity(message);

  const company =
    detectCompany(message);

  const sources: SourceDefinition[] = [];

  /*
  Official company source FIRST
  */

  if (company) {

    const companySources =
      COMPANY_DOMAINS[company];

    if (companySources) {
      sources.push(
        ...companySources
      );
    }
  }

  /*
  Commodity-specific sources
  */

  if (
    topic === "commodity" &&
    commodity
  ) {

    const commoditySources =
      SOURCE_REGISTRY[
        commodity as keyof typeof SOURCE_REGISTRY
      ];

    if (commoditySources) {

      sources.push(
        ...commoditySources
      );
    }
  }



  /*
==================================================
COMPANY RANKING SOURCES
==================================================
*/

if (
  topic === "companyRanking"
) {
  sources.push(
    ...SOURCE_REGISTRY.companyRanking
  );
}

  /*
  Topic sources
  */

  if (
    topic === "miningNews"
  ) {

    sources.push(
      ...SOURCE_REGISTRY.miningNews
    );
  }

  if (
    topic === "government"
  ) {

    sources.push(
      ...SOURCE_REGISTRY.government
    );
  }

  if (
    topic === "regulation"
  ) {

    sources.push(
      ...SOURCE_REGISTRY.regulation
    );
  }

  /*
  Exploration gets government + mining news.
  */

  if (
    topic === "exploration"
  ) {

    sources.push(
      ...SOURCE_REGISTRY.government,
      ...SOURCE_REGISTRY.miningNews
    );
  }

  /*
  Financial/company gets mining news.
  */

  if (
    topic === "financial" ||
    topic === "company"
  ) {

    sources.push(
      ...SOURCE_REGISTRY.miningNews
    );
  }

  /*
  Remove duplicate domains.
  */

  const unique =
    new Map<
      string,
      SourceDefinition
    >();

  for (const source of sources) {

    if (
      !unique.has(source.domain)
    ) {

      unique.set(
        source.domain,
        source
      );
    }
  }


  console.log(
  "DETECTED TOPIC IN getSourcesForQuestion:",
  topic
);

console.log(
  "SELECTED SOURCES:",
  [...unique.values()].map(source => source.url)
);


  return [
    ...unique.values()
  ].sort(
    (a, b) =>
      a.priority - b.priority
  );
}