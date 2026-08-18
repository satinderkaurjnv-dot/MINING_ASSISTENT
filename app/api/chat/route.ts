import {
  openai,
  MODEL,
} from "../../lib/openai";

import companyKnowledge from "../../lib/company-knowledge";

import {
  miningAgentKnowledge,
} from "../../lib/knowledge";

import {
  connectMongoDB,
} from "../../../server/mongodb";

import {
  needsCurrentData,
  detectTopic,
  detectCommodity,
  detectCompany,
  detectCountry,
} from "../../lib/topic-detector";

import {
  fetchSourcesForQuestion,
} from "../../lib/source-fetcher";

import {
  extractSourceData,
} from "../../lib/source-parser";

import {
  createMiningAnswerStream,
} from "../../lib/mining-answer";


/*
==================================================
FRONTEND
==================================================
*/

const FRONTEND_URL =
  "https://mining-ai-assistent-vvxl-475xy5yf5.vercel.app";


/*
==================================================
COMPANY CONTEXT
==================================================
*/

const companyContext = `
==================================================
MINING DISCOVERY COMPANY KNOWLEDGE
==================================================

${JSON.stringify(
  companyKnowledge,
  null,
  2
)}

==================================================
IMPORTANT COMPANY RULES
==================================================

Use this knowledge when answering questions
specifically about Mining Discovery.

Do not invent company information.

Do not invent employees or executives.

Do not invent services.

Do not invent prices.

Do not invent phone numbers.

Do not invent addresses.

Do not invent partnerships.

If the requested company information is not
available in this knowledge, clearly say that
the information is not available and direct
the visitor to contact Mining Discovery.

Identify yourself as an AI assistant.

Never pretend to be a Mining Discovery employee.

For investment questions, provide general
educational information only.

Do not guarantee financial returns.

Answer politely, professionally and concisely.
`;


/*
==================================================
SAVE CONVERSATION MESSAGE
==================================================
*/

async function saveConversationMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {

  try {

    const db =
      await connectMongoDB();

    const collection =
      db.collection(
        "conversations"
      );

    const now =
      new Date().toISOString();

    await collection.updateOne(

      {
        id: conversationId,
      },

      {
        $set: {
          updatedAt: now,
        },

        $setOnInsert: {
          id: conversationId,
          createdAt: now,
        },

        $push: {
          messages: {
            role,
            content,
            timestamp: now,
          },
        },
      } as any,

      {
        upsert: true,
      }
    );

    console.log(
      "CONVERSATION SAVED:",
      conversationId,
      role
    );

  } catch (error) {

    console.error(
      "FAILED TO SAVE CONVERSATION:",
      error
    );
  }
}


/*
==================================================
SLEEP
==================================================
*/

