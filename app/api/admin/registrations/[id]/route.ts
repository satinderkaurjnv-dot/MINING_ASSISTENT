import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { connectMongoDB } from "@/server/mongodb";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ==========================================
    // CHECK ADMIN LOGIN
    // ==========================================

    const cookieStore = await cookies();

    const adminAuthenticated =
      cookieStore.get("admin_authenticated")?.value;

    if (adminAuthenticated !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // GET REGISTRATION ID
    // ==========================================

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration ID",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CONNECT TO MONGODB
    // ==========================================

    const db = await connectMongoDB();

    // ==========================================
    // ACCEPT REGISTRATION
    // ==========================================

    const result = await db.collection("users").updateOne(
      {
        _id: new ObjectId(id),
        status: "PENDING",
      },
      {
        $set: {
          status: "APPROVED",
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
          message:
            "Pending registration not found",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,
      message: "Registration accepted",
    });
  } catch (error) {
    console.error(
      "Accept registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to accept registration",
      },
      { status: 500 }
    );
  }
}