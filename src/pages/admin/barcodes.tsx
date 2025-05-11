import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Barcode, ArrowLeft, Plus, Settings as SettingsIcon, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '../../components/AuthGuard';
import { BarcodeTemplate, BarcodeSetting, PrintLog } from '../../types/barcode';
import { barcodeService } from '../../services/barcodeService';
import TemplateList from '../../components/barcode/TemplateList';
import TemplateForm from '../../components/barcode/TemplateForm';
import TemplatePreview from '../../components/barcode/TemplatePreview';
import SettingsForm from '../../components/barcode/SettingsForm';
import PrintLogsTable from '../../components/barcode/PrintLogsTable';

const BarcodesAdmin: React.FC = () => {
  const navigate = useNavigate();
  
  // State for templates
  const [templates, setTemplates] = useState<BarcodeTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<BarcodeTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateType, setTemplateType] = useState<'standard' | 'card'>('standard');
  
  // State for settings
  const [settings, setSettings] = useState<BarcodeSetting | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // State for print logs
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'templates' | 'settings' | 'logs'>('templates');

  // Create card template if it doesn't exist
  const ensureCardTemplateExists = async () => {
    try {
      await barcodeService.createCardTemplate();
    } catch (error) {
      console.error('Error ensuring card template exists:', error);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await barcodeService.fetchTemplates();
      setTemplates(data);
      
      // Set default template as selected
      const defaultTemplate = data.find(t => t.is_default) || (data.length > 0 ? data[0] : null);
      setSelectedTemplate(defaultTemplate);
      
      // Check if the selected template is a card template
      if (defaultTemplate && (defaultTemplate.name.toLowerCase().includes('card') || 
          defaultTemplate.description?.toLowerCase().includes('card'))) {
        setTemplateType('card');
      } else {
        setTemplateType('standard');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load barcode templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const data = await barcodeService.fetchSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load barcode settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await barcodeService.fetchPrintLogs();
      setPrintLogs(data);
    } catch (error) {
      console.error('Error fetching print logs:', error);
      toast.error('Failed to load print logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    ensureCardTemplateExists().then(() => fetchTemplates());
    fetchSettings();
    fetchLogs();
  }, []);

  // Handle template type change
  const handleTemplateTypeChange = (type: 'standard' | 'card') => {
    setTemplateType(type);
    
    // Find a template that matches the selected type
    const matchingTemplate = templates.find(t => {
      const isCardTemplate = t.name.toLowerCase().includes('card') || 
                           t.description?.toLowerCase().includes('card');
      return type === 'card' ? isCardTemplate : !isCardTemplate;
    });
    
    if (matchingTemplate) {
      setSelectedTemplate(matchingTemplate);
    }
  };

  // Handle template save
  const handleSaveTemplate = async (templateData: Partial<BarcodeTemplate>) => {
    try {
      if (isEditingTemplate && selectedTemplate) {
        // Update existing template
        await barcodeService.updateTemplate(selectedTemplate.id, templateData);
      } else {
        // Create new template
        await barcodeService.createTemplate(templateData as Omit<BarcodeTemplate, 'id' | 'created_at' | 'updated_at'>);
      }
      
      // Refresh templates
      fetchTemplates();
      
      // Exit edit/create mode
      setIsEditingTemplate(false);
      setIsCreatingTemplate(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  // Handle template edit
  const handleEditTemplate = (template: BarcodeTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(true);
    
    // Set template type based on name or description
    if (template.name.toLowerCase().includes('card') || 
        template.description?.toLowerCase().includes('card')) {
      setTemplateType('card');
    } else {
      setTemplateType('standard');
    }
  };

  // Handle template delete
  const handleDeleteTemplate = async (template: BarcodeTemplate) => {
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      try {
        await barcodeService.deleteTemplate(template.id);
        fetchTemplates();
        
        // If the deleted template was selected, select another one
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  // Handle settings save
  const handleSaveSettings = async (settingsData: Partial<BarcodeSetting['setting_value']>) => {
    try {
      await barcodeService.updateSettings(settingsData);
      fetchSettings();
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Admin
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Barcode className="h-6 w-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Barcode Management</h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
                  activeTab === 'templates'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
                  activeTab === 'logs'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="h-4 w-4 mr-2" />
                Print Logs
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div>
                {!isCreatingTemplate && !isEditingTemplate ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Barcode Templates</h2>
                      <div className="flex items-center space-x-3">
                        <div className="flex rounded-md shadow-sm">
                          <button
                            onClick={() => handleTemplateTypeChange('standard')}
                            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                              templateType === 'standard'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Standard
                          </button>
                          <button
                            onClick={() => handleTemplateTypeChange('card')}
                            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                              templateType === 'card'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Card
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setIsCreatingTemplate(true);
                            setSelectedTemplate(null);
                          }}
                          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Template
                        </button>
                      </div>
                    </div>
                    
                    {isLoadingTemplates ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <TemplateList 
                            templates={templates} 
                            onEdit={handleEditTemplate} 
                            onDelete={handleDeleteTemplate} 
                          />
                        </div>
                        <div>
                          <TemplatePreview 
                            template={selectedTemplate} 
                            templateType={templateType}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      {isCreatingTemplate ? 'Create New Template' : 'Edit Template'}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <TemplateForm 
                          template={isEditingTemplate ? selectedTemplate || undefined : undefined}
                          onSave={handleSaveTemplate}
                          onCancel={() => {
                            setIsCreatingTemplate(false);
                            setIsEditingTemplate(false);
                          }}
                        />
                      </div>
                      <div>
                        <TemplatePreview 
                          template={selectedTemplate}
                          templateType={templateType} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Barcode Settings</h2>
                
                {isLoadingSettings ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <SettingsForm settings={settings} onSave={handleSaveSettings} />
                    </div>
                    <div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-800 mb-2">About Barcode Settings</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          These settings control the appearance and content of barcodes when printed using the default template.
                          Custom templates may override some of these settings.
                        </p>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">Setting Types:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-medium">Barcode Type:</span> The type of barcode symbology to use</li>
                            <li><span className="font-medium">Dimensions:</span> Width and height of the barcode</li>
                            <li><span className="font-medium">Content:</span> What information to include on the label</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Print History</h2>
                  <button
                    onClick={() => fetchLogs()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                
                <PrintLogsTable logs={printLogs} isLoading={isLoadingLogs} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default BarcodesAdmin;
