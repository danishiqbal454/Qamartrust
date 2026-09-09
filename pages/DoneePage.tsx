
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CategoryItem, SystemConfig } from '../types';
import { PrintIcon, DoneeIcon, IdCardIcon, LocationMarkerIcon, PhoneIcon, DownloadIcon, DeleteIcon, ChevronUpIcon, ChevronDownIcon, EditIcon } from '../components/Icons';

declare global {
    interface Window {
        XLSX: any;
        jspdf: any;
    }
}

export type Attachment = {
    name: string;
    url: string; // blob url
    file: File;
};

export type FamilyMember = {
  cnic: string;
  name: string;
  relationship: string;
};

export type Donee = {
    id: number;
    sNo?: string;
    // Table fields
    status: string;
    gender: 'Male' | 'Female' | '';
    name: string;
    relation: string; // Will hold Father/Husband Name
    cnic: string;
    mobile: string; // Mobile 1
    payment: string;
    count: number;
    type: string;
    caseType: string;
    amount: number;
    regDate: string;
    // Form fields
    profilePicture?: Attachment;
    attachments?: Attachment[];
    relationType?: 'S/O' | 'D/O' | 'W/O' | '';
    dob?: string;
    mobile2?: string;
    street?: string;
    village?: string;
    tehsil?: string;
    district?: string;
    province?: string;
    familyMembers?: number;
    family?: FamilyMember[];
    familyRole?: string;
    referredBy?: string;
    bank?: string;
    accountNo?: string;
    remarks?: string;
};


// Mock data based on the user's screenshot
export const mockDonees: Donee[] = [];

const inputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const selectClass = "custom-select block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md";

const FormField: React.FC<{ label: string; children: React.ReactNode; htmlFor?: string }> = ({ label, children, htmlFor }) => (
    <div>
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-white">{label}</label>
        <div className="mt-1">{children}</div>
    </div>
);

const FileInput: React.FC<{
    id: string;
    label: string;
    multiple?: boolean;
    onChange: (files: FileList | null) => void;
    currentFiles: Attachment[] | Attachment | null;
}> = ({ id, label, multiple = false, onChange, currentFiles }) => {
    let fileCount = 0;
    if (currentFiles) {
        fileCount = Array.isArray(currentFiles) ? currentFiles.length : 1;
    }

    const fileText = multiple
        ? `${fileCount} file(s) chosen`
        : (currentFiles && 'name' in currentFiles ? (currentFiles as Attachment).name : 'No file chosen');


    return (
        <FormField label={label} htmlFor={id}>
            <div className="flex items-center">
                 <label htmlFor={id} className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span>Choose file(s)</span>
                    <input id={id} name={id} type="file" className="sr-only" multiple={multiple} onChange={(e) => onChange(e.target.files)} />
                </label>
                <span className="ml-3 text-sm text-gray-500 dark:text-white truncate">{fileText}</span>
            </div>
        </FormField>
    );
};

