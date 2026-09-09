import React from 'react';
import type { NavItem, CategoryItem, SystemConfig, Message, Admin } from '../types';
import type { Donee } from '../pages/DoneePage';
import type { Donation } from '../pages/PayDonationsPage';
import { SignOutIcon, MenuIcon, SunIcon, MoonIcon } from './Icons';
import { DashboardPageSkeleton, GenericPageSkeleton, Spinner } from './Loading';

// Import all the new page components
import DashboardPage from '../pages/DashboardPage';
import InquiryPage from '../pages/InquiryPage';
import DoneePage from '../pages/DoneePage';
import PayDonationsPage from '../pages/PayDonationsPage';
import ReportsPage from '../pages/ReportsPage';
import CaseTrackingPage from '../pages/CaseTrackingPage';
import AdminsPage from '../pages/AdminsPage';
import SystemSettingsPage from '../pages/SystemSettingsPage';
import EmployeeChatPage from '../pages/EmployeeChatPage';
import DoneeContactListPage from '../pages/DoneeContactListPage';
import CaseTrackingReportsPage from '../pages/CaseTrackingReportsPage';
import AllDonationsPage from '../pages/AllDonationsPage';

interface MainContentProps {
  activeItem: NavItem;
  navigateTo: (id: string, action?: string | null) => void;
  pageAction: string | null;
  resetPageAction: () => void;
  donees: Donee[];
  setDonees: React.Dispatch<React.SetStateAction<Donee[]>>;
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
  onLogout: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  loading: boolean;
  // System Settings Props
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
  // Admins props
  admins: Admin[];
  setAdmins: React.Dispatch<React.SetStateAction<Admin[]>>;
  // System Config props
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  // Chat props
  currentUser: Admin | null;
  conversations: Record<string, Message[]>;
  setConversations: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
}

const MainContent: React.FC<MainContentProps> = ({ 
  activeItem, navigateTo, pageAction, resetPageAction, donees, setDonees, donations, setDonations, onLogout, isSidebarOpen, toggleSidebar,
  theme, toggleTheme, donationCases, setDonationCases, doneeTypes, setDoneeTypes, donationTypes, setDonationTypes, references, setReferences, bankTypes, setBankTypes, admins, setAdmins,
  config, setConfig, loading, currentUser, conversations, setConversations
}) => {
  
  const renderContent = () => {
    if (loading) {
      switch (activeItem.id) {
        case 'dashboard':
          return <DashboardPageSkeleton />;
        case 'donee':
        case 'pay_donations':
        case 'all_donations':
        case 'reports':
        case 'case_tracking':
        case 'case_tracking_reports':
        case 'donee_contact_list':
        case 'admins':
          return <GenericPageSkeleton />;
        default:
          return <Spinner />;
      }
    }
    
    // Role-based access control
    const isSuperAdmin = currentUser?.role === 'Super Admin';
    const isManager = currentUser?.role === 'Manager';
    const isStaff = currentUser?.role === 'Staff';
    
    const restrictedPagesForStaff = ['reports', 'case_tracking', 'case_tracking_reports'];

    if ((activeItem.id === 'admins' || activeItem.id === 'system_settings') && !isSuperAdmin) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Access Denied</h2>
                <p className="text-gray-600 dark:text-white">You do not have permission to view this page. Please contact your administrator.</p>
            </div>
        );
    }
    
    if (restrictedPagesForStaff.includes(activeItem.id) && isStaff) {
         return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Access Denied</h2>
                <p className="text-gray-600 dark:text-white">You do not have permission to view this page. Please contact your administrator.</p>
            </div>
        );
    }

    switch (activeItem.id) {
      case 'dashboard':
        return <DashboardPage navigateTo={navigateTo} donees={donees} donations={donations} />;
      case 'inquiry':
        return <InquiryPage donees={donees} donations={donations} />;
      case 'donee':
        return <DoneePage 
                  pageAction={pageAction} 
                  resetPageAction={resetPageAction} 
                  donees={donees} 
                  setDonees={setDonees} 
                  donationCases={donationCases}
                  doneeTypes={doneeTypes}
                  references={references}
                  bankTypes={bankTypes}
                  navigateTo={navigateTo}
                  config={config}
                />;
      case 'donee_contact_list':
        return <DoneeContactListPage donees={donees} />;
      case 'pay_donations':
        return <PayDonationsPage 
                    donees={donees} 
                    donations={donations} 
                    setDonations={setDonations} 
                    donationCases={donationCases} 
                    donationTypes={donationTypes} 
                    config={config}
                />;
      case 'all_donations':
        return <AllDonationsPage donations={donations} donees={donees} />;
      case 'reports':
        return <ReportsPage donees={donees} donations={donations} />;
      case 'case_tracking':
        return <CaseTrackingPage donees={donees} donations={donations} />;
      case 'case_tracking_reports':
        return <CaseTrackingReportsPage donees={donees} donations={donations} />;
      case 'employee_chat':
        return currentUser ? <EmployeeChatPage admins={admins} currentUser={currentUser} conversations={conversations} setConversations={setConversations} /> : <Spinner />;
      case 'admins':
        return <AdminsPage admins={admins} setAdmins={setAdmins} currentUser={currentUser} />;
      case 'system_settings':
        return <SystemSettingsPage 
                  donationCases={donationCases}
                  setDonationCases={setDonationCases}
                  doneeTypes={doneeTypes}
                  setDoneeTypes={setDoneeTypes}
                  donationTypes={donationTypes}
                  setDonationTypes={setDonationTypes}
                  references={references}
                  setReferences={setReferences}
                  bankTypes={bankTypes}
                  setBankTypes={setBankTypes}
                  donees={donees}
                  setDonees={setDonees}
                  donations={donations}
                  setDonations={setDonations}
                  admins={admins}
                  setAdmins={setAdmins}
                  config={config}
                  setConfig={setConfig}
                />;
      default:
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Welcome</h2>
            <p className="text-gray-600 dark:text-white">Please select a page from the sidebar.</p>
          </div>
        );
    }
  };

  const mainBgClass = activeItem.id === 'dashboard' ? 'bg-indigo-50 dark:bg-gray-900' : 'bg-gray-100 dark:bg-gray-900';

  return (
    <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 w-full ${mainBgClass}`}>
      <header className={`p-4 sm:p-6 lg:p-8 shrink-0 bg-transparent`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
                onClick={toggleSidebar}
                className="p-2 rounded-full text-gray-500 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"
                aria-label="Open sidebar"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">{activeItem.label}</h1>
              <p className="text-gray-500 dark:text-white mt-1 text-sm sm:text-base">Manage the {activeItem.label.toLowerCase()} section.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Toggle dark mode"
            >
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-3 text-right">
                <img
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                    src={config.trustProfilePicture || "https://picsum.photos/100"}
                    alt={config.trustName ? `${config.trustName} logo` : 'Trust logo'}
                />
                <div className="hidden sm:block">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm capitalize">{currentUser?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-500 dark:text-white">{currentUser?.role}</p>
                </div>
            </div>
            <button
                onClick={onLogout}
                className="p-2 rounded-full text-gray-500 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Sign Out"
            >
                <SignOutIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
      
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8`}>
        {renderContent()}
      </div>
    </main>
  );
};

export default MainContent;