import { NextRequest, NextResponse } from "next/server";

import { connectMongoDB } from "@/server/mongodb";

export async function GET(
  request: NextRequest
) {
  try {
    // ============================================================
    // CHECK ADMIN LOGIN
    // ============================================================

    const cookie =
      request.cookies.get("admin_authenticated");

    if (cookie?.value !== "true") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // DATABASE
    // ============================================================

    const db = await connectMongoDB();

    const users = db.collection("users");

    // ============================================================
    // GET PENDING ADMINS
    // ============================================================

    const pendingUsers =
      await users
        .find(
          {
            role: "ADMIN",
            status: "PENDING",
          },
          {
            projection: {
              passwordHash: 0,
            },
          }
        )
        .sort({
          createdAt: -1,
        })
        .toArray();

    // ============================================================
    // FORMAT RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      users: pendingUsers.map(
        (user) => ({
          id: user._id.toString(),

          username:
            user.username || "",

          email:
            user.email || "",

          role:
            user.role || "ADMIN",

          status:
            user.status || "PENDING",

          createdAt:
            user.createdAt || null,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Pending admin users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not load pending admins.",
      },
      {
        status: 500,
      }
    );
  }
}
