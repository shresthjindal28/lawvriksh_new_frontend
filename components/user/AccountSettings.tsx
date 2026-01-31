'use client';

import React, { useEffect, useState } from 'react';
import '@/styles/common-styles/account-settings.css';
import Link from 'next/link';
import { authService } from '@/lib/api/authService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSessionManager } from '@/hooks/common/useSessionManagement';
import { useRouter } from 'next/navigation';
import Modal from '../ui/Modal';

type ModalType = 'confirmPassword' | 'changePassword' | 'deleteAccount' | null;

export default function AccountSettings() {
  const { profile, getProfile, logout, user } = useAuth();
  const {
    sessions,
    fetchSessions,
    logoutAllSessions,
    deleteSession,
    isLoading: isSessionLoading,
  } = useSessionManager();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_fa_enabled || false);
  const [errormsg, setErrormsg] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (!sessions) {
      fetchSessions();
    }
  }, [sessions, fetchSessions]);

  useEffect(() => {
    setErrormsg('');
    setSuccess('');
  }, [activeModal]);

  const closeModal = () => {
    setActiveModal(null);
    setConfirmPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setConfirmation('');
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword) {
      setErrormsg('Password is required');
      return;
    }

    setIsSubmitting(true);
    setErrormsg('');
    setSuccess('');
    try {
      const apiCall = twoFactorEnabled ? authService.disable2FA : authService.enable2FA;
      const response = await apiCall({ password: confirmPassword });

      if (response.success) {
        await getProfile();
        const new2FAState = !twoFactorEnabled;
        setTwoFactorEnabled(new2FAState);
        setSuccess(
          `Two-factor authentication ${new2FAState ? 'enabled' : 'disabled'} successfully`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrormsg(error.message || 'An error occurred while updating 2FA settings');
      } else {
        setErrormsg('An error occurred while updating 2FA settings');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setErrormsg('');
    setSuccess('');
    try {
      const response = await deleteSession(sessionId);
      if (response.success) {
        await fetchSessions();
        setSuccess('Session deleted successfully');
      }
    } catch (error) {
      setErrormsg(error instanceof Error ? error.message : 'Failed to delete session');
    }
  };

  const handleLogoutAllSessions = async () => {
    setErrormsg('');
    setSuccess('');
    try {
      const response = await logoutAllSessions();
      if (response.success) {
        setSuccess('All sessions logged out successfully');
        await logout();
        router.push('/login');
      }
    } catch (error) {
      setErrormsg(error instanceof Error ? error.message : 'Failed to logout all sessions');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrormsg('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrormsg('All password fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrormsg('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Password changed successfully!');
    } catch (error) {
      if (error instanceof Error) {
        setErrormsg(error.message || 'Failed to change password.');
      } else {
        setErrormsg('Failed to change password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateConfirmation = (confirmationValue: string) => {
    //check whether user has entreted : delete my account
    const confirmationRegex = /^delete my account$/;

    if (confirmationRegex.test(confirmationValue)) {
      setErrormsg('');
      return true;
    } else {
      setErrormsg("Please Enter 'delete my account'");
      return false;
    }
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmation(value);
    validateConfirmation(value);
  };

  const handleAccountDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrormsg('');
    setSuccess('');
    if (!currentPassword || !confirmation || !confirmPassword) {
      setErrormsg('All feilds are required');
      return;
    }

    if (!validateConfirmation(confirmation)) {
      setErrormsg("Please Enter 'delete my account'");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await authService.accountDelete({
        password: currentPassword,
        confirm_password: confirmPassword,
        confirmation: confirmation,
      });
      if (response.success) {
        setSuccess('Account Deleted Successfully, Youll be Logout soon.');
        await logout();
        router.push('/login');
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrormsg(error.message || 'Unable to Delete the Account');
      } else {
        setErrormsg('Unable to Delete the Account');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = (): string => {
    switch (activeModal) {
      case 'confirmPassword':
        return 'Confirm Your Identity';
      case 'changePassword':
        return 'Change Your Password';
      case 'deleteAccount':
        return 'Delete Your Account';
      default:
        return '';
    }
  };

  const renderModalContent = () => {
    if (activeModal === 'confirmPassword') {
      return (
        <form onSubmit={handle2FASubmit}>
          <p className="form-description">Please enter your password to change 2FA settings.</p>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="form-input"
            />
          </div>
          <div className="modal-buttons">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Confirming...' : 'Confirm'}
            </button>
          </div>
        </form>
      );
    }

    if (activeModal === 'changePassword') {
      return (
        <form onSubmit={handleChangePasswordSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="current-password">
              Current Password
            </label>
            <input
              id="current-password"
              type="text"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              New Password
            </label>
            <input
              id="new-password"
              type="text"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-new-password">
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type="text"
              placeholder="Confirm your new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
          <div className="modal-buttons">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      );
    }

    if (activeModal === 'deleteAccount') {
      return (
        <form onSubmit={handleAccountDelete}>
          <p className="form-description">
            Please enter your password and the confirmation to Delete your Account.
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Enter your password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirmation">
              Confirmation
            </label>
            <p className="form-description">Please type "delete my account" to continue </p>
            <input
              id="confirmation"
              type="text"
              placeholder="Enter your confirmation"
              value={confirmation}
              onChange={(e) => handleConfirmationChange(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="form-input"
            />
          </div>
          <div className="modal-buttons">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Confirming...' : 'Confirm'}
            </button>
          </div>
        </form>
      );
    }

    return null;
  };

  return (
    <div className="account-settings-container">
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <Link href="/settings" className="settings-back">
          Back to Settings
        </Link>
      </div>

      {errormsg && !activeModal && <p className="error-message">{errormsg}</p>}
      {success && !activeModal && <p className="success-message">{success}</p>}

      {/* 2FA Section */}
      <div className="settings-section">
        <h2 className="section-title">Two-Factor Authentication (2FA)</h2>
        <p className="section-description">Add an extra layer of security to your account.</p>
        <div className="toggle-container">
          <div className="toggle-info">
            <div className="toggle-label">Enable 2FA</div>
          </div>
          <label className="toggle-switch" onClick={() => setActiveModal('confirmPassword')}>
            <input type="checkbox" className="toggle-input" checked={twoFactorEnabled} readOnly />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <h2 className="section-title">Password</h2>
        <p className="section-description">
          It's a good practice to periodically update your password.
        </p>
        <button className="btn btn-primary" onClick={() => setActiveModal('changePassword')}>
          Change Password
        </button>
      </div>

      {/*Account Delete Section*/}
      <div className="settings-section">
        <h2 className="section-title">Delete Account</h2>
        <p className="section-description">Note: This Action is Note reversable.</p>
        <button className="btn btn-danger" onClick={() => setActiveModal('deleteAccount')}>
          Delete Account
        </button>
      </div>

      {/* Sessions Section */}
      <div className="settings-section">
        <div className="sessions-header">
          <h2 className="section-title">Active Sessions</h2>
          <p className="section-description">
            Logout all sessions will log you out of all devices and platforms.
          </p>
          <button
            className="btn btn-danger"
            onClick={handleLogoutAllSessions}
            disabled={isSessionLoading}
          >
            Logout All Sessions
          </button>
        </div>
        <p className="section-description">
          Manage your active sessions across all devices and platforms.
        </p>

        <div className="sessions-list">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              className={`session-item ${session.is_current ? 'current' : ''}`}
            >
              <div className="session-info">
                <div className="session-device">{session.device_info}</div>
                {session.is_current && <div className="session-current">Current Session</div>}
                <div className="session-details">
                  IP: {session.ip_address}
                  <br />
                  Last active: {session.last_active}
                </div>
              </div>
              {!session.is_current && (
                <div className="session-actions">
                  <button
                    className="btn btn-small"
                    onClick={() => handleDeleteSession(session.session_id)}
                    disabled={isSessionLoading}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={activeModal !== null} onClose={closeModal} title={getModalTitle()}>
        {/* Display error messages inside the modal */}
        {errormsg && activeModal && <p className="error-message">{errormsg}</p>}
        {success && activeModal && <p className="success-message">{success}</p>}
        {renderModalContent()}
      </Modal>
    </div>
  );
}
