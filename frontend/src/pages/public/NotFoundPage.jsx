import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <FileQuestion className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-navy-900">404 - Page Not Found</h1>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          The requested medicine finder page or portal route does not exist.
        </p>
        <Link to="/">
          <Button variant="primary">Return to Homepage</Button>
        </Link>
      </div>
    </div>
  );
};
