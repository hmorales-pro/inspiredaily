import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit2, RefreshCw } from "lucide-react";
import { Profile } from '@/lib/supabase';

interface ResponseActionsProps {
  isOptimizing: boolean;
  profile: Profile | null;
  onEdit: () => void;
  onOptimize: () => void;
  showOptimize?: boolean;
}

export const ResponseActions = ({
  isOptimizing,
  profile,
  onEdit,
  onOptimize,
  showOptimize = true
}: ResponseActionsProps) => {
  return (
    <div className="space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
      >
        <Edit2 className="w-4 h-4 mr-2" />
        Éditer
      </Button>
      {showOptimize && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOptimize}
          disabled={isOptimizing || !profile || profile.optimizations_count === 0}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
          Optimiser
        </Button>
      )}
    </div>
  );
};