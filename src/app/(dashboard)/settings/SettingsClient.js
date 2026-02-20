"use client";
// Static profile/account UI. No setTheme, no useEffect that changes theme.
import { UserCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function SettingsClient({ user }) {
  return (
    <div className="space-y-6 max-w-xl">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-4">
          Profile
        </h2>
        <div className="flex items-center gap-4 mb-4">
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              className="w-14 h-14 rounded-full border-2 border-indigo-600/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center">
              <UserCircleIcon className="w-8 h-8 text-indigo-600" />
            </div>
          )}
          <div>
            <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {user?.name ?? "—"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <EnvelopeIcon className="w-4 h-4" />
              {user?.email ?? "—"}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-4">
          Account
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Manage your profile and preferences from this page. Theme can be changed from the Sun/Moon toggle in the navigation bar.
        </p>
      </section>
    </div>
  );
}
