import { NextResponse } from "next/server";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { connectMongoDB } from "@/server/mongodb";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
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

    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const db = await connectMongoDB();

    const users = db.collection("users");

    const existingUser = await users.findOne({
      $or: [
        { username },
        { email },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username or email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash =
      await hashPassword(password);

    const now = new Date();

    const result = await users.insertOne({
      username,
      email,
      passwordHash,

      // IMPORTANT:
      // The user cannot choose this.
      role: "USER",

      // IMPORTANT:
      // User must be approved by Super Admin.
      status: "PENDING",

      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration submitted successfully. Your account is waiting for Super Admin approval.",
        userId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "User registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Registration failed.",
      },
      { status: 500 }
    );
  }
}