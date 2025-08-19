import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Test database connection by querying all users
    const allUsers = await db.select().from(users);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and name are required",
        },
        { status: 400 }
      );
    }

    // Insert a new user to test write operations
    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: newUser[0],
    });
  } catch (error) {
    console.error("Error creating user:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
