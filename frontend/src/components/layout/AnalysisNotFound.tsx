import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common/EmptyState';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export interface AnalysisNotFoundProps {
  id?: string;
  message?: string;
}

export const AnalysisNotFound: React.FC<AnalysisNotFoundProps> = ({
  id,
  message,
}) => {
  const navigate = useNavigate();

  return (
    <div className="py-16 flex items-center justify-center">
      <EmptyState
        icon={<AlertCircle className="w-8 h-8 text-amber-600" />}
        title="Analysis Not Found"
        description={
          message ||
          (id
            ? `The requested analysis ID "${id}" could not be found or is invalid.`
            : 'The requested analysis could not be found.')
        }
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
