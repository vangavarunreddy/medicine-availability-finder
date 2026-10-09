import React from 'react';
import { Search, Bell, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { AvailabilityBadge } from '../../components/common/Badge';

export const PatientDashboard = () => {
  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Patient Portal</h1>
          <p className="text-slate-600 text-sm">Track your search history, availability notifications, and reservation requests.</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">12</div>
              <div className="text-xs text-slate-500">Total Searches</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">2</div>
              <div className="text-xs text-slate-500">Active Notifications</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">3</div>
              <div className="text-xs text-slate-500">Requests Submitted</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">2</div>
              <div className="text-xs text-slate-500">Fulfilled Orders</div>
            </div>
          </Card>
        </div>

        {/* Recent Search History & Active Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card header={<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" /> Recent Searches</h3>}>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Paracetamol 500mg</div>
                  <div className="text-slate-400">Location: Connaught Place</div>
                </div>
                <span className="text-slate-400">2 hours ago</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Amoxicillin Syrup</div>
                  <div className="text-slate-400">Location: All Cities</div>
                </div>
                <span className="text-slate-400">Yesterday</span>
              </div>
            </div>
          </Card>

          <Card header={<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-blue-600" /> Active "Notify Me" Alerts</h3>}>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Crocin 120mg/5ml Syrup</div>
                  <div className="text-slate-400">Subscribed for Global LifeCare Agency</div>
                </div>
                <AvailabilityBadge status="OUT_OF_STOCK" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
