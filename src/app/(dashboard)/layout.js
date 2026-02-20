// src/app/(dashboard)/layout.js
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect("/"); // Если не залогинен, кидаем на главную к модальному окну
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      <Sidebar user={session.user} credits={session.user?.credits ?? 0} />
      <main className="flex-1 overflow-y-auto p-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-8 lg:pl-24 xl:pl-60">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
