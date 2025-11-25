// components/InvoiceTemplate.tsx
import React from 'react';
import { InvoiceData, InvoiceTemplate as TemplateType } from '../../../types/invoice';
import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import MinimalTemplate from './MinimalTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';
// Your original template

interface InvoiceTemplateProps {
  invoiceData: InvoiceData | null;
  selectedTemplate: TemplateType;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ 
  invoiceData, 
  selectedTemplate 
}) => {
  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate invoiceData={invoiceData} />;
      case 'classic':
        return <ClassicTemplate invoiceData={invoiceData} />;
      case 'minimal':
        return <MinimalTemplate invoiceData={invoiceData} />;
      case 'professional':
      default:
        return <ProfessionalTemplate invoiceData={invoiceData} />;
    }
  };

  return (
    <div className="invoice-template-wrapper">
      {renderTemplate()}
    </div>
  );
};

export default InvoiceTemplate;