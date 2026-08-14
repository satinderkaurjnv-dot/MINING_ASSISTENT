import {
  NextRequest,
  NextResponse,
} from "next/server";

import { connectMongoDB } from "@/server/mongodb";

export async function GET(request: NextRequest) {
  try {
    // ============================================================
    // CHECK ADMIN LOGIN
    // ============================================================

    const cookie = request.cookies.get(
      "admin_authenticated"
    );

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
    // CONNECT TO MONGODB
    // ============================================================

    const db = await connectMongoDB();

    const usersCollection =
      db.collection("users");

    // ============================================================
    // TOTAL REGISTERED ACCOUNTS
    // ============================================================

    const registeredUsers =
      await usersCollection.countDocuments();

    // ============================================================
    // TOTAL PENDING ADMIN REGISTRATIONS
    // ============================================================

    const pendingUsers =
      await usersCollection.countDocuments({
        role: "ADMIN",
        status: "PENDING",
      });

    // ============================================================
    // TOTAL APPROVED ACCOUNTS
    // ============================================================

    const approvedUsers =
      await usersCollection.countDocuments({
        status: "APPROVED",
      });

    // ============================================================
    // SUPER ADMIN
    // ============================================================

    const superAdminCount =
      await usersCollection.countDocuments({
        role: "SUPER_ADMIN",
      });

    // ============================================================
    // APPROVED ADMINS
    // ============================================================

    const approvedAdminCount =
      await usersCollection.countDocuments({
        role: "ADMIN",
        status: "APPROVED",
      });

    // ============================================================
    // PENDING ADMINS
    // ============================================================

    const pendingAdminCount =
      await usersCollection.countDocuments({
        role: "ADMIN",
        status: "PENDING",
      });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      registeredUsers,

      pendingUsers,

      approvedUsers,

      superAdminCount,

      approvedAdminCount,

      pendingAdminCount,
    });
  } catch (error) {
    console.error(
      "User statistics error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not load user statistics.",
      },
      {
        status: 500,
      }
    );
  }
}
