
import React from 'react';

export const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-full p-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

export const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center animate-pulse">
        <div className="p-3 rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
        <div className="ml-4 flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse w-full">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/12"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/12"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/12"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/12"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/12"></div>
                </div>
            ))}
        </div>
    </div>
);

export const DashboardPageSkeleton: React.FC = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <SkeletonTable rows={5} cols={4} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse">
                 <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                 <div className="space-y-4">
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                 </div>
            </div>
        </div>
    </div>
);

export const GenericPageSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/6"></div>
            </div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <SkeletonTable rows={8} cols={5} />
        </div>
    </div>
);
