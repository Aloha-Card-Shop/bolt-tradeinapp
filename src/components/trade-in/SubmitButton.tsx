
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  label: string;
  loadingLabel?: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  onSubmit,
  isSubmitting,
  isDisabled,
  label,
  loadingLabel = 'Submitting...'
}) => {
  return (
    <button
      onClick={onSubmit}
      disabled={isSubmitting || isDisabled}
      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
};

export default SubmitButton;
