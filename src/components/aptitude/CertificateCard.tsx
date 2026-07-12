'use client';

import React from 'react';
import { Award, Download, Share2 } from 'lucide-react';

export function CertificateCard({ certificate }: { certificate: any }) {
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] flex flex-col items-center text-center">
      <Award className="w-12 h-12 text-yellow-400 mb-3" />
      <h3 className="text-lg font-bold text-white mb-1">{certificate.module_name}</h3>
      <p className="text-sm text-gray-400 mb-4">Issued on {new Date(certificate.issued_at).toLocaleDateString()}</p>
      
      <div className="w-full bg-[#222] text-xs font-mono p-2 rounded text-gray-500 mb-4">
        ID: {certificate.certificate_id}
      </div>

      <div className="flex gap-2 w-full">
        <button className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white py-2 rounded-lg transition-colors text-sm">
          <Download className="w-4 h-4" /> PDF
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white py-2 rounded-lg transition-colors text-sm">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  );
}
