
import React, { useState, useMemo } from 'react';
import type { Donee } from './DoneePage';
import type { Donation } from './PayDonationsPage';

const selectClass = "custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md";
const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

const FormField: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white">{label}</label>
    {children}
  </div>
);

const ReportPreview: React.FC<{ data: Donation[] }> = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-white py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p>No results found for the selected criteria.</p>
            </div>
        );
    }

    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    
    const tableHeaders = [
        { key: 'voucherNo', label: 'Voucher No.', align: 'center' },
        { key: 'donee', label: 'Donee', align: 'right' },
        { key: 'cnic', label: 'CNIC', align: 'left' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'type', label: 'Type', align: 'right' },
        { key: 'case', label: 'Case', align: 'right' },
        { key: 'date', label: 'Date', align: 'left' },
    ];
    
    return (
        <div>
            <div className="printable-content">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">Donation Report</h2>
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
                           {data.map(d => (
                                <tr key={d.voucherNo}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white font-medium text-center">{d.voucherNo}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right" dir="rtl">{d.doneeName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{d.cnic}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right">Rs {d.amount.toLocaleString()}.00</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right" dir="rtl">{d.type}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white text-right" dir="rtl">{d.case}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-white">{d.date}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-left text-sm text-gray-700 dark:text-white">Total Donations: {data.length}</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-white">Total Amount</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">Rs {totalAmount.toLocaleString()}.00</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};


interface ReportsPageProps {
  donees: Donee[];
  donations: Donation[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ donees, donations }) => {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        doneeId: '',
        mohallah: '',
        tehsil: '',
        userType: '',
        caseType: '',
        donationType: '',
        reference: '',
    });
    const [reportData, setReportData] = useState<Donation[] | null>(null);

    const uniqueMohallahs = useMemo(() => [...new Set(donees.map(d => d.village).filter(Boolean))].sort(), [donees]);
    const uniqueTehsils = useMemo(() => [...new Set(donees.map(d => d.tehsil).filter(Boolean))].sort(), [donees]);
    const uniqueUserTypes = useMemo(() => [...new Set(donees.map(d => d.type).filter(Boolean))].sort(), [donees]);
    const uniqueCaseTypes = useMemo(() => [...new Set(donations.map(d => d.case).filter(Boolean))].sort(), [donations]);
    const uniqueReferences = useMemo(() => [...new Set(donees.map(d => d.referredBy).filter(Boolean))].sort(), [donees]);
    const donationTypes = useMemo(() => ['زکوٰۃ', 'صدقہ', 'عطیہ'], []);
    const doneesByCnic = useMemo(() => new Map(donees.map(d => [d.cnic, d])), [donees]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const filteredDonations = donations.filter(donation => {
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            
            // Adjust end date to be inclusive of the whole day
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
            }
            
            // Use new Date() to parse both old ("12 Jul 2024") and new ("12 Jul 2024 02:30 pm") formats
            const donationDate = new Date(donation.date);
            
            if (startDate && donationDate < startDate) return false;
            if (endDate && donationDate > endDate) return false;
            
            const doneeDetails = doneesByCnic.get(donation.cnic);

            if (filters.doneeId && doneeDetails?.id.toString() !== filters.doneeId) return false;
            if (filters.donationType && donation.type !== filters.donationType) return false;
            if (filters.caseType && donation.case !== filters.caseType) return false;

            if (doneeDetails) {
                 if (filters.mohallah && doneeDetails.village !== filters.mohallah) return false;
                 if (filters.tehsil && doneeDetails.tehsil !== filters.tehsil) return false;
                 if (filters.userType && doneeDetails.type !== filters.userType) return false;
                 if (filters.reference && doneeDetails.referredBy !== filters.reference) return false;
            } else {
                 if (filters.mohallah || filters.tehsil || filters.userType || filters.reference) {
                     return false;
                 }
            }
            
            return true;
        });

        setReportData(filteredDonations);
    };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Generate Reports</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Start Date" id="startDate">
                <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleInputChange} className={inputClass} />
            </FormField>
            <FormField label="End Date" id="endDate">
                 <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleInputChange} className={inputClass} />
            </FormField>
          </div>

          <div className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField label="Select Donee" id="doneeId">
                <select id="doneeId" name="doneeId" value={filters.doneeId} onChange={handleInputChange} className={selectClass}>
                    <option value="">All Donees</option>
                    {donees.map(d => <option key={d.id} value={d.id}>{d.name} ({d.cnic})</option>)}
                </select>
              </FormField>
              <FormField label="Mohallah/Village" id="mohallah">
                <select id="mohallah" name="mohallah" value={filters.mohallah} onChange={handleInputChange} className={selectClass}>
                    <option value="">All Mohallahs</option>
                    {uniqueMohallahs.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Tehsil" id="tehsil">
                 <select id="tehsil" name="tehsil" value={filters.tehsil} onChange={handleInputChange} className={selectClass}>
                    <option value="">All Tehsils</option>
                    {uniqueTehsils.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="User Type" id="userType">
                 <select id="userType" name="userType" value={filters.userType} onChange={handleInputChange} className={selectClass}>
                    <option value="">All Types</option>
                    {uniqueUserTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="کیس" id="caseType">
                 <select id="caseType" name="caseType" value={filters.caseType} onChange={handleInputChange} className={selectClass}>
                    <option value="">تمام کیس</option>
                    {uniqueCaseTypes.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </FormField>
              <FormField label="Donation Type" id="donationType">
                <select id="donationType" name="donationType" value={filters.donationType} onChange={handleInputChange} className={selectClass}>
                    <option value="">All Types</option>
                    {donationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
               <FormField label="Reference" id="reference">
                <select id="reference" name="reference" value={filters.reference} onChange={handleInputChange} className={selectClass}>
                    <option value="">All References</option>
                    {uniqueReferences.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
                type="submit"
                className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Generate Report
            </button>
          </div>
        </form>
      </div>

      {reportData !== null && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-6xl mx-auto">
            <ReportPreview data={reportData} />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
