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

// ============================================================
// DELETE ONE CONVERSATION
// ============================================================

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ========================================================
    // CHECK ADMIN LOGIN
    // ========================================================

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

    // ========================================================
    // GET CONVERSATION ID
    // ========================================================

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Conversation ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // CONNECT TO MONGODB
    // ========================================================

    const db = await getDatabase();

    const collection =
      db.collection("conversations");

    // ========================================================
    // DELETE
    // ========================================================

    const result =
      await collection.deleteOne({
        id: id,
      });

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json({
      success: true,
      message: "Conversation deleted.",
    });

  } catch (error) {
    console.error(
      "Delete conversation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not delete conversation.",
      },
      {
        status: 500,
      }
    );
  }
}