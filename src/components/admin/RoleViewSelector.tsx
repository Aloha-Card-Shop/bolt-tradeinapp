
import React from 'react';
import { Check, ChevronDown, Eye, Pencil } from 'lucide-react';

interface RoleViewSelectorProps {
  currentRole: 'admin' | 'manager' | 'user';
  onChangeRole: (role: 'admin' | 'manager' | 'user') => void;
  viewPermissions: {
    admin: boolean;
    manager: boolean;
    user: boolean;
  };
  editPermissions: {
    admin: boolean;
    manager: boolean;
    user: boolean;
  };
  onTogglePermission: (role: 'admin' | 'manager' | 'user', type: 'view' | 'edit', value: boolean) => void;
}

const RoleViewSelector: React.FC<RoleViewSelectorProps> = ({
  currentRole,
  onChangeRole,
  viewPermissions,
  editPermissions,
  onTogglePermission
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const roleLabels = {
    admin: 'Admin View',
    manager: 'Manager View',
    user: 'User View'
  };

  const toggleDropdown = () => setIsOpen(!isOpen);
  
  return (
    <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100 p-5">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Interface Preview</h3>
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
          >
            <span>{roleLabels[currentRole]}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          
          {isOpen && (
            <div className="absolute mt-1 w-full z-10 bg-white rounded-lg shadow-lg border border-gray-200">
              <ul className="py-1">
                {Object.entries(roleLabels).map(([role, label]) => (
                  <li key={role}>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeRole(role as 'admin' | 'manager' | 'user');
                        setIsOpen(false);
                      }}
                      className={`flex items-center px-4 py-2 w-full text-left hover:bg-gray-50 ${
                        currentRole === role ? 'bg-blue-50 text-blue-600 font-medium' : ''
                      }`}
                    >
                      {currentRole === role && <Check className="h-4 w-4 mr-2" />}
                      <span className={currentRole !== role ? 'pl-6' : ''}>{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium mr-4">Access Control</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-2 text-center">
              <div className="text-sm font-medium mb-2">Admin</div>
              <div className="flex items-center justify-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewPermissions.admin}
                    onChange={(e) => onTogglePermission('admin', 'view', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Eye className="h-4 w-4 text-gray-500" title="View" />
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPermissions.admin}
                    onChange={(e) => onTogglePermission('admin', 'edit', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Pencil className="h-4 w-4 text-gray-500" title="Edit" />
                </label>
              </div>
            </div>
            
            <div className="border rounded-lg p-2 text-center">
              <div className="text-sm font-medium mb-2">Manager</div>
              <div className="flex items-center justify-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewPermissions.manager}
                    onChange={(e) => onTogglePermission('manager', 'view', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Eye className="h-4 w-4 text-gray-500" title="View" />
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPermissions.manager}
                    onChange={(e) => onTogglePermission('manager', 'edit', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Pencil className="h-4 w-4 text-gray-500" title="Edit" />
                </label>
              </div>
            </div>
            
            <div className="border rounded-lg p-2 text-center">
              <div className="text-sm font-medium mb-2">User</div>
              <div className="flex items-center justify-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewPermissions.user}
                    onChange={(e) => onTogglePermission('user', 'view', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Eye className="h-4 w-4 text-gray-500" title="View" />
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPermissions.user}
                    onChange={(e) => onTogglePermission('user', 'edit', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Pencil className="h-4 w-4 text-gray-500" title="Edit" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleViewSelector;
