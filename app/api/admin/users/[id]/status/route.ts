import {
  NextRequest,
  NextResponse,
} from "next/server";

import { ObjectId } from "mongodb";

import { connectMongoDB } from "@/server/mongodb";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ==========================================
    // CHECK ADMIN LOGIN
    // ==========================================

    const cookie = request.cookies.get(
      "admin_authenticated"
    );

    if (cookie?.value !== "true") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // GET USER ID
    // ==========================================

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // READ REQUEST BODY
    // ==========================================

    const body = await request.json();

    const status = String(
      body.status || ""
    ).toUpperCase();

    if (
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Status must be APPROVED or REJECTED.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CONNECT DATABASE
    // ==========================================

    const db = await connectMongoDB();

    const users = db.collection("users");

    // ==========================================
    // UPDATE PENDING ADMIN
    // ==========================================

    const result = await users.updateOne(
      {
        _id: new ObjectId(id),

        // IMPORTANT
        // Your registration route creates
        // new accounts as ADMIN + PENDING
        role: "ADMIN",
        status: "PENDING",
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    // ==========================================
    // USER NOT FOUND
    // ==========================================

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pending admin registration not found or already processed.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,
      status,
      message:
        status === "APPROVED"
          ? "Admin approved successfully."
          : "Admin registration declined.",
    });
  } catch (error) {
    console.error(
      "Admin status update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not update admin status.",
      },
      { status: 500 }
    );
  }
}