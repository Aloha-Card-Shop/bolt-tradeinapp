
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { validateUsername, validateEmail, generateEmailFromUsername } from '../../utils/userValidation';

interface NewStaffUser {
  email?: string;
  password: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
}

interface CreateUserModalProps {
  newUser: NewStaffUser;
  onUserChange: (user: NewStaffUser) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ 
  newUser, 
  onUserChange, 
  onSubmit, 
  onClose 
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<string>('');

  // Validate and update preview email when username changes
  useEffect(() => {
    if (newUser.username && !newUser.email) {
      const validation = validateUsername(newUser.username);
      if (validation.isValid) {
        setUsernameError(null);
        setPreviewEmail(generateEmailFromUsername(newUser.username));
      } else {
        setUsernameError(validation.error || null);
        setPreviewEmail('');
      }
    } else {
      setUsernameError(null);
      setPreviewEmail('');
    }
  }, [newUser.username, newUser.email]);

  // Validate email when it changes
  useEffect(() => {
    if (newUser.email) {
      const validation = validateEmail(newUser.email);
      if (!validation.isValid) {
        setEmailError(validation.error || null);
      } else {
        setEmailError(null);
      }
    } else {
      setEmailError(null);
    }
  }, [newUser.email]);

  // General form validation
  useEffect(() => {
    if (!newUser.email && !newUser.username) {
      setFormError('Either email or username is required');
    } else if (newUser.email && emailError) {
      setFormError('Please fix the email error');
    } else if (newUser.username && usernameError) {
      setFormError('Please fix the username error');
    } else {
      setFormError(null);
    }
  }, [newUser.email, newUser.username, emailError, usernameError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!newUser.email && !newUser.username) {
      setFormError('Either email or username is required');
      return;
    }

    if (newUser.email) {
      const emailValidation = validateEmail(newUser.email);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error || null);
        return;
      }
    }

    if (newUser.username) {
      const usernameValidation = validateUsername(newUser.username);
      if (!usernameValidation.isValid) {
        setUsernameError(usernameValidation.error || null);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    onUserChange({ ...newUser, username: value || undefined });
  };

  const handleEmailChange = (value: string) => {
    onUserChange({ ...newUser, email: value || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Staff User</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional if username is provided)
              </label>
              <input
                type="email"
                value={newUser.email || ''}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  emailError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username (Required if email is not provided)
              </label>
              <input
                type="text"
                value={newUser.username || ''}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  usernameError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="username"
                disabled={isSubmitting}
              />
              {usernameError && (
                <p className="mt-1 text-sm text-red-600">{usernameError}</p>
              )}
              {!usernameError && newUser.username && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    Only letters, numbers, dots, underscores, and hyphens allowed
                  </p>
                  {previewEmail && (
                    <p className="text-xs text-blue-600">
                      Will create email: {previewEmail}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => onUserChange({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => onUserChange({ ...newUser, role: e.target.value as 'admin' | 'manager' | 'user' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white bg-blue-600 rounded-lg ${
                isSubmitting || formError || !newUser.password ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
              disabled={isSubmitting || !!formError || !newUser.password}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
