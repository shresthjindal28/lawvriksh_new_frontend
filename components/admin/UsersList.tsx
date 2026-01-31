'use client';

import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/common/useUsers';
import '@/styles/admin-styles/users-list.css';
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
    <div className="container">
      {open && <UserModal mode={'add'} onClose={() => setOpen(!open)} onSubmit={addUser} />}
      <header className="users-header">
        <Link href="/dashboard" className="back-link">
          &larr; Back to Dashboard
        </Link>
        <button onClick={() => setOpen(!open)} className="action-button">
          Add User
        </button>
      </header>

      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="input-field select-field"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="professional">Professional</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="user-table-wrapper">
        {users.length > 0 ? (
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hide-on-mobile">Email</th>
                <th className="hide-on-mobile">Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.name || user.username || 'NA'}</td>
                  <td className="hide-on-mobile">{user.email}</td>
                  <td className="hide-on-mobile">
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>{user.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => router.push(`/dashboard/admin/users/${user.user_id}`)}
                      className="action-button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-users">No users found. Adjust your search or filters.</div>
        )}
      </div>

      <div className="pagination">
        <p className="pagination-info">
          Showing {Math.min(skip + 1, total)} - {Math.min(skip + limit, total)} of {total} users
        </p>
        <div className="pagination-controls">
          <button onClick={handlePrevPage} disabled={skip === 0} className="pagination-button">
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={skip + limit >= total}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
