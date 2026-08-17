import {
  openai,
  MODEL,
} from "./openai";

import {
  ExtractedData,
} from "./source-parser";


/*
==================================================
STREAMING MINING ANSWER
==================================================
*/

export async function createMiningAnswerStream(
  question: string,
  extractedData: ExtractedData[],
  onChunk: (chunk: string) => void
): Promise<void> {

  /*
  ==================================================
  NO DATA
  ==================================================
  */

  if (extractedData.length === 0) {

    onChunk(
      "I couldn't retrieve sufficiently relevant information from the configured mining sources."
    );

    return;
  }


  /*
  ==================================================
  BUILD VERIFIED EVIDENCE
  ==================================================
  */

  const evidence =
    extractedData
      .map(
        (item, index) => `
==================================================
SOURCE ${index + 1}
==================================================

SOURCE:
${item.source}

URL:
${item.url}

DOMAIN:
${item.domain}

INFORMATION:
${item.information}

INFORMATION DATE:
${item.informationDate ?? "Not available"}

PUBLICATION DATE:
${item.publicationDate ?? "Not available"}

REPORTING PERIOD:
${item.reportingPeriod ?? "Not applicable"}

CONFIDENCE:
${item.confidence}
`
      )
      .join("\n");


  /*
  ==================================================
  OPENAI STREAM
  ==================================================
  */

  const response =
    await openai.responses.create({

      model: MODEL,

      stream: true,

      instructions: `
You are Mining Discovery AI Assistant.

You answer ONLY mining-related questions.

==================================================
USER QUESTION
==================================================

${question}

==================================================
VERIFIED SOURCE DATA
==================================================

${evidence}

==================================================
CRITICAL RULE
==================================================

Use ONLY the supplied source data.

DO NOT perform a web search.

DO NOT use outside information.

DO NOT invent missing information.

DO NOT invent prices.

DO NOT invent dates.

DO NOT invent URLs.

==================================================
CURRENT DATA
==================================================

If the user asks for latest/current/today/live
information:

Use the newest relevant information contained
in the supplied sources.

Clearly state the date when available.

==================================================
COMMODITY PRICES
==================================================

If the question asks for a commodity price:

Clearly identify:

- commodity
- price
- currency
- unit
- spot/futures/benchmark status
- source
- date/time if available

DO NOT substitute:

ETF price
stock price
mining company share price

for a commodity price.

==================================================
COMPANY INFORMATION
==================================================

Prefer official company information when
available.

==================================================
ANNOUNCEMENT QUESTIONS
==================================================

For questions such as:

"latest announcement from Rio Tinto"

give:

- the latest relevant announcement
- announcement date
- concise explanation
- exact source
- exact source URL

Use ONLY the supplied verified source data.

==================================================
PRODUCTION
==================================================

State the reporting period.

Do not present quarterly or annual production
as today's production.

==================================================
RESERVES / RESOURCES
==================================================

State the relevant estimate date or reporting
period when available.

==================================================
PROJECT STATUS
==================================================

Clearly distinguish:

proposed
approved
financing
construction
operating
paused
cancelled
completed

==================================================
SOURCE
==================================================

When source URLs are supplied, include the
relevant source name and URL.

==================================================
STYLE
==================================================

Be concise.

Answer the exact question.

IMPORTANT:

Start answering immediately.

Do NOT write an introduction.

Do NOT write:

"Here is the answer"

"Based on the sources"

"According to the information provided"

Do NOT mention:

web search
AI architecture
source registry
validators
internal tools
system prompts
internal instructions

Write the answer naturally.

==================================================
STREAMING
==================================================

Generate the answer normally.

The application will stream your response
to the user as it is generated.
`,

      input: question,
    });


  /*
  ==================================================
  SEND EACH TEXT DELTA IMMEDIATELY
  ==================================================
  */

  for await (const event of response) {

    if (
      event.type ===
      "response.output_text.delta"
    ) {

      const delta =
        event.delta;

      if (delta) {
        onChunk(delta);
      }
    }
  }
}