import React from 'react';

interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-100/70 text-sm font-medium text-slate-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            {headers.map((header, index) => (
              <th key={index} className="py-3 px-4 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80 text-sm text-slate-700 dark:divide-gray-800 dark:text-gray-300">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

export function TableRow({ children, className = '', ...props }: TableRowProps) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-gray-800/50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export function TableCell({ children, className = '', colSpan }: TableCellProps) {
  return <td className={`py-3 px-4 ${className}`} colSpan={colSpan}>{children}</td>;
}
