import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Trade-In Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/app" className="block bg-white rounded-2xl shadow-xl border border-gray-100 hover:border-blue-200 transition-colors duration-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Create New Trade-In</h2>
              <Pencil className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-gray-600">Quickly start a new trade-in process.</p>
            <div className="flex justify-end mt-4">
              <span className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </span>
            </div>
          </Link>

          <Link to="/trade-ins" className="block bg-white rounded-2xl shadow-xl border border-gray-100 hover:border-blue-200 transition-colors duration-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">View All Trade-Ins</h2>
              <Pencil className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-gray-600">Review and manage existing trade-in records.</p>
            <div className="flex justify-end mt-4">
              <span className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center">
                View Trade-ins
                <ArrowRight className="h-4 w-4 ml-2" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
