


import React, { useMemo } from 'react';
import { DoneeIcon, PayDonationsIcon, ReportsIcon } from '../components/Icons';
import type { Donee } from './DoneePage';
import type { Donation } from './PayDonationsPage';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement; color: string; }> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
      <div className={`p-3 rounded-full ${color}`}>
        {/* FIX: Add type assertion to inform TypeScript that the icon prop accepts a className. */}
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6 text-white" })}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-white">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white';
    }
};

interface DashboardPageProps {
  navigateTo: (id: string, action?: string | null) => void;
  donees: Donee[];
  donations: Donation[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ navigateTo, donees, donations }) => {
    const totalDonees = donees.length;
    const totalDonationValue = donations.reduce((sum, d) => sum + d.amount, 0);
    const recentDonations = donations.slice(0, 5);

    // Calculate new donees in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newDoneesCount = donees.filter(donee => {
        // The regDate is a string like "12 Jul 2024", which new Date() can parse.
        const registrationDate = new Date(donee.regDate);
        return registrationDate >= thirtyDaysAgo;
    }).length;

    const pendingThisMonthValue = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get CNICs of donees who have been paid this month
        const paidCnicThisMonth = new Set(
            donations
                .filter(donation => {
                    const donationDate = new Date(donation.date);
                    return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
                })
                .map(donation => donation.cnic)
        );

        // Filter for monthly donees who have NOT been paid this month
        const pendingAmount = donees
            .filter(donee => 
                donee.caseType === 'ماہانہ' && !paidCnicThisMonth.has(donee.cnic)
            )
            .reduce((sum, donee) => sum + donee.amount, 0);
        
        return pendingAmount;
    }, [donees, donations]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Donees" value={totalDonees.toString()} icon={<DoneeIcon />} color="bg-blue-500" />
                <StatCard title="Total Donations Value" value={`Rs. ${totalDonationValue.toLocaleString()}`} icon={<PayDonationsIcon />} color="bg-green-500" />
                <StatCard title="Pending This Month" value={`Rs. ${pendingThisMonthValue.toLocaleString()}`} icon={<ReportsIcon />} color="bg-yellow-500" />
                <StatCard title="New Donees (30d)" value={newDoneesCount.toString()} icon={<DoneeIcon />} color="bg-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Donations</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Donee</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {recentDonations.length > 0 ? (
                                    recentDonations.map(donation => (
                                        <tr key={donation.voucherNo}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" dir="rtl">{donation.doneeName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white text-right">Rs. {donation.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{donation.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass('Completed')}`}>
                                                    Completed
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-white">
                                            No recent donations.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-4">
                        <button
                          onClick={() => navigateTo('donee', 'add')}
                          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                            <DoneeIcon className="w-5 h-5 mr-2" />
                            Add New Donee
                        </button>
                        <button
                          onClick={() => navigateTo('pay_donations')}
                          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                            <PayDonationsIcon className="w-5 h-5 mr-2" />
                            Pay Donation
                        </button>
                         <button 
                          onClick={() => navigateTo('reports')}
                          className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <ReportsIcon className="w-5 h-5 mr-2" />
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;