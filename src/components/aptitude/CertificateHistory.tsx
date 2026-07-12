'use client';

import React from 'react';
import { CertificateCard } from './CertificateCard';

export function CertificateHistory({ certificates = [] }: { certificates: any[] }) {
  if (certificates.length === 0) {
    return (
      <div className="text-center py-12 bg-[#121212] rounded-2xl border border-[#2a2a2a]">
        <p className="text-gray-400">No certificates earned yet.</p>
        <p className="text-sm text-gray-500 mt-2">Complete modules and pass mocks to earn certifications.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map(cert => (
        <CertificateCard key={cert.id} certificate={cert} />
      ))}
    </div>
  );
}
