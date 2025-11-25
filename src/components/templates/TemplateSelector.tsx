// components/TemplateSelector.tsx
'use client';

import React from 'react';
import { InvoiceTemplate } from '../../../types/invoice';

interface TemplateSelectorProps {
  selectedTemplate: InvoiceTemplate;
  onTemplateChange: (template: InvoiceTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateChange
}) => {
  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean and colorful design' },
    { id: 'classic', name: 'Classic', description: 'Traditional formal layout' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and clean' },
    { id: 'professional', name: 'Professional', description: 'Original template' }
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Template</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template.id as InvoiceTemplate)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-gray-800">{template.name}</div>
            <div className="text-xs text-gray-500 mt-1">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;