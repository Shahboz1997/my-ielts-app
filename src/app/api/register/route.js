import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Используем bcryptjs (он стабильнее)
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const prisma = getPrisma();

    // 1. Парсим тело запроса
    const body = await request.json();
    const { email, name, password } = body;

    // 2. Валидация полей
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Все поля обязательны (email, name, password)" }, 
        { status: 400 }
      );
    }

    // 3. Проверка: не занят ли email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" }, 
        { status: 400 }
      );
    }

    // 4. Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Создание пользователя в Supabase через Prisma
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // 6. Возвращаем успех (без пароля в целях безопасности)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { message: "Регистрация успешна", user: userWithoutPassword }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при регистрации" }, 
      { status: 500 }
    );
  }
}
