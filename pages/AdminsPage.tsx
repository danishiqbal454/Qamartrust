


import React, { useState } from 'react';
import { EditIcon, DeleteIcon } from '../components/Icons';
import type { Admin, UserRole } from '../types';

// Helper component for form fields
const FormField: React.FC<{ 
    label: string; 
    id: string; 
    type?: string; 
    value: string; 
    placeholder?: string; 
    disabled?: boolean; 
    name?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}> = ({ label, id, type = 'text', value, placeholder, disabled = false, name, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white">{label}</label>
    <input 
        type={type} 
        id={id} 
        name={name || id} 
        value={value}
        onChange={onChange} 
        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800" 
        placeholder={placeholder} 
        disabled={disabled} 
    />
  </div>
);

// Helper component for the action icons in the table
const ActionIcons: React.FC<{ onEdit: () => void; onDelete: () => void; isCurrentUser: boolean }> = ({ onEdit, onDelete, isCurrentUser }) => (
    <div className="flex items-center justify-center space-x-2">
        <button onClick={onEdit} className="text-gray-400 dark:text-gray-500 hover:text-indigo-600" aria-label="Edit Admin">
            <EditIcon className="h-5 w-5" />
        </button>
        <button 
            onClick={onDelete} 
            className={`text-gray-400 dark:text-gray-500 ${isCurrentUser ? 'cursor-not-allowed opacity-50' : 'hover:text-red-600'}`} 
            aria-label="Delete Admin"
            disabled={isCurrentUser}
        >
            <DeleteIcon className="h-5 w-5" />
        </button>
    </div>
);

interface AdminsPageProps {
    admins: Admin[];
    setAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
    currentUser: Admin | null;
}

const AdminsPage: React.FC<AdminsPageProps> = ({ admins, setAdmins, currentUser }) => {
    
    // Unified state for the admin form (create/edit)
    const initialAdminFormState = { username: '', email: '', password: '', status: 'Active' as 'Active' | 'Inactive', role: 'Staff' as UserRole };
    const [adminFormData, setAdminFormData] = useState(initialAdminFormState);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const isEditing = editingAdmin !== null;

    // Admin form change handler
    const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAdminFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

    const refreshAdmins = async () => {
        try {
            const res = await fetch(`${apiBase}/api/users`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const users = await res.json();
            const mapped: Admin[] = (Array.isArray(users) ? users : []).map((u: any) => ({
                username: u.Username || u.username,
                email: u.Email || u.email,
                password: '',
                status: (u.Status || u.status) === 'Active' ? 'Active' : 'Inactive',
                role: (u.Role || u.role),
                createdBy: 'System',
                createdAt: (u.CreatedAt || u.createdAt) ? String(u.CreatedAt || u.createdAt).slice(0,10) : ''
            }));
            setAdmins(mapped);
        } catch (e) {
            console.error('Failed to refresh admins', e);
        }
    };

    // Unified Admin form submit handler for creating and updating
    const handleAdminFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editingAdmin) {
                if (!adminFormData.username || !adminFormData.email) {
                    alert('Username and email are required.');
                    return;
                }
                const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(editingAdmin.email)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: adminFormData.username,
                        email: adminFormData.email !== editingAdmin.email ? adminFormData.email : undefined,
                        password: adminFormData.password || undefined,
                        role: adminFormData.role,
                        status: adminFormData.status,
                    })
                });
                if (res.status === 409) {
                    alert('Email already exists.');
                    return;
                }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                await refreshAdmins();
                setEditingAdmin(null);
                setAdminFormData(initialAdminFormState);
            } else {
                if (!adminFormData.username || !adminFormData.email || !adminFormData.password) {
                    alert('Please fill all fields for the new admin.');
                    return;
                }
                const res = await fetch(`${apiBase}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: adminFormData.username,
                        email: adminFormData.email,
                        password: adminFormData.password,
                        role: adminFormData.role,
                        status: adminFormData.status,
                    })
                });
                if (res.status === 409) {
                    alert('Username or Email already exists.');
                    return;
                }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                await refreshAdmins();
                setAdminFormData(initialAdminFormState);
            }
        } catch (err) {
            console.error('Failed to save admin', err);
            alert('Failed to save admin');
        }
    };
    
    // Handlers for starting edit, canceling edit, and deleting
    const handleStartEdit = (admin: Admin) => {
        setEditingAdmin(admin);
        setAdminFormData({
            username: admin.username,
            email: admin.email,
            password: '', // Password field is for creation or reset, not display
            status: admin.status,
            role: admin.role,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingAdmin(null);
        setAdminFormData(initialAdminFormState);
    };

    const handleDeleteAdmin = async (email: string) => {
        if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
        try {
            const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refreshAdmins();
        } catch (e) {
            console.error('Failed to delete admin', e);
            alert('Failed to delete admin');
        }
    };
    
    const handleStatusChange = async (email: string, newStatus: 'Active' | 'Inactive') => {
        try {
            const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(email)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refreshAdmins();
        } catch (e) {
            console.error('Failed to update status', e);
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-8">
            {/* Create/Edit Admin Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b dark:border-gray-700 pb-3">
                    {isEditing && editingAdmin ? `Edit Admin: ${editingAdmin.username}` : 'Create New Admin'}
                </h3>
                <form onSubmit={handleAdminFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <FormField label="Username" id="username" name="username" value={adminFormData.username} onChange={handleAdminFormChange} placeholder="e.g., john.doe" />
                         <FormField label="Email Address" id="email" name="email" type="email" value={adminFormData.email} onChange={handleAdminFormChange} placeholder="e.g., john.doe@example.com" disabled={isEditing} />
                         <FormField label="Password" id="password" name="password" type="password" value={adminFormData.password} onChange={handleAdminFormChange} placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter a strong password'} />
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-white">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={adminFormData.status}
                                onChange={handleAdminFormChange}
                                className="mt-1 block w-full custom-select pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-white">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={adminFormData.role}
                                onChange={handleAdminFormChange}
                                className="mt-1 block w-full custom-select pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                                <option value="Super Admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end space-x-3">
                        {isEditing && (
                            <button type="button" onClick={handleCancelEdit} className="inline-flex justify-center py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {isEditing ? 'Update Admin' : 'Create Admin'}
                        </button>
                    </div>
                </form>
            </div>

            {/* All Admins Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">All Admins</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase">Role</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase">Created At</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {admins.length > 0 ? (
                                admins.map((admin) => {
                                    const isCurrentUserRow = admin.email === currentUser?.email;
                                    return (
                                    <tr key={admin.email}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{admin.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{admin.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{admin.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <select
                                                value={admin.status}
                                                onChange={(e) => handleStatusChange(admin.email, e.target.value as 'Active' | 'Inactive')}
                                                disabled={isCurrentUserRow}
                                                className={`custom-select w-full text-xs font-semibold rounded-full border-0 focus:ring-0 focus:outline-none appearance-none py-1 pl-2 pr-6 ${admin.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'} ${isCurrentUserRow ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                aria-label={`Status for ${admin.username}`}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{admin.createdBy}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{admin.createdAt}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <ActionIcons onEdit={() => handleStartEdit(admin)} onDelete={() => handleDeleteAdmin(admin.email)} isCurrentUser={isCurrentUserRow} />
                                        </td>
                                    </tr>
                                );
                            })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-white">No admins found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminsPage;