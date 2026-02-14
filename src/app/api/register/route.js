import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
    }

    // Проверяем, существует ли пользователь (username в схеме — это email)
    const existingUser = await prisma.user.findUnique({
      where: { username: email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Пользователь уже существует" }, { status: 400 });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем в базу Neon
    await prisma.user.create({
      data: {
        username: email,
        password: hashedPassword,
        name: name || null,
      },
    });

    return NextResponse.json({ message: "Успешная регистрация" }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
