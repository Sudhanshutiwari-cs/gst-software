'use client';

import { useState, useEffect } from 'react';
import { 
  Edit2, Save, X, Trash2, Eye, Plus, Search, Filter, 
  CheckCircle,  FileText, Image as ImageIcon,
  User, QrCode, Signature, Settings, Copy,
  Building, RefreshCw, AlertCircle
} from 'lucide-react';

// ========== TYPES ==========
interface Template {
  id: string;
  name: string;
  notes?: string;
  terms_conditions?: string;
  bank_name?: string;
  ifsc_code?: string;
  acc_number?: string;
  upi_id?: string;
  qr_code?: string;
  signature?: string;
  acc_holder_name?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  template_image?: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

// ========== API SERVICE FUNCTIONS ==========
const API_BASE_URL = 'https://manhemdigitalsolutions.com/pos-admin/api/vendor/templates';

// Get JWT token (update this with your actual auth logic)
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Replace with your actual JWT token retrieval logic
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

// Fetch single template
const fetchTemplateById = async (id: string): Promise<Template> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/view/${id}`, {
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

    const result: ApiResponse<Template> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch template');
    }
  } catch (error) {
    console.error(`Error fetching template ${id}:`, error);
    throw error;
  }
};

// Update template
const updateTemplateApi = async (
  id: string, 
  data: Partial<Template>
): Promise<Template> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const requestData = {
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

    const response = await fetch(`${API_BASE_URL}/edit/${id}`, {
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
    console.error(`Error updating template ${id}:`, error);
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
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.notes && template.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && template.status) ||
      (filterStatus === 'inactive' && !template.status);
    
    return matchesSearch && matchesStatus;
  });

  // Open modal for viewing/editing
  const handleOpenModal = async (template: Template) => {
    try {
      setLoading(prev => ({ ...prev, fetching: true }));
      setError(null);
      
      const freshTemplate = await fetchTemplateById(template.id);
      setSelectedTemplate(freshTemplate);
      setFormData({ ...freshTemplate });
      setIsModalOpen(true);
      setIsEditing(false);
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
      status: true,
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
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle file upload (for QR code and signature)
  const handleFileUpload = async (field: 'qr_code' | 'signature', file: File) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        [field]: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        template_image: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  // Save template (update via API)
  const handleSaveTemplate = async () => {
    if (!selectedTemplate?.id) return;
    
    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      
      // Filter out undefined values
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([ v]) => v !== undefined)
      );
      
      // Update via API
      const updatedTemplate = await updateTemplateApi(selectedTemplate.id, cleanData);
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));
      
      setSuccessMessage('Template updated successfully');
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Delete template (Note: You'll need a DELETE API endpoint)
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      // Note: If you have a DELETE endpoint, implement it here
      // For now, we'll just remove from local state
      setTemplates(prev => prev.filter(t => t.id !== id));
      setSuccessMessage('Template deleted successfully');
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
    }
  };

  // Duplicate template (creates local copy)


  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
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
              <div className="text-2xl font-bold text-green-600">{templates.filter(t => t.status).length}</div>
              <div className="text-sm text-gray-600">Active Templates</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{templates.filter(t => !t.status).length}</div>
              <div className="text-sm text-gray-600">Inactive Templates</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {templates.filter(t => t.bank_name).length}
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
                  placeholder="Search templates by name or notes..."
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
              {/* Template Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                {template.template_image ? (
                  <div className="relative h-full w-full">
                    <img
                      src={template.template_image}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                      <span className="text-sm text-gray-400">No Image</span>
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${template.status ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {template.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Template Details */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 truncate text-lg">{template.name}</h3>
                </div>

                {/* Quick Info */}
                <div className="space-y-2 mb-4">
                  {template.notes && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-medium">Notes:</span> {template.notes}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    {template.bank_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{template.bank_name}</span>
                      </div>
                    )}
                    {template.acc_holder_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{template.acc_holder_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.bank_name && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Bank
                    </span>
                  )}
                  {template.upi_id && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      UPI
                    </span>
                  )}
                  {template.qr_code && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      QR Code
                    </span>
                  )}
                  {template.signature && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                      Signature
                    </span>
                  )}
                  {template.terms_conditions && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      Terms
                    </span>
                  )}
                </div>

                {/* Stats and Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div>
                    Updated: {formatDate(template.updated_at)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(template)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View/Edit"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                     
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleOpenModal(template)}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Details
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Edit Template' : 'Template Details'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {isEditing ? 'Update the template details below' : 'View template details'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading.saving}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              {loading.fetching ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Template Image Upload (Optional - if your API supports it) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Image
                    </label>
                    <div className="space-y-4">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                        {formData.template_image ? (
                          <>
                            <img
                              src={formData.template_image}
                              alt="Template Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            {isEditing && (
                              <div className="absolute bottom-4 right-4 flex gap-2">
                                <button
                                  onClick={() => setFormData(prev => ({ ...prev, template_image: '' }))}
                                  className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Remove Image
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600 mb-2">No template image</div>
                            {isEditing && (
                              <label className="cursor-pointer">
                                <div className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                                  Upload Image
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name
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
                      placeholder="Enter template name"
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
                      placeholder="Add any notes or description"
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
                      placeholder="Enter terms and conditions"
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
                        checked={formData.status || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">
                        {formData.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
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
                      <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* QR Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          QR Code
                        </label>
                        <div className="space-y-3">
                          {formData.qr_code ? (
                            <div className="flex items-center gap-4">
                              <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                <img 
                                  src={formData.qr_code} 
                                  alt="QR Code" 
                                  className="max-w-full max-h-full"
                                />
                              </div>
                              {isEditing && (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => setFormData(prev => ({ ...prev, qr_code: '' }))}
                                    className="px-3 py-1.5 text-sm bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                                  >
                                    Remove QR
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-600 mb-2">No QR code uploaded</div>
                              {isEditing && (
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files && handleFileUpload('qr_code', e.target.files[0])}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Signature */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Signature
                        </label>
                        <div className="space-y-3">
                          {formData.signature ? (
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                <img 
                                  src={formData.signature} 
                                  alt="Signature" 
                                  className="max-w-full max-h-full"
                                />
                              </div>
                              {isEditing && (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => setFormData(prev => ({ ...prev, signature: '' }))}
                                    className="px-3 py-1.5 text-sm bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                                  >
                                    Remove Signature
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                              <Signature className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-600 mb-2">No signature uploaded</div>
                              {isEditing && (
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files && handleFileUpload('signature', e.target.files[0])}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEditing && selectedTemplate.id && (
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
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
                    className="px-6 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading.saving}
                  >
                    Cancel
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleSaveTemplate}
                      disabled={!formData.name?.trim() || loading.saving || !getAuthToken()}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading.saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}