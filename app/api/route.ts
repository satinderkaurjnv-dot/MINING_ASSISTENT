import {
  openai,
  MODEL,
} from "../../lib/openai";

import companyKnowledge from "../../lib/company-knowledge";

import { miningAgentKnowledge } from "../../lib/knowledge";

import { connectMongoDB } from "../../../server/mongodb";

import {
  needsCurrentData,
  detectTopic,
  detectCommodity,
  detectCompany,
  getSourcesForQuestion,
} from "../../lib/topic-detector";

import {
  fetchSources,
} from "../../lib/source-fetcher";

import {
  extractSourceData,
} from "../../lib/source-parser";

import {
  createMiningAnswerStream,
} from "../../lib/mining-answer";

const FRONTEND_URL =
  "https://mining-ai-assistent-vvxl-475xy5yf5.vercel.app";

  
const companyContext = `
==================================================
MINING DISCOVERY COMPANY KNOWLEDGE
==================================================

${JSON.stringify(companyKnowledge, null, 2)}

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

    const db = await connectMongoDB();

    const collection =
      db.collection("conversations");

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

    if (!conversationId) {

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


    if (!message) {

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
    SAVE USER MESSAGE IMMEDIATELY
    ==================================================
    */

    await saveConversationMessage(
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
      ReadableStreamDefaultController<Uint8Array> | null =
      null;


    const stream =
      new ReadableStream<Uint8Array>({

        start(controller) {

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

      if (!controllerRef) {
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

      } catch (error) {

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

      if (controllerRef) {

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
          "===================================="
        );

        console.log(
          "USER QUESTION:",
          message
        );

        console.log(
          "CONVERSATION ID:",
          conversationId
        );


        /*
        ==================================================
        DETECT CURRENT DATA
        ==================================================
        */

        const current =
          needsCurrentData(
            message
          );


        console.log(
          "CURRENT DATA REQUIRED:",
          current
        );


        /*
        ==================================================
        NORMAL KNOWLEDGE
        ==================================================
        */

if (!current) {

  const knowledgeText =
    typeof miningAgentKnowledge === "string"
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

Use the following Mining Discovery knowledge base
as the primary source for information about Mining
Discovery:

${knowledgeText}

==================================================
COMPANY KNOWLEDGE
==================================================

${companyContext}

==================================================
RULES
==================================================

- Use the knowledge base when the question is about
  Mining Discovery.
- Do not invent information that is not supported
  by the knowledge base.
- Do not invent Mining Discovery employees,
  executives, services, prices, addresses,
  phone numbers, partnerships, projects, or
  company claims.
- If information about Mining Discovery is not
  available in the knowledge base, clearly say
  that the information is not available.
- For current/latest information, use the existing
  current-data/web-search logic.
- The user did NOT ask for current/latest
  information in this branch.
- Do not perform a web search in this branch.
- Answer questions related to mining, minerals,
  mines, mining companies, mining projects,
  commodities, exploration, geology, processing,
  equipment, safety, regulations, mining economics,
  mining operations and the global mining industry.

- If the question is completely unrelated to mining,
  respond exactly:

I'm a mining-focused AI assistant. I can only answer questions related to mining, minerals, mines, mining companies, mining projects, commodities, exploration, geology, processing, equipment, safety, regulations, and the global mining industry.

- Identify yourself as an AI assistant.
- Never pretend to be a Mining Discovery employee.
- For investment questions, provide general
  educational information only.
- Do not guarantee financial returns.
- Answer politely, professionally and concisely.
`;

  const response =
    await openai.responses.create({

      model: MODEL,

      instructions: systemPrompt,

      input: message,

    });


  const answer =
    response.output_text
      ?.trim() || "";

  // ... keep everything below exactly as you already have



          /*
          ==================================================
          SAVE ASSISTANT ANSWER
          ==================================================
          */

          if (answer) {

            await saveConversationMessage(
              conversationId,
              "assistant",
              answer
            );


            send(
              "answer",
              answer
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
        CURRENT DATA
        ==================================================
        */

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


        /*
        ==================================================
        CONFIGURED SOURCES
        ==================================================
        */

        const sources =
          getSourcesForQuestion(
            message
          );


        console.log(
          "CONFIGURED SOURCES:",
          sources.map(
            source =>
              source.url
          )
        );


        if (
          sources.length === 0
        ) {

          const answer =
            "I don't have configured trusted sources for this type of current mining information yet.";


          await saveConversationMessage(
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
        FETCH SOURCES
        ==================================================
        */

        const fetchedSources =
          await fetchSources(
            sources
          );


        console.log(
          "SOURCE FETCH RESULTS"
        );


        console.log(
          fetchedSources.map(
            source => ({

              name:
                source.name,

              status:
                source.status,

              length:
                source.text.length,

              url:
                source.url,

            })
          )
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
        NO DATA
        ==================================================
        */

        if (
          extractedData.length === 0
        ) {

          const answer =
            "I couldn't retrieve relevant current information from the configured sources.";


          await saveConversationMessage(
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

        let finalAnswer = "";


        await createMiningAnswerStream(

          message,

          extractedData,

          (chunk) => {

            finalAnswer += chunk;


            send(
              "answer",
              chunk
            );

          }

        );


        /*
        ==================================================
        SAVE FINAL ASSISTANT ANSWER
        ==================================================
        */

        if (finalAnswer.trim()) {

          await saveConversationMessage(

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


      } catch (error) {

        console.error(
          "STREAM ERROR:",
          error
        );


        const errorMessage =
          "AI response failed.";


        /*
        ==================================================
        SAVE ERROR MESSAGE
        ==================================================
        */

        await saveConversationMessage(
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

 return new Response(stream, {
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
});


  } catch (error) {

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

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": FRONTEND_URL,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

}