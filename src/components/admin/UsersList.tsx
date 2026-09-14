import React from "react";
import { Users as UsersIcon } from "lucide-react";

export default function UsersList({ users, locale }: { users: { id: string; name: string | null; email: string; emailVerified: Date | null }[], locale: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-blue-500" />
          {locale === 'he' ? 'רשימת משתמשים' : 'Users List'}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-[80%] mx-auto text-sm text-center table-fixed" dir={locale === 'he' ? 'rtl' : 'ltr'}>
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 w-1/2">{locale === 'he' ? 'שם' : 'Name'}</th>
              <th className="px-6 py-3 w-1/2">{locale === 'he' ? 'אימייל' : 'Email'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user, i) => (
              <tr key={user.id || i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name || (locale === 'he' ? 'ללא שם' : 'Unnamed')}</td>
                <td className="px-6 py-4 text-slate-700">{user.email}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                  {locale === 'he' ? 'אין נתונים להצגה' : 'No data to display'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
