// app/api/register/route.js
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma"; 


export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    // 1. Валидация на стороне сервера
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 2. Проверка, существует ли уже такой пользователь
    const existingUser = await db.user.findUnique({
      where: { username: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 3. Хеширование пароля (никогда не храним пароль в чистом виде!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Создание записи в базе данных Neon
    const newUser = await db.user.create({
      data: {
        username: email, // Используем email как логин
        password: hashedPassword,
        // Если в схеме Prisma есть поле name, раскомментируй ниже:
        // name: name 
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTRATION_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
