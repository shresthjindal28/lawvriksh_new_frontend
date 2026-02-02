'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserActionRequest, UserRole } from '@/types/admin';
import { useUserDetails } from '@/hooks/common/useUserDetails';
import VideoLoader from '../ui/VideoLoader';
import Modal from '../ui/Modal';
import UserModal from './UserModal';

interface UserDetailsCompProps {
  userId: string;
}

type ModalType = 'update' | 'updateScore' | 'userAction';

export default function UserDetailsComp({ userId }: UserDetailsCompProps) {
  const {
    user,
    loading,
    error,
    isSubmitting,
    updateUserRole,
    updateUserScore,
    userAction,
    editUser,
  } = useUserDetails(userId);

  const [showModal, setShowModal] = useState<ModalType | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newScore, setNewScore] = useState({
    risk_score: 0,
    spam_score: 0,
    profile_score: 0,
    reason: '',
  });
  const [userActionRequest, setUserActionRequest] = useState<UserActionRequest>({
    action: 'suspend',
    reason: '',
    duration_hours: 0,
    user_id: userId,
  });
  const InitialUserData = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    password: '',
  };

  // Clear messages when opening a modal
  const openModal = (modalType: ModalType) => {
    setErrorMsg('');
    setSuccess('');
    setShowModal(modalType);
  };

  const closeModal = () => {
    setShowModal(null);
    setReason('');
    setSuccess('');
    setErrorMsg('');
    setNewScore({
      risk_score: 0,
      spam_score: 0,
      profile_score: 0,
      reason: '',
    });
    setUserActionRequest({
      action: 'suspend',
      reason: '',
      duration_hours: 0,
      user_id: userId,
    });
  };

  const handleUpdateUserAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess('');
    try {
      if (userActionRequest.duration_hours <= 0 || userActionRequest.duration_hours > 10) {
        setErrorMsg('Duration hours cannot be less than zero or greater than 10');
        return;
      }
      await userAction({
        action: userActionRequest.action,
        reason: userActionRequest.reason,
        duration_hours: userActionRequest.duration_hours,
        user_id: userId,
      });
      setSuccess('User action updated successfully!');
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message || 'Failed to update user action');
      } else {
        setErrorMsg('Failed to update user action');
      }
    }
  };

  const handleUpdateUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess('');
    try {
      await updateUserRole({ reason, new_role: newRole });
      setSuccess('User role updated successfully!');
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message || 'Failed to update user role');
      } else {
        setErrorMsg('Failed to update user role');
      }
    }
  };

  const handleUpdateUserScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess('');
    try {
      await updateUserScore({
        user_id: userId,
        risk_score: newScore.risk_score,
        spam_score: newScore.spam_score,
        profile_score: newScore.profile_score,
        reason: newScore.reason,
      });
      setSuccess('User score updated successfully!');
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message || 'Failed to update user score');
      } else {
        setErrorMsg('Failed to update user score');
      }
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px',
        }}
      >
        <VideoLoader width={150} height={150} />
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Loading user details...</p>
      </div>
    );
  if (error)
    return (
      <div className="p-8 font-sans text-black max-w-[1200px] mx-auto md:p-8 p-4">
        <div className="p-4 my-4 border font-medium bg-red-50 text-red-700 border-red-700">Error: {error}</div>
      </div>
    );
  if (!user)
    return (
      <div className="p-8 font-sans text-black max-w-[1200px] mx-auto md:p-8 p-4">
        <div className="p-4 my-4 border font-medium bg-red-50 text-red-700 border-red-700">User not found.</div>
      </div>
    );

  return (
    <>
      <div className="font-sans text-black max-w-[1200px] mx-auto md:p-8 p-4">
        <Link
          href="/dashboard/admin/users"
          className="inline-block mb-6 text-black no-underline font-medium hover:underline"
        >
          &larr; Back to Users List
        </Link>
        {open && (
          <UserModal
            mode={'edit'}
            onClose={() => setOpen(!open)}
            onSubmit={editUser}
            initialData={InitialUserData}
          />
        )}

        <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-start md:gap-8 border-b-2 border-black pb-4 mb-8">
          <h1 className="m-0 text-2xl shrink-0">{user.name || user.username}</h1>
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <button
              onClick={() => openModal('update')}
              className="px-[1.2rem] py-[0.6rem] border border-black bg-black text-white cursor-pointer text-sm font-bold whitespace-nowrap transition-all duration-200 hover:bg-[#333] disabled:bg-[#666] disabled:cursor-not-allowed disabled:opacity-70 flex-1 text-center min-w-[120px] md:flex-none md:w-auto"
              disabled={isSubmitting}
            >
              Update Role
            </button>
            <button
              onClick={() => setOpen(true)}
              className="px-[1.2rem] py-[0.6rem] border border-black bg-black text-white cursor-pointer text-sm font-bold whitespace-nowrap transition-all duration-200 hover:bg-[#333] disabled:bg-[#666] disabled:cursor-not-allowed disabled:opacity-70 flex-1 text-center min-w-[120px] md:flex-none md:w-auto"
              disabled={isSubmitting}
            >
              Edit
            </button>
            <button
              onClick={() => openModal('userAction')}
              className="px-[1.2rem] py-[0.6rem] border border-black bg-black text-white cursor-pointer text-sm font-bold whitespace-nowrap transition-all duration-200 hover:bg-[#333] disabled:bg-[#666] disabled:cursor-not-allowed disabled:opacity-70 flex-1 text-center min-w-[120px] md:flex-none md:w-auto"
              disabled={isSubmitting}
            >
              User Action
            </button>
          </div>
        </div>

        {/* Status messages outside of modal */}
        {success && !showModal && (
          <div className="p-4 my-4 border font-medium bg-blue-50 text-green-800 border-green-800">
            {success}
          </div>
        )}
        {errorMsg && !showModal && (
          <div className="p-4 my-4 border font-medium bg-red-50 text-red-700 border-red-700">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(350px,1fr))] md:gap-8 mt-8">
          <div className="border border-[#ddd] p-6 bg-[#f9f9f9]">
            <h2 className="mt-0 border-b border-[#ccc] pb-2 mb-4 text-xl">User Information</h2>
            <p className="my-3 leading-relaxed">
              <strong>ID:</strong>{' '}
              <code className="bg-[#f1f1f1] px-1 py-0.5 rounded font-mono text-[0.9em]">
                {user.user_id}
              </code>
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Verified:</strong> {user.is_verified ? 'Yes' : 'No'}
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Role:</strong>{' '}
              <span
                className={`px-2 py-[2px] rounded font-bold uppercase text-[0.85em]
                  ${user.role === 'admin' ? 'bg-black text-white' : ''}
                  ${user.role === 'creator' ? 'bg-[#666] text-white' : ''}
                  ${user.role === 'user' ? 'bg-[#ddd] text-black' : ''}
              `}
              >
                {user.role}
              </span>
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Status:</strong>{' '}
              <span
                className={`px-2 py-[2px] rounded font-bold uppercase text-[0.85em]
                  ${user.status === 'active' ? 'bg-green-800 text-white' : ''}
                  ${user.status === 'suspended' ? 'bg-red-700 text-white' : ''}
                  ${user.status === 'inactive' ? 'bg-[#666] text-white' : ''}
              `}
              >
                {user.status}
              </span>
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Provider:</strong> {user.provider}
            </p>
            <p className="my-3 leading-relaxed">
              <strong>2FA Enabled:</strong> {user.two_fa_enabled ? 'Yes' : 'No'}
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Joined:</strong> {new Date(user.created_at).toLocaleString()}
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Last Login:</strong>{' '}
              {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
            </p>
          </div>

          <div className="border border-[#ddd] p-6 bg-[#f9f9f9]">
            <h2 className="mt-0 border-b border-[#ccc] pb-2 mb-4 text-xl">Security & Risk Scores</h2>
            <p className="my-3 leading-relaxed">
              <strong>Risk Score:</strong>{' '}
              <span className="font-bold font-mono">{user.risk_score || 0}</span>
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Spam Score:</strong>{' '}
              <span className="font-bold font-mono">{user.spam_score || 0}</span>
            </p>
            <p className="my-3 leading-relaxed">
              <strong>Failed Login Attempts:</strong> {user.login_attempts || 0}
            </p>
          </div>
        </div>

        <Modal
          isOpen={showModal !== null}
          onClose={closeModal}
          title={
            showModal
              ? `${showModal.charAt(0).toUpperCase() + showModal.slice(1)} User: ${user.name || user.username}`
              : ''
          }
        >
          {/* Show messages inside modal */}
          {errorMsg && (
            <div className="p-3 mb-4 border font-medium text-center bg-red-50 text-red-700 border-red-700">
              {errorMsg}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 border font-medium text-center bg-blue-50 text-green-800 border-green-800">
              {success}
            </div>
          )}

          {showModal === 'update' && (
            <form onSubmit={handleUpdateUserRole} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="new_role" className="font-bold text-black">
                  New Role *
                </label>
                <select
                  id="new_role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  required
                  className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                >
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="role_reason" className="font-bold text-black">
                  Reason for Role Update *
                </label>
                <textarea
                  id="role_reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter reason for role change..."
                  className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 min-h-[80px]"
                />
              </div>

              <div className="flex flex-col gap-4 justify-end mt-4 pt-4 border-t border-[#eee] md:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-[#ccc] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto hover:bg-[#e8e8e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-black bg-black text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto hover:bg-[#333]"
                >
                  {isSubmitting ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          )}

          {showModal === 'updateScore' && (
            <form onSubmit={handleUpdateUserScore} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="score_reason" className="font-bold text-black">
                  Reason for Score Update *
                </label>
                <textarea
                  id="score_reason"
                  value={newScore.reason}
                  onChange={(e) => setNewScore({ ...newScore, reason: e.target.value })}
                  required
                  rows={2}
                  placeholder="Enter reason for score update..."
                  className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                <div className="flex flex-col gap-2">
                  <label htmlFor="risk_score" className="font-bold text-black">
                    Risk Score
                  </label>
                  <input
                    type="number"
                    id="risk_score"
                    value={newScore.risk_score}
                    onChange={(e) =>
                      setNewScore({ ...newScore, risk_score: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    max="1"
                    className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 w-full"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="spam_score" className="font-bold text-black">
                    Spam Score
                  </label>
                  <input
                    type="number"
                    id="spam_score"
                    value={newScore.spam_score}
                    onChange={(e) =>
                      setNewScore({ ...newScore, spam_score: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    max="1"
                    className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 w-full"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="profile_score" className="font-bold text-black">
                    Profile Score
                  </label>
                  <input
                    type="number"
                    id="profile_score"
                    value={newScore.profile_score}
                    onChange={(e) =>
                      setNewScore({ ...newScore, profile_score: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    max="100"
                    className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-end mt-4 pt-4 border-t border-[#eee] md:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-[#ccc] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto hover:bg-[#e8e8e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-black bg-black text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto hover:bg-[#333]"
                >
                  {isSubmitting ? 'Updating...' : 'Update Scores'}
                </button>
              </div>
            </form>
          )}

          {showModal === 'userAction' && (
            <form onSubmit={handleUpdateUserAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="action" className="font-bold text-black">
                  Action *
                </label>
                <select
                  id="action"
                  value={userActionRequest.action}
                  onChange={(e) =>
                    setUserActionRequest({
                      ...userActionRequest,
                      action: e.target.value as UserActionRequest['action'],
                    })
                  }
                  required
                  className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                >
                  <option value="suspend">Suspend</option>
                  <option value="ban">Ban</option>
                  <option value="delete">Delete</option>
                  <option value="restore">Restore</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="action_reason" className="font-bold text-black">
                  Reason for Action *
                </label>
                <textarea
                  id="action_reason"
                  value={userActionRequest.reason}
                  onChange={(e) =>
                    setUserActionRequest({ ...userActionRequest, reason: e.target.value })
                  }
                  required
                  rows={3}
                  placeholder="Enter reason for this action..."
                  className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 min-h-[80px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="duration_hours" className="font-bold text-black">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  id="duration_hours"
                  value={userActionRequest.duration_hours}
                  onChange={(e) =>
                    setUserActionRequest({
                      ...userActionRequest,
                      duration_hours: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0 = permanent"
                  required
                  max="10"
                  className="p-3 border border-[#ccc] bg-white text-base font-inherit focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="flex flex-col gap-4 justify-end mt-4 pt-4 border-t border-[#eee] md:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-[#ccc] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto hover:bg-[#e8e8e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-[#b91c1c] bg-[#b91c1c] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto hover:bg-[#991b1b]"
                >
                  {isSubmitting ? 'Processing...' : 'Execute Action'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </>
  );
}
