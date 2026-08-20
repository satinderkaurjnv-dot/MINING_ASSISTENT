import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(MONGODB_URI);

async function getDatabase() {
  await client.connect();

  return client.db(
    process.env.MONGODB_DB || "mining_discovery"
  );
}

export async function GET(request: NextRequest) {
  try {
    // ============================================================
    // CHECK ADMIN LOGIN
    // ============================================================

    const authenticated =
      request.cookies.get(
        "admin_authenticated"
      )?.value === "true";

    if (!authenticated) {
      return NextResponse.json(
        {
          error: "Admin login required.",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // CONNECT TO MONGODB
    // ============================================================

    const db = await getDatabase();

    const collection =
      db.collection("conversations");

    // ============================================================
    // GET ALL CONVERSATIONS
    // ============================================================

    const conversations =
      await collection
        .find({})
        .sort({
          updatedAt: -1,
        })
        .toArray();

    // ============================================================
    // CONVERT MONGODB DOCUMENTS
    // ============================================================

    const result =
      conversations.map(
        (conversation) => ({
          id:
            conversation.id ||
            conversation._id.toString(),

          updatedAt:
            conversation.updatedAt ||
            new Date().toISOString(),

          messages:
            Array.isArray(
              conversation.messages
            )
              ? conversation.messages
              : [],
        })
      );

    // ============================================================
    // RETURN DATA
    // ============================================================

    return NextResponse.json(result);

  } catch (error) {
    console.error(
      "Could not load conversations:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load conversations",
      },
      {
        status: 500,
      }
    );
  }
}