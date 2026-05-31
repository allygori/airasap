// Reference: AGENTS.md § 3.3 - Auth layout with professional dental aesthetic
import { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  // const year = new Date().getFullYear();

  // return (
  //   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
  //     <div className="w-full max-w-md">
  //       <div className="bg-white rounded-lg shadow-lg p-8">
  //         {/* Header */}
  //         <div className="text-center mb-8">
  //           <h1 className="text-3xl font-bold text-slate-900">Katalis Dental</h1>
  //           <p className="text-slate-600 mt-2">Professional Content Management</p>
  //         </div>

  //         {/* Children */}
  //         {children}
  //       </div>

  //       {/* Footer */}
  //       <p className="text-center text-slate-600 text-sm mt-6">
  //         © {year} Katalis. All rights reserved.
  //       </p>
  //     </div>
  //   </div>
  // );

  return <div>{children}</div>;
}
