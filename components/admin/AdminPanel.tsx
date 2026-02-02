import React from 'react';

interface Stat {
  label: string;
  value?: string | number;
  split?: { main: string | number; sub: string | number };
}

interface Action {
  user: string;
  action: string;
  timestamp: string;
  detailsUrl?: string;
}

interface AdminInfo {
  admin_id: string;
  admin_name: string;
  admin_email: string;
  role?: string;
  last_login?: string;
  dashboard_generated_at?: string;
}

interface AdminPanelProps {
  stats: Stat[];
  actions: Action[];
  adminInfo?: AdminInfo;
}

export default function AdminPanel({ stats, actions, adminInfo }: AdminPanelProps) {
  return (
    <>
      <div className="w-full text-[#0b1220] bg-[#f8fafc] font-sans min-h-screen">
        <div className="max-w-[1200px] mx-auto p-[5px] sm:p-[5px]">
          {/* Title */}
          <div className="flex justify-between items-start gap-3 py-5 px-2 border-b border-[#e6edf3]">
            <div>
              <h1 className="m-0 text-[26px] sm:text-[32px] font-normal font-['NyghtSerif-LightItalic'] text-[#0b1220] -tracking-[0.02em] leading-[1.05]">
                Hello, {adminInfo?.admin_name || 'Admin'}
              </h1>
              <p className="mt-1.5 text-gray-500 text-sm font-medium">
                Here is an overview of key metrics and recent activities
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-6 py-6 px-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col gap-3 p-6 sm:p-5 sm:gap-2.5 border border-[#e6edf3] rounded-2xl bg-gradient-to-br from-white to-white/98 shadow-[0_1px_3px_rgba(11,18,32,0.04)] overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-[#d4af3733] hover:shadow-[0_8px_32px_rgba(11,18,32,0.08),0_4px_16px_rgba(212,175,55,0.1)] hover:to-white"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#d4af37] to-[#d4af3799] opacity-0 transition-opacity duration-250 ease-out group-hover:opacity-100" />
                <p className="text-gray-500 text-xs font-bold uppercase tracking-[1px] mb-1 font-sans sm:text-[11px] sm:tracking-[0.8px]">
                  {stat.label}
                </p>
                {stat.split ? (
                  <div className="flex items-baseline gap-3">
                    <p className="text-[32px] sm:text-[32px] font-light text-[#0b1220] font-['NyghtSerif-LightItalic'] -tracking-[0.02em] leading-none mb-0.5">
                      {stat.split.main}
                    </p>
                    <p className="font-light text-[#d4af37] text-2xl font-['NyghtSerif-LightItalic']">
                      /
                    </p>
                    <p className="text-gray-500 font-light text-2xl font-['NyghtSerif-LightItalic']">
                      {stat.split.sub}
                    </p>
                  </div>
                ) : (
                  <p className="text-[32px] sm:text-[32px] font-light text-[#0b1220] font-['NyghtSerif-LightItalic'] -tracking-[0.02em] leading-none mb-0.5">
                    {stat.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Table */}
          <section className="py-[22px] px-2">
            <h2 className="text-lg font-bold m-0 mb-3 text-[#d4af37] font-['NyghtSerif-LightItalic']">
              Recent Admin Actions
            </h2>
            <div className="overflow-x-auto rounded-[10px] bg-white border border-[#e2e8f0]">
              <table className="w-full border-collapse min-w-[720px]">
                <thead>
                  <tr>
                    <th className="p-[14px] px-[18px] sm:p-[10px] text-left text-[13px] sm:text-xs font-bold text-[#0b1220] uppercase tracking-[0.6px] border-b border-[#e2e8f0]">
                      Source
                    </th>
                    <th className="p-[14px] px-[18px] sm:p-[10px] text-left text-[13px] sm:text-xs font-bold text-[#0b1220] uppercase tracking-[0.6px] border-b border-[#e2e8f0]">
                      Activity
                    </th>
                    <th className="p-[14px] px-[18px] sm:p-[10px] text-left text-[13px] sm:text-xs font-bold text-[#0b1220] uppercase tracking-[0.6px] border-b border-[#e2e8f0]">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-[#0b1220]/[0.02] border-t border-[#e2e8f0] first:border-t-0"
                    >
                      <td className="p-[14px] px-[18px] sm:p-[10px] text-[13px] sm:text-xs text-left">
                        <span
                          className={`px-2 py-1 rounded text-[0.75rem] font-medium uppercase
                        ${
                          row.user.toLowerCase() === 'system'
                            ? 'bg-[#e3f2fd] text-[#1976d2]'
                            : row.user.toLowerCase() === 'alert'
                              ? 'bg-[#fff3e0] text-[#f57c00]'
                              : row.user.toLowerCase() === 'security'
                                ? 'bg-[#ffebee] text-[#c62828]'
                                : 'bg-gray-100 text-gray-700'
                        }
                      `}
                        >
                          {row.user}
                        </span>
                      </td>
                      <td className="p-[14px] px-[18px] sm:p-[10px] text-[13px] sm:text-xs text-left text-gray-500">
                        {row.action}
                      </td>
                      <td className="p-[14px] px-[18px] sm:p-[10px] text-[13px] sm:text-xs text-left text-gray-500">
                        {row.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
