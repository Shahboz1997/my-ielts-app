import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// УДАЛИЛИ: import "dotenv/config" — Next.js делает это сам!

export async function POST(req) {
  try {
    // 1. Проверяем, что тело запроса вообще пришло
    const body = await req.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
    }

    // 2. Извлекаем данные с жесткой проверкой типов
    const email = typeof body.email === 'string' ? body.email.trim() : null;
    const password = typeof body.password === 'string' ? body.password : null;
    const name = typeof body.name === 'string' ? body.name.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль должны быть корректными строками" }, 
        { status: 400 }
      );
    }

    // 3. Проверяем существующего пользователя в Neon
    const existingUser = await prisma.user.findUnique({
      where: { username: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким Email уже существует" }, 
        { status: 400 }
      );
    }

    // 4. Хешируем пароль (теперь bcrypt точно получит строку)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Создаем запись
    await prisma.user.create({
      data: {
        username: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
      },
    });

    return NextResponse.json({ message: "Успешная регистрация" }, { status: 201 });

  } catch (error) {
    // Детальный лог в терминале поможет нам поймать проблемы со связью
    console.error("ОШИБКА РЕГИСТРАЦИИ:", error.message);
    
    return NextResponse.json(
      { error: "Ошибка на стороне сервера", details: error.message }, 
      { status: 500 }
    );
  }
}
