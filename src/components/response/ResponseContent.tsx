import React from 'react';
import { ResponseActions } from './ResponseActions';
import { Profile } from '@/lib/supabase';

interface ResponseContentProps {
  title: string;
  content: string;
  isOptimizing: boolean;
  profile: Profile | null;
  onEdit: () => void;
  onOptimize: () => void;
  isOriginalVersion?: boolean;
}

export const ResponseContent = ({
  title,
  content,
  isOptimizing,
  profile,
  onEdit,
  onOptimize,
  isOriginalVersion = true
}: ResponseContentProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{title}</h3>
        <ResponseActions
          isOptimizing={isOptimizing}
          profile={profile}
          onEdit={onEdit}
          onOptimize={onOptimize}
          showOptimize={isOriginalVersion}
        />
      </div>
      <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
};