export type ChartType =
  | "bar"
  | "line"
  | "pie"
  | "doughnut";

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartPayload = {
  type: ChartType;
  title: string;
  unit?: string;
  data: ChartDataPoint[];
};


/*
==================================================
GENERIC CHART BUILDER
==================================================

This file does NOT know about:
- gold
- market cap
- companies
- production
- countries
- commodities

It only understands structured numerical data.
==================================================
*/


export type ChartBuildInput = {
  question: string;
  title?: string;
  unit?: string;

  data: ChartDataPoint[];
};


function isValidDataPoint(
  point: ChartDataPoint
): boolean {

  return (
    typeof point.label === "string" &&
    point.label.trim().length > 0 &&
    typeof point.value === "number" &&
    Number.isFinite(point.value)
  );
}


/*
==================================================
DETECT TIME SERIES
==================================================
*/

function isTimeLabel(label: string): boolean {

  const value = label.trim();

  /*
  2020
  2021
  2022
  */

  if (/^(19|20)\d{2}$/.test(value)) {
    return true;
  }

  /*
  Jan 2026
  January 2026
  */

  if (
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(
      value
    )
  ) {
    return true;
  }

  /*
  2026-01
  2026-02
  */

  if (/^\d{4}-\d{1,2}$/.test(value)) {
    return true;
  }

  /*
  Dates such as:
  2026-01-15
  */

  if (
    /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)
  ) {
    return true;
  }

  return false;
}


/*
==================================================
CHOOSE CHART TYPE
==================================================
*/

function chooseChartType(
  data: ChartDataPoint[]
): ChartType {

  if (data.length < 2) {
    return "bar";
  }

  const timeSeriesCount =
    data.filter((point) =>
      isTimeLabel(point.label)
    ).length;

  /*
  If most labels represent dates/years,
  use a line chart.
  */

  if (
    timeSeriesCount >= 2 &&
    timeSeriesCount >= data.length / 2
  ) {
    return "line";
  }

  /*
  For category comparisons,
  use bar.
  */

  return "bar";
}


/*
==================================================
BUILD GENERIC CHART
==================================================
*/

export function buildChart(
  input: ChartBuildInput
): ChartPayload | null {

  if (
    !input ||
    !Array.isArray(input.data)
  ) {
    return null;
  }

  const data = input.data
    .filter(isValidDataPoint)
    .slice(0, 20);

  /*
  Need at least two values
  to make a meaningful chart.
  */

  if (data.length < 2) {
    return null;
  }

  const type =
    chooseChartType(data);

  return {
    type,

    title:
      input.title?.trim() ||
      "Data Visualization",

    ...(input.unit
      ? {
          unit: input.unit,
        }
      : {}),

    data,
  };
}


/*
==================================================
BUILD CHART FROM AI ANSWER
==================================================

Converts numerical information in the generated
answer into structured chart data.

This remains generic:
- no company names
- no commodities
- no countries
- no mining topics hard-coded
==================================================
*/

export function buildChartForAnswer(
  question: string,
  answer: string
): ChartPayload | null {

  if (!question?.trim() || !answer?.trim()) {
    return null;
  }

  const data: ChartDataPoint[] = [];

  /*
  ==================================================
  HELPERS
  ==================================================
  */

  function parseNumber(value: string): number | null {

    const cleaned = value
      .replace(/,/g, "")
      .replace(/[$€£₹¥%]/g, "")
      .trim();

    const match = cleaned.match(
      /[-+]?\d+(?:\.\d+)?/
    );

    if (!match) {
      return null;
    }

    const number = Number(match[0]);

    return Number.isFinite(number)
      ? number
      : null;
  }


function cleanLabel(label: string): string {

  return label
    .replace(
      /^\s*(?:[-*•]|\d+[.)])\s*/,
      ""
    )
    .replace(
      /[:|—–-]\s*$/,
      ""
    )
    .replace(
      /\s*\([^)]*\)/g,
      ""
    )
    .replace(
      /\b(?:metric\s+tons?|tonnes?|tons?|ton)\b/gi,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

  function addDataPoint(
    label: string,
    value: number | null
  ) {

    const cleanedLabel =
      cleanLabel(label);

    if (
      !cleanedLabel ||
      value === null ||
      !Number.isFinite(value)
    ) {
      return;
    }

    /*
    Do not create charts from a single year
    or obvious numbering.
    */

    if (
      /^\d{1,4}$/.test(cleanedLabel) &&
      value === Number(cleanedLabel)
    ) {
      return;
    }

    data.push({
      label: cleanedLabel,
      value,
    });
  }


  /*
  ==================================================
  1. MARKDOWN TABLES
  ==================================================
  */

  const tableRows =
    answer.match(
      /^\|[^|\n]+\|[^|\n]+\|.*$/gm
    ) || [];

  for (const row of tableRows) {

    const cells =
      row
        .split("|")
        .map(cell => cell.trim())
        .filter(Boolean);

    if (cells.length < 2) {
      continue;
    }

    /*
    Ignore markdown separator rows.
    */

    if (
      cells.every(cell =>
        /^[-:]+$/.test(cell)
      )
    ) {
      continue;
    }

    const value =
      parseNumber(cells[1]);

    addDataPoint(
      cells[0],
      value
    );
  }


  /*
  ==================================================
  2. NUMBERED / BULLET LISTS
  ==================================================

  Examples:

  1. BHP — $245 billion
  2. Rio Tinto — $157 billion

  - Gold — $4,700
  - Copper — $10,000
  ==================================================
  */

  if (data.length < 2) {

    const lines =
      answer.split(/\r?\n/);

    for (const line of lines) {

      const cleaned =
        line.trim();

      if (!cleaned) {
        continue;
      }

      /*
      Require a list-style line.
      */

      if (
        !/^(?:\d+[.)]|[-*•])\s+/.test(
          cleaned
        )
      ) {
        continue;
      }

      const withoutPrefix =
        cleaned.replace(
          /^(?:\d+[.)]|[-*•])\s+/,
          ""
        );

      const valueMatch =
        withoutPrefix.match(
          /[-+]?(?:[$€£₹¥]\s*)?\d[\d,]*(?:\.\d+)?\s*(?:trillion|billion|million|thousand|tn|bn|mn|k|m|b|t)?/i
        );

      if (!valueMatch) {
        continue;
      }

      const value =
        parseNumber(
          valueMatch[0]
        );

      const label =
  withoutPrefix
    .replace(valueMatch[0], "")
    .replace(/[-—–:|]+/g, " ")
    .replace(
      /\s*\([^)]*\)/g,
      ""
    )
    .replace(
      /\b(?:metric\s+tons?|tonnes?|tons?|ton)\b/gi,
      ""
    )
    .replace(
      /\b(?:trillion|billion|million|thousand|tn|bn|mn|k|m|b|t)\b/gi,
      ""
    )
    .trim();

