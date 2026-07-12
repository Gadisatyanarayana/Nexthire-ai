'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';

export function CertificateVerification() {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'loading'>('idle');
  const [details, setDetails] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setStatus('loading');
    
    // In production, this calls a public verification endpoint
    // e.g. GET /api/v1/aptitude/certificates/verify?id={certId}
    await new Promise(resolve => setTimeout(resolve, 800));

    if (certId.startsWith('CERT-')) {
      setStatus('valid');
      setDetails({
        name: 'John Doe',
        module: 'Advanced Quant & Reasoning',
        date: new Date().toLocaleDateString()
      });
    } else {
      setStatus('invalid');
      setDetails(null);
    }
  };

  return (
    <div className="bg-[#121212] p-8 rounded-2xl border border-[#2a2a2a] text-white max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-center">Verify Certificate</h2>
      <p className="text-gray-400 text-center text-sm mb-6">Enter the certificate ID to verify its authenticity.</p>

      <form onSubmit={handleVerify} className="mb-6">
        <div className="relative">
          <input 
            type="text" 
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="e.g. CERT-162..."
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button type="submit" disabled={status === 'loading'} className="absolute right-2 top-2 p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {status === 'valid' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-emerald-400 mb-1">Valid Certificate</h3>
            <p className="text-sm text-gray-300">Issued to: <span className="font-semibold text-white">{details.name}</span></p>
            <p className="text-sm text-gray-300">Module: <span className="font-semibold text-white">{details.module}</span></p>
            <p className="text-sm text-gray-300">Date: <span className="font-semibold text-white">{details.date}</span></p>
          </div>
        </div>
      )}

      {status === 'invalid' && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">Invalid or expired certificate ID. Please check and try again.</p>
        </div>
      )}
    </div>
  );
}
