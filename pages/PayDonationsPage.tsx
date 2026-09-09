
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Donee } from './DoneePage';
import type { CategoryItem, SystemConfig } from '../types';
import { PrintIcon } from '../components/Icons';
import SearchableSelect from '../components/SearchableSelect';

// Define Donation type for the new table
export interface Donation {
  voucherNo: number;
  doneeName: string;
  cnic: string;
  amount: number;
  type: string;
  case: string;
  date: string;
}

// Mock data based on the user's screenshot
export const mockRecentDonations: Donation[] = [];

interface PayDonationsPageProps {
  donees: Donee[];
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
  donationCases: CategoryItem[];
  donationTypes: CategoryItem[];
  config: SystemConfig;
}

const toISODateString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

const DonationVoucherView: React.FC<{ 
    donation: Donation; 
    donee: Donee; 
    config: SystemConfig;
    onClose: () => void;
}> = ({ donation, donee, config, onClose }) => {
    const handlePrint = () => {
        document.body.classList.add('is-printing');
        window.print();
    };

    const VoucherContent: React.FC<{ copyType?: string }> = ({ copyType }) => (
        <div className="border-2 border-black p-4 font-sans text-right text-black bg-white h-full flex flex-col" dir="rtl">
            {/* Header */}
            <header className="border-b-2 border-black pb-2 mb-4 flex items-start justify-between gap-4">
                {/* Left side: Photo */}
                <div className="w-24 h-28 border-2 border-black flex items-center justify-center text-gray-500 text-sm shrink-0">
                    {donee.profilePicture ? (
                        <img src={donee.profilePicture.url} alt={donee.name} className="w-full h-full object-cover" />
                    ) : (
                        <span> تصویر </span>
                    )}
                </div>

                {/* Middle: Trust Info */}
                <div className="text-center flex-grow">
                    <h1 className="text-2xl font-bold">{config.trustName}</h1>
                    <p className="text-xs">{config.address}</p>
                    <p className="text-xs">رابطہ: {config.contactNumber}</p>
                </div>

                {/* Right side: Voucher Title and copy type */}
                <div className="text-center w-24 shrink-0">
                    <h2 className="text-lg font-bold">ادائیگی واؤچر</h2>
                    <span className="text-xs">{copyType}</span>
                </div>
            </header>
            
            {/* Details */}
            <div className="flex justify-between mb-4 text-sm">
                <div><strong>واؤچر نمبر:</strong> {`V-${new Date(donation.date).getFullYear()}-${String(donation.voucherNo).padStart(4, '0')}`}</div>
                <div><strong>تاریخ:</strong> {new Date(donation.date).toLocaleDateString('ur-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            {/* Body */}
            <div className="space-y-3 text-sm flex-grow">
                <div className="flex"><p className="w-32 font-bold shrink-0">وصول کنندہ:</p><p className="border-b border-dotted border-gray-500 flex-grow text-right">{donee.name}</p></div>
                <div className="flex"><p className="w-32 font-bold shrink-0">{donee.relationType === 'S/O' ? 'ولدیت' : donee.relationType === 'W/O' ? 'زوجیت' : 'بنت'}:</p><p className="border-b border-dotted border-gray-500 flex-grow text-right">{donee.relation}</p></div>
                <div className="flex"><p className="w-32 font-bold shrink-0">شناختی کارڈ نمبر:</p><p className="border-b border-dotted border-gray-500 flex-grow text-right">{donee.cnic}</p></div>
                <div className="flex"><p className="w-32 font-bold shrink-0">بابت:</p><p className="border-b border-dotted border-gray-500 flex-grow text-right">{donation.type} - {donation.case}</p></div>
                <div className="flex"><p className="w-32 font-bold shrink-0">مبلغ روپے (لفظوں میں):</p><p className="border-b border-dotted border-gray-500 flex-grow"></p></div>
                <div className="flex text-lg font-bold"><p className="w-32 shrink-0">رقم:</p><p className="border-b border-dotted border-gray-500 flex-grow text-right">{donation.amount.toLocaleString()} روپے</p></div>
            </div>
            {/* Footer / Signatures */}
            <div className="flex justify-between mt-16 pt-4 text-sm">
                <div className="text-center">
                    <p className="border-t-2 border-black pt-1 px-4">دستخط / انگوٹھا وصول کنندہ</p>
                </div>
                <div className="text-center">
                    <p className="border-t-2 border-black pt-1 px-4">مجاز دستخط</p>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div id="voucher-to-print" className="printable-content flex-grow overflow-y-auto p-8">
                    {/* First copy for display and print */}
                    <div className="voucher-copy">
                        <VoucherContent copyType="Office Copy" />
                    </div>
                    {/* Second copy for print only */}
                    <div className="voucher-copy print-only-block">
                        <VoucherContent copyType="Recipient Copy" />
                    </div>
                </div>
                <div className="no-print bg-gray-50 dark:bg-gray-800/50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg border-t dark:border-gray-700 flex-shrink-0">
                    <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Close</button>
                    <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"><PrintIcon className="w-4 h-4" /> Print</button>
                </div>
            </div>
        </div>
    );
};

const PayDonationsPage: React.FC<PayDonationsPageProps> = ({ donees, donations, setDonations, donationCases, donationTypes, config }) => {
    // Form state
    const [selectedDoneeId, setSelectedDoneeId] = useState('');
    const [amount, setAmount] = useState('');
    const [donationType, setDonationType] = useState('');
    const [donationCase, setDonationCase] = useState('');
    const [donationDate, setDonationDate] = useState(() => toISODateString(new Date()));
    const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
    const [previewingDonation, setPreviewingDonation] = useState<Donation | null>(null);

    // Table state
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [deletingDonation, setDeletingDonation] = useState<Donation | null>(null);

    // Effect to auto-populate donation case and amount when a donee is selected
    useEffect(() => {
        if (selectedDoneeId && !editingDonation) {
            const selectedDonee = donees.find(d => d.id.toString() === selectedDoneeId);
            if (selectedDonee) {
                setDonationCase(selectedDonee.caseType || '');
                setAmount(selectedDonee.amount.toString());
            }
        }
    }, [selectedDoneeId, donees, editingDonation]);
    
    const parseDisplayDateToISO = (dateStr: string): string => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return toISODateString(new Date()); // Fallback
        }
        return toISODateString(date);
    };

    const resetForm = () => {
        setSelectedDoneeId('');
        setAmount('');
        setDonationType('');
        setDonationCase('');
        setDonationDate(toISODateString(new Date()));
        setEditingDonation(null);
    };

    const handleStartEdit = (donation: Donation) => {
        setEditingDonation(donation);
        const donee = donees.find(d => d.cnic === donation.cnic);
        setSelectedDoneeId(donee ? donee.id.toString() : '');
        setAmount(donation.amount.toString());
        setDonationType(donation.type);
        setDonationCase(donation.case);
        setDonationDate(parseDisplayDateToISO(donation.date));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const refreshDonations = async () => {
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${base}/api/donations`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setDonations(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to refresh donations', e);
        }
    };

    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoneeId || !amount || !donationType || !donationDate) {
            alert('Please fill out all fields.');
            return;
        }
        const selectedDonee = donees.find(d => d.id.toString() === selectedDoneeId);
        if (!selectedDonee) {
            alert('Selected donee not found.');
            return;
        }
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            if (editingDonation) {
                const res = await fetch(`${base}/api/donations/${editingDonation.voucherNo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        doneeId: selectedDonee.id,
                        amount: parseFloat(amount),
                        type: donationType,
                        case: donationCase,
                        date: donationDate
                    })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } else {
                const res = await fetch(`${base}/api/donations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        doneeId: selectedDonee.id,
                        amount: parseFloat(amount),
                        type: donationType,
                        case: donationCase,
                        date: donationDate
                    })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            }
            await refreshDonations();
            resetForm();
        } catch (err) {
            console.error('Failed to save donation', err);
            alert('Failed to save donation');
        }
    };
    
    const handleDeleteRequest = (donation: Donation) => {
        setDeletingDonation(donation);
    };
    
    const confirmDelete = async () => {
        if (!deletingDonation) return;
        try {
            const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${base}/api/donations/${deletingDonation.voucherNo}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refreshDonations();
        } catch (err) {
            console.error('Failed to delete donation', err);
            alert('Failed to delete donation');
        } finally {
            setDeletingDonation(null);
        }
    };

    const filteredDonations = useMemo(() => {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return donations;

        return donations.filter(donation => (
            donation.doneeName.toLowerCase().includes(search) ||
            donation.cnic.includes(search) ||
            donation.amount.toString().includes(search) ||
            donation.type.toLowerCase().includes(search) ||
            donation.case.toLowerCase().includes(search) ||
            donation.date.toLowerCase().includes(search)
        ));
    }, [donations, searchTerm]);

    const totalPages = Math.ceil(filteredDonations.length / entriesPerPage);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredDonations.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredDonations, currentPage, entriesPerPage]);
    
    const doneeForVoucher = useMemo(() => {
        if (!previewingDonation) return null;
        return donees.find(d => d.cnic === previewingDonation.cnic) || null;
    }, [previewingDonation, donees]);

    const tableHeaders = [
        { key: 'V.No', label: 'V.No', align: 'center' },
        { key: 'Donee', label: 'Donee', align: 'right', rtl: true },
        { key: 'CNIC', label: 'CNIC', align: 'left' },
        { key: 'Amount', label: 'Amount', align: 'right' },
        { key: 'Type', label: 'Type', align: 'right', rtl: true },
        { key: 'Case', label: 'Case', align: 'right', rtl: true },
        { key: 'Date', label: 'Date', align: 'left' },
        { key: 'Actions', label: 'Actions', align: 'center' },
    ];
    
    const doneeOptions = useMemo(() => 
        donees.map(d => ({
            value: d.id.toString(),
            label: `${d.name} (${d.cnic})`
        })), 
    [donees]);

    return (
        <div className="space-y-8">
            {previewingDonation && doneeForVoucher && (
                <DonationVoucherView 
                    donation={previewingDonation} 
                    donee={doneeForVoucher} 
                    config={config} 
                    onClose={() => setPreviewingDonation(null)} 
                />
            )}
            <ConfirmationDialog
                isOpen={!!deletingDonation}
                onClose={() => setDeletingDonation(null)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
            >
                <p>Are you sure you want to delete the donation for "<strong>{deletingDonation?.doneeName}</strong>" (Voucher #{deletingDonation?.voucherNo})? This action cannot be undone.</p>
            </ConfirmationDialog>
            
            {/* Donation Details Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b dark:border-gray-700 pb-3">
                    {editingDonation ? `Edit Donation (Voucher #${editingDonation.voucherNo})` : 'Donation Details'}
                </h2>
                <form onSubmit={handleSaveEntry} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2">
                            <label htmlFor="donee" className="block text-sm font-medium text-gray-700 dark:text-white">Select Donee</label>
                            <SearchableSelect
                                id="donee"
                                options={doneeOptions}
                                value={selectedDoneeId}
                                onChange={(val) => setSelectedDoneeId(val)}
                                placeholder="Search and select a donee..."
                            />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-white">Amount (PKR)</label>
                            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                         <div>
                            <label htmlFor="donationType" className="block text-sm font-medium text-gray-700 dark:text-white">Donation Type</label>
                            <select id="donationType" value={donationType} onChange={(e) => setDonationType(e.target.value)} required className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="" disabled>Select Donation Type</option>
                                {donationTypes.map(dt => <option key={dt.id} value={dt.name}>{dt.name}</option>)}
                            </select>
                        </div>
                         <div className="lg:col-span-2">
                            <label htmlFor="donationCase" className="block text-sm font-medium text-gray-700 dark:text-white">Donation Case</label>
                            <input type="text" id="donationCase" value={donationCase} readOnly={!editingDonation} onChange={e => setDonationCase(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-300 border border-gray-300 rounded-md shadow-sm sm:text-sm read-only:bg-gray-100 disabled:bg-gray-100" />
                        </div>
                        <div className="lg:col-span-2">
                            <label htmlFor="donationDate" className="block text-sm font-medium text-gray-700 dark:text-white">Date</label>
                            <input
                                type="date"
                                id="donationDate"
                                value={donationDate}
                                onChange={(e) => setDonationDate(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end space-x-3">
                        {editingDonation && (
                            <button 
                                type="button" 
                                onClick={handleCancelEdit}
                                className="inline-flex justify-center py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                Cancel
                            </button>
                        )}
                         <button 
                            type="submit" 
                            className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                             {editingDonation ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Recent Donations Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Donations</h2>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="entries" className="text-sm text-gray-600 dark:text-white">Show</label>
                        <select id="entries" value={entriesPerPage} onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="custom-select block w-20 pl-3 pr-8 py-1.5 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                         <span className="text-sm text-gray-600 dark:text-white">entries</span>
                    </div>
                    <div>
                        <label htmlFor="search" className="sr-only">Search</label>
                        <input id="search" type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full sm:w-64 px-3 py-1.5 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {tableHeaders.map(h =>
                                    <th key={h.key} className={`px-4 py-3 text-${h.align} text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider`}>{h.label}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                           {paginatedDonations.length > 0 ? (
                            paginatedDonations.map(d => (
                                <tr key={d.voucherNo}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white font-medium text-center">{d.voucherNo}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right" dir="rtl">{d.doneeName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{d.cnic}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right">Rs {d.amount.toLocaleString()}.00</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right" dir="rtl">{d.type}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right" dir="rtl">{d.case}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{d.date}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => setPreviewingDonation(d)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-400 text-white hover:bg-gray-500 transition-colors"
                                                aria-label={`Print voucher ${d.voucherNo}`}
                                                title="Print Voucher"
                                            >
                                                <PrintIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStartEdit(d)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
                                                aria-label={`Edit voucher ${d.voucherNo}`}
                                                title="Edit"
                                            >
                                                E
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRequest(d)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                                                aria-label={`Delete voucher ${d.voucherNo}`}
                                                title="Delete"
                                            >
                                                D
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                           ) : (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-gray-500 dark:text-white">
                                    No donations found.
                                </td>
                            </tr>
                           )}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-700 dark:text-white">
                        Showing {Math.min(1 + (currentPage - 1) * entriesPerPage, filteredDonations.length)} to {Math.min(currentPage * entriesPerPage, filteredDonations.length)} of {filteredDonations.length} entries
                    </p>
                    <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Prev</button>
                        {[...Array(totalPages)].map((_, i) =>
                             (i < 3 || i > totalPages - 4 || Math.abs(i - (currentPage-1)) < 2) ? (
                                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`relative inline-flex items-center border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium ${currentPage === i + 1 ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-white z-10' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{i + 1}</button>
                            ) : ( (i === 3 && totalPages > 6) || (i === totalPages - 4 && totalPages > 6) ? <span key={i} className="relative inline-flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white">...</span> : null )
                        )}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Next</button>
                    </nav>
                </div>
            </div>

        </div>
    );
};

export default PayDonationsPage;
