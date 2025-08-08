
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApiKeySettings from '../../components/admin/ApiKeySettings';
import CertificateTestPanel from '../../components/admin/CertificateTestPanel';
import { PriceTestPanel } from '../../components/admin/PriceTestPanel';
import { TcgDatabaseRefresh } from '../../components/admin/TcgDatabaseRefresh';
import AuthGuard from '../../components/AuthGuard';
import JustTcgDiagnostics from '../../components/admin/JustTcgDiagnostics';
import JustTcgKeyCard from '../../components/admin/JustTcgKeyCard';

const ApiSettingsPage = () => {
  const navigate = useNavigate();
  
  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <p className="mb-4 text-gray-600">
              Manage API keys for various external services. These keys are required for functions like certificate lookups and submission tracking.
            </p>
            <p className="text-sm text-amber-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Keep these keys secure and update them regularly.
            </p>
          </div>
          
          <div className="space-y-6">
            <TcgDatabaseRefresh />

            <div className="bg-white rounded-lg shadow-sm">
              <PriceTestPanel />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <ApiKeySettings />
            </div>

            {/* JustTCG Secret Management & Diagnostics */}
            <div className="space-y-6">
              {/* Minimal card to input/test key and link to Supabase Secrets */}
              <JustTcgKeyCard />
              <JustTcgDiagnostics />
            </div>

            <CertificateTestPanel />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default ApiSettingsPage;
