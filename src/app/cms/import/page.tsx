'use client';
import React, { useState } from 'react';
import { ImportWizard } from '../../../components/cms/ImportWizard';

export default function ImportCenter() {
  const [step, setStep] = useState(0);

  const steps = [
    { id: '1', name: 'Upload File', status: step === 0 ? 'current' : step > 0 ? 'complete' : 'upcoming' as any },
    { id: '2', name: 'Validation & Preview', status: step === 1 ? 'current' : step > 1 ? 'complete' : 'upcoming' as any },
    { id: '3', name: 'Commit to Staging', status: step === 2 ? 'current' : 'upcoming' as any }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Center</h1>
        <p className="mt-1 text-sm text-gray-500">Bulk import questions into the platform.</p>
      </div>

      <ImportWizard 
        steps={steps} 
        currentStep={step} 
        onNext={() => setStep(s => Math.min(2, s + 1))}
        onBack={() => setStep(s => Math.max(0, s - 1))}
      >
        {step === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">CSV or JSON up to 10MB</p>
          </div>
        )}
        
        {step === 1 && (
          <div className="p-4 bg-white h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview: quantitative_aptitude_v1.csv</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <dt className="text-sm font-medium text-green-800">Valid Rows</dt>
                <dd className="text-2xl font-semibold text-green-900">482</dd>
              </div>
              <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <dt className="text-sm font-medium text-red-800">Errors (DLQ)</dt>
                <dd className="text-2xl font-semibold text-red-900">18</dd>
              </div>
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <dt className="text-sm font-medium text-yellow-800">Duplicates Detected</dt>
                <dd className="text-2xl font-semibold text-yellow-900">4</dd>
              </div>
            </div>
            <p className="text-sm text-gray-600">Only valid, non-duplicate rows will be committed to staging.</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center h-64 bg-white">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Import Batch #4092 Successfully Committed</h3>
            <p className="text-sm text-gray-500 mt-2">482 questions are now awaiting editorial approval.</p>
          </div>
        )}
      </ImportWizard>
    </div>
  );
}
