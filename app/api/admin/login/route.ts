import { NextResponse } from "next/server";
import { scrypt } from "crypto";
import { promisify } from "util";

import { connectMongoDB } from "@/server/mongodb";

const scryptAsync = promisify(scrypt);

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
const ADMIN_ROLE = "ADMIN";

// ============================================================
// VERIFY PASSWORD
// ============================================================

async function verifyPassword(
  password: string,
  storedPasswordHash: string
): Promise<boolean> {
  try {
    const parts = storedPasswordHash.split(":");

    if (parts.length !== 2) {
      return false;
    }

    const [salt, storedKey] = parts;

    const derivedKey = (await scryptAsync(
      password,
      salt,
      64
    )) as Buffer;

    return (
      derivedKey.toString("hex") === storedKey
    );
  } catch (error) {
    console.error(
      "Password verification error:",
      error
    );

    return false;
  }
}

// ============================================================
// LOGIN
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(
      body.username || ""
    ).trim();

    const password = String(
      body.password || ""
    );

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username and password are required.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 1. SUPER ADMIN LOGIN
    // ========================================================

    const correctUsername =
      process.env.ADMIN_USERNAME ||
      "miningAdmin";

    const correctPassword =
      process.env.ADMIN_PASSWORD ||
      "Mining@123";

    if (
      username === correctUsername &&
      password === correctPassword
    ) {
      const response = NextResponse.json({
        success: true,
        role: SUPER_ADMIN_ROLE,
      });

      response.cookies.set(
        "admin_authenticated",
        "true",
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 8,
          path: "/",
        }
      );

      return response;
    }

    // ========================================================
    // 2. REGISTERED ADMIN LOGIN
    // ========================================================

    const db = await connectMongoDB();

    const users = db.collection("users");

    const user = await users.findOne({
      username,
      role: ADMIN_ROLE,
    });

    // ========================================================
    // USER NOT FOUND
    // ========================================================

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // PENDING
    // ========================================================

    if (user.status === "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your registration is still pending approval.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // REJECTED
    // ========================================================

    if (user.status === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your registration has been rejected.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // MUST BE APPROVED
    // ========================================================

    if (user.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account is not approved.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // VERIFY REGISTERED ADMIN PASSWORD
    // ========================================================

    if (
      !user.passwordHash ||
      typeof user.passwordHash !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Account password is not configured correctly.",
        },
        { status: 500 }
      );
    }

    console.log("LOGIN DEBUG");
console.log("Username:", username);
console.log("Role:", user.role);
console.log("Status:", user.status);
console.log(
  "Password hash exists:",
  !!user.passwordHash
);
console.log(
  "Password hash length:",
  user.passwordHash?.length
);

    const passwordValid =
      await verifyPassword(
        password,
        user.passwordHash
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // REGISTERED ADMIN LOGIN SUCCESS
    // ========================================================

    const response = NextResponse.json({
      success: true,
      role: ADMIN_ROLE,
    });

    response.cookies.set(
      "admin_authenticated",
      "true",
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Login failed.",
      },
      { status: 500 }
    );
  }
}
