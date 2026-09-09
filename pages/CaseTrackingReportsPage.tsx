



import React, { useState, useMemo } from 'react';
import type { Donee } from './DoneePage';
import type { Donation } from './PayDonationsPage';
import { DoneeIcon, CaseTrackingIcon, AdvancedScheduleIcon } from '../components/Icons';

const selectClass = "custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md";

type CaseStatus = 'Completed' | 'Pending';

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


interface CaseTrackingReportsPageProps {
    donees: Donee[];
    donations: Donation[];
}

const CaseTrackingReportsPage: React.FC<CaseTrackingReportsPageProps> = ({ donees, donations }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('');
  const [monthlyDonees, setMonthlyDonees] = useState<Donee[]>([]);
  const [completedCases, setCompletedCases] = useState<Case[]>([]);
  const [pendingCases, setPendingCases] = useState<Case[]>([]);
  
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingDoneeType, setPendingDoneeType] = useState('');
  const [pendingReference, setPendingReference] = useState('');
  
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedDoneeType, setCompletedDoneeType] = useState('');
  const [completedReference, setCompletedReference] = useState('');

  const months = useMemo(() => [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ], []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  const allCasesForPeriod = useMemo(() => [...pendingCases, ...completedCases], [pendingCases, completedCases]);
  const doneeTypes = useMemo(() => [...new Set(allCasesForPeriod.map(c => c.type))], [allCasesForPeriod]);
  const references = useMemo(() => [...new Set(allCasesForPeriod.map(c => c.reference))], [allCasesForPeriod]);


  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    const donationsInPeriod = donations.filter(donation => {
        // Use new Date() to robustly parse old and new date formats
        const donationDate = new Date(donation.date);
        const donationMonth = donationDate.getMonth() + 1; // getMonth() is 0-indexed
        const donationYear = donationDate.getFullYear();
        return donationMonth === parseInt(selectedMonth, 10) && donationYear === parseInt(selectedYear, 10);
    });

    const completedCnicSet = new Set(donationsInPeriod.map(d => d.cnic));
    
    // Determine the last moment of the selected report period
    const reportPeriodEndDate = new Date(parseInt(selectedYear, 10), parseInt(selectedMonth, 10), 0);
    reportPeriodEndDate.setHours(23, 59, 59, 999);
    
    const currentMonthlyDonees = donees.filter(d => {
        const regDate = new Date(d.regDate);
        // Only include monthly donees who were registered on or before the end of the report period
        return d.caseType === 'ماہانہ' && regDate <= reportPeriodEndDate;
    });

    const completed: Case[] = [];
    const pending: Case[] = [];

    currentMonthlyDonees.forEach(donee => {
        const fullAddress = [donee.street, donee.village, donee.tehsil, donee.district, donee.province].filter(Boolean).join(', ');
        const correspondingDonation = donationsInPeriod.find(don => don.cnic === donee.cnic);

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
        if (completedCnicSet.has(donee.cnic)) {
            completed.push(caseItem);
        } else {
            pending.push(caseItem);
        }
    });
    
    setCompletedCases(completed);
    setPendingCases(pending);
    setMonthlyDonees(currentMonthlyDonees);
    setReportPeriod(`${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`);
    setReportGenerated(true);
  };
  
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

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md no-print">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Case Tracking Reports</h2>
        <form onSubmit={handleGenerateReport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-white">Month</label>
              <select id="month" name="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={selectClass}>
                {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-white">Year</label>
              <select id="year" name="year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={selectClass}>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button type="submit" className="inline-flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {reportGenerated ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-8 printable-content">
                <header className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Monthly Report: {reportPeriod}</h3>
                        <p className="text-sm text-gray-500 dark:text-white">Qamar Khan Welfare Trust</p>
                    </div>
                </header>
                
                <section>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white" dir="rtl">ماہانہ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow w-full">
                      <StatCard label="Total Monthly Donees" value={monthlyDonees.length} color="blue" icon={<DoneeIcon />} />
                      <StatCard label="Completed" value={completedCases.length} color="green" icon={<CaseTrackingIcon />} />
                      <StatCard label="Pending" value={pendingCases.length} color="yellow" icon={<AdvancedScheduleIcon />} />
                    </div>
                  </div>
                </section>
            </div>

            <section className="p-8 space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2" dir="rtl">جو رہتے ہیں ماہانہ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end no-print">
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
                        <select id="pending-donee-type" value={pendingDoneeType} onChange={e => setPendingDoneeType(e.target.value)} className={selectClass}>
                            <option value="">All Types</option>
                            {doneeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="pending-reference" className="block text-sm font-medium text-gray-700 dark:text-white">Reference</label>
                        <select id="pending-reference" value={pendingReference} onChange={e => setPendingReference(e.target.value)} className={selectClass}>
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

            <section className="p-8 space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2" dir="rtl">جو ادا ہو چکے ہیں ماہانہ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end no-print">
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
                        <select id="completed-donee-type" value={completedDoneeType} onChange={e => setCompletedDoneeType(e.target.value)} className={selectClass}>
                            <option value="">All Types</option>
                            {doneeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="completed-reference" className="block text-sm font-medium text-gray-700 dark:text-white">Reference</label>
                        <select id="completed-reference" value={completedReference} onChange={e => setCompletedReference(e.target.value)} className={selectClass}>
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
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Report Preview</h3>
            <div className="text-center text-gray-500 dark:text-white py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p>Your generated report for case tracking will be displayed here.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default CaseTrackingReportsPage;