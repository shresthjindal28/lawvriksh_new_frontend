import React, { useState } from 'react';
import '@/styles/admin-styles/user-modal.css';
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
  );
};

export default UserModal;
