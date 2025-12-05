import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`animate-pulse bg-secondary/50 rounded ${className}`} />
);

export const CardSkeleton: React.FC = () => (
    <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
    </div>
);

export const StatCardSkeleton: React.FC = () => (
    <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-24" />
    </div>
);

export const ListItemSkeleton: React.FC = () => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
        </div>
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <div className="space-y-4">
                <CardSkeleton />
            </div>
        </div>
    </div>
);

export const BookingListSkeleton: React.FC = () => (
    <div className="space-y-4">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
    </div>
);