if (!label || label.length > 50) {
  continue;
}

addDataPoint(
  label,
  value
);
    }
  }


  /*
  ==================================================
  3. YEAR / DATE SERIES
  ==================================================

  Supports:

  2021: 120
  2022: 145
  2023: 160

  2021 - 120
  2022 - 145
  ==================================================
  */

  if (data.length < 2) {

    const lines =
      answer.split(/\r?\n/);

    for (const line of lines) {

      const match =
        line.match(
          /^\s*((?:19|20)\d{2})\s*(?::|[-–—])\s*([-+]?(?:\d[\d,]*(?:\.\d+)?))/i
        );

      if (!match) {
        continue;
      }

      const value =
        parseNumber(
          match[2]
        );

      addDataPoint(
        match[1],
        value
      );
    }
  }


  /*
  ==================================================
  4. DATE + VALUE PAIRS
  ==================================================

  Examples:

  Jan 2025: 120
  Feb 2025: 135

  January 2025 - 120
  February 2025 - 145
  ==================================================
  */

  if (data.length < 2) {

    const lines =
      answer.split(/\r?\n/);

    for (const line of lines) {

      const match =
        line.match(
          /^\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*(?::|[-–—])\s*([-+]?(?:\d[\d,]*(?:\.\d+)?))/i
        );

      if (!match) {
        continue;
      }

      const value =
        parseNumber(
          match[2]
        );

      addDataPoint(
        match[1],
        value
      );
    }
  }


  /*
  ==================================================
  5. SENTENCE-BASED COMPARISONS
  ==================================================

  Supports natural answers such as:

  BHP has a market capitalization of
  $245 billion, while Rio Tinto has
  $157 billion.

  Gold production was 3.2 million tonnes
  in 2024 and 3.5 million tonnes in 2025.
  ==================================================
  */

  if (data.length < 2) {

    const sentences =
      answer
        .split(/[.!?]\s+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);

    for (const sentence of sentences) {

      /*
      ------------------------------------------------
      ENTITY -> VALUE
      ------------------------------------------------
      */

      const entityValueMatches =
  sentence.matchAll(
    /(?:^|[,;])\s*([A-Za-z][A-Za-z0-9&'().\-/]*(?:\s+[A-Za-z][A-Za-z0-9&'().\-/]*){0,3})\s+(?:has|had|was|is|reached|reported|recorded|produced|generated|stood at|amounted to|totaled|totalled)\s+(?:a\s+)?(?:value\s+of\s+|market capitalization\s+of\s+|market cap\s+of\s+)?([-+]?(?:[$€£₹¥]\s*)?\d[\d,]*(?:\.\d+)?\s*(?:trillion|billion|million|thousand|metric tons?|tonnes?|tons?|tn|bn|mn|k|m|b|t)?)/gi
  );

      for (
        const match of entityValueMatches
      ) {

        const label =
          match[1]
            .trim();

        const value =
          parseNumber(
            match[2]
          );

        addDataPoint(
          label,
          value
        );
      }
    }
  }


  /*
  ==================================================
  6. REMOVE DUPLICATES
  ==================================================
  */

  const uniqueData =
    Array.from(
      new Map(
        data.map(point => [
          point.label
            .toLowerCase()
            .trim(),
          point,
        ])
      ).values()
    );


  /*
  ==================================================
  7. REQUIRE AT LEAST TWO VALUES
  ==================================================
  */

  if (
    uniqueData.length < 2
  ) {
    return null;
  }


  /*
  ==================================================
  8. LIMIT CHART SIZE
  ==================================================
  */

  const chartData =
    uniqueData.slice(0, 20);


  /*
  ==================================================
  9. TITLE
  ==================================================
  */

  const title =
    "Data Visualization";


  /*
  ==================================================
  10. BUILD GENERIC CHART
  ==================================================
  */

  return buildChart({

    question,

    title:
      title || "Data Visualization",

    data:
      chartData,

  });
}