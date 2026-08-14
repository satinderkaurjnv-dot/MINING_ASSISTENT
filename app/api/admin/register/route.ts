import { NextResponse } from "next/server";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { connectMongoDB } from "@/server/mongodb";

const scryptAsync = promisify(scrypt);

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
const ADMIN_ROLE = "ADMIN";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");

  const derivedKey = (await scryptAsync(
    password,
    salt,
    64
  )) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    const confirmPassword = String(
      body.confirmPassword || ""
    );

    // ============================================
    // VALIDATION
    // ============================================

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          error: "Username is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // DATABASE
    // ============================================

    const db = await connectMongoDB();

    const users = db.collection("users");

    // ============================================
    // CHECK USERNAME
    // ============================================

    const existingUsername = await users.findOne({
      username,
    });

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Username already exists.",
        },
        { status: 409 }
      );
    }

    // ============================================
    // CHECK EMAIL
    // ============================================

    const existingEmail = await users.findOne({
      email,
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists.",
        },
        { status: 409 }
      );
    }

    // ============================================
    // CHECK WHETHER SUPER ADMIN EXISTS
    // ============================================

    const existingSuperAdmin =
      await users.findOne({
        role: SUPER_ADMIN_ROLE,
      });

    // ============================================
    // DETERMINE ROLE
    // ============================================

    let role: string;
    let status: string;
    let message: string;

    if (!existingSuperAdmin) {
      // --------------------------------------------
      // FIRST ACCOUNT
      // --------------------------------------------

      role = SUPER_ADMIN_ROLE;
      status = "APPROVED";

      message =
        "Super Admin registered successfully.";
    } else {
      // --------------------------------------------
      // SUPER ADMIN ALREADY EXISTS
      // NEW USERS BECOME ADMIN
      // --------------------------------------------

      role = ADMIN_ROLE;
      status = "PENDING";

      message =
        "Admin registration submitted successfully. Please wait for Super Admin approval.";
    }

    // ============================================
    // HASH PASSWORD
    // ============================================

    const passwordHash =
      await hashPassword(password);

    const now = new Date();

    // ============================================
    // CREATE USER
    // ============================================

    const result = await users.insertOne({
      username,
      email,
      passwordHash,

      role,

      status,

      createdAt: now,
      updatedAt: now,
    });

    console.log(
      `User registered: ${result.insertedId} | role=${role} | status=${status}`
    );

    // ============================================
    // RESPONSE
    // ============================================

    return NextResponse.json(
      {
        success: true,
        role,
        status,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}