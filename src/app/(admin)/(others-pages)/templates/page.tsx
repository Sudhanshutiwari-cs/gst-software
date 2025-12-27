'use client';

import { useState, useEffect } from 'react';
import { 
  Edit2, Save, X, Trash2, Eye, Plus, Search, Filter, 
  CheckCircle, FileText,
  User, QrCode, Signature, Settings, Copy,
  Building, RefreshCw, AlertCircle,  CreditCard, Hash
} from 'lucide-react';

// ========== TYPES ==========
interface Template {
  id: number;
  template_id: string;
  template_name: string | null;
  name: string;
  notes?: string | null;
  terms_conditions?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  acc_number?: string | null;
  upi_id?: string | null;
  qr_code?: string | null;
  signature?: string | null;
  vendor_id: string;
  acc_holder_name?: string | null;
  status: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

// ========== API SERVICE FUNCTIONS ==========
const API_BASE_URL = 'https://manhemdigitalsolutions.com/pos-admin/api/vendor/templates';

// Get JWT token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  return null;
};

// Fetch all templates
const fetchAllTemplates = async (): Promise<Template[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Template[]> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch templates');
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Fetch single template by template_name
const fetchTemplateByName = async (templateName: string): Promise<Template> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/view/${templateName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (response.status === 404) {
        throw new Error(`Template "${templateName}" not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Template> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch template');
    }
  } catch (error) {
    console.error(`Error fetching template ${templateName}:`, error);
    throw error;
  }
};

// Create new template (assumed endpoint)
const createTemplateApi = async (data: Partial<Template>): Promise<Template> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const requestData = {
      template_name: data.template_name || null,
      name: data.name || null,
      notes: data.notes || null,
      terms_conditions: data.terms_conditions || null,
      bank_name: data.bank_name || null,
      ifsc_code: data.ifsc_code || null,
      acc_number: data.acc_number || null,
      upi_id: data.upi_id || null,
      qr_code: data.qr_code || null,
      signature: data.signature || null,
      acc_holder_name: data.acc_holder_name || null,
      status: data.status !== undefined ? data.status : 1,
    };

    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Template> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to create template');
    }
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Update template (assumed endpoint - adjust as needed)
const updateTemplateApi = async (
  templateName: string,
  data: Partial<Template>
): Promise<Template> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const requestData = {
      template_name: data.template_name || null,
      name: data.name || null,
      notes: data.notes || null,
      terms_conditions: data.terms_conditions || null,
      bank_name: data.bank_name || null,
      ifsc_code: data.ifsc_code || null,
      acc_number: data.acc_number || null,
      upi_id: data.upi_id || null,
      qr_code: data.qr_code || null,
      signature: data.signature || null,
      acc_holder_name: data.acc_holder_name || null,
      status: data.status !== undefined ? data.status : null,
    };

    const response = await fetch(`${API_BASE_URL}/update/${templateName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Template> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to update template');
    }
  } catch (error) {
    console.error(`Error updating template ${templateName}:`, error);
    throw error;
  }
};

// Delete template (assumed endpoint)
const deleteTemplateApi = async (templateName: string): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/delete/${templateName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<null> = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error deleting template ${templateName}:`, error);
    throw error;
  }
};

// ========== MAIN COMPONENT ==========
export default function TemplatesPage() {
  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Template>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState({
    templates: true,
    saving: false,
    fetching: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch all templates
  const fetchTemplates = async () => {
    try {
      setLoading(prev => ({ ...prev, templates: true }));
      setError(null);
      
      const data = await fetchAllTemplates();
      setTemplates(data);
      
      setSuccessMessage('Templates loaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      (template.name && template.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (template.notes && template.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (template.template_name && template.template_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (template.bank_name && template.bank_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && template.status === 1) ||
      (filterStatus === 'inactive' && template.status === 0);
    
    return matchesSearch && matchesStatus;
  });

  // Open modal for viewing/editing
  const handleOpenModal = async (template: Template) => {
    try {
      setLoading(prev => ({ ...prev, fetching: true }));
      setError(null);
      
      // Use template_name to fetch single template
      if (template.template_name) {
        const freshTemplate = await fetchTemplateByName(template.template_name);
        setSelectedTemplate(freshTemplate);
        setFormData({ ...freshTemplate });
        setIsModalOpen(true);
        setIsEditing(false);
      } else {
        throw new Error('Template name is required to view details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template details';
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  // Open modal for creating new template
  const handleCreateNew = () => {
    const newTemplate: Partial<Template> = {
      template_name: '',
      name: '',
      notes: '',
      terms_conditions: '',
      bank_name: '',
      ifsc_code: '',
      acc_number: '',
      upi_id: '',
      qr_code: '',
      signature: '',
      acc_holder_name: '',
      status: 1,
    };
    
    setSelectedTemplate(newTemplate as Template);
    setFormData(newTemplate);
    setIsModalOpen(true);
    setIsEditing(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value || null
      }));
    }
  };

  // Handle file URL input for QR code and signature
  

  // Save template (create or update)
  const handleSaveTemplate = async () => {
    if (!formData.name?.trim()) {
      setError('Template name is required');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      
      let updatedTemplate: Template;
      
      if (selectedTemplate && selectedTemplate.template_name) {
        // Update existing template using template_name
        updatedTemplate = await updateTemplateApi(selectedTemplate.template_name, formData);
        
        // Update local state
        setTemplates(prev => prev.map(t => 
          t.template_name === selectedTemplate.template_name ? updatedTemplate : t
        ));
        
        setSuccessMessage('Template updated successfully');
      } else {
        // Create new template
        updatedTemplate = await createTemplateApi(formData);
        
        // Add to local state
        setTemplates(prev => [...prev, updatedTemplate]);
        
        setSuccessMessage('Template created successfully');
      }
      
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateName: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;
    
    try {
      await deleteTemplateApi(templateName);
      
      // Remove from local state
      setTemplates(prev => prev.filter(t => t.template_name !== templateName));
      setSuccessMessage('Template deleted successfully');
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
    }
  };

  // Duplicate template
  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Partial<Template> = {
      ...template,
      template_name: `${template.template_name}_copy_${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    
    setSelectedTemplate(duplicatedTemplate as Template);
    setFormData(duplicatedTemplate);
    setIsModalOpen(true);
    setIsEditing(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to get status display
  const getStatusDisplay = (status: number) => {
    return status === 1 ? 'Active' : 'Inactive';
  };

  // Helper function to get status color
  const getStatusColor = (status: number) => {
    return status === 1 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );

  // Main render
  if (loading.templates) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">{successMessage}</span>
              </div>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bill Templates</h1>
              <p className="text-gray-600 mt-2">Manage your billing templates with pre-filled details</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTemplates}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={loading.templates}
              >
                <RefreshCw className={`w-4 h-4 ${loading.templates ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow"
                disabled={!getAuthToken()}
              >
                <Plus className="w-5 h-5" />
                Create New Template
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.status === 1).length}
              </div>
              <div className="text-sm text-gray-600">Active Templates</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-amber-600">
                {templates.filter(t => t.status === 0).length}
              </div>
              <div className="text-sm text-gray-600">Inactive Templates</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {templates.filter(t => t.bank_name && t.bank_name.trim() !== '').length}
              </div>
              <div className="text-sm text-gray-600">With Bank Details</div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates by name, template name, notes, or bank..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              {/* Template Header Section */}
              <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(template.status)}`}>
                      {getStatusDisplay(template.status)}
                    </span>
                  </div>
                  {template.vendor_id && (
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Vendor ID
                    </div>
                  )}
                </div>
                
                <div className="mb-2">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{template.name}</h3>
                  {template.template_name && (
                    <div className="flex items-center gap-1 mt-1">
                      <Hash className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600 font-mono">{template.template_name}</span>
                    </div>
                  )}
                </div>

                {template.template_id && (
                  <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded inline-block">
                    ID: {template.template_id}
                  </div>
                )}
              </div>

              {/* Template Details */}
              <div className="p-4">
                {/* Quick Info */}
                <div className="space-y-3 mb-4">
                  {template.notes && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-medium">Notes:</span> {template.notes}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {template.bank_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Building className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate font-medium">{template.bank_name}</span>
                      </div>
                    )}
                    {template.acc_holder_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{template.acc_holder_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.bank_name && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Bank
                    </span>
                  )}
                  {template.upi_id && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      UPI
                    </span>
                  )}
                  {template.qr_code && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      QR
                    </span>
                  )}
                  {template.signature && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded flex items-center gap-1">
                      <Signature className="w-3 h-3" />
                      Signature
                    </span>
                  )}
                  {template.terms_conditions && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Terms
                    </span>
                  )}
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Updated:</span>
                    {formatDate(template.updated_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Created:</span>
                    {formatDate(template.created_at)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(template)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleOpenModal(template)}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredTemplates.length === 0 && !loading.templates && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-16 h-16 text-blue-300" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No templates available. Create your first template to get started'}
            </p>
            {!getAuthToken() ? (
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-yellow-600 mb-4">Authentication required. Please login to access templates.</p>
              </div>
            ) : (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create New Template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal for Viewing/Editing Template */}
      {isModalOpen && selectedTemplate && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
            onClick={handleCloseModal}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 mt-3 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Modal Card with spacing from top */}
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 transform transition-all duration-300 ease-out animate-slide-up">
                
                {/* Modal Header with gradient */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isEditing ? (selectedTemplate.id ? 'Edit Template' : 'Create New Template') : 'Template Details'}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {isEditing 
                          ? (selectedTemplate.id ? 'Update the template details below' : 'Fill in the details to create a new template')
                          : 'View template details'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={handleCloseModal}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-gray-200 bg-white"
                        disabled={loading.saving}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="overflow-y-auto mt-3 max-h-[calc(90vh-200px)] p-6">
                  {loading.fetching ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Template ID and Vendor ID Display */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template ID
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                            {formData.template_id || 'Auto-generated on save'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vendor ID
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                            {formData.vendor_id || 'Auto-assigned'}
                          </div>
                        </div>
                      </div>

                      {/* Template Name Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Identifier *
                        </label>
                        <input
                          type="text"
                          name="template_name"
                          value={formData.template_name || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                          }`}
                          placeholder="Enter unique template identifier (e.g., classic, premium)"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be used in the URL to access this template
                        </p>
                      </div>

                      {/* Display Name Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                          }`}
                          placeholder="Enter display name for the template"
                          required
                        />
                      </div>

                      {/* Notes Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={3}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                          }`}
                          placeholder="Add any notes or description for this template"
                        />
                      </div>

                      {/* Terms & Conditions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Terms & Conditions
                        </label>
                        <textarea
                          name="terms_conditions"
                          value={formData.terms_conditions || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={4}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                          }`}
                          placeholder="Enter terms and conditions that will appear on bills"
                        />
                      </div>

                      {/* Status Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="status"
                            checked={formData.status === 1}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${formData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {formData.status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Bank Details Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Building className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Bank & Payment Details</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Bank Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              name="bank_name"
                              value={formData.bank_name || ''}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              }`}
                              placeholder="Enter bank name"
                            />
                          </div>

                          {/* IFSC Code */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              IFSC Code
                            </label>
                            <input
                              type="text"
                              name="ifsc_code"
                              value={formData.ifsc_code || ''}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              }`}
                              placeholder="Enter IFSC code"
                            />
                          </div>

                          {/* Account Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Number
                            </label>
                            <input
                              type="text"
                              name="acc_number"
                              value={formData.acc_number || ''}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              }`}
                              placeholder="Enter account number"
                            />
                          </div>

                          {/* Account Holder Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              name="acc_holder_name"
                              value={formData.acc_holder_name || ''}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              }`}
                              placeholder="Enter account holder name"
                            />
                          </div>

                          {/* UPI ID */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              UPI ID
                            </label>
                            <input
                              type="text"
                              name="upi_id"
                              value={formData.upi_id || ''}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              }`}
                              placeholder="Enter UPI ID"
                            />
                          </div>
                        </div>
                      </div>

                      {/* QR Code and Signature */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Media & Files</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* QR Code */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              QR Code URL
                            </label>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-gray-400" />
                                <input
                                  type="url"
                                  name="qr_code"
                                  value={formData.qr_code || ''}
                                  onChange={handleInputChange}
                                  disabled={!isEditing}
                                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                                  }`}
                                  placeholder="Enter QR code image URL"
                                />
                              </div>
                              {formData.qr_code && (
                                <div className="text-center p-4 border border-gray-200 rounded-lg">
                                  <div className="text-sm text-gray-600 mb-2">QR Code Preview</div>
                                  <div className="w-32 h-32 mx-auto border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                    <img 
                                      src={formData.qr_code} 
                                      alt="QR Code" 
                                      className="max-w-full max-h-full"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Signature */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Signature URL
                            </label>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Signature className="w-5 h-5 text-gray-400" />
                                <input
                                  type="url"
                                  name="signature"
                                  value={formData.signature || ''}
                                  onChange={handleInputChange}
                                  disabled={!isEditing}
                                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                                  }`}
                                  placeholder="Enter signature image URL"
                                />
                              </div>
                              {formData.signature && (
                                <div className="text-center p-4 border border-gray-200 rounded-lg">
                                  <div className="text-sm text-gray-600 mb-2">Signature Preview</div>
                                  <div className="h-16 mx-auto flex items-center justify-center">
                                    <img 
                                      src={formData.signature} 
                                      alt="Signature" 
                                      className="max-w-full max-h-full"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Read-only fields for non-editing mode */}
                      {!isEditing && (
                        <div className="border-t border-gray-200 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Created At
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                                {formatDate(selectedTemplate.created_at)}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Updated At
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                                {formatDate(selectedTemplate.updated_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50/50 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isEditing && selectedTemplate.template_name && (
                        <button
                          onClick={() => handleDeleteTemplate(selectedTemplate.template_name!)}
                          className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
                          disabled={loading.saving}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Template
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCloseModal}
                        className="px-6 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors bg-white"
                        disabled={loading.saving}
                      >
                        Cancel
                      </button>
                      {isEditing && (
                        <button
                          onClick={handleSaveTemplate}
                          disabled={!formData.template_name?.trim() || !formData.name?.trim() || loading.saving || !getAuthToken()}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading.saving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              {selectedTemplate.id ? 'Save Changes' : 'Create Template'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add custom animations to the page */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}