'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadExport } from '@/hooks/useData';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { getPortalBasePath } from '@/lib/rbac';
import { FileText, Download, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const basePath = getPortalBasePath(user?.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Exports</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">Generate and download organizational reports.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-11 w-11 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><FileText size={22} /></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cases CSV Export</h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">Download all cases as a spreadsheet.</p>
            <Button variant="outline" className="gap-2 w-full" onClick={() => downloadExport(ENDPOINTS.exportCasesCSV, 'cases.csv')}><Download size={16} /> Download CSV</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-11 w-11 rounded-lg bg-red-100 text-red-600 flex items-center justify-center dark:bg-red-900/30 dark:text-red-400"><FileText size={22} /></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cases PDF Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">Formatted PDF report of all cases.</p>
            <Button variant="outline" className="gap-2 w-full" onClick={() => downloadExport(ENDPOINTS.exportCasesPDF, 'cases.pdf')}><Download size={16} /> Download PDF</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-11 w-11 rounded-lg bg-green-100 text-green-600 flex items-center justify-center dark:bg-green-900/30 dark:text-green-400"><BarChart3 size={22} /></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dashboard Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">View the live dashboard summary data.</p>
            <Link
              href={basePath}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              View Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
