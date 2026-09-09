
import React, { useState, useMemo } from 'react';
import type { Donee } from './DoneePage';
import type { Donation } from './PayDonationsPage';
import SearchableSelect from '../components/SearchableSelect';

interface InquiryPageProps {
  donees: Donee[];
  donations: Donation[];
}

const InquiryPage: React.FC<InquiryPageProps> = ({ donees, donations }) => {
  const [selectedDoneeId, setSelectedDoneeId] = useState('');
  const [searchResult, setSearchResult] = useState<Donee | 'not_found' | null>(null);
  const [searchedTerm, setSearchedTerm] = useState('');

  const doneeOptions = useMemo(() => 
    donees.map(d => ({
        value: d.id.toString(),
        label: `${d.name} (${d.cnic})`
    })), 
  [donees]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDoneeId) {
      const foundDonee = donees.find(donee => donee.id.toString() === selectedDoneeId);
      setSearchResult(foundDonee || 'not_found');
      if (foundDonee) {
        setSearchedTerm(`${foundDonee.name} (${foundDonee.cnic})`);
      } else {
        const selectedOption = doneeOptions.find(opt => opt.value === selectedDoneeId);
        setSearchedTerm(selectedOption?.label || `ID: ${selectedDoneeId}`);
      }
    } else {
      setSearchResult(null);
      setSearchedTerm('');
    }
  };

  const renderResult = () => {
    if (searchResult === 'not_found') {
      return (
        <div className="text-center text-gray-500 dark:text-white py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p>No donee found for selection: <span className="font-semibold text-gray-700 dark:text-white">{searchedTerm}</span>.</p>
        </div>
      );
    }

    if (searchResult) {
      const donee = searchResult;
      const doneeDonations = donations
          .filter(d => d.cnic === donee.cnic)
          .sort((a, b) => {
              // Handle potential invalid date strings gracefully
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              if (isNaN(dateA) || isNaN(dateB)) return 0;
              return dateB - dateA;
          });
      const lastTransaction = doneeDonations.length > 0 ? doneeDonations[0] : null;

      const fullAddress = [donee.street, donee.village, donee.tehsil, donee.district, donee.province].filter(Boolean).join(', ');

      return (
        <div className="space-y-6">
          {/* Donee Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-cyan-500 text-white p-3 font-bold text-lg">Donee Details</div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white w-1/4">Name</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{donee.name}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">CNIC</td><td className="py-2 text-gray-800 dark:text-white">{donee.cnic}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Father/Husband</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{donee.relation}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Gender</td><td className="py-2 text-gray-800 dark:text-white">{donee.gender}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Type</td><td className="py-2 text-gray-800 dark:text-white">{donee.type}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Case</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{donee.caseType}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Reference</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{donee.referredBy || 'N/A'}</td></tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white align-top">Address</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{fullAddress || 'N/A'}</td></tr>
                  <tr><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white align-top">Remarks</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{donee.remarks || 'N/A'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Last Transaction Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-green-600 text-white p-3 font-bold text-lg">Last Transaction</div>
            <div className="p-4">
              {lastTransaction ? (
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white w-1/4">Voucher #</td><td className="py-2 text-gray-800 dark:text-white">{lastTransaction.voucherNo}</td></tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Case</td><td className="py-2 text-gray-800 dark:text-white" dir="rtl">{lastTransaction.case}</td></tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700"><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Amount</td><td className="py-2 text-gray-800 dark:text-white">Rs. {lastTransaction.amount.toLocaleString()}</td></tr>
                    <tr><td className="py-2 pr-4 font-semibold text-gray-600 dark:text-white">Date</td><td className="py-2 text-gray-800 dark:text-white">{lastTransaction.date}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 dark:text-white">No transactions found for this donee.</p>
              )}
            </div>
          </div>
          
          {/* Donation History Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-600 text-white p-3 font-bold text-lg">Donation History</div>
            <div className="p-4 overflow-x-auto">
              {doneeDonations.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <th className="py-2 text-left font-semibold text-gray-600 dark:text-white">Date</th>
                      <th className="py-2 text-right font-semibold text-gray-600 dark:text-white">Case</th>
                      <th className="py-2 text-right font-semibold text-gray-600 dark:text-white">Amount</th>
                      <th className="py-2 text-right font-semibold text-gray-600 dark:text-white">Voucher #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doneeDonations.map(donation => (
                      <tr key={donation.voucherNo} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2 whitespace-nowrap text-gray-800 dark:text-white">{donation.date}</td>
                        <td className="py-2 text-right text-gray-800 dark:text-white" dir="rtl">{donation.case}</td>
                        <td className="py-2 text-right text-gray-800 dark:text-white">Rs. {donation.amount.toLocaleString()}</td>
                        <td className="py-2 text-right text-gray-800 dark:text-white">{donation.voucherNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 dark:text-white">No donation history available.</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    return (
        <div className="text-center text-gray-500 dark:text-white py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p>Please select a donee to see their details.</p>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Donee Inquiry</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-grow w-full">
            <label htmlFor="donee-inquiry" className="sr-only">Select Donee</label>
            <SearchableSelect
              id="donee-inquiry"
              options={doneeOptions}
              value={selectedDoneeId}
              onChange={setSelectedDoneeId}
              placeholder="Search and select a donee by name or CNIC..."
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Search
          </button>
        </form>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {renderResult()}
      </div>
    </div>
  );
};

export default InquiryPage;
