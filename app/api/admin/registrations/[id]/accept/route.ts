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
        {
          status: 401,
        }
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
          message: "Invalid registration ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // CONNECT TO DATABASE
    // ==========================================

    const db = await connectMongoDB();

    const users = db.collection("users");

    // ==========================================
    // APPROVE PENDING ADMIN
    // ==========================================

    const result = await users.updateOne(
      {
        _id: new ObjectId(id),

        // IMPORTANT:
        // Additional registrations are ADMIN accounts.
        role: "ADMIN",

        // Only pending registrations can be approved.
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
    // NOT FOUND / ALREADY PROCESSED
    // ==========================================

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pending admin registration not found or already processed.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,
      message: "Admin registration accepted successfully.",
      status: "APPROVED",
    });
  } catch (error) {
    console.error(
      "Accept admin registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to accept admin registration.",
      },
      {
        status: 500,
      }
    );
  }
}
