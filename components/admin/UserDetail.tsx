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
      <div className="container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  if (!user)
    return (
      <div className="container">
        <div className="error-message">User not found.</div>
      </div>
    );

  return (
    <div className="container">
      <Link href="/dashboard/admin/users" className="backLink">
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

      <div className="header">
        <h1>{user.name || user.username}</h1>
        <div className="actions">
          <button
            onClick={() => openModal('update')}
            className="actionButton userRole"
            disabled={isSubmitting}
          >
            Update Role
          </button>
          <button
            onClick={() => setOpen(true)}
            className="actionButton userScore"
            disabled={isSubmitting}
          >
            Edit
          </button>
          <button
            onClick={() => openModal('userAction')}
            className="actionButton userAction"
            disabled={isSubmitting}
          >
            User Action
          </button>
        </div>
      </div>

      {/* Status messages outside of modal */}
      {success && !showModal && <div className="success-message">{success}</div>}
      {errorMsg && !showModal && <div className="error-message">{errorMsg}</div>}

      <div className="grid">
        <div className="card">
          <h2>User Information</h2>
          <p>
            <strong>ID:</strong> <code>{user.user_id}</code>
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Verified:</strong> {user.is_verified ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Role:</strong> <span className={`role-badge ${user.role}`}>{user.role}</span>
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={`status-badge ${user.status}`}>{user.status}</span>
          </p>
          <p>
            <strong>Provider:</strong> {user.provider}
          </p>
          <p>
            <strong>2FA Enabled:</strong> {user.two_fa_enabled ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Joined:</strong> {new Date(user.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Last Login:</strong>{' '}
            {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
          </p>
        </div>

        <div className="card">
          <h2>Security & Risk Scores</h2>
          <p>
            <strong>Risk Score:</strong> <span className="score">{user.risk_score || 0}</span>
          </p>
          <p>
            <strong>Spam Score:</strong> <span className="score">{user.spam_score || 0}</span>
          </p>
          <p>
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
        {errorMsg && <div className="modal-error">{errorMsg}</div>}
        {success && <div className="modal-success">{success}</div>}

        {showModal === 'update' && (
          <form onSubmit={handleUpdateUserRole} className="modal-form">
            <div className="form-group">
              <label htmlFor="new_role">New Role *</label>
              <select
                id="new_role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                required
              >
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="role_reason">Reason for Role Update *</label>
              <textarea
                id="role_reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Enter reason for role change..."
              />
            </div>

            <div className="form-buttons">
              <button type="button" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        )}

        {showModal === 'updateScore' && (
          <form onSubmit={handleUpdateUserScore} className="modal-form">
            <div className="form-group">
              <label htmlFor="score_reason">Reason for Score Update *</label>
              <textarea
                id="score_reason"
                value={newScore.reason}
                onChange={(e) => setNewScore({ ...newScore, reason: e.target.value })}
                required
                rows={2}
                placeholder="Enter reason for score update..."
              />
            </div>

            <div className="score-grid">
              <div className="form-group">
                <label htmlFor="risk_score">Risk Score</label>
                <input
                  type="number"
                  id="risk_score"
                  value={newScore.risk_score}
                  onChange={(e) =>
                    setNewScore({ ...newScore, risk_score: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  max="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="spam_score">Spam Score</label>
                <input
                  type="number"
                  id="spam_score"
                  value={newScore.spam_score}
                  onChange={(e) =>
                    setNewScore({ ...newScore, spam_score: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  max="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile_score">Profile Score</label>
                <input
                  type="number"
                  id="profile_score"
                  value={newScore.profile_score}
                  onChange={(e) =>
                    setNewScore({ ...newScore, profile_score: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Scores'}
              </button>
            </div>
          </form>
        )}

        {showModal === 'userAction' && (
          <form onSubmit={handleUpdateUserAction} className="modal-form">
            <div className="form-group">
              <label htmlFor="action">Action *</label>
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
              >
                <option value="suspend">Suspend</option>
                <option value="ban">Ban</option>
                <option value="delete">Delete</option>
                <option value="restore">Restore</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="action_reason">Reason for Action *</label>
              <textarea
                id="action_reason"
                value={userActionRequest.reason}
                onChange={(e) =>
                  setUserActionRequest({ ...userActionRequest, reason: e.target.value })
                }
                required
                rows={3}
                placeholder="Enter reason for this action..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration_hours">Duration (hours)</label>
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
              />
            </div>

            <div className="form-buttons">
              <button type="button" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="danger" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Execute Action'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
