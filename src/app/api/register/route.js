export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db"; // Убедись, что здесь именованный импорт в { }

export async function POST(req) {
  try {
    // 1. Проверка на пустой запрос
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    const { email, password, name } = body;

    // 2. Валидация входных данных (защита от TypeError)
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: "Password must be a string" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    // 3. Проверка существующего пользователя
    // Используем findFirst или findUnique для Neon
    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 4. Хеширование пароля (теперь точно строка)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Создание пользователя в Neon
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split('@')[0], // Если имя не пришло, берем часть email
        password: hashedPassword,
        credits: 3, // Начальный баланс
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );

  } catch (err) {
    // Логируем конкретную ошибку в терминал для отладки
    console.error("REGISTRATION_API_ERROR:", err);

    // Если ошибка базы (например, таймаут Neon)
    if (err.message.includes("Connection terminated")) {
      return NextResponse.json(
        { error: "Database is waking up. Please try again in 5 seconds." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
