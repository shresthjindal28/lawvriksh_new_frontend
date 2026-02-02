'use client';

import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/common/useUsers';
import Link from 'next/link';
import UserModal from './UserModal';
import { useState } from 'react';

export default function UsersList() {
  const router = useRouter();
  const {
    users,
    total,
    loading,
    error,
    skip,
    limit,
    searchTerm,
    role,
    setSkip,
    setSearchTerm,
    setRole,
    addUser,
  } = useUsers();
  const [open, setOpen] = useState(false);

  const handleNextPage = () => {
    if (skip + limit < total) {
      setSkip((prev) => prev + limit);
    }
  };

  const handlePrevPage = () => {
    if (skip - limit >= 0) {
      setSkip((prev) => prev - limit);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-8 max-w-[1200px] mx-auto font-sans text-[#1a1a1a] bg-[#f7f7f7]">
        {open && <UserModal mode={'add'} onClose={() => setOpen(!open)} onSubmit={addUser} />}
        <header className="flex justify-between items-center border-b-2 border-[#ccc] pb-4">
          <Link
            href="/dashboard"
            className="text-base no-underline text-[#555] transition-colors duration-200 hover:text-black"
          >
            &larr; Back to Dashboard
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 border border-black bg-white text-black cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white w-fit"
          >
            Add User
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-[#ccc] bg-white text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full p-3 border border-[#ccc] bg-white text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-[#ddd]">
          {users.length > 0 ? (
            <table className="w-full border-collapse text-left min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-4 border-b border-[#ddd] bg-[#e9e9e9] font-semibold">Name</th>
                  <th className="p-4 border-b border-[#ddd] bg-[#e9e9e9] font-semibold hidden md:table-cell">
                    Email
                  </th>
                  <th className="p-4 border-b border-[#ddd] bg-[#e9e9e9] font-semibold hidden md:table-cell">
                    Role
                  </th>
                  <th className="p-4 border-b border-[#ddd] bg-[#e9e9e9] font-semibold">Status</th>
                  <th className="p-4 border-b border-[#ddd] bg-[#e9e9e9] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-[#f0f0f0]">
                    <td className="p-4 border-b border-[#ddd]">
                      {user.name || user.username || 'NA'}
                    </td>
                    <td className="p-4 border-b border-[#ddd] hidden md:table-cell">
                      {user.email}
                    </td>
                    <td className="p-4 border-b border-[#ddd] hidden md:table-cell">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold capitalize bg-[#e8e8e8] text-[#333]`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 border-b border-[#ddd]">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold capitalize
                            ${user.status === 'active' ? 'bg-[#d1f7d1] text-[#1a6d1a]' : ''}
                            ${user.status === 'suspended' ? 'bg-[#fdd8b5] text-[#b05e00]' : ''}
                            ${user.status === 'banned' ? 'bg-[#fecaca] text-[#a42c2c]' : ''}
                        `}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 border-b border-[#ddd]">
                      <button
                        onClick={() => router.push(`/dashboard/admin/users/${user.user_id}`)}
                        className="px-4 py-2 border border-black bg-white text-black cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white w-fit"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-8 text-[#777] italic">
              No users found. Adjust your search or filters.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#ccc] pt-4">
          <p className="text-sm text-[#555]">
            Showing {Math.min(skip + 1, total)} - {Math.min(skip + limit, total)} of {total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={skip === 0}
              className="px-4 py-2 border border-[#ccc] bg-white cursor-pointer transition-colors duration-200 hover:bg-[#e8e8e8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={skip + limit >= total}
              className="px-4 py-2 border border-[#ccc] bg-white cursor-pointer transition-colors duration-200 hover:bg-[#e8e8e8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
