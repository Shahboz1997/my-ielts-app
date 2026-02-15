// Обязательно в фигурных скобках!
import { prisma } from "../../../lib/prisma"; 
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({})); // Возвращаем пустой объект вместо null
    
    const email = body.email?.toString().trim() || null;
    const password = body.password?.toString() || null;
    // ... остальной код
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
