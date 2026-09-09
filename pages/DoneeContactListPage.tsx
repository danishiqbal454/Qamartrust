


import React, { useState, useMemo } from 'react';
import type { Donee } from './DoneePage';

interface DoneeContactListPageProps {
    donees: Donee[];
}

const DoneeContactListPage: React.FC<DoneeContactListPageProps> = ({ donees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        gender: '',
        doneeType: '',
        caseType: '',
    });

    const doneeTypes = useMemo(() => [...new Set(donees.map(d => d.type))], [donees]);
    const caseTypes = useMemo(() => [...new Set(donees.map(d => d.caseType))], [donees]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({
            gender: '',
            doneeType: '',
            caseType: '',
        });
    };

    const filteredDonees = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
        
        return donees.filter(donee => {
            const searchMatch = !lowercasedSearchTerm ||
                donee.name.toLowerCase().includes(lowercasedSearchTerm) ||
                donee.cnic.includes(lowercasedSearchTerm) ||
                donee.mobile.toLowerCase().includes(lowercasedSearchTerm);

            const genderMatch = !filters.gender || donee.gender === filters.gender;
            const doneeTypeMatch = !filters.doneeType || donee.type === filters.doneeType;
            const caseTypeMatch = !filters.caseType || donee.caseType === filters.caseType;

            return searchMatch && genderMatch && doneeTypeMatch && caseTypeMatch;
        });
    }, [searchTerm, filters, donees]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Donee Contact List</h2>
            
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label htmlFor="search-donee-contact" className="block text-sm font-medium text-gray-700 dark:text-white">Search</label>
                        <input
                            id="search-donee-contact"
                            type="text"
                            placeholder="Name, CNIC, or mobile..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-white">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            value={filters.gender}
                            onChange={handleFilterChange}
                            className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="doneeType" className="block text-sm font-medium text-gray-700 dark:text-white">Donee Type</label>
                        <select
                            id="doneeType"
                            name="doneeType"
                            value={filters.doneeType}
                            onChange={handleFilterChange}
                            className="custom-select mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">All Types</option>
                            {doneeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 dark:text-white">Case Type</label>
                        <select
                            id="caseType"
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
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">F/H Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">CNIC</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Mobile</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredDonees.length > 0 ? (
                            filteredDonees.slice(0, 100).map((donee) => ( // limit for performance
                                <tr key={donee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white text-center">{donee.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" dir="rtl">{donee.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white" dir="rtl">
                                        {donee.relationType && <span className="font-semibold">{donee.relationType}</span>}{' '}{donee.relation}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{donee.cnic}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{donee.mobile}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-white">
                                    No donees found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DoneeContactListPage;