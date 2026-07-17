import React from 'react';

interface Step {
  id: string;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface ImportWizardProps {
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  children: React.ReactNode;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  steps,
  currentStep,
  onNext,
  onBack,
  isNextDisabled = false,
  children
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8 mb-8">
          {steps.map((step, index) => (
            <li key={step.name} className="md:flex-1">
              <div
                className={`group pl-4 py-2 flex flex-col border-l-4 md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4 ${
                  index < currentStep
                    ? 'border-indigo-600 hover:border-indigo-800'
                    : index === currentStep
                    ? 'border-indigo-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-xs font-semibold tracking-wide uppercase ${
                    index <= currentStep ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  Step {index + 1}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
      
      <div className="min-h-[300px] border border-gray-100 rounded-md p-4 bg-gray-50 mb-6">
        {children}
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || currentStep === steps.length - 1}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};
