

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import MainContent from './components/MainContent';
import type { NavItem, CategoryItem, SystemConfig, Message, Admin, UserRole } from './types';
import { DashboardIcon, InquiryIcon, DoneeIcon, PayDonationsIcon, ReportsIcon, CaseTrackingIcon, AdminsIcon, SystemSettingsIcon, LogoIcon, EmployeeChatIcon, ContactListIcon, AllDonationsIcon } from './components/Icons';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import type { Donee } from './pages/DoneePage';
import { type Donation } from './pages/PayDonationsPage';

const mockConversations: Record<string, Message[]> = {};

const App: React.FC = () => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'inquiry', label: 'Inquiry', icon: <InquiryIcon /> },
    { id: 'donee', label: 'Donee', icon: <DoneeIcon /> },
    { id: 'donee_contact_list', label: 'Donee Contact List', icon: <ContactListIcon /> },
    { id: 'pay_donations', label: 'Pay Donations', icon: <PayDonationsIcon /> },
    { id: 'all_donations', label: 'All Donations', icon: <AllDonationsIcon /> },
    { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
    { id: 'case_tracking', label: 'Case Tracking', icon: <CaseTrackingIcon /> },
    { id: 'case_tracking_reports', label: 'Case Tracking Reports', icon: <ReportsIcon /> },
    { id: 'employee_chat', label: 'Employee Chat', icon: <EmployeeChatIcon /> },
    { id: 'admins', label: 'Admins', icon: <AdminsIcon /> },
    { id: 'system_settings', label: 'System Settings', icon: <SystemSettingsIcon /> },
  ];

  const [activeNavItem, setActiveNavItem] = useState<string>('dashboard');
  const [pageAction, setPageAction] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [donees, setDonees] = useState<Donee[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState<boolean>(true);
  const [admins, setAdmins] = useState<Admin[]>([
  ]);
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [conversations, setConversations] = useState<Record<string, Message[]>>(mockConversations);


  // Centralized state for system settings
  const [donationCases, setDonationCases] = useState<CategoryItem[]>([
    { id: 1, name: 'ایک بار' },
    { id: 2, name: 'ماہانہ' },
    { id: 3, name: 'سالانہ' },
  ]);
  const [doneeTypes, setDoneeTypes] = useState<CategoryItem[]>([
    { id: 1, name: 'Factory Worker' },
    { id: 2, name: 'Outdoor Worker' },
  ]);
  const [donationTypes, setDonationTypes] = useState<CategoryItem[]>([
    { id: 1, name: 'زکوٰۃ' },
    { id: 2, name: 'صدقہ' },
    { id: 3, name: 'عطیہ' },
  ]);
  const [references, setReferences] = useState<CategoryItem[]>([
    { id: 1, name: 'قمر خان' },
    { id: 2, name: 'شادہ شاہ' },
    { id: 3, name: 'جمال ہاشمی' },
    { id: 4, name: 'حمید اللہ نیازی' },
  ]);
  const [bankTypes, setBankTypes] = useState<CategoryItem[]>([
    { id: 1, name: 'Meezan Bank' },
    { id: 2, name: 'Bank Alfalah' },
    { id: 3, name: 'HBL' },
    { id: 4, name: 'UBL' },
    { id: 5, name: 'MCB Bank' },
    { id: 6, name: 'National Bank of Pakistan' },
    { id: 7, name: 'Allied Bank Limited' },
    { id: 8, name: 'Faysal Bank' },
    { id: 9, name: 'Askari Bank' },
    { id: 10, name: 'Bank Al-Habib' },
    { id: 11, name: 'Standard Chartered' },
    { id: 12, name: 'Habib Metro Bank' },
    { id: 13, name: 'Soneri Bank' },
    { id: 14, name: 'Bank of Punjab' },
    { id: 15, name: 'JS Bank' },
    { id: 16, name: 'Other' },
  ]);
  const [config, setConfig] = useState<SystemConfig>({
      trustName: 'Qamar Khan Trust',
      contactNumber: '0347-7523873',
      systemEmail: 'qamarteacompany0@gmail.com',
      address: 'Plot No.B1-273/A, Fazal Abad Colony. Railway Mall Godam Road Malakwal District Mandi Bahauddin.',
      trustProfilePicture: '',
      backupSchedule: {
        full: {
          enabled: true,
          everyHours: 6,
          everyMinutes: 0,
        },
        runBetween: {
          enabled: false,
          startTime: '12:00',
          endTime: '12:00',
        },
        runOnDays: {
          sun: true, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true,
        },
        firstFullBackupStart: '2025-01-06T10:16',
      },
  });
  
  const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    'Super Admin': navItems.map(item => item.id), // All access
    'Manager': [
        'dashboard', 'inquiry', 'donee', 'donee_contact_list', 
        'pay_donations', 'all_donations', 'reports', 'case_tracking', 
        'case_tracking_reports', 'employee_chat'
    ],
    'Staff': [
        'dashboard', 'inquiry', 'donee', 
        'donee_contact_list', 'pay_donations', 'all_donations', 'employee_chat'
    ],
  };

  const accessibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    const allowedIds = ROLE_PERMISSIONS[currentUser.role];
    return navItems.filter(item => allowedIds.includes(item.id));
  }, [currentUser]);

  const activeItemDetails = navItems.find(item => item.id === activeNavItem) || navItems[0];
  
  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    try {
      const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass })
      });
      if (!res.ok) return false;
      const user = await res.json();
      // Map backend user to Admin shape used by the app
      const mapped: Admin = {
        username: user.username,
        email: user.email,
        password: '',
        status: user.status === 'Active' ? 'Active' : 'Inactive',
        role: user.role,
        createdBy: 'System',
        createdAt: typeof user.createdAt === 'string' ? user.createdAt : new Date(user.createdAt).toISOString().slice(0,10),
      };
      setIsAuthenticated(true);
      setCurrentUser(mapped);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthPage('login');
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  };

  const handleSignUp = (user: string, email: string, pass: string) => {
    // In a real app, you would register the user here
    console.log('Signing up with:', user, email, pass);
    // For this demo, signing up automatically logs the user in
    setIsAuthenticated(true);
  };

  const navigateTo = useCallback((navId: string, action: string | null = null) => {
    setActiveNavItem(navId);
    setPageAction(action);
  }, []);

  const resetPageAction = useCallback(() => {
    setPageAction(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    // Load SystemConfig from backend
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/system-config`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sc = await res.json();
        if (sc) {
          setConfig(prev => ({
            ...prev,
            trustName: sc.TrustName ?? sc.trustName ?? prev.trustName,
            contactNumber: sc.ContactNumber ?? sc.contactNumber ?? prev.contactNumber,
            systemEmail: sc.SystemEmail ?? sc.systemEmail ?? prev.systemEmail,
            address: sc.Address ?? sc.address ?? prev.address,
            trustProfilePicture: sc.TrustProfilePicture ?? sc.trustProfilePicture ?? prev.trustProfilePicture,
          }));
        }
      } catch (e) {
        console.error('Failed to load system config', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  }, []);

  useEffect(() => {
    // Simulate initial data fetch when the component mounts after authentication
    if (isAuthenticated) {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500); // Simulate a 1.5-second network request

        return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Donees from backend API when authenticated
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/donees`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDonees(Array.isArray(data) ? data : []);
      } catch (e) {
        // swallow for now; UI will show empty state
        console.error('Failed to load donees', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Bank Types for System Settings
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/banks`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setBankTypes(data);
      } catch (e) {
        console.error('Failed to load bank types', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch References for System Settings
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/references`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setReferences(data);
      } catch (e) {
        console.error('Failed to load references', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Donation Types for System Settings
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/donation-types`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setDonationTypes(data);
      } catch (e) {
        console.error('Failed to load donation types', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Donee Types for System Settings
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/donee-types`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setDoneeTypes(data);
      } catch (e) {
        console.error('Failed to load donee types', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Donation Cases for System Settings
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/donation-cases`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setDonationCases(data);
      } catch (e) {
        console.error('Failed to load donation cases', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Donations from backend API when authenticated
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/donations`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDonations(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load donations', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch Admins (Users) from backend API when authenticated
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/api/users`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = await res.json();
        const mapped = (Array.isArray(users) ? users : []).map(u => ({
          username: u.Username || u.username,
          email: u.Email || u.email,
          password: '',
          status: (u.Status || u.status) === 'Active' ? 'Active' : 'Inactive',
          role: (u.Role || u.role) as UserRole,
          createdBy: 'System',
          createdAt: (u.CreatedAt || u.createdAt) ? String(u.CreatedAt || u.createdAt).slice(0,10) : ''
        }));
        setAdmins(mapped);
      } catch (e) {
        console.error('Failed to load users', e);
      }
    };
    load();
    return () => controller.abort();
  }, [isAuthenticated]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleAfterPrint = () => {
        document.body.classList.remove('is-printing');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const logoComponent = config.trustProfilePicture ? (
      <img src={config.trustProfilePicture} alt={`${config.trustName} Logo`} className="w-10 h-10 rounded-full object-cover" />
  ) : (
      <LogoIcon className="w-8 h-8 text-white" />
  );


  if (!isAuthenticated) {
    if (authPage === 'login') {
      return <LoginPage onLogin={handleLogin} onGoToSignUp={() => setAuthPage('signup')} />;
    }
    return <SignUpPage onSignUp={handleSignUp} onGoToLogin={() => setAuthPage('login')} />;
  }

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 font-sans lg:flex">
      <Dashboard 
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        navItems={accessibleNavItems} 
        activeNavItem={activeNavItem}
        onNavItemClick={(id) => {
          navigateTo(id);
          // Close sidebar on navigation on mobile
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
        logo={logoComponent}
        title={config.trustName}
      />
       <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
        aria-hidden="true"
      ></div>
      <MainContent 
        activeItem={activeItemDetails}
        navigateTo={navigateTo}
        pageAction={pageAction}
        resetPageAction={resetPageAction}
        donees={donees}
        setDonees={setDonees}
        donations={donations}
        setDonations={setDonations}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        loading={loading}
        // Pass system settings state down
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
        admins={admins}
        setAdmins={setAdmins}
        config={config}
        setConfig={setConfig}
        // Pass chat state down
        currentUser={currentUser}
        conversations={conversations}
        setConversations={setConversations}
      />
    </div>
  );
};

export default App;