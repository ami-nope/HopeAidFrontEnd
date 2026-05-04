import React from 'react';

import { Card, CardContent } from './ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md hover:scale-105 dark:border-gray-800 dark:hover:shadow-none" data-card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300">{title}</h3>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-transform dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-gray-100">{value}</span>
          {trend && (
            <span
              className={`mb-1 text-sm font-medium transition-all ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {trendUp ? 'Up' : 'Down'} {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
