'use client';
import React from 'react';
import { ApprovalCard } from '../../../components/cms/ApprovalCard';
import { PreviewPane } from '../../../components/cms/PreviewPane';

export default function EditorialWorkflow() {
  const handleApprove = async (comments: string) => {
    console.log("Approved with:", comments);
  };

  const handleReject = async (comments: string) => {
    console.log("Rejected with:", comments);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editorial Queue</h1>
        <p className="mt-1 text-sm text-gray-500">Review questions submitted by subject matter experts.</p>
      </div>

      <div className="space-y-8">
        <ApprovalCard
          title="Understanding Time and Work"
          subtitle="Quantitative Aptitude > Time and Work > Core Concepts"
          status="AwaitingApproval"
          requestedBy="John Doe"
          timestamp={new Date()}
          onApprove={handleApprove}
          onReject={handleReject}
        >
          <PreviewPane
            title="Question Preview"
            metadata={[
              { label: 'Difficulty', value: 'Hard' },
              { label: 'Bloom Level', value: 'Analyze' },
              { label: 'Tags', value: 'TCS, Infosys' }
            ]}
            content={
              <div>
                <p className="mb-4">If A can do a piece of work in 10 days and B can do the same work in 15 days, how long will they take to complete the work if they work together?</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Option A: 6 days (Correct)</li>
                  <li>Option B: 8 days</li>
                  <li>Option C: 12 days</li>
                  <li>Option D: 25 days</li>
                </ul>
                <div className="bg-gray-50 p-4 rounded border">
                  <strong>Explanation:</strong> Work done by A in 1 day = 1/10. Work done by B in 1 day = 1/15. Together = 1/10 + 1/15 = 5/30 = 1/6. Total days = 6.
                </div>
              </div>
            }
          />
        </ApprovalCard>
      </div>
    </div>
  );
}