function sleep(
  ms: number
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


/*
==================================================
MINING WEB DATA DECISION
==================================================

This is important.

The bot should search globally for:

- current information
- companies
- CEOs
- executives
- countries
- mining projects
- mines
- governments
- regulations
- exploration
- production
- financial information
- rankings
- mining news

But it should NOT perform web searches for every
basic educational question.

Examples that can use knowledge:

"What is open pit mining?"

"What is copper?"

"How does flotation work?"

Examples that should use global sources:

"Who is the CEO of BHP?"

"What mining companies operate in Mongolia?"

"Gold production in Ghana"

"Mining regulations in Peru"

"Current copper price"

"Major lithium projects in Argentina"
==================================================
*/

function shouldUseGlobalMiningSearch(
  message: string
): boolean {

  const q =
    message
      .toLowerCase()
      .trim();

  /*
  --------------------------------------------------
  CURRENT DATA
  --------------------------------------------------
  */

  if (
    needsCurrentData(
      message
    )
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  DETECT ENTITIES
  --------------------------------------------------
  */

  const company =
    detectCompany(
      message
    );

  const country =
    detectCountry(
      message
    );

  const topic =
    detectTopic(
      message
    );


  /*
  --------------------------------------------------
  COMPANY QUESTIONS
  --------------------------------------------------
  */

  const companyWords = [
    "ceo",
    "chief executive",
    "executive",
    "executives",
    "leadership",
    "management",
    "president",
    "chairman",
    "chairperson",
    "director",
    "directors",
    "founder",
    "founders",
    "headquarters",
    "head office",
    "owned by",
    "owner",
    "ownership",
    "shareholder",
    "shareholders",
    "subsidiary",
    "subsidiaries",
    "company profile",
    "company information",
    "company history",
    "who owns",
    "who runs",
    "what does the company do",
  ];

  if (
    company ||
    companyWords.some(
      word =>
        q.includes(word)
    )
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  COUNTRY QUESTIONS
  --------------------------------------------------
  */

  const countryWords = [
    "mining in",
    "mines in",
    "mine in",
    "mining companies in",
    "mining company in",
    "mining industry in",
    "mining sector in",
    "mining projects in",
    "mineral resources in",
    "mineral reserves in",
    "mineral production in",
    "mineral exports from",
    "mineral imports into",
    "gold mining in",
    "copper mining in",
    "lithium mining in",
    "iron ore mining in",
    "coal mining in",
    "diamond mining in",
    "uranium mining in",
    "mining laws in",
    "mining regulations in",
    "mining policy in",
  ];

  if (
    country &&
    countryWords.some(
      word =>
        q.includes(word)
    )
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  PROJECT QUESTIONS
  --------------------------------------------------
  */

  const projectWords = [
    "project",
    "mine",
    "mine development",
    "mine status",
    "project status",
    "project update",
    "project progress",
    "construction",
    "commissioning",
    "expansion",
    "development",
    "operations",
    "operational",
  ];

  if (
    projectWords.some(
      word =>
        q.includes(word)
    )
  ) {

    /*
    Only use global search when the question
    appears to be asking about a real-world
    mining project/mine rather than explaining
    the concept of a project.
    */

    const realWorldIndicators = [
      "status",
      "update",
      "current",
      "latest",
      "company",
      "located",
      "location",
      "country",
      "owner",
      "owns",
      "production",
      "construction",
      "development",
      "operation",
      "operating",
      "announced",
      "when will",
      "where is",
      "who owns",
    ];

    if (
      realWorldIndicators.some(
        word =>
          q.includes(word)
      )
    ) {
      return true;
    }
  }


  /*
  --------------------------------------------------
  GOVERNMENT / REGULATION
  --------------------------------------------------
  */

  if (
    topic === "government" ||
    topic === "regulation"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  EXPLORATION
  --------------------------------------------------
  */

  if (
    topic === "exploration"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  FINANCIAL
  --------------------------------------------------
  */

  if (
    topic === "financial"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  RANKINGS
  --------------------------------------------------
  */

  if (
    topic === "companyRanking"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  DEFAULT
  --------------------------------------------------
  */

  return false;
}


/*
==================================================
POST
==================================================
*/

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();


    const message =
      String(
        body.message || ""
      ).trim();


    const conversationId =
      String(
        body.conversationId || ""
      ).trim();


    /*
    ==================================================
    VALIDATION
    ==================================================
    */

    if (
      !conversationId
    ) {

      return Response.json(
        {
          error:
            "Conversation ID is required",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !message
    ) {

      return Response.json(
        {
          error:
            "Message is required",
        },
        {
          status: 400,
        }
      );
    }


    /*
    ==================================================
    SAVE USER MESSAGE
    ==================================================
    */

    void saveConversationMessage(
      conversationId,
      "user",
      message
    );


    /*
    ==================================================
    STREAM CONTROLLER
    ==================================================
    */

    const encoder =
      new TextEncoder();


    let controllerRef:
      ReadableStreamDefaultController<Uint8Array> |
      null =
      null;


    const stream =
      new ReadableStream<Uint8Array>({

        start(
          controller
        ) {

          controllerRef =
            controller;
        },

        cancel() {

          controllerRef =
            null;
        },

      });


    /*
    ==================================================
    SEND
    ==================================================
    */

    function send(
      type: string,
      data: unknown
    ) {

      if (
        !controllerRef
      ) {
        return;
      }

      try {

        controllerRef.enqueue(

          encoder.encode(

            JSON.stringify({
              type,
              data,
            }) + "\n"

          )

        );

      } catch (
        error
      ) {

        console.error(
          "STREAM SEND ERROR:",
          error
        );
      }
    }


    /*
    ==================================================
    CLOSE
    ==================================================
    */

    function close() {

      if (
        controllerRef
      ) {

        try {

          controllerRef.close();

        } catch {
          // Stream already closed
        }

        controllerRef =
          null;
      }
    }


    /*
    ==================================================
    BACKGROUND PROCESS
    ==================================================
    */

    (async () => {

      try {

        console.log(
          "=========================================="
        );

        console.log(
          "MINING DISCOVERY AI"
        );

        console.log(
          "USER QUESTION:",
          message
        );

        console.log(
          "CONVERSATION ID:",
          conversationId
        );

        console.log(
          "=========================================="
        );


        /*
        ==================================================
        DETECT
        ==================================================
        */

        const current =
          needsCurrentData(
            message
          );

        const topic =
          detectTopic(
            message
          );

        const commodity =
          detectCommodity(
            message
          );

        const company =
          detectCompany(
            message
          );

        const country =
          detectCountry(
            message
          );

        const useGlobalSearch =
          shouldUseGlobalMiningSearch(
            message
          );


        console.log(
          "CURRENT DATA:",
          current
        );

        console.log(
          "TOPIC:",
          topic
        );

        console.log(
          "COMMODITY:",
          commodity
        );

        console.log(
          "COMPANY:",
          company
        );

        console.log(
          "COUNTRY:",
          country
        );

        console.log(
          "USE GLOBAL SEARCH:",
          useGlobalSearch
        );


        /*
        ==================================================
        BASIC KNOWLEDGE BRANCH
        ==================================================

        Used for educational questions.

        Example:

        What is open pit mining?

        What is flotation?

        What is a mineral resource?
        ==================================================
        */

        if (
          !useGlobalSearch
        ) {

          const knowledgeText =
            typeof miningAgentKnowledge ===
              "string"

              ? miningAgentKnowledge

              : JSON.stringify(
                  miningAgentKnowledge,
                  null,
                  2
                );


          const systemPrompt = `
You are the Mining Discovery AI Assistant.

==================================================
MINING DISCOVERY KNOWLEDGE BASE
==================================================

${knowledgeText}

==================================================
COMPANY KNOWLEDGE
==================================================

${companyContext}

==================================================
ROLE
==================================================

You are a global mining-focused AI assistant.

You can answer questions about:

- mining
- minerals
- mines
- geology
- mineral processing
- exploration
- mining equipment
- mine safety
- mining economics
- mining engineering
- commodities
- mining operations
- mining terminology
- mining technology

==================================================
RULES
==================================================

Use the knowledge base when appropriate.

Do not invent Mining Discovery information.

Do not invent employees.

Do not invent executives.

Do not invent services.

Do not invent prices.

Do not invent addresses.

Do not invent phone numbers.

Do not invent partnerships.

If a question specifically asks about Mining
Discovery and the information is unavailable,
clearly say that it is unavailable.

Do not pretend to be a Mining Discovery employee.

Identify yourself as an AI assistant.

For investment questions, provide general
educational information only.

Do not guarantee financial returns.

Do not include source names or URLs for this
basic educational response.

Answer clearly and professionally.

If the question is completely unrelated to
mining, respond exactly:

I'm a mining-focused AI assistant. I can only answer questions related to mining, minerals, mines, mining companies, mining projects, commodities, exploration, geology, processing, equipment, safety, regulations, and the global mining industry.
`;


          let answer =
            "";


          const responseStream =
            await openai.responses.create({

              model:
                MODEL,

              instructions:
                systemPrompt,

              input:
                message,

              stream:
                true,

            });


          for await (
            const event of
              responseStream
          ) {

            if (
              event.type ===
              "response.output_text.delta"
            ) {

              const chunk =
                event.delta;

              answer +=
                chunk;

              send(
                "answer",
                chunk
              );

              /*
              Visual streaming delay.
              */

              await sleep(
                100
              );
            }
          }


          if (
            answer.trim()
          ) {

            void saveConversationMessage(
              conversationId,
              "assistant",
              answer.trim()
            );
          }


          send(
            "done",
            true
          );

          close();

          return;
        }


        /*
        ==================================================
        GLOBAL MINING DATA BRANCH
        ==================================================

        IMPORTANT:

        We no longer call:

        getSourcesForQuestion()
        fetchSources()

        Instead:

        fetchSourcesForQuestion()

        performs:

        trusted sources
              +
        global web discovery
              +
        source fetching
        ==================================================
        */

        send(
          "status",
          "Searching trusted mining sources..."
        );


        const fetchedSources =
          await fetchSourcesForQuestion(
            message
          );


        console.log(
          "=========================================="
        );

        console.log(
          "FETCHED GLOBAL SOURCES"
        );

        console.log(
          fetchedSources.map(
            source => ({

              name:
                source.name,

              domain:
                source.domain,

              status:
                source.status,

              length:
                source.text.length,

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


        /*
        ==================================================
        NO SOURCES
        ==================================================
        */

        if (
          fetchedSources.length ===
          0
        ) {

          const answer =
            "I couldn't retrieve reliable information for that mining question right now. Please try again.";

          void saveConversationMessage(
            conversationId,
            "assistant",
            answer
          );

          send(
            "answer",
            answer
          );

          send(
            "done",
            true
          );

          close();

          return;
        }


        /*
        ==================================================
        STATUS
        ==================================================
        */

        send(
          "status",
          "Analyzing mining information..."
        );


        /*
        ==================================================
        EXTRACT VERIFIED DATA
        ==================================================
        */

        const extractedData =
          await extractSourceData(
            message,
            fetchedSources
          );


        console.log(
          "EXTRACTED DATA:",
          JSON.stringify(
            extractedData,
            null,
            2
          )
        );


        /*
        ==================================================
        NO VERIFIED DATA
        ==================================================
        */

        if (
          extractedData.length ===
          0
        ) {

          const answer =
            "I couldn't verify reliable information for this mining question from the available sources.";

          void saveConversationMessage(
            conversationId,
            "assistant",
            answer
          );

          send(
            "answer",
            answer
          );

          send(
            "done",
            true
          );

          close();

          return;
        }


        /*
        ==================================================
        FINAL ANSWER
        ==================================================
        */

        send(
          "status",
          "Preparing answer..."
        );


        let finalAnswer =
          "";


        await createMiningAnswerStream(

          message,

          extractedData,

          (
            chunk
          ) => {

            finalAnswer +=
              chunk;

            send(
              "answer",
              chunk
            );
          }
        );


        /*
        ==================================================
        SAVE FINAL ANSWER
        ==================================================
        */

        if (
          finalAnswer.trim()
        ) {

          void saveConversationMessage(
            conversationId,
            "assistant",
            finalAnswer.trim()
          );
        }


        /*
        ==================================================
        SOURCES
        ==================================================
        */

        send(
          "sources",

          extractedData.map(
            source => ({

              name:
                source.source,

              url:
                source.url,

              date:
                source.informationDate,

              publicationDate:
                source.publicationDate,

            })
          )
        );


        /*
        ==================================================
        COMPLETE
        ==================================================
        */

        send(
          "done",
          true
        );

        close();

      } catch (
        error
      ) {

        console.error(
          "STREAM ERROR:",
          error
        );


        const errorMessage =
          "AI response failed. Please try again.";


        void saveConversationMessage(
          conversationId,
          "assistant",
          errorMessage
        );


        send(
          "answer",
          errorMessage
        );


        send(
          "done",
          true
        );


        close();
      }

    })();


    /*
    ==================================================
    RETURN STREAM
    ==================================================
    */

    return new Response(
      stream,
      {
        headers: {

          "Content-Type":
            "application/x-ndjson; charset=utf-8",

          "Cache-Control":
            "no-cache, no-transform",

          "Connection":
            "keep-alive",

          "Access-Control-Allow-Origin":
            FRONTEND_URL,

          "Access-Control-Allow-Methods":
            "POST, OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type",
        },
      }
    );

  } catch (
    error
  ) {

    console.error(
      "CHAT API ERROR:",
      error
    );


    return Response.json(

      {
        error:
          "AI response failed",
      },

      {
        status: 500,
      }
    );
  }
}


/*
==================================================
OPTIONS
==================================================
*/

export async function OPTIONS() {

  return new Response(
    null,
    {
      status: 204,

      headers: {

        "Access-Control-Allow-Origin":
          FRONTEND_URL,

        "Access-Control-Allow-Methods":
          "POST, OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type",
      },
    }
  );
}