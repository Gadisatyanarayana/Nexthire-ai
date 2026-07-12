'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function CertificateViewer({ certificate }: { certificate: any }) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-12 rounded-xl shadow-2xl text-center border-8 border-gray-100">
      <div className="border-4 border-double border-gray-300 p-16 relative">
        
        <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
        
        <h1 className="text-4xl font-serif text-gray-800 mb-2">Certificate of Completion</h1>
        <p className="text-gray-500 mb-8 uppercase tracking-widest text-sm">NextHire AI Placement Platform</p>
        
        <p className="text-lg text-gray-600 mb-4">This certifies that</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-8 underline decoration-gray-200 underline-offset-8">
          {certificate.users?.name || 'Student Name'}
        </h2>
        
        <p className="text-lg text-gray-600 mb-4">has successfully completed the module</p>
        <h3 className="text-2xl font-bold text-emerald-700 mb-12">{certificate.module_name}</h3>
        
        <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-200">
          <div className="text-left">
            <p className="text-gray-800 font-bold">NextHire AI Team</p>
            <p className="text-sm text-gray-500">Authorized Signature</p>
          </div>
          
          <div className="text-right">
            <p className="text-gray-800 font-mono text-sm">ID: {certificate.certificate_id}</p>
            <p className="text-sm text-gray-500">Date: {new Date(certificate.issued_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
