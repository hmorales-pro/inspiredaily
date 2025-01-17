import React, { useState } from 'react';
import QuestionCard from '@/components/QuestionCard';
import ResponseInput from '@/components/ResponseInput';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { saveResponse } from '@/lib/supabase';
import { optimizeResponse } from '@/lib/openai';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const [response, setResponse] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch today's question
  const { data: todayQuestion, isLoading } = useQuery({
    queryKey: ['todayQuestion'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const { data, error } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('display_date', today)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const handleSave = async () => {
    if (!todayQuestion) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder sans question du jour.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveResponse({
        question: todayQuestion.question,
        response: response,
        is_optimized: false
      });
      
      toast({
        title: "Réponse enregistrée",
        description: "Votre réponse a été sauvegardée avec succès.",
      });
      
      setResponse('');
      navigate('/history');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleOptimize = async () => {
    if (!todayQuestion) {
      toast({
        title: "Erreur",
        description: "Impossible d'optimiser sans question du jour.",
        variant: "destructive",
      });
      return;
    }

    if (profile?.optimizations_count === 0) {
      toast({
        title: "Limite atteinte",
        description: "Vous avez atteint votre limite d'optimisations pour ce mois. Passez à l'abonnement premium pour des optimisations illimitées.",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      const optimizedContent = await optimizeResponse(response);
      
      // Mise à jour du compteur d'optimisations
      if (profile && profile.subscription_type === 'free') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            optimizations_count: Math.max(0, (profile.optimizations_count || 0) - 1)
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
        
        // Invalider le cache pour forcer le rechargement du profil
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
      
      await saveResponse({
        question: todayQuestion.question,
        response: response,
        is_optimized: true,
        optimized_response: optimizedContent
      });
      
      toast({
        title: "Réponse optimisée",
        description: "Votre contenu a été optimisé et sauvegardé avec succès.",
      });
      
      setResponse('');
      navigate('/history');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'optimisation.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-light p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement de la question du jour...</p>
      </div>
    );
  }

  if (!todayQuestion) {
    return (
      <div className="min-h-screen bg-primary-light p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Aucune question disponible pour aujourd'hui.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light p-4 space-y-6">
      <div className="max-w-4xl mx-auto pt-8">
        <h1 className="text-2xl font-bold text-center text-primary-dark mb-8">
          Question du jour
        </h1>
        
        <div className="space-y-6">
          <QuestionCard 
            question={todayQuestion.question}
            date={new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          />
          
          <ResponseInput
            value={response}
            onChange={setResponse}
            onSave={handleSave}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;