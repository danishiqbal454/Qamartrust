

import React, { useState, useMemo } from 'react';
import DashboardItem from './DashboardItem';
import type { NavItem } from '../types';
import { MenuIcon, InquiryIcon } from './Icons';

interface DashboardProps {
  navItems: NavItem[];
  activeNavItem: string;
  onNavItemClick: (id: string) => void;
  logo: React.ReactElement;
  title: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navItems, activeNavItem, onNavItemClick, logo, title, isSidebarOpen, toggleSidebar }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNavItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return navItems;
    }
    return navItems.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [navItems, searchTerm]);
  
  return (
    <aside className={`fixed inset-y-0 left-0 bg-gray-900 text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:shrink-0 ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-64' : '-translate-x-full w-64 lg:w-20'}`}>
      <div className="flex items-center h-20 px-4 border-b border-gray-700 shrink-0">
        <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-full text-white hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-6 h-6" />
        </button>
        <div className={`flex items-center space-x-3 overflow-hidden transition-all duration-200 ${isSidebarOpen ? 'w-auto ml-3' : 'w-0 ml-0'}`}>
          {logo}
          <span className="text-xl font-bold text-white whitespace-nowrap">{title}</span>
        </div>
      </div>

      <div className={`p-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <InquiryIcon className="w-5 h-5 text-white" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 text-white bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search navigation items"
          />
        </div>
      </div>
      
      <nav className="flex-1 px-2 lg:px-4 pb-6 space-y-2 overflow-y-auto">
        {filteredNavItems.length > 0 ? (
            filteredNavItems.map((item) => (
              <DashboardItem
                key={item.id}
                item={item}
                isActive={activeNavItem === item.id}
                onClick={() => onNavItemClick(item.id)}
                isSidebarOpen={isSidebarOpen}
              />
            ))
        ) : (
             <div className={`text-center py-4 text-white text-sm ${isSidebarOpen ? 'block' : 'hidden'}`}>
                No results found.
            </div>
        )}
      </nav>
    </aside>
  );
};

export default Dashboard;