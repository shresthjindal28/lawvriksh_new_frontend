import React, { useState } from 'react';
import { UserRole } from '@/types/admin';

export interface UserData {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

interface UserModalProps {
  mode: 'add' | 'edit'; // Determines whether we are adding or editing
  initialData?: UserData; // Pre-fill form for edit mode
  onClose: () => void;
  onSubmit: (data: UserData) => Promise<any>;
}

const UserModal: React.FC<UserModalProps> = ({ mode, initialData, onClose, onSubmit }) => {
  const [name, setName] = useState(() => initialData?.name || '');
  const [email, setEmail] = useState(() => initialData?.email || '');
  const [role, setRole] = useState<UserRole>(() => initialData?.role || 'user');
  const [password, setPassword] = useState(() => initialData?.password || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({ name, email, role, password });
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{mode === 'edit' ? 'Edit User' : 'Add New User'}</h2>
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={error ? 'error-input' : ''}
                disabled={mode === 'edit'} /* usually email isn't editable */
              />
              {error && <p className="error-text">{error}</p>}
            </div>

            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value={'user'}>User</option>
                <option value={'student'}>Student</option>
                <option value={'professional'}>Professional</option>
                <option value={'admin'}>Admin</option>
                <option value={'creator'}>Creator</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode === 'add'}
              />
            </div>

            <button type="submit" className="submit-btn">
              {mode === 'edit' ? 'Save Changes' : 'Add User'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        /* Overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
          padding: 10px;
        }

        /* Modal container */
        .modal {
          background: #fff;
          border-radius: 10px;
          width: 500px;
          max-width: 100%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          padding: 20px 24px;
          animation: fadeIn 0.3s ease;
          box-sizing: border-box;
        }

        /* Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          font-size: 22px;
          cursor: pointer;
        }

        /* Form */
        .modal-form .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 14px;
        }

        .modal-form label {
          font-size: 14px;
          margin-bottom: 4px;
          color: #333;
        }

        .modal-form input,
        .modal-form select {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .modal-form input:focus,
        .modal-form select:focus {
          outline: none;
          border-color: #000;
        }

        .error-input {
          border-color: #e53e3e;
        }

        .error-text {
          color: #e53e3e;
          font-size: 12px;
          margin-top: 3px;
        }

        .submit-btn {
          width: 100%;
          padding: 10px;
          background-color: #000;
          color: white;
          font-weight: 500;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .submit-btn:hover {
          background-color: #222;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsiveness */
        @media (max-width: 480px) {
          .modal {
            width: 100%;
            border-radius: 8px;
            padding: 16px;
          }

          .modal-header h2 {
            font-size: 16px;
          }

          .submit-btn {
            padding: 8px;
            font-size: 14px;
          }

          .modal-form input,
          .modal-form select {
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
};

export default UserModal;
