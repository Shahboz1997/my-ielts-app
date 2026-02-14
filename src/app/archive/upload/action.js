// app/archive/upload/action.js
'use server'
import { put } from '@vercel/blob';
import { auth } from "@/auth";

export async function uploadPdf(formData) {
  const session = await auth();
  if (!session) throw new Error("Нет доступа");

  const file = formData.get('file');
  
  // Загружаем в облако Vercel
  const blob = await put(file.name, file, { access: 'public' });

  // Сохраняем ссылку blob.url в твою базу данных (MySQL/Postgres)
  // await db.pdf_files.create({ data: { url: blob.url, userId: session.user.id } });

  return blob.url;
}
