import React, { useState, useMemo } from 'react';
import type { Donation } from './PayDonationsPage';
import type { Donee } from './DoneePage';

interface AllDonationsPageProps {
  donations: Donation[];
  donees: Donee[]; // To get extra info if needed
}

const AllDonationsPage: React.FC<AllDonationsPageProps> = ({ donations, donees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        donationType: '',
        caseType: '',
    });
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const donationTypes = useMemo(() => [...new Set(donations.map(d => d.type))], [donations]);
    const caseTypes = useMemo(() => [...new Set(donations.map(d => d.case))], [donations]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({
            donationType: '',
            caseType: '',
        });
        setCurrentPage(1);
    };

    const filteredDonations = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
        
        return donations.filter(donation => {
            const searchMatch = !lowercasedSearchTerm ||
                donation.doneeName.toLowerCase().includes(lowercasedSearchTerm) ||
                donation.cnic.includes(lowercasedSearchTerm);

            const donationTypeMatch = !filters.donationType || donation.type === filters.donationType;
            const caseTypeMatch = !filters.caseType || donation.case === filters.caseType;

            return searchMatch && donationTypeMatch && caseTypeMatch;
        });
    }, [searchTerm, filters, donations]);

    const totalPages = Math.ceil(filteredDonations.length / entriesPerPage);
    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredDonations.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredDonations, currentPage, entriesPerPage]);


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">All Donations History</h2>

            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label htmlFor="search-donation" className="block text-sm font-medium text-gray-700 dark:text-white">Search</label>
                        <input
                            id="search-donation"
                            type="text"
                            placeholder="Donee Name or CNIC..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="donationTypeFilter" className="block text-sm font-medium text-gray-700 dark:text-white">Donation Type</label>
                        <select
                            id="donationTypeFilter"
                            name="donationType"
                            value={filters.donationType}
                            onChange={handleFilterChange}
                            className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">All Types</option>
                            {donationTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="caseTypeFilter" className="block text-sm font-medium text-gray-700 dark:text-white">Case Type</label>
                        <select
                            id="caseTypeFilter"
                            name="caseType"
                            value={filters.caseType}
                            onChange={handleFilterChange}
                            className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">All Cases</option>
                            {caseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="flex justify-end pt-2">
                    <button
                        onClick={resetFilters}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Voucher No.</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Donee Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">CNIC</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Donation Type</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Case Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedDonations.length > 0 ? (
                            paginatedDonations.map((donation) => (
                                <tr key={donation.voucherNo}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">{donation.voucherNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white" dir="rtl">{donation.doneeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{donation.cnic}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white text-right">Rs. {donation.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white" dir="rtl">{donation.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white" dir="rtl">{donation.case}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{donation.date}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-white">
                                    No donation history found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-700 dark:text-white">
                    Showing {paginatedDonations.length > 0 ? (1 + (currentPage - 1) * entriesPerPage) : 0} to {Math.min(currentPage * entriesPerPage, filteredDonations.length)} of {filteredDonations.length} entries
                </p>
                <div className="flex items-center space-x-2">
                    <label htmlFor="entries-per-page" className="text-sm text-gray-600 dark:text-white">Show:</label>
                    <select id="entries-per-page" value={entriesPerPage} onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="custom-select block w-20 pl-3 pr-8 py-1.5 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                    </select>
                </div>
                <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Prev</button>
                    <span className="relative inline-flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Next</button>
                </nav>
            </div>
        </div>
    );
};

export default AllDonationsPage;
