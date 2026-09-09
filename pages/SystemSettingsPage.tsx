import React, { useState, useRef, useEffect } from 'react';
import type { CategoryItem, SystemConfig, Admin, BackupSchedule } from '../types';
import { EditIcon, DeleteIcon, DownloadIcon, UploadIcon, AdvancedScheduleIcon, PasswordIcon, ChevronUpIcon, ChevronDownIcon } from '../components/Icons';
import type { Donee } from '../pages/DoneePage';
import type { Donation } from '../pages/PayDonationsPage';


// Helper component for form fields, moved from AdminsPage
const FormField: React.FC<{ 
    label: string; 
    id: string; 
    type?: string; 
    value: string; 
    placeholder?: string; 
    disabled?: boolean; 
    isTextArea?: boolean;
    name?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}> = ({ label, id, type = 'text', value, placeholder, disabled = false, isTextArea = false, name, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {isTextArea ? (
        <textarea 
            id={id} 
            name={name || id} 
            rows={3} 
            value={value} 
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800" 
            disabled={disabled}
        ></textarea>
    ) : (
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
    )}
  </div>
);


// Reusable component to manage a category
const CategoryManager: React.FC<{
  title: string;
  itemName: string;
  items: CategoryItem[];
  setItems: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  onAdd?: (name: string) => Promise<{ id: number; name: string }>;
  onUpdate?: (item: CategoryItem) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}> = ({ title, itemName, items, setItems, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return item.name.toLowerCase().includes(term);
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    if (items.some(item => item.name.toLowerCase() === newItemName.trim().toLowerCase())) {
        alert(`A ${itemName} with this name already exists.`);
        return;
    }
    try {
      if (onAdd) {
        const created = await onAdd(newItemName.trim());
        setItems(prev => [...prev, created].sort((a,b) => a.id - b.id));
      } else {
        const newItem = {
          id: (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1,
          name: newItemName.trim(),
        };
        setItems(prev => [...prev, newItem].sort((a,b) => a.id - b.id));
      }
      setNewItemName('');
    } catch (err) {
      alert('Failed to add item.');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;
    if (items.some(item => item.id !== editingItem.id && item.name.toLowerCase() === editingItem.name.trim().toLowerCase())) {
        alert(`A ${itemName} with this name already exists.`);
        return;
    }
    try {
      if (onUpdate) {
        await onUpdate({ ...editingItem, name: editingItem.name.trim() });
      }
      setItems(prev => prev.map(item => (item.id === editingItem.id ? { ...editingItem, name: editingItem.name.trim() } : item)));
      setEditingItem(null);
    } catch (err) {
      alert('Failed to update item.');
    }
  };
  
  const handleDeleteItem = async (id: number) => {
    try {
      if (onDelete) await onDelete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      if (editingItem && editingItem.id === id) {
          setEditingItem(null);
      }
    } catch (err) {
      alert('Failed to delete item.');
    }
  };
  
  const startEditing = (item: CategoryItem) => {
      setEditingItem({...item});
      setNewItemName('');
  }
  
  const cancelEditing = () => {
      setEditingItem(null);
  }
  
  const nameInputId = `${itemName.toLowerCase()}-name-input`;
  const searchInputId = `${itemName.toLowerCase()}-search-input`;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
      
      {/* Add/Edit Form */}
      <form onSubmit={handleAddItem} className="mb-6 flex flex-col sm:flex-row items-end gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50">
        <div className="flex-grow w-full">
            <label htmlFor={nameInputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {editingItem ? `Edit Item Name` : `New ${itemName} Name`}
            </label>
            <input
                type="text"
                id={nameInputId}
                value={editingItem ? editingItem.name : newItemName}
                onChange={(e) => {
                    if (editingItem) {
                        setEditingItem({ ...editingItem, name: e.target.value });
                    } else {
                        setNewItemName(e.target.value);
                    }
                }}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={`Enter a name`}
            />
        </div>
        {editingItem ? (
            <div className="flex gap-2 shrink-0">
                <button
                    type="button"
                    onClick={handleUpdateItem}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Update
                </button>
                 <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                    Cancel
                </button>
            </div>
        ) : (
            <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 shrink-0"
            >
                Add New
            </button>
        )}
      </form>
      
      {/* Search Bar */}
      <div className="mb-4">
        <label htmlFor={searchInputId} className="sr-only">Search</label>
        <input
          id={searchInputId}
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full sm:w-1/3 px-3 py-1.5 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => startEditing(item)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400" aria-label={`Edit ${item.name}`}>
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400" aria-label={`Delete ${item.name}`}>
                      <DeleteIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
             {filteredItems.length === 0 && (
                <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        No items found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SystemSettingsPageProps {
  donationCases: CategoryItem[];
  setDonationCases: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  doneeTypes: CategoryItem[];
  setDoneeTypes: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  donationTypes: CategoryItem[];
  setDonationTypes: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  references: CategoryItem[];
  setReferences: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  bankTypes: CategoryItem[];
  setBankTypes: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  donees: Donee[];
  setDonees: React.Dispatch<React.SetStateAction<Donee[]>>;
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
  admins: Admin[];
  setAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

const NumberSpinner: React.FC<{ value: number; onChange: (value: number) => void; min?: number; max?: number; disabled?: boolean; }> = ({ value, onChange, min = 0, max = 59, disabled }) => {
    const handleChange = (newValue: number) => {
        if (!isNaN(newValue)) {
            onChange(Math.max(min, Math.min(max, newValue)));
        }
    };
    const increment = () => !disabled && handleChange(value + 1);
    const decrement = () => !disabled && handleChange(value - 1);

    return (
        <div className="relative flex items-center">
            <input 
                type="number"
                value={value}
                onChange={e => handleChange(parseInt(e.target.value, 10))}
                min={min}
                max={max}
                disabled={disabled}
                className="w-16 text-center py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
            />
            <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center">
                <button type="button" onClick={increment} disabled={disabled || value >= max} className="h-1/2 px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"><ChevronUpIcon className="w-3 h-3"/></button>
                <button type="button" onClick={decrement} disabled={disabled || value <= min} className="h-1/2 px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"><ChevronDownIcon className="w-3 h-3"/></button>
            </div>
        </div>
    );
};


const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({
    donationCases, setDonationCases,
    doneeTypes, setDoneeTypes,
    donationTypes, setDonationTypes,
    references, setReferences,
    bankTypes, setBankTypes,
    donees, setDonees,
    donations, setDonations,
    admins, setAdmins,
    config, setConfig,
}) => {
    const [activeTab, setActiveTab] = useState('general');
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restoreData, setRestoreData] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
    const addDonationCase = async (name: string) => {
        const res = await fetch(`${apiBase}/api/donation-cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('create-failed');
        const data = await res.json();
        return { id: data.id as number, name };
    };
    const updateDonationCase = async (item: CategoryItem) => {
        const res = await fetch(`${apiBase}/api/donation-cases/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: item.name })
        });
        if (!res.ok) throw new Error('update-failed');
    };
    const deleteDonationCase = async (id: number) => {
        const res = await fetch(`${apiBase}/api/donation-cases/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete-failed');
    };

    const addDoneeType = async (name: string) => {
        const res = await fetch(`${apiBase}/api/donee-types`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('create-failed');
        const data = await res.json();
        return { id: data.id as number, name };
    };
    const updateDoneeType = async (item: CategoryItem) => {
        const res = await fetch(`${apiBase}/api/donee-types/${item.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.name })
        });
        if (!res.ok) throw new Error('update-failed');
    };
    const deleteDoneeType = async (id: number) => {
        const res = await fetch(`${apiBase}/api/donee-types/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete-failed');
    };

    const addDonationType = async (name: string) => {
        const res = await fetch(`${apiBase}/api/donation-types`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('create-failed');
        const data = await res.json();
        return { id: data.id as number, name };
    };
    const updateDonationType = async (item: CategoryItem) => {
        const res = await fetch(`${apiBase}/api/donation-types/${item.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.name })
        });
        if (!res.ok) throw new Error('update-failed');
    };
    const deleteDonationType = async (id: number) => {
        const res = await fetch(`${apiBase}/api/donation-types/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete-failed');
    };

    const addReference = async (name: string) => {
        const res = await fetch(`${apiBase}/api/references`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('create-failed');
        const data = await res.json();
        return { id: data.id as number, name };
    };
    const updateReference = async (item: CategoryItem) => {
        const res = await fetch(`${apiBase}/api/references/${item.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.name })
        });
        if (!res.ok) throw new Error('update-failed');
    };
    const deleteReference = async (id: number) => {
        const res = await fetch(`${apiBase}/api/references/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete-failed');
    };

    const addBankType = async (name: string) => {
        const res = await fetch(`${apiBase}/api/banks`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('create-failed');
        const data = await res.json();
        return { id: data.id as number, name };
    };
    const updateBankType = async (item: CategoryItem) => {
        const res = await fetch(`${apiBase}/api/banks/${item.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.name })
        });
        if (!res.ok) throw new Error('update-failed');
    };
    const deleteBankType = async (id: number) => {
        const res = await fetch(`${apiBase}/api/banks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete-failed');
    };


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({
                    ...prev,
                    trustProfilePicture: reader.result as string,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setConfig(prev => ({
            ...prev,
            trustProfilePicture: '',
        }));
        if (profilePicInputRef.current) {
            profilePicInputRef.current.value = '';
        }
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiBase}/api/system-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trustName: config.trustName,
                    contactNumber: config.contactNumber,
                    systemEmail: config.systemEmail,
                    address: config.address,
                    trustProfilePicture: config.trustProfilePicture || null,
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const saved = await res.json();
            setConfig(prev => ({
                ...prev,
                trustName: saved.TrustName ?? saved.trustName ?? prev.trustName,
                contactNumber: saved.ContactNumber ?? saved.contactNumber ?? prev.contactNumber,
                systemEmail: saved.SystemEmail ?? saved.systemEmail ?? prev.systemEmail,
                address: saved.Address ?? saved.address ?? prev.address,
                trustProfilePicture: saved.TrustProfilePicture ?? saved.trustProfilePicture ?? prev.trustProfilePicture,
            }));
            alert("System configuration saved successfully!");
        } catch (err) {
            console.error('Failed to save system config', err);
            alert('Failed to save system configuration');
        }
    };


    const GeneralSettingsComponent = () => (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-3">System Configuration</h3>
            <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Trust Name" id="trustName" name="trustName" value={config.trustName} onChange={handleConfigChange} />
                    <FormField label="Contact Number" id="contactNumber" name="contactNumber" value={config.contactNumber} onChange={handleConfigChange} />
                    <FormField label="System Email" id="systemEmail" name="systemEmail" type="email" value={config.systemEmail} onChange={handleConfigChange} />
                    <FormField label="Address" id="address" name="address" isTextArea value={config.address} onChange={handleConfigChange} />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trust Profile Picture</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {config.trustProfilePicture ? (
                                    <img className="h-full w-full object-cover" src={config.trustProfilePicture} alt="Trust Logo" />
                                ) : (
                                    <svg className="h-full w-full text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )}
                            </span>
                            <input type="file" accept="image/*" className="hidden" ref={profilePicInputRef} onChange={handleImageChange} />
                            <button
                                type="button"
                                onClick={() => profilePicInputRef.current?.click()}
                                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Change
                            </button>
                            {config.trustProfilePicture && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="pt-2 flex justify-end">
                    <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Save Configuration
                    </button>
                </div>
            </form>
        </div>
    );

    const BackupRestoreComponent = () => {
        const [schedule, setSchedule] = useState<BackupSchedule>(config.backupSchedule!);
        const [estimatedPlan, setEstimatedPlan] = useState<string[]>([]);
        const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

        useEffect(() => {
            if (!schedule || !schedule.full.enabled) {
                setEstimatedPlan([]);
                return;
            }
        
            const plan: string[] = [];
            const firstStartDate = new Date(schedule.firstFullBackupStart);
            const intervalMs = (schedule.full.everyHours * 60 * 60 * 1000) + (schedule.full.everyMinutes * 60 * 1000);
        
            if (intervalMs <= 0 || isNaN(firstStartDate.getTime())) {
                setEstimatedPlan([]);
                return;
            }
        
            const dayMap: (keyof BackupSchedule['runOnDays'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            let nextDate = new Date(firstStartDate);
            let iterations = 0; 
        
            while (plan.length < 20 && iterations < 1000) {
                const dayIndex = nextDate.getDay();
                const dayKey = dayMap[dayIndex];
                
                if (schedule.runOnDays[dayKey] && nextDate.getTime() >= new Date().getTime()) {
                     const formattedDate = new Intl.DateTimeFormat('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    }).format(nextDate).replace(',', '');
                    plan.push(formattedDate);
                }
                
                nextDate = new Date(nextDate.getTime() + intervalMs);
                iterations++;
            }
        
            setEstimatedPlan(plan);
        }, [schedule]);

        const handleScheduleChange = (part: keyof BackupSchedule, field: string, value: any) => {
            setSchedule(prev => ({ ...prev, [part]: { ...(prev as any)[part], [field]: value } }));
        };

        const handleDayChange = (day: keyof BackupSchedule['runOnDays']) => {
            setSchedule(prev => ({ ...prev, runOnDays: { ...prev.runOnDays, [day]: !prev.runOnDays[day] }}));
        };

        const handlePreset = (preset: '6h' | 'daily' | 'weekly') => {
            setSchedule(prev => {
                const newSchedule = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation
                let newHours = 0;
                switch (preset) {
                    case '6h': newHours = 6; break;
                    case 'daily': newHours = 24; break;
                    case 'weekly': newHours = 168; break; // 24 * 7
                }
                 newSchedule.full.everyHours = newHours;
                 newSchedule.full.everyMinutes = 0;

                return newSchedule;
            });
        };
        
        const handleSelectAllDays = (select: boolean) => {
            setSchedule(prev => ({
                ...prev,
                runOnDays: {
                    sun: select, mon: select, tue: select, wed: select, thu: select, fri: select, sat: select
                }
            }));
        };
        
        const handleBackup = () => {
            const backupData = { donees, donations, admins, donationCases, doneeTypes, references, config };
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `qamartrust_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.donees && data.donations && data.admins && data.donationCases && data.doneeTypes && data.references && data.config) {
                        setRestoreData(data);
                        setIsRestoreConfirmOpen(true);
                    } else {
                        alert('Error: Invalid or corrupted backup file.');
                    }
                } catch (error) {
                    console.error("Restore error:", error);
                    alert('Error reading backup file.');
                } finally {
                    if (e.target) e.target.value = '';
                }
            };
            reader.readAsText(file);
        };
        
        const handleScheduleSave = () => {
            setConfig(prev => ({ ...prev, backupSchedule: schedule }));
            alert('Backup schedule saved successfully!');
        };

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200">Backup Data</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">Download a JSON file containing all application data.</p>
                        <button onClick={handleBackup} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">
                            <DownloadIcon className="w-5 h-5" /> Download Backup
                        </button>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200">Restore Data</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">Restore data from a backup file. This will overwrite existing data.</p>
                        <input type="file" ref={fileInputRef} onChange={handleRestoreFileSelect} accept="application/json" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-yellow-600">
                            <UploadIcon className="w-5 h-5" /> Restore from File
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <AdvancedScheduleIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Advanced Backup Schedule</h3>
                </div>
                
                <div className="space-y-8">
                    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
                            <label htmlFor="schedule-enabled" className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Automated Full Backup
                            </label>
                            <div className="flex items-center">
                                <span className={`mr-3 text-sm font-medium ${schedule.full.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {schedule.full.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <label htmlFor="schedule-enabled" className="inline-flex relative items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        id="schedule-enabled"
                                        className="sr-only peer" 
                                        checked={schedule.full.enabled}
                                        onChange={e => handleScheduleChange('full', 'enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className={`space-y-6 transition-opacity duration-300 ${!schedule.full.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Frequency</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Presets:</span>
                                        <button type="button" onClick={() => handlePreset('6h')} className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900">Every 6 Hours</button>
                                        <button type="button" onClick={() => handlePreset('daily')} className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900">Daily</button>
                                        <button type="button" onClick={() => handlePreset('weekly')} className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900">Weekly</button>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2 sm:pt-0 sm:border-l sm:pl-4 border-gray-300 dark:border-gray-600">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Custom:</span>
                                        <NumberSpinner value={schedule.full.everyHours} onChange={v => handleScheduleChange('full', 'everyHours', v)} min={0} max={168} disabled={!schedule.full.enabled} />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">hr</span>
                                        <NumberSpinner value={schedule.full.everyMinutes} onChange={v => handleScheduleChange('full', 'everyMinutes', v)} min={0} max={59} disabled={!schedule.full.enabled} />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">min</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center">
                                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">Active Days</h4>
                                    <div className="space-x-3">
                                        <button type="button" onClick={() => handleSelectAllDays(true)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400" disabled={!schedule.full.enabled}>Select All</button>
                                        <button type="button" onClick={() => handleSelectAllDays(false)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400" disabled={!schedule.full.enabled}>Deselect All</button>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between space-x-2">
                                    {daysOfWeek.map(day => (
                                        <label key={day} className="flex flex-col items-center cursor-pointer">
                                            <input type="checkbox" checked={schedule.runOnDays[day]} onChange={() => handleDayChange(day)} disabled={!schedule.full.enabled} className="sr-only peer" />
                                            <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 text-sm font-bold uppercase text-gray-500 dark:text-gray-400 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                                                {day}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="first-start" className="block text-md font-semibold text-gray-700 dark:text-gray-300">Start Time</label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Set the date and time for the first backup to run. Subsequent backups will follow the frequency you set.</p>
                                <input 
                                    type="datetime-local" 
                                    id="first-start" 
                                    value={schedule.firstFullBackupStart} 
                                    onChange={e => setSchedule(s => ({ ...s, firstFullBackupStart: e.target.value }))}
                                    disabled={!schedule.full.enabled}
                                    className="mt-1 block w-full sm:w-1/2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50" 
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Upcoming Backups</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">This is an estimated schedule for the next 20 backup times based on your current settings.</p>
                        <div className="mt-1 h-56 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                            {schedule.full.enabled && estimatedPlan.length > 0 ? (
                                <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 font-mono space-y-1">
                                    {estimatedPlan.map((item, index) => (
                                        <li key={index}>
                                            <span className={index === 0 ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}>{item}</span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                   {schedule.full.enabled ? 'Invalid settings. Please set a future start date and an interval greater than 0.' : 'Enable automated backups to see the schedule.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button type="button" onClick={handleScheduleSave} className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        Save Schedule
                    </button>
                </div>
            </div>
        );
    };

    const tabs = [
        { id: 'general', label: 'General Settings' },
        { id: 'cases', label: 'Donation Cases' },
        { id: 'types', label: 'Donee Types' },
        { id: 'donation-types', label: 'Donation Types' },
        { id: 'references', label: 'References' },
        { id: 'banks', label: 'Bank Types' },
        { id: 'backup', label: 'Backup & Restore' },
    ];
  
    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettingsComponent />;
            case 'cases':
                return (
                    <CategoryManager 
                        title="Donation Cases" 
                        itemName="Case" 
                        items={donationCases} 
                        setItems={setDonationCases}
                        onAdd={addDonationCase}
                        onUpdate={updateDonationCase}
                        onDelete={deleteDonationCase}
                    />
                );
            case 'types':
                return (
                    <CategoryManager 
                        title="Donee Types" 
                        itemName="Type" 
                        items={doneeTypes} 
                        setItems={setDoneeTypes}
                        onAdd={addDoneeType}
                        onUpdate={updateDoneeType}
                        onDelete={deleteDoneeType}
                    />
                );
            case 'donation-types':
                return (
                    <CategoryManager 
                        title="Donation Types" 
                        itemName="Donation Type" 
                        items={donationTypes} 
                        setItems={setDonationTypes}
                        onAdd={addDonationType}
                        onUpdate={updateDonationType}
                        onDelete={deleteDonationType}
                    />
                );
            case 'references':
                return (
                    <CategoryManager 
                        title="References" 
                        itemName="Reference" 
                        items={references} 
                        setItems={setReferences}
                        onAdd={addReference}
                        onUpdate={updateReference}
                        onDelete={deleteReference}
                    />
                );
            case 'banks':
                return (
                    <CategoryManager 
                        title="Bank Types" 
                        itemName="Bank" 
                        items={bankTypes} 
                        setItems={setBankTypes}
                        onAdd={addBankType}
                        onUpdate={updateBankType}
                        onDelete={deleteBankType}
                    />
                );
            case 'backup':
                return <BackupRestoreComponent />;
            default:
                return null;
        }
    };
    
    const handleConfirmRestore = () => {
        if (!restoreData) return;

        try {
            setDonees(restoreData.donees);
            setDonations(restoreData.donations);
            setAdmins(restoreData.admins);
            setDonationCases(restoreData.donationCases);
            setDoneeTypes(restoreData.doneeTypes);
            setReferences(restoreData.references);
            setConfig(restoreData.config);
            
            alert('Restore successful! The application data has been updated.');
        } catch (error) {
            alert('An unexpected error occurred during restore.');
            console.error("Restore confirmation error:", error);
        } finally {
            setIsRestoreConfirmOpen(false);
            setRestoreData(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">Select a tab</label>
                    <select
                        id="tabs"
                        name="tabs"
                        className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        onChange={(e) => setActiveTab(e.target.value)}
                        value={activeTab}
                    >
                    {tabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.label}</option>
                    ))}
                    </select>
                </div>
                <div className="hidden sm:block">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    tab.id === activeTab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                aria-current={tab.id === activeTab ? 'page' : undefined}
                            >
                            {tab.label}
                            </button>
                        ))}
                        </nav>
                    </div>
                </div>
            </div>
            
            <div>
                {renderContent()}
            </div>

            {isRestoreConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 m-4">
                        <h3 className="text-lg font-bold text-yellow-500">Confirm Restore</h3>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            <p>Are you sure you want to restore data from the selected file?</p>
                            <p className="font-bold text-red-500 mt-2">This will overwrite all current application data. This action cannot be undone.</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setIsRestoreConfirmOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={handleConfirmRestore} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Yes, Restore Data</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettingsPage;