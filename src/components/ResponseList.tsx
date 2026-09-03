import React from 'react';
import { Response, Profile } from '@/lib/supabase';
import { ResponseCard } from './ResponseCard';

interface ResponseListProps {
  responses: Response[];
  editingId: number | null;
  editedResponse: string;
  isOptimizing: boolean;
  profile: Profile | null;
  onEdit: (response: Response) => void;
  onSave: (response: Response) => void;
  onOptimize: (response: Response) => void;
  setEditedResponse: (value: string) => void;
}

export const ResponseList = ({
  responses,
  editingId,
  editedResponse,
  isOptimizing,
  profile,
  onEdit,
  onSave,
  onOptimize,
  setEditedResponse
}: ResponseListProps) => {
  if (!responses?.length) {
    return (
      <p className="text-center text-muted-foreground">
        Aucune réponse enregistrée pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response: Response) => (
        <ResponseCard
          key={response.id}
          response={response}
          editingId={editingId}
          editedResponse={editedResponse}
          isOptimizing={isOptimizing}
          profile={profile}
          onEdit={onEdit}
          onSave={onSave}
          onOptimize={onOptimize}
          setEditedResponse={setEditedResponse}
        />
      ))}
    </div>
  );
};