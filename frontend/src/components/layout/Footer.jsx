import React from 'react';
import { Pill, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-navy-900 text-slate-400 border-t border-navy-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Pill className="w-5 h-5 text-teal-400" />
              Medicine Availability Finder
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Centralized healthcare technology platform connecting patients with verified pharmacies and medical agencies for real-time stock location.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/search" className="hover:text-teal-400 transition-colors">Search Medicines</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Register Pharmacy</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Register Medical Agency</Link></li>
              <li><Link to="/login" className="hover:text-teal-400 transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          {/* Verification & Compliance */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Verification & Compliance</h4>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>All registered vendors undergo administrative verification before inventory listing.</span>
            </div>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">System Information</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400" />
                support@medicinefinder.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                Citywide Vendor Network
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 text-xs text-center text-slate-500">
          <p>© {new Date().getFullYear()} Medicine Availability Finder. Educational & Operational Healthcare Platform.</p>
        </div>
      </div>
    </footer>
  );
};
