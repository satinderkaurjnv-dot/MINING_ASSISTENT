/*
==================================================
MINING DISCOVERY
SOURCE REGISTRY
==================================================

IMPORTANT:

These are the ONLY sources used by the current-data
pipeline.

OpenAI web search is NOT used.

You can add/remove sources here.
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

export const SOURCE_REGISTRY = {

  /*
  ==================================================
  GOLD
  ==================================================
  */

  gold: [
    {
      name: "Reuters",
      url: "https://www.reuters.com/markets/commodities/",
      domain: "reuters.com",
      priority: 1,
      type: "news",
    },

    {
      name: "Kitco",
      url: "https://www.kitco.com/charts/gold",
      domain: "kitco.com",
      priority: 2,
      type: "commodity",
    },

    {
      name: "Investing.com Gold",
      url: "https://www.investing.com/commodities/gold",
      domain: "investing.com",
      priority: 3,
      type: "commodity",
    },

    {
      name: "Trading Economics Gold",
      url: "https://tradingeconomics.com/commodity/gold",
      domain: "tradingeconomics.com",
      priority: 4,
      type: "commodity",
    },

    {
      name: "LBMA",
      url: "https://www.lbma.org.uk/prices-and-data",
      domain: "lbma.org.uk",
      priority: 5,
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
      name: "Kitco",
      url: "https://www.kitco.com/charts/silver",
      domain: "kitco.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Investing.com",
      url: "https://www.investing.com/commodities/silver",
      domain: "investing.com",
      priority: 2,
      type: "commodity",
    },

    {
      name: "Trading Economics",
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
      name: "Investing.com",
      url: "https://www.investing.com/commodities/copper",
      domain: "investing.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Trading Economics",
      url: "https://tradingeconomics.com/commodity/copper",
      domain: "tradingeconomics.com",
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
  NICKEL
  ==================================================
  */

  nickel: [
    {
      name: "Investing.com",
      url: "https://www.investing.com/commodities/nickel",
      domain: "investing.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Trading Economics",
      url: "https://tradingeconomics.com/commodity/nickel",
      domain: "tradingeconomics.com",
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
  ALUMINIUM
  ==================================================
  */

  aluminium: [
    {
      name: "Investing.com",
      url: "https://www.investing.com/commodities/aluminum",
      domain: "investing.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Trading Economics",
      url: "https://tradingeconomics.com/commodity/aluminum",
      domain: "tradingeconomics.com",
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
  IRON ORE
  ==================================================
  */

  "iron ore": [
    {
      name: "Trading Economics",
      url: "https://tradingeconomics.com/commodity/iron-ore",
      domain: "tradingeconomics.com",
      priority: 1,
      type: "commodity",
    },

    {
      name: "Investing.com",
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
      name: "Trading Economics",
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
      name: "Trading Economics",
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
  MINING NEWS
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
  ] satisfies SourceDefinition[],

  /*
  ==================================================
  REGULATION
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
      name: "Rio Tinto",
      url: "https://www.riotinto.com/",
      domain: "riotinto.com",
      priority: 1,
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

  "newmont": [
    {
      name: "Newmont",
      url: "https://www.newmont.com/",
      domain: "newmont.com",
      priority: 1,
      type: "official",
    },
  ],

  "bhp": [
    {
      name: "BHP",
      url: "https://www.bhp.com/",
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

  "glencore": [
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

  "vale": [
    {
      name: "Vale",
      url: "https://www.vale.com/",
      domain: "vale.com",
      priority: 1,
      type: "official",
    },
  ],

  "fortescue": [
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

  "kinross": [
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
];