import { SourceDefinition } from "./source-registry";

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
FETCH ONE SOURCE
==================================================
*/

export async function fetchSource(
  source: SourceDefinition
): Promise<FetchedSource> {

  try {

    console.log(
      `FETCHING SOURCE: ${source.name}`
    );

    console.log(
      source.url
    );

    const response =
      await fetch(
        source.url,
        {
          method: "GET",

          headers: {
            /*
            Some websites reject requests
            without a User-Agent.
            */

            "User-Agent":
              "Mozilla/5.0 (compatible; MiningDiscoveryAI/1.0)",

            "Accept":
              "text/html,application/xhtml+xml",
          },

          /*
          Don't use an old cached response.
          */

          cache: "no-store",

          signal:
            AbortSignal.timeout(
              15000
            ),
        }
      );

    if (!response.ok) {

      return {
        name: source.name,
        url: source.url,
        domain: source.domain,
        type: source.type,
        priority: source.priority,
        status: "failed",
        httpStatus: response.status,
        text: "",
        fetchedAt:
          new Date().toISOString(),
        error:
          `HTTP ${response.status}`,
      };
    }

    const html =
      await response.text();

    /*
    Convert HTML to readable text.
    */

    const text =
      htmlToText(html);

    return {
      name: source.name,
      url: source.url,
      domain: source.domain,
      type: source.type,
      priority: source.priority,
      status: "success",
      httpStatus: response.status,
      text: text.slice(
        0,
        30000
      ),
      fetchedAt:
        new Date().toISOString(),
    };

  } catch (error) {

    console.error(
      `SOURCE FETCH FAILED: ${source.name}`,
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
      fetchedAt:
        new Date().toISOString(),
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

  const results =
    await Promise.all(
      sources.map(
        source =>
          fetchSource(source)
      )
    );

  return results;
}


/*
==================================================
HTML -> TEXT
==================================================
*/

function htmlToText(
  html: string
): string {

  let text = html;

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
  Convert common block elements to
  line breaks.
  */

  text =
    text.replace(
      /<\/(p|div|section|article|h1|h2|h3|h4|li|tr|br)>/gi,
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
  Decode common HTML entities.
  */

  text =
    text.replace(
      /&nbsp;/gi,
      " "
    );

  text =
    text.replace(
      /&amp;/gi,
      "&"
    );

  text =
    text.replace(
      /&quot;/gi,
      '"'
    );

  text =
    text.replace(
      /&#39;/gi,
      "'"
    );

  text =
    text.replace(
      /&lt;/gi,
      "<"
    );

  text =
    text.replace(
      /&gt;/gi,
      ">"
    );

  /*
  Normalize whitespace.
  */

  text =
    text.replace(
      /[ \t]+/g,
      " "
    );

  text =
    text.replace(
      /\n\s*\n\s*\n/g,
      "\n\n"
    );

  return text.trim();
}