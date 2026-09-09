

import React, { useState, useMemo } from 'react';
import type { Donee } from './DoneePage';
import type { Donation } from './PayDonationsPage';
import { DoneeIcon, CaseTrackingIcon, AdvancedScheduleIcon } from '../components/Icons';

type CaseStatus = 'Completed' | 'Pending';

interface StatCardProps {
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow';
  icon: React.ReactElement;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center space-x-4">
      <div className={`p-3 rounded-full text-white ${colorClasses[color]}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-white">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

interface Case {
  id: number;
  name: string;
  relation: string;
  relationType?: 'S/O' | 'D/O' | 'W/O' | '';
  cnic: string;
  address: string;
  phone: string;
  lastReceived: string;
  type: string;
  amount: number;
  reference: string;
  reason: string;
  voucher?: string;
}

interface CaseTrackingPageProps {
    donees: Donee[];
    donations: Donation[];
}

interface CaseTableProps {
    cases: Case[];
    status: CaseStatus;
    searchTerm: string;
    doneeTypeFilter: string;
    referenceFilter: string;
}

const CaseTable: React.FC<CaseTableProps> = ({ cases, status, searchTerm, doneeTypeFilter, referenceFilter }) => {
  const filteredCases = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return cases.filter(c => {
        const searchMatch = !term ||
            c.name.toLowerCase().includes(term) ||
            c.cnic.includes(term) ||
            c.address.toLowerCase().includes(term);
        
        const typeMatch = !doneeTypeFilter || c.type === doneeTypeFilter;
        const referenceMatch = !referenceFilter || c.reference === referenceFilter;

        return searchMatch && typeMatch && referenceMatch;
    });
  }, [cases, searchTerm, doneeTypeFilter, referenceFilter]);

    const headersConfig = {
        Pending: [
            { label: 'نمبر شمار', align: 'center' },
            { label: 'نام و شناختی کارڈ نمبر', align: 'right' },
            { label: 'پتہ', align: 'right' },
            { label: 'آخری وصولی', align: 'right' },
            { label: 'ٹائپ', align: 'right' },
            { label: 'متعین رقم', align: 'right' },
            { label: 'معرفت', align: 'right' },
            { label: 'وجہ امداد', align: 'right' },
        ],
        Completed: [
            { label: 'نمبر شمار', align: 'center' },
            { label: 'ووچر نمبر', align: 'right' },
            { label: 'نام و شناختی کارڈ', align: 'right' },
            { label: 'پتہ', align: 'right' },
            { label: 'آخری وصولی', align: 'right' },
            { label: 'ٹائپ', align: 'right' },
            { label: 'کل رقم', align: 'right' },
            { label: 'معرفت', align: 'right' },
            { label: 'وجہ امداد', align: 'right' },
        ],
    };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-700/50">
          <tr>
            {headersConfig[status].map(header => (
                <th key={header.label} scope="col" className={`px-4 py-3 text-${header.align} text-xs font-medium text-gray-600 dark:text-white uppercase tracking-wider`} dir="rtl">{header.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredCases.length > 0 ? (
            filteredCases.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-white text-center">{index + 1}</td>
                {status === 'Completed' && <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-white text-right">{item.voucher}</td>}
                <td className="px-4 py-3 whitespace-nowrap text-right" dir="rtl">
                  <div className="font-semibold text-gray-900 dark:text-white">{item.name} {item.relationType} {item.relation}</div>
                  <div className="text-gray-500 dark:text-white">{item.cnic}</div>
                </td>
                <td className="px-4 py-3 whitespace-normal text-gray-600 dark:text-white max-w-xs text-right" dir="rtl">
                  {item.address}
                  <div className="text-gray-500 dark:text-white">{item.phone}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-white text-right">{item.lastReceived}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-white text-right">{item.type}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-white font-medium text-right">Rs. {item.amount.toLocaleString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-white text-right" dir="rtl">{item.reference}</td>
                <td className="px-4 py-3 whitespace-normal text-gray-600 dark:text-white max-w-xs text-right" dir="rtl">{item.reason}</td>
              </tr>
            ))
          ) : (
             <tr>
                <td colSpan={status === 'Completed' ? 9 : 8} className="px-6 py-10 text-center text-gray-500 dark:text-white">
                    No records found matching your criteria.
                </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};


const CaseTrackingPage: React.FC<CaseTrackingPageProps> = ({ donees, donations }) => {
    const [pendingSearch, setPendingSearch] = useState('');
    const [pendingDoneeType, setPendingDoneeType] = useState('');
    const [pendingReference, setPendingReference] = useState('');
    
    const [completedSearch, setCompletedSearch] = useState('');
    const [completedDoneeType, setCompletedDoneeType] = useState('');
    const [completedReference, setCompletedReference] = useState('');
    
    const [currentDateTime, setCurrentDateTime] = useState('');

    const monthlyDonees = useMemo(() => {
        return donees.filter(donee => donee.caseType === 'ماہانہ');
    }, [donees]);

    const { pendingCases, completedCases } = useMemo(() => {
        const completedCnics = new Set(donations.map(d => d.cnic));
        
        const pending: Case[] = [];
        const completed: Case[] = [];

        monthlyDonees.forEach(donee => {
            const fullAddress = [donee.street, donee.village, donee.tehsil, donee.district, donee.province].filter(Boolean).join(', ');
            const correspondingDonation = donations.find(don => don.cnic === donee.cnic);

            const caseItem: Case = {
                id: donee.id,
                name: donee.name,
                relation: donee.relation,
                relationType: donee.relationType,
                cnic: donee.cnic,
                address: fullAddress || 'N/A',
                phone: donee.mobile,
                lastReceived: correspondingDonation ? correspondingDonation.date : 'N/A',
                type: donee.caseType,
                amount: donee.amount,
                reference: donee.referredBy || 'N/A',
                reason: donee.remarks || 'N/A',
                voucher: correspondingDonation ? `V-2024-${String(correspondingDonation.voucherNo).padStart(3, '0')}` : undefined,
            };

            if (completedCnics.has(donee.cnic)) {
                completed.push(caseItem);
            } else {
                pending.push(caseItem);
            }
        });

        return { pendingCases: pending, completedCases: completed };
    }, [monthlyDonees, donations]);
    
    const allCases = useMemo(() => [...pendingCases, ...completedCases], [pendingCases, completedCases]);
    const doneeTypes = useMemo(() => [...new Set(allCases.map(c => c.type))], [allCases]);
    const references = useMemo(() => [...new Set(allCases.map(c => c.reference))], [allCases]);

    const totalPendingAmount = useMemo(() => pendingCases.reduce((sum, c) => sum + c.amount, 0), [pendingCases]);
    const totalCompletedAmount = useMemo(() => completedCases.reduce((sum, c) => sum + c.amount, 0), [completedCases]);

    const resetPendingFilters = () => {
      setPendingSearch('');
      setPendingDoneeType('');
      setPendingReference('');
    };

    const resetCompletedFilters = () => {
      setCompletedSearch('');
      setCompletedDoneeType('');
      setCompletedReference('');
    };


    React.useEffect(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        setCurrentDateTime(now.toLocaleString('en-US', options).replace(',', ' ').replace(' ', ' '));
    }, []);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Qamar Khan Welfare Trust</h2>
        <p className="mt-1 text-lg text-gray-600 dark:text-white">Donation Case Tracking</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-white">{currentDateTime.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2 $1 $3')}</p>
      </header>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white" dir="rtl">ماہانہ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow w-full">
            <StatCard label="Total Active Donees" value={monthlyDonees.length} color="blue" icon={<DoneeIcon />} />
            <StatCard label="Completed" value={completedCases.length} color="green" icon={<CaseTrackingIcon />} />
            <StatCard label="Pending" value={pendingCases.length} color="yellow" icon={<AdvancedScheduleIcon />} />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
         <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2" dir="rtl">جو رہتے ہیں ماہانہ</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div>
                <label htmlFor="pending-search" className="block text-sm font-medium text-gray-700 dark:text-white">Search</label>
                 <input
                     type="text"
                     id="pending-search"
                     value={pendingSearch}
                     onChange={(e) => setPendingSearch(e.target.value)}
                     placeholder="Name, CNIC, Address..."
                     className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 />
            </div>
            <div>
                <label htmlFor="pending-donee-type" className="block text-sm font-medium text-gray-700 dark:text-white">Donee Type</label>
                <select id="pending-donee-type" value={pendingDoneeType} onChange={e => setPendingDoneeType(e.target.value)} className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="">All Types</option>
                    {doneeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="pending-reference" className="block text-sm font-medium text-gray-700 dark:text-white">Reference</label>
                <select id="pending-reference" value={pendingReference} onChange={e => setPendingReference(e.target.value)} className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="">All References</option>
                    {references.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <button onClick={resetPendingFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Reset
            </button>
        </div>
        <CaseTable cases={pendingCases} status="Pending" searchTerm={pendingSearch} doneeTypeFilter={pendingDoneeType} referenceFilter={pendingReference} />
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
         <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2" dir="rtl">جو ادا ہو چکے ہیں ماہانہ</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div>
                <label htmlFor="completed-search" className="block text-sm font-medium text-gray-700 dark:text-white">Search</label>
                 <input
                     type="text"
                     id="completed-search"
                     value={completedSearch}
                     onChange={(e) => setCompletedSearch(e.target.value)}
                     placeholder="Name, CNIC, Address..."
                     className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 />
            </div>
            <div>
                <label htmlFor="completed-donee-type" className="block text-sm font-medium text-gray-700 dark:text-white">Donee Type</label>
                <select id="completed-donee-type" value={completedDoneeType} onChange={e => setCompletedDoneeType(e.target.value)} className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="">All Types</option>
                    {doneeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="completed-reference" className="block text-sm font-medium text-gray-700 dark:text-white">Reference</label>
                <select id="completed-reference" value={completedReference} onChange={e => setCompletedReference(e.target.value)} className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="">All References</option>
                    {references.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <button onClick={resetCompletedFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Reset
            </button>
        </div>
        <CaseTable cases={completedCases} status="Completed" searchTerm={completedSearch} doneeTypeFilter={completedDoneeType} referenceFilter={completedReference} />
      </section>
    </div>
  );
};

export default CaseTrackingPage;