const DoneeDetailView: React.FC<{ donee: Donee; config: SystemConfig; onClose: () => void }> = ({ donee, config, onClose }) => {
    const handlePrint = () => {
        document.body.classList.add('is-printing');
        window.print();
    };

    const VoucherContent: React.FC = () => {
        const fullAddress = [donee.street, donee.village, donee.tehsil, donee.district, donee.province].filter(Boolean).join(', ');

        const getRelationLabels = () => {
            switch (donee.relationType) {
                case 'S/O':
                case 'D/O':
                    return { urdu: "والد کا نام" };
                case 'W/O':
                    return { urdu: "شوہر کا نام" };
                default:
                    return { urdu: "والد/شوہر کا نام" };
            }
        };
        const relationLabels = getRelationLabels();

        return (
            <div className="border-2 border-black p-4 font-sans text-right text-black bg-white h-full flex flex-col text-sm" dir="rtl">
                {/* Header */}
                <header className="border-b-2 border-black pb-2 mb-2">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">{config.trustName}</h1>
                        <h2 className="text-lg font-bold">مستحق درخواست فارم</h2>
                        <div className="text-left text-xs">
                           <p>فارم نمبر: {donee.sNo || donee.id}</p>
                        </div>
                    </div>
                    <p className="text-xs text-center">{config.address}</p>
                </header>

                {/* Body */}
                <main className="flex-grow mt-4 space-y-2">
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">مکمل نام:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.name}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">{relationLabels.urdu}:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.relation}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">شناختی کارڈ نمبر:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.cnic}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">تاریخ پیدائش:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.dob || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">موبائل نمبر:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.mobile}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-4">
                        <span className="font-bold">جنس:</span>
                        <div className="flex justify-end items-center gap-4 px-2 border-b border-black h-[1.25rem]">
                            <div className="flex items-center gap-1"><div className={`w-3 h-3 border border-black ${donee.gender === 'Male' ? 'bg-black' : ''}`}></div><label>مرد</label></div>
                            <div className="flex items-center gap-1"><div className={`w-3 h-3 border border-black ${donee.gender === 'Female' ? 'bg-black' : ''}`}></div><label>عورت</label></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">موجودہ پتہ:</span>
                        <span className="border-b border-black px-2">{fullAddress}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">مستقل پتہ:</span>
                        <span className="border-b border-black px-2">{fullAddress}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">مستحق کی قسم:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.type}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">کیس کی قسم:</span>
                        <span className="border-b border-black px-2">{donee.caseType}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">امداد کی رقم:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">Rs. {donee.amount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">معرفت:</span>
                        <span className="border-b border-black px-2">{donee.referredBy}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">بینک:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.bank}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-end gap-x-4">
                        <span className="font-bold">اکاؤنٹ نمبر:</span>
                        <span className="border-b border-black px-2 text-left" dir="ltr">{donee.accountNo}</span>
                    </div>

                    {/* Family Members Table */}
                    {donee.family && donee.family.length > 0 && (
                        <div className="pt-2">
                            <span className="font-bold">خاندان کے افراد کی تفصیلات:</span>
                            <div className="border border-black mt-1">
                                <table className="w-full text-xs text-center border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border border-black p-1 font-bold">نمبر شمار</th>
                                            <th className="border border-black p-1 font-bold">نام</th>
                                            <th className="border border-black p-1 font-bold">رشتہ</th>
                                            <th className="border border-black p-1 font-bold">شناختی کارڈ نمبر</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donee.family.map((member, index) => (
                                            <tr key={index}>
                                                <td className="border border-black p-1">{index + 1}</td>
                                                <td className="border border-black p-1 text-right">{member.name}</td>
                                                <td className="border border-black p-1 text-right">{member.relationship}</td>
                                                <td className="border border-black p-1 text-left" dir="ltr">{member.cnic || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col pt-2">
                        <span className="font-bold shrink-0">ریمارکس:</span>
                        <div className="border border-black min-h-[50px] mt-1 p-1">{donee.remarks}</div>
                    </div>
                </main>
                {/* Footer */}
                <footer className="mt-auto pt-4">
                    <div className="flex justify-between items-end">
                        <div className="text-center">
                            <div className="h-16 w-32 border-b-2 border-black"></div>
                            <p className="text-xs">دستخط مجاز افسر</p>
                        </div>
                         <div className="text-center">
                            <div className="h-16 w-32 border-b-2 border-black"></div>
                            <p className="text-xs">دستخط امیدوار</p>
                        </div>
                    </div>
                    <div className="border-t-2 border-dashed border-black mt-4 pt-2 text-center">
                        <h3 className="font-bold">رسید</h3>
                         <div className="flex justify-between items-center text-xs mt-2">
                            <p><strong>فارم نمبر:</strong> {donee.sNo || donee.id}</p>
                            <p><strong>نام:</strong> {donee.name}</p>
                            <p><strong>شناختی کارڈ نمبر:</strong> {donee.cnic}</p>
                            <p><strong>تاریخ:</strong> {new Date().toLocaleDateString('ur-PK')}</p>
                        </div>
                    </div>
                </footer>
            </div>
        );
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div id="donee-profile" className="printable-content flex-grow overflow-y-auto p-8">
                     <div className="voucher-copy">
                        <VoucherContent />
                    </div>
                </div>
                <div className="no-print bg-gray-50 dark:bg-gray-800/50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg border-t dark:border-gray-700 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">Close</button>
                    <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"><PrintIcon className="w-4 h-4" /> Print</button>
                </div>
            </div>
        </div>
    );
};


interface DoneeFormProps {
    onSave: (donee: Omit<Donee, 'id' | 'regDate'> | Donee) => void;
    onCancel: () => void;
    initialData?: Donee | null;
    nextSNo?: string;
    donationCases: CategoryItem[];
    doneeTypes: CategoryItem[];
    references: CategoryItem[];
    bankTypes: CategoryItem[];
}

const DoneeForm: React.FC<DoneeFormProps> = ({ onSave, onCancel, initialData, nextSNo, donationCases, doneeTypes, references, bankTypes }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState<Partial<Donee>>(() => initialData || {
        sNo: nextSNo,
        status: 'Active',
        gender: 'Male',
        family: [],
    });

    const [profilePicture, setProfilePicture] = useState<Attachment | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    
    // State for the family member modal
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState<FamilyMember>({ cnic: '', name: '', relationship: '' });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setProfilePicture(initialData.profilePicture || null);
            setAttachments(initialData.attachments || []);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (files: FileList | null, isMultiple: boolean) => {
        if (!files || files.length === 0) return;
        if (isMultiple) {
            const newAttachments = Array.from(files).map(file => ({ name: file.name, url: URL.createObjectURL(file), file }));
            setAttachments(prev => [...prev, ...newAttachments]);
        } else {
            const file = files[0];
            setProfilePicture({ name: file.name, url: URL.createObjectURL(file), file });
        }
    };

    const removeAttachment = (fileName: string) => {
        setAttachments(prev => prev.filter(att => att.name !== fileName));
    };
    
    const handleAddFamilyMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMember.name.trim() || !currentMember.relationship.trim()) {
            alert("Member's Name and Relationship are required.");
            return;
        }
        setFormData(prev => ({ ...prev, family: [...(prev.family || []), currentMember] }));
        setCurrentMember({ cnic: '', name: '', relationship: '' });
        setIsFamilyModalOpen(false);
    };

    const handleRemoveFamilyMember = (index: number) => {
        setFormData(prev => ({
            ...prev,
            family: prev.family?.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalFamily = formData.family || [];
        const saveData = {
            ...formData,
            family: finalFamily,
            familyMembers: finalFamily.length,
            profilePicture,
            attachments,
        };
        if (isEditing) {
            onSave({ ...initialData, ...saveData });
        } else {
            onSave(saveData as Omit<Donee, 'id' | 'regDate'>);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b dark:border-gray-700 pb-3">
                {isEditing ? `Edit Donee: ${initialData.name}` : 'Add New Donee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="col-span-1 lg:col-span-2">
                        <FileInput id="profilePicture" label="Profile Picture" onChange={(f) => handleFileChange(f, false)} currentFiles={profilePicture} />
                        {profilePicture && <img src={profilePicture.url} alt="Profile preview" className="mt-2 h-20 w-20 object-cover rounded-md" />}
                    </div>
                    <div className="col-span-1 lg:col-span-2">
                         <FileInput id="attachments" label="Attachments (multiple allowed)" multiple onChange={(f) => handleFileChange(f, true)} currentFiles={attachments} />
                         {attachments.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-white list-disc list-inside">
                                {attachments.map(att => (
                                    <li key={att.name} className="flex items-center justify-between">
                                        <span>{att.name}</span>
                                        <button type="button" onClick={() => removeAttachment(att.name)} className="text-red-500 hover:text-red-700">&times;</button>
                                    </li>
                                ))}
                            </ul>
                         )}
                    </div>
                    
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white col-span-full border-t dark:border-gray-700 pt-4 mt-4">Personal Information</h3>
                    <div>
                        <FormField label="S/No" htmlFor="sNo"><input id="sNo" name="sNo" type="text" value={formData.sNo || ''} onChange={handleChange} className={`${inputClass} bg-gray-100 dark:bg-gray-800`} readOnly /></FormField>
                    </div>
                    <div className="lg:col-span-3">
                        <FormField label="Full Name" htmlFor="name"><input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} className={inputClass} required /></FormField>
                    </div>
                    <div className="lg:col-span-2">
                        <FormField label="CNIC" htmlFor="cnic"><input id="cnic" name="cnic" type="text" value={formData.cnic || ''} onChange={handleChange} className={inputClass} required /></FormField>
                    </div>
                    <div>
                        <FormField label="Father/Husband Name" htmlFor="relation"><input id="relation" name="relation" type="text" value={formData.relation || ''} onChange={handleChange} className={inputClass} /></FormField>
                    </div>
                    <div>
                        <FormField label="Relation Type" htmlFor="relationType">
                            <select id="relationType" name="relationType" value={formData.relationType || ''} onChange={handleChange} className={selectClass}>
                                <option value="">Select...</option><option value="S/O">S/O (Son Of)</option><option value="D/O">D/O (Daughter Of)</option><option value="W/O">W/O (Wife Of)</option>
                            </select>
                        </FormField>
                    </div>
                    <div>
                        <FormField label="Date of Birth" htmlFor="dob"><input id="dob" name="dob" type="date" value={formData.dob || ''} onChange={handleChange} className={inputClass} /></FormField>
                    </div>
                    <div>
                        <FormField label="Amount" htmlFor="amount"><input id="amount" name="amount" type="number" value={formData.amount || ''} onChange={handleChange} className={inputClass} required /></FormField>
                    </div>
                     <div>
                        <FormField label="Gender" htmlFor="gender">
                            <select id="gender" name="gender" value={formData.gender || ''} onChange={handleChange} className={selectClass}>
                                <option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                        </FormField>
                    </div>
                    <div>
                        <FormField label="Mobile 1" htmlFor="mobile"><input id="mobile" name="mobile" type="text" value={formData.mobile || ''} onChange={handleChange} className={inputClass} required /></FormField>
                    </div>
                    <div>
                        <FormField label="Mobile 2" htmlFor="mobile2"><input id="mobile2" name="mobile2" type="text" value={formData.mobile2 || ''} onChange={handleChange} className={inputClass} /></FormField>
                    </div>
                    <div>
                         <FormField label="Status" htmlFor="status">
                            <select id="status" name="status" value={formData.status || 'Active'} onChange={handleChange} className={selectClass}>
                                <option value="Active">Active</option><option value="Inactive">Inactive</option>
                            </select>
                        </FormField>
                    </div>

                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white col-span-full border-t dark:border-gray-700 pt-4 mt-4">Case Details</h3>
                    <div className="lg:col-span-2">
                        <FormField label="Donee Type" htmlFor="type">
                             <select id="type" name="type" value={formData.type || ''} onChange={handleChange} className={selectClass} required>
                                <option value="" disabled>Select Donee Type</option>
                                {doneeTypes.map(dt => <option key={dt.id} value={dt.name}>{dt.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <div className="lg:col-span-2">
                        <FormField label="Donation Cases" htmlFor="caseType">
                             <select id="caseType" name="caseType" value={formData.caseType || ''} onChange={handleChange} className={selectClass} required>
                                <option value="" disabled>تمام کیس</option>
                                {donationCases.map(dc => <option key={dc.id} value={dc.name}>{dc.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white col-span-full border-t dark:border-gray-700 pt-4 mt-4">Address Details</h3>
                    <div className="lg:col-span-2"><FormField label="Street" htmlFor="street"><input id="street" name="street" type="text" value={formData.street || ''} onChange={handleChange} className={inputClass} /></FormField></div>
                    <div className="lg:col-span-2"><FormField label="Mohallah/Village" htmlFor="village"><input id="village" name="village" type="text" value={formData.village || ''} onChange={handleChange} className={inputClass} /></FormField></div>
                    
                    <div>
                        <FormField label="Province" htmlFor="province">
                            <input id="province" name="province" type="text" value={formData.province || ''} onChange={handleChange} className={inputClass} />
                        </FormField>
                    </div>
                    <div>
                        <FormField label="District" htmlFor="district">
                            <input id="district" name="district" type="text" value={formData.district || ''} onChange={handleChange} className={inputClass} />
                        </FormField>
                    </div>
                    <div className="lg:col-span-2">
                        <FormField label="Tehsil" htmlFor="tehsil">
                            <input id="tehsil" name="tehsil" type="text" value={formData.tehsil || ''} onChange={handleChange} className={inputClass} />
                        </FormField>
                    </div>

                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white col-span-full border-t dark:border-gray-700 pt-4 mt-4">Family & Financial Information</h3>
                    <div><FormField label="Primary Family Role" htmlFor="familyRole"><input id="familyRole" name="familyRole" type="text" value={formData.familyRole || ''} onChange={handleChange} className={inputClass} /></FormField></div>
                    
                    <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">Family Members ({formData.family?.length || 0})</label>
                        <div className="mt-2 space-y-2">
                            {formData.family && formData.family.length > 0 ? (
                                <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-white">Name</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-white">Relationship</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-white">CNIC</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-white"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {formData.family.map((member, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 text-gray-800 dark:text-white">{member.name}</td>
                                                    <td className="px-3 py-2 text-gray-500 dark:text-white">{member.relationship}</td>
                                                    <td className="px-3 py-2 text-gray-500 dark:text-white">{member.cnic || 'N/A'}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button type="button" onClick={() => handleRemoveFamilyMember(index)} className="text-red-600 hover:text-red-700 p-1" aria-label={`Remove ${member.name}`}>
                                                            <DeleteIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-white py-2 px-3 border border-dashed dark:border-gray-600 rounded-md text-center">No family members added yet.</p>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsFamilyModalOpen(true)}
                                className="w-full inline-flex justify-center py-2 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Add Family Member
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <FormField label="Referred By" htmlFor="referredBy">
                            <select id="referredBy" name="referredBy" value={formData.referredBy || ''} onChange={handleChange} className={selectClass}>
                                <option value="">Select...</option>
                                {references.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <div>
                        <FormField label="Bank" htmlFor="bank">
                            <select id="bank" name="bank" value={formData.bank || ''} onChange={handleChange} className={selectClass}>
                                <option value="">Select Bank...</option>
                                {bankTypes.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <div className="lg:col-span-3">
                        <FormField label="Account No." htmlFor="accountNo"><input id="accountNo" name="accountNo" placeholder="Enter IBAN or Bank Account Number" type="text" value={formData.accountNo || ''} onChange={handleChange} className={inputClass} /></FormField>
                    </div>
                    
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white col-span-full border-t dark:border-gray-700 pt-4 mt-4">Remarks</h3>
                    <div className="col-span-full">
                        <textarea id="remarks" name="remarks" value={formData.remarks || ''} onChange={handleChange} rows={4} className={inputClass}></textarea>
                    </div>
                 </div>
                 <div className="pt-2 flex justify-end space-x-3">
                     <button type="button" onClick={onCancel} className="inline-flex justify-center py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">{isEditing ? 'Update Donee' : 'Save Donee'}</button>
                </div>
            </form>
            
            {isFamilyModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <form onSubmit={handleAddFamilyMember} className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Family Member</h3>
                            <div className="space-y-4">
                                <FormField label="Full Name" htmlFor="memberName">
                                    <input id="memberName" type="text" value={currentMember.name} onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })} className={inputClass} required />
                                </FormField>
                                <FormField label="Relationship" htmlFor="memberRelationship">
                                    <input id="memberRelationship" type="text" value={currentMember.relationship} onChange={e => setCurrentMember({ ...currentMember, relationship: e.target.value })} className={inputClass} required />
                                </FormField>
                                <FormField label="CNIC (Optional)" htmlFor="memberCnic">
                                    <input id="memberCnic" type="text" value={currentMember.cnic} onChange={e => setCurrentMember({ ...currentMember, cnic: e.target.value })} className={inputClass} />
                                </FormField>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsFamilyModalOpen(false)} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700">Add Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

type SortDirection = 'ascending' | 'descending';
type SortableDoneeKeys = 'sNo' | 'name' | 'cnic' | 'amount' | 'regDate';

interface DoneeTableProps {
    donees: Donee[];
    onEdit: (donee: Donee) => void;
    onDelete: (donee: Donee) => void;
    onView: (donee: Donee) => void;
    onViewFamily: (donee: Donee) => void;
    onSort: (key: SortableDoneeKeys) => void;
    sortKey: SortableDoneeKeys | null;
    sortDirection: SortDirection;
}

const DoneeTable: React.FC<DoneeTableProps> = ({ donees, onEdit, onDelete, onView, onViewFamily, onSort, sortKey, sortDirection }) => {
    const [openAttachmentMenu, setOpenAttachmentMenu] = useState<number | null>(null);

    useEffect(() => {
        const closeMenu = () => setOpenAttachmentMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const renderSortArrow = (columnKey: SortableDoneeKeys) => {
        if (sortKey !== columnKey) return null;
        return sortDirection === 'ascending' 
            ? <ChevronUpIcon className="w-4 h-4 ml-1" /> 
            : <ChevronDownIcon className="w-4 h-4 ml-1" />;
    };

    const SortableHeader: React.FC<{ label: string; columnKey: SortableDoneeKeys; className?: string }> = ({ label, columnKey, className }) => (
        <th 
            className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70 ${className}`}
            onClick={() => onSort(columnKey)}
        >
            <div className="flex items-center">
                <span>{label}</span>
                {renderSortArrow(columnKey)}
            </div>
        </th>
    );

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        <SortableHeader label="S/No" columnKey="sNo" className="text-center" />
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">F/H Name</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Relation Type</th>
                        <SortableHeader label="CNIC" columnKey="cnic" className="text-left" />
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Mobile</th>
                        <SortableHeader label="Amount" columnKey="amount" className="text-right" />
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Family Members</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Case</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Donee Type</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Attach</th>
                        <SortableHeader label="Reg Date" columnKey="regDate" className="text-left" />
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {donees.length > 0 ? donees.map(donee => (
                        <tr key={donee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-center">{donee.sNo || ''}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" dir="rtl">{donee.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white" dir="rtl">{donee.relation}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-center">{donee.relationType || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{donee.cnic}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{donee.mobile}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right">Rs {donee.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-center">
                                <button
                                    onClick={() => onViewFamily(donee)}
                                    className="text-indigo-600 hover:text-indigo-900 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed dark:text-indigo-400 dark:hover:text-indigo-300 dark:disabled:text-gray-500"
                                    disabled={!donee.familyMembers || donee.familyMembers === 0}
                                    aria-label={`View ${donee.name}'s family members`}
                                >
                                    {donee.familyMembers || 0}
                                </button>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white" dir="rtl">{donee.caseType}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{donee.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-center relative">
                                {donee.attachments && donee.attachments.length > 0 ? (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenAttachmentMenu(openAttachmentMenu === donee.id ? null : donee.id);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                                            aria-haspopup="true"
                                            aria-expanded={openAttachmentMenu === donee.id}
                                        >
                                            {donee.attachments.length}
                                        </button>
                                        {openAttachmentMenu === donee.id && (
                                            <div
                                                className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20"
                                                role="menu"
                                                aria-orientation="vertical"
                                            >
                                                <div className="py-1" role="none">
                                                    {donee.attachments.map((att, index) => (
                                                        <a
                                                            key={index}
                                                            href={att.url}
                                                            download={att.name}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                                                            role="menuitem"
                                                        >
                                                            <span className="truncate" title={att.name}>{att.name}</span>
                                                            <DownloadIcon className="w-4 h-4 text-gray-400 shrink-0 ml-2" aria-label={`Download ${att.name}`} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span>0</span>
                                )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{donee.regDate}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${donee.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{donee.status}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center justify-center space-x-2">
                                     <button onClick={() => onView(donee)} className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-500 text-white hover:bg-gray-600 transition-colors" aria-label="Print Preview" title="Print Preview">
                                        <PrintIcon className="w-4 h-4"/>
                                    </button>
                                    <button onClick={() => onEdit(donee)} className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors" aria-label="Edit Donee" title="Edit">E</button>
                                    <button onClick={() => onDelete(donee)} className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors" aria-label="Delete Donee" title="Delete">D</button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={14} className="text-center py-10 text-gray-500 dark:text-white">No donees found.</td></tr>
                    )}
                 </tbody>
            </table>
        </div>
    );
};

interface DoneePageProps {
  pageAction: string | null;
  resetPageAction: () => void;
  donees: Donee[];
  setDonees: React.Dispatch<React.SetStateAction<Donee[]>>;
  donationCases: CategoryItem[];
  doneeTypes: CategoryItem[];
  references: CategoryItem[];
  bankTypes: CategoryItem[];
  navigateTo: (id: string, action?: string | null) => void;
  config: SystemConfig;
}

const ConfirmationDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 m-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <div className="mt-2 text-sm text-gray-600 dark:text-white">
                    {children}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const FamilyMembersModal: React.FC<{ donee: Donee; onClose: () => void }> = ({ donee, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Family Members</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Relationship</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">CNIC</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {donee.family && donee.family.length > 0 ? (
                                donee.family.map((member, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white" dir="rtl">{member.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-white" dir="rtl">{member.relationship}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-white">{member.cnic || 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-white">No family member data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const DoneePage: React.FC<DoneePageProps> = ({ pageAction, resetPageAction, donees, setDonees, donationCases, doneeTypes, references, bankTypes, navigateTo, config }) => {
    
    const [editingDonee, setEditingDonee] = useState<Donee | null>(null);
    const [deletingDonee, setDeletingDonee] = useState<Donee | null>(null);
    const [viewingFamily, setViewingFamily] = useState<Donee | null>(null);
    const [previewingDonee, setPreviewingDonee] = useState<Donee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortableDoneeKeys>('sNo');
    const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSort = (key: SortableDoneeKeys) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'ascending' ? 'descending' : 'ascending');
        } else {
            setSortKey(key);
            setSortDirection('ascending');
        }
    };

    const refreshDonees = async () => {
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${base}/api/donees`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setDonees(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to refresh donees', e);
        }
    };

    const filteredDonees = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase().trim();
        if (!lowercasedTerm) {
            return donees;
        }
        return donees.filter(donee => 
            donee.name.toLowerCase().includes(lowercasedTerm) ||
            donee.cnic.includes(lowercasedTerm) ||
            donee.mobile.toLowerCase().includes(lowercasedTerm)
        );
    }, [donees, searchTerm]);
    
    const sortedDonees = useMemo(() => {
        if (!sortKey) return filteredDonees;

        const sorted = [...filteredDonees].sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case 'sNo':
                    comparison = (parseInt(a.sNo || '0', 10)) - (parseInt(b.sNo || '0', 10));
                    break;
                case 'amount':
                    comparison = (a.amount || 0) - (b.amount || 0);
                    break;
                case 'regDate':
                    comparison = new Date(a.regDate).getTime() - new Date(b.regDate).getTime();
                    break;
                case 'name':
                case 'cnic':
                    comparison = (a[sortKey] as string || '').localeCompare(b[sortKey] as string || '');
                    break;
                default:
                    return 0;
            }
            return comparison;
        });

        return sortDirection === 'ascending' ? sorted : sorted.reverse();
    }, [filteredDonees, sortKey, sortDirection]);
    
    const handleStartEdit = (donee: Donee) => {
        setEditingDonee(donee);
        navigateTo('donee', 'edit');
    };

    const handleDeleteRequest = (donee: Donee) => {
        setDeletingDonee(donee);
    };
    
    const confirmDelete = async () => {
        if (!deletingDonee) return;
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${base}/api/donees/${deletingDonee.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refreshDonees();
        } catch (e) {
            console.error('Failed to delete donee', e);
        } finally {
            setDeletingDonee(null);
        }
    };
    
    const handleViewFamily = (donee: Donee) => {
        if ((donee.family && donee.family.length > 0) || (donee.familyMembers && donee.familyMembers > 0)) {
            setViewingFamily(donee);
        }
    };

    const handleUpdateDonee = async (doneeData: Omit<Donee, 'id' | 'regDate'> | Donee) => {
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            const d = doneeData as Donee;
            const res = await fetch(`${base}/api/donees/${d.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(d)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refreshDonees();
        } catch (e) {
            console.error('Failed to update donee', e);
        } finally {
            resetPageAction();
            setEditingDonee(null);
        }
    };
    
    const handleAddDonee = async (doneeData: Omit<Donee, 'id' | 'regDate'>) => {
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${base}/api/donees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doneeData)
            });
            if (!res.ok) {
                if (res.status === 409) {
                    try {
                        const data = await res.json();
                        const existingId = data?.id;
                        alert('A donee with this CNIC already exists. Opening it for edit.');
                        if (existingId) {
                            const getRes = await fetch(`${base}/api/donees/${existingId}`);
                            if (getRes.ok) {
                                const existing = await getRes.json();
                                setEditingDonee(existing);
                                navigateTo('donee', 'edit');
                                return;
                            }
                        }
                    } catch {}
                }
                throw new Error(`HTTP ${res.status}`);
            }
            await refreshDonees();
        } catch (e) {
            console.error('Failed to add donee', e);
        } finally {
            resetPageAction();
        }
    };
    
    const handleCancel = () => {
        resetPageAction();
        setEditingDonee(null);
    };
    
    const handleExportExcel = () => {
        const dataToExport = sortedDonees.map(d => ({
            'S/No': d.sNo,
            'Name': d.name,
            'F/H Name': d.relation,
            'Relation Type': d.relationType,
            'CNIC': d.cnic,
            'Mobile': d.mobile,
            'Amount': d.amount,
            'Family Members': d.familyMembers || 0,
            'Case': d.caseType,
            'Type': d.type,
            'Attachments': d.attachments?.length || 0,
            'Registration Date': d.regDate,
            'Status': d.status,
        }));

        const worksheet = window.XLSX.utils.json_to_sheet(dataToExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Donees");
        window.XLSX.writeFile(workbook, "DoneeList.xlsx");
        setIsExportMenuOpen(false);
    };

    const handleExportPdf = () => {
        const doc = new window.jspdf.jsPDF();
        
        const tableColumns = ['S/No', 'Name', 'F/H Name', 'Relation Type', 'CNIC', 'Mobile', 'Amount', 'Family Members', 'Case', 'Type', 'Attachments', 'Reg Date', 'Status'];
        
        const tableRows = sortedDonees.map(d => [
            d.sNo || '',
            d.name,
            d.relation,
            d.relationType || '',
            d.cnic,
            d.mobile,
            d.amount,
            d.familyMembers || 0,
            d.caseType,
            d.type,
            d.attachments?.length || 0,
            d.regDate,
            d.status,
        ]);

        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: 20,
        });

        doc.text("All Donees Report", 14, 15);
        doc.save('DoneeList.pdf');
        setIsExportMenuOpen(false);
    };
    
    if (pageAction === 'add') {
        const maxSNo = Math.max(0, ...donees.map(d => parseInt(d.sNo || '0', 10)).filter(n => !isNaN(n)));
        const nextSNoValue = (maxSNo + 1).toString();
        return <DoneeForm onSave={handleAddDonee} onCancel={handleCancel} donationCases={donationCases} doneeTypes={doneeTypes} references={references} bankTypes={bankTypes} nextSNo={nextSNoValue} />;
    }
    
    if (pageAction === 'edit' && editingDonee) {
        return <DoneeForm initialData={editingDonee} onSave={handleUpdateDonee} onCancel={handleCancel} donationCases={donationCases} doneeTypes={doneeTypes} references={references} bankTypes={bankTypes} />;
    }

    return (
        <>
            {previewingDonee && <DoneeDetailView donee={previewingDonee} onClose={() => setPreviewingDonee(null)} config={config} />}
            {viewingFamily && <FamilyMembersModal donee={viewingFamily} onClose={() => setViewingFamily(null)} />}
            
            <ConfirmationDialog
                isOpen={!!deletingDonee}
                onClose={() => setDeletingDonee(null)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
            >
                <p>Are you sure you want to delete "<strong>{deletingDonee?.name}</strong>"? This action cannot be undone.</p>
            </ConfirmationDialog>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-white">All Donees</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigateTo('donee', 'add')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Add New Donee
                        </button>
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(prev => !prev)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                Export
                                <ChevronDownIcon className="w-4 h-4 ml-2 -mr-1" />
                            </button>
                            {isExportMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        <button
                                            onClick={handleExportExcel}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Export to Excel (.xlsx)
                                        </button>
                                        <button
                                            onClick={handleExportPdf}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Export to PDF (.pdf)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by name, CNIC, or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <DoneeTable 
                    donees={sortedDonees} 
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteRequest}
                    onView={(donee) => setPreviewingDonee(donee)}
                    onViewFamily={handleViewFamily}
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                />
            </div>
        </>
    );
};

export default DoneePage;
