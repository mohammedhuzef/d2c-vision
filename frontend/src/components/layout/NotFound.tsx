import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common/EmptyState';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-16 flex items-center justify-center">
      <EmptyState
        icon={<FileQuestion className="w-8 h-8 text-indigo-600" />}
        title="Page Not Found"
        description="The page or analysis resource you are looking for does not exist or has been moved."
        action={{
          label: 'Back to Dashboard',
          onClick: () => navigate('/'),
          icon: <ArrowLeft className="w-4 h-4" />,
        }}
        className="max-w-md w-full"
      />
    </div>
  );
};
