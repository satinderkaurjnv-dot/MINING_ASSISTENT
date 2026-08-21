import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cookie =
      request.cookies.get("admin_authenticated");

    const authenticated =
      cookie?.value === "true";

    return NextResponse.json({
      authenticated,
    });
  } catch (error) {
    console.error(
      "Admin check error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        error: "Could not check admin authentication",
      },
      {
        status: 500,
      }
    );
  }
}

