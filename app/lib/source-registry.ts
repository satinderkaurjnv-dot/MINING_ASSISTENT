/*
==================================================
MINING DISCOVERY
SOURCE REGISTRY
==================================================

Trusted sources used by the current-data pipeline.

IMPORTANT:
- Every URL MUST be a real URL.
- Do NOT use Markdown links.
- The fetcher receives these URLs directly.
- Company/project-specific pages should be preferred
  over generic homepages whenever available.
==================================================
*/

export type SourceDefinition = {
  name: string;
  url: string;
  domain: string;
  priority: number;

  type:
    | "official"
    | "government"
    | "regulator"
    | "exchange"
    | "news"
    | "financial"
    | "commodity"
    | "geology";
};


/*
==================================================
SOURCE REGISTRY
==================================================
*/

export const SOURCE_REGISTRY = {
  /*
  ==================================================
  GOLD
  ==================================================
  */

gold: [
  {
    name: "Kitco Gold Spot",
    url: "https://www.kitco.com/price/precious-metals?Symbol=GOLD",
    domain: "kitco.com",
    priority: 1,
    type: "commodity",
  },

] satisfies SourceDefinition[],

  /*
  ==================================================
  SILVER
  ==================================================
  */

  silver: [
    {
      name: "Kitco Silver",
      url: "https://www.kitco.com/charts/silver",
      domain: "kitco.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Investing.com Silver",
      url: "https://www.investing.com/commodities/silver",
      domain: "investing.com",
      priority: 2,
      type: "commodity",
    },

    {
      name: "Trading Economics Silver",
      url: "https://tradingeconomics.com/commodity/silver",
      domain: "tradingeconomics.com",
      priority: 3,
      type: "commodity",
    },

    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 4,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  COPPER
  ==================================================
  */
copper: [
  {
    name: "Kitco Copper Spot",
    url: "https://www.kitco.com/price/base-metals/copper",
    domain: "kitco.com",
    priority: 1,
    type: "commodity",
  },
] satisfies SourceDefinition[],

  /*
  ==================================================
  NICKEL
  ==================================================
  */

  nickel: [
    {
      name: "LME",
      url: "https://www.lme.com/",
      domain: "lme.com",
      priority: 1,
      type: "exchange",
    },

    {
      name: "Investing.com Nickel",
      url: "https://www.investing.com/commodities/nickel",
      domain: "investing.com",
      priority: 2,
      type: "commodity",
    },

    {
      name: "Trading Economics Nickel",
      url: "https://tradingeconomics.com/commodity/nickel",
      domain: "tradingeconomics.com",
      priority: 3,
      type: "commodity",
    },

    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 4,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  ALUMINIUM
  ==================================================
  */

  aluminium: [
    {
      name: "LME",
      url: "https://www.lme.com/",
      domain: "lme.com",
      priority: 1,
      type: "exchange",
    },

    {
      name: "Investing.com Aluminium",
      url: "https://www.investing.com/commodities/aluminum",
      domain: "investing.com",
      priority: 2,
      type: "commodity",
    },

    {
      name: "Trading Economics Aluminium",
      url: "https://tradingeconomics.com/commodity/aluminum",
      domain: "tradingeconomics.com",
      priority: 3,
      type: "commodity",
    },

    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 4,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  IRON ORE
  ==================================================
  */

  "iron ore": [
    {
      name: "Trading Economics Iron Ore",
      url: "https://tradingeconomics.com/commodity/iron-ore",
      domain: "tradingeconomics.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Investing.com Iron Ore",
      url: "https://www.investing.com/commodities/iron-ore",
      domain: "investing.com",
      priority: 2,
      type: "commodity",
    },

    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 3,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  LITHIUM
  ==================================================
  */

  lithium: [
    {
      name: "Trading Economics Lithium",
      url: "https://tradingeconomics.com/commodity/lithium",
      domain: "tradingeconomics.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 2,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  URANIUM
  ==================================================
  */

  uranium: [
    {
      name: "Trading Economics Uranium",
      url: "https://tradingeconomics.com/commodity/uranium",
      domain: "tradingeconomics.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 2,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  GLOBAL MINING NEWS
  ==================================================
  */

  miningNews: [
    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 1,
      type: "news",
    },

    {
      name: "Mining.com",
      url: "https://www.mining.com/",
      domain: "mining.com",
      priority: 2,
      type: "news",
    },

    {
      name: "Mining Weekly",
      url: "https://www.miningweekly.com/",
      domain: "miningweekly.com",
      priority: 3,
      type: "news",
    },

    {
      name: "International Mining",
      url: "https://im-mining.com/",
      domain: "im-mining.com",
      priority: 4,
      type: "news",
    },

    {
      name: "S&P Global Market Intelligence",
      url: "https://www.spglobal.com/market-intelligence/",
      domain: "spglobal.com",
      priority: 5,
      type: "financial",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  GOVERNMENT / GEOLOGY
  ==================================================
  */

  government: [
    {
      name: "USGS",
      url: "https://www.usgs.gov/",
      domain: "usgs.gov",
      priority: 1,
      type: "government",
    },

    {
      name: "Geological Survey of India",
      url: "https://www.gsi.gov.in/",
      domain: "gsi.gov.in",
      priority: 2,
      type: "geology",
    },

    {
      name: "Ministry of Mines India",
      url: "https://mines.gov.in/",
      domain: "mines.gov.in",
      priority: 3,
      type: "government",
    },

    {
      name: "Indian Bureau of Mines",
      url: "https://ibm.gov.in/",
      domain: "ibm.gov.in",
      priority: 4,
      type: "government",
    },

    {
      name: "Geoscience Australia",
      url: "https://www.ga.gov.au/",
      domain: "ga.gov.au",
      priority: 5,
      type: "government",
    },

    {
      name: "Natural Resources Canada",
      url: "https://natural-resources.canada.ca/",
      domain: "natural-resources.canada.ca",
      priority: 6,
      type: "government",
    },

    {
      name: "Geological Survey of Canada",
      url: "https://natural-resources.canada.ca/science-data/science-research/earth-sciences",
      domain: "natural-resources.canada.ca",
      priority: 7,
      type: "geology",
    },

    {
      name: "British Geological Survey",
      url: "https://www.bgs.ac.uk/",
      domain: "bgs.ac.uk",
      priority: 8,
      type: "geology",
    },

    {
      name: "Brazil Geological Survey",
      url: "https://www.sgb.gov.br/",
      domain: "sgb.gov.br",
      priority: 9,
      type: "geology",
    },

    {
      name: "SERNAGEOMIN Chile",
      url: "https://www.sernageomin.cl/",
      domain: "sernageomin.cl",
      priority: 10,
      type: "government",
    },

    {
      name: "INGEMMET Peru",
      url: "https://www.gob.pe/ingemmet",
      domain: "gob.pe",
      priority: 11,
      type: "government",
    },

    {
      name: "Council for Geoscience South Africa",
      url: "https://www.geoscience.org.za/",
      domain: "geoscience.org.za",
      priority: 12,
      type: "geology",
    },

    {
      name: "Geological Survey of Finland",
      url: "https://www.gtk.fi/en/",
      domain: "gtk.fi",
      priority: 13,
      type: "geology",
    },

    {
      name: "Geological Survey of Norway",
      url: "https://www.ngu.no/en",
      domain: "ngu.no",
      priority: 14,
      type: "geology",
    },

    {
      name: "Geological Survey of Sweden",
      url: "https://www.sgu.se/en/",
      domain: "sgu.se",
      priority: 15,
      type: "geology",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  MINING REGULATION
  ==================================================
  */

  regulation: [
    {
      name: "Ministry of Mines India",
      url: "https://mines.gov.in/",
      domain: "mines.gov.in",
      priority: 1,
      type: "government",
    },

    {
      name: "Indian Bureau of Mines",
      url: "https://ibm.gov.in/",
      domain: "ibm.gov.in",
      priority: 2,
      type: "government",
    },

    {
      name: "US EPA",
      url: "https://www.epa.gov/",
      domain: "epa.gov",
      priority: 3,
      type: "government",
    },

    {
      name: "Government of Canada",
      url: "https://www.canada.ca/",
      domain: "canada.ca",
      priority: 4,
      type: "government",
    },

    {
      name: "Australian Government",
      url: "https://www.australia.gov.au/",
      domain: "australia.gov.au",
      priority: 5,
      type: "government",
    },

    {
      name: "UK Government",
      url: "https://www.gov.uk/",
      domain: "gov.uk",
      priority: 6,
      type: "government",
    },

    {
      name: "European Commission",
      url: "https://commission.europa.eu/",
      domain: "europa.eu",
      priority: 7,
      type: "government",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  COMPANY RANKING
  ==================================================
  */

  companyRanking: [
    {
      name: "CompaniesMarketCap Mining",
      url: "https://companiesmarketcap.com/mining/largest-mining-companies-by-market-cap/",
      domain: "companiesmarketcap.com",
      priority: 1,
      type: "financial",
    },

    {
      name: "S&P Global Market Intelligence",
      url: "https://www.spglobal.com/market-intelligence/",
      domain: "spglobal.com",
      priority: 2,
      type: "financial",
    },

    {
      name: "Mining.com",
      url: "https://www.mining.com/",
      domain: "mining.com",
      priority: 3,
      type: "news",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  CANADA COMPANY RANKING
  ==================================================
  */

  companyRankingCanada: [
    {
      name: "CompaniesMarketCap Canada",
      url: "https://companiesmarketcap.com/canada/largest-companies-in-canada-by-market-cap/",
      domain: "companiesmarketcap.com",
      priority: 1,
      type: "financial",
    },

    {
      name: "TMX Group",
      url: "https://www.tmx.com/",
      domain: "tmx.com",
      priority: 2,
      type: "exchange",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  UNITED STATES
  ==================================================
  */

  unitedStates: [
    {
      name: "USGS",
      url: "https://www.usgs.gov/",
      domain: "usgs.gov",
      priority: 1,
      type: "government",
    },

    {
      name: "US EPA",
      url: "https://www.epa.gov/",
      domain: "epa.gov",
      priority: 2,
      type: "government",
    },

    {
      name: "SEC",
      url: "https://www.sec.gov/",
      domain: "sec.gov",
      priority: 3,
      type: "regulator",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  CANADA
  ==================================================
  */

  canada: [
    {
      name: "Natural Resources Canada",
      url: "https://natural-resources.canada.ca/",
      domain: "natural-resources.canada.ca",
      priority: 1,
      type: "government",
    },

    {
      name: "Government of Canada",
      url: "https://www.canada.ca/",
      domain: "canada.ca",
      priority: 2,
      type: "government",
    },

    {
      name: "TMX Group",
      url: "https://www.tmx.com/",
      domain: "tmx.com",
      priority: 3,
      type: "exchange",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  AUSTRALIA
  ==================================================
  */

  australia: [
    {
      name: "Geoscience Australia",
      url: "https://www.ga.gov.au/",
      domain: "ga.gov.au",
      priority: 1,
      type: "geology",
    },

    {
      name: "Australian Government",
      url: "https://www.australia.gov.au/",
      domain: "australia.gov.au",
      priority: 2,
      type: "government",
    },

    {
      name: "ASX",
      url: "https://www.asx.com.au/",
      domain: "asx.com.au",
      priority: 3,
      type: "exchange",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  INDIA
  ==================================================
  */

  india: [
    {
      name: "Ministry of Mines India",
      url: "https://mines.gov.in/",
      domain: "mines.gov.in",
      priority: 1,
      type: "government",
    },

    {
      name: "Indian Bureau of Mines",
      url: "https://ibm.gov.in/",
      domain: "ibm.gov.in",
      priority: 2,
      type: "government",
    },

    {
      name: "Geological Survey of India",
      url: "https://www.gsi.gov.in/",
      domain: "gsi.gov.in",
      priority: 3,
      type: "geology",
    },

    {
      name: "SEBI",
      url: "https://www.sebi.gov.in/",
      domain: "sebi.gov.in",
      priority: 4,
      type: "regulator",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  CHINA
  ==================================================
  */

  china: [
    {
      name: "Ministry of Natural Resources China",
      url: "https://www.mnr.gov.cn/",
      domain: "mnr.gov.cn",
      priority: 1,
      type: "government",
    },

    {
      name: "China Geological Survey",
      url: "https://www.cgs.gov.cn/",
      domain: "cgs.gov.cn",
      priority: 2,
      type: "geology",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  BRAZIL
  ==================================================
  */

  brazil: [
    {
      name: "Brazilian Geological Survey",
      url: "https://www.sgb.gov.br/",
      domain: "sgb.gov.br",
      priority: 1,
      type: "geology",
    },

    {
      name: "ANM Brazil",
      url: "https://www.gov.br/anm/",
      domain: "gov.br",
      priority: 2,
      type: "regulator",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  CHILE
  ==================================================
  */

  chile: [
    {
      name: "SERNAGEOMIN",
      url: "https://www.sernageomin.cl/",
      domain: "sernageomin.cl",
      priority: 1,
      type: "government",
    },

    {
      name: "COCHILCO",
      url: "https://www.cochilco.cl/",
      domain: "cochilco.cl",
      priority: 2,
      type: "government",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  SOUTH AFRICA
  ==================================================
  */

  southAfrica: [
    {
      name: "Department of Mineral and Petroleum Resources",
      url: "https://www.dmre.gov.za/",
      domain: "dmre.gov.za",
      priority: 1,
      type: "government",
    },

    {
      name: "Council for Geoscience",
      url: "https://www.geoscience.org.za/",
      domain: "geoscience.org.za",
      priority: 2,
      type: "geology",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  PERU
  ==================================================
  */

  peru: [
    {
      name: "INGEMMET",
      url: "https://www.gob.pe/ingemmet",
      domain: "gob.pe",
      priority: 1,
      type: "government",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  MEXICO
  ==================================================
  */

  mexico: [
    {
      name: "Mexican Government",
      url: "https://www.gob.mx/",
      domain: "gob.mx",
      priority: 1,
      type: "government",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  INDONESIA
  ==================================================
  */

  indonesia: [
    {
      name: "Ministry of Energy and Mineral Resources Indonesia",
      url: "https://www.esdm.go.id/",
      domain: "esdm.go.id",
      priority: 1,
      type: "government",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  UNITED KINGDOM
  ==================================================
  */

  unitedKingdom: [
    {
      name: "British Geological Survey",
      url: "https://www.bgs.ac.uk/",
      domain: "bgs.ac.uk",
      priority: 1,
      type: "geology",
    },

    {
      name: "UK Government",
      url: "https://www.gov.uk/",
      domain: "gov.uk",
      priority: 2,
      type: "government",
    },
  ] satisfies SourceDefinition[],


  /*
  ==================================================
  RIO TINTO / SIMANDOU
  ==================================================

  Project-specific sources.
  */

  simandou: [
    {
      name: "Rio Tinto Simandou",
      url: "https://www.riotinto.com/en/operations/africa/simandou",
      domain: "riotinto.com",
      priority: 1,
      type: "official",
    },

    {
      name: "Rio Tinto Africa",
      url: "https://www.riotinto.com/en/operations/africa",
      domain: "riotinto.com",
      priority: 2,
      type: "official",
    },

    {
      name: "Rio Tinto Key Project Updates",
      url: "https://www.riotinto.com/en/invest/reports/annual-report/key-project-updates",
      domain: "riotinto.com",
      priority: 3,
      type: "official",
    },

    {
      name: "Rio Tinto News",
      url: "https://www.riotinto.com/en/news",
      domain: "riotinto.com",
      priority: 4,
      type: "official",
    },

    {
      name: "Mining.com",
      url: "https://www.mining.com/",
      domain: "mining.com",
      priority: 5,
      type: "news",
    },

    {
      name: "Mining Weekly",
      url: "https://www.miningweekly.com/",
      domain: "miningweekly.com",
      priority: 6,
      type: "news",
    },

    {
      name: "International Mining",
      url: "https://im-mining.com/",
      domain: "im-mining.com",
      priority: 7,
      type: "news",
    },
  ] satisfies SourceDefinition[],

} as const;


/*
==================================================
COMPANY SOURCES
==================================================
*/

export const COMPANY_DOMAINS: Record<
  string,
  SourceDefinition[]
> = {

  "rio tinto": [
    {
      name: "Rio Tinto Simandou",
      url: "https://www.riotinto.com/en/operations/africa/simandou",
      domain: "riotinto.com",
      priority: 1,
      type: "official",
    },

    {
      name: "Rio Tinto Africa",
      url: "https://www.riotinto.com/en/operations/africa",
      domain: "riotinto.com",
      priority: 2,
      type: "official",
    },

    {
      name: "Rio Tinto Key Project Updates",
      url: "https://www.riotinto.com/en/invest/reports/annual-report/key-project-updates",
      domain: "riotinto.com",
      priority: 3,
      type: "official",
    },

    {
      name: "Rio Tinto News",
      url: "https://www.riotinto.com/en/news",
      domain: "riotinto.com",
      priority: 4,
      type: "official",
    },
  ],

  "barrick mining": [
    {
      name: "Barrick Mining",
      url: "https://www.barrick.com/",
      domain: "barrick.com",
      priority: 1,
      type: "official",
    },
  ],

  newmont: [
    {
      name: "Newmont",
      url: "https://www.newmont.com/",
      domain: "newmont.com",
      priority: 1,
      type: "official",
    },
  ],

  bhp: [
  {
  name: "BHP Operational Reviews",
  url: "https://www.bhp.com/news/media-centre/releases",
  domain: "bhp.com",
  priority: 1,
  type: "official",
},
  ],

  "anglo american": [
    {
      name: "Anglo American",
      url: "https://www.angloamerican.com/",
      domain: "angloamerican.com",
      priority: 1,
      type: "official",
    },
  ],

  glencore: [
    {
      name: "Glencore",
      url: "https://www.glencore.com/",
      domain: "glencore.com",
      priority: 1,
      type: "official",
    },
  ],

  "freeport mcmoran": [
    {
      name: "Freeport-McMoRan",
      url: "https://www.fcx.com/",
      domain: "fcx.com",
      priority: 1,
      type: "official",
    },
  ],

  vale: [
    {
      name: "Vale",
      url: "https://www.vale.com/",
      domain: "vale.com",
      priority: 1,
      type: "official",
    },
  ],

  fortescue: [
    {
      name: "Fortescue",
      url: "https://www.fortescue.com/",
      domain: "fortescue.com",
      priority: 1,
      type: "official",
    },
  ],

  "agnico eagle": [
    {
      name: "Agnico Eagle",
      url: "https://www.agnicoeagle.com/",
      domain: "agnicoeagle.com",
      priority: 1,
      type: "official",
    },
  ],

  kinross: [
    {
      name: "Kinross Gold",
      url: "https://www.kinross.com/",
      domain: "kinross.com",
      priority: 1,
      type: "official",
    },
  ],

  "teck resources": [
    {
      name: "Teck Resources",
      url: "https://www.teck.com/",
      domain: "teck.com",
      priority: 1,
      type: "official",
    },
  ],
};


/*
==================================================
COMMODITIES
==================================================
*/

export const COMMODITIES = [
  "gold",
  "silver",
  "copper",
  "platinum",
  "palladium",
  "nickel",
  "zinc",
  "lead",
  "iron ore",
  "lithium",
  "cobalt",
  "uranium",
  "tin",
  "aluminium",
  "aluminum",
  "coal",
  "manganese",
  "chromium",
  "potash",
] as const;