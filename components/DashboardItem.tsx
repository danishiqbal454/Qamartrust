import React from 'react';
import type { NavItem } from '../types';

interface DashboardItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  isSidebarOpen: boolean;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ item, isActive, onClick, isSidebarOpen }) => {
  const baseClasses = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer group";
  const activeClasses = "bg-indigo-600 text-white shadow-lg";
  const inactiveClasses = "text-white hover:bg-gray-700 hover:text-white";
  const layoutClasses = isSidebarOpen ? "" : "justify-center";

  const iconBaseClasses = "w-5 h-5 transition-colors duration-200 shrink-0";
  const iconActiveClasses = "text-white";
  const iconInactiveClasses = "text-white group-hover:text-white";
  const iconMargin = isSidebarOpen ? "mr-3" : "mr-0";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${layoutClasses}`}
      title={!isSidebarOpen ? item.label : undefined}
      aria-label={item.label}
    >
      {/* FIX: Add type assertion to inform TypeScript that item.icon accepts a className prop. */}
      {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { 
        className: `${iconBaseClasses} ${isActive ? iconActiveClasses : iconInactiveClasses} ${iconMargin}` 
      })}
      {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
    </div>
  );
};

export default DashboardItem;