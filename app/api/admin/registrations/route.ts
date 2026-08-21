import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { connectMongoDB } from "@/server/mongodb";

export async function GET() {
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
    // CONNECT TO MONGODB
    // ==========================================

    const db = await connectMongoDB();

    // ==========================================
    // GET PENDING REGISTRATIONS
    // ==========================================

    const registrations = await db
      .collection("users")
      .find({
        status: "PENDING",
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

   const formattedRegistrations = registrations.map(
  (registration) => ({
    _id: registration._id.toString(),

    username: registration.username || "",

    email: registration.email || "",

    role: registration.role || "",

    status: registration.status || "",

    createdAt: registration.createdAt || null,
  })
);

    return NextResponse.json({
      success: true,
      registrations: formattedRegistrations,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/registrations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load registrations",
      },
      {
        status: 500,
      }
    );
  }
}