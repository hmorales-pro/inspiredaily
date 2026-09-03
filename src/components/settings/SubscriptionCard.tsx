import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, type Profile } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SubscriptionCardProps {
  profileData: Profile | null;
  isUpgrading: boolean;
  handleUpgrade: () => Promise<void>;
}

export const SubscriptionCard = ({ profileData, isUpgrading, handleUpgrade }: SubscriptionCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCanceling, setIsCanceling] = useState(false);

  const getOptimizationsLimit = () => {
    if (profileData?.subscription_type === 'premium') return Infinity;
    return 5;
  };

  const getRemainingOptimizations = () => {
    if (profileData?.subscription_type === 'premium') return 'Illimité';
    return profileData?.optimizations_count || 0;
  };

  const getNextResetDate = () => {
    if (!profileData?.optimizations_reset_date) return null;
    return new Date(profileData.optimizations_reset_date).toLocaleDateString('fr-FR');
  };

  const getProgressValue = () => {
    const limit = getOptimizationsLimit();
    if (limit === Infinity) return 100;
    const count = profileData?.optimizations_count || 0;
    const maxOptimizations = 5;
    return Math.max(0, Math.min(100, (count / maxOptimizations) * 100));
  };

  const handleCancel = async () => {
    try {
      setIsCanceling(true);
      const response = await supabase.functions.invoke('cancel-subscription');
      
      if (response.error) throw response.error;
      
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: "Succès",
        description: "Votre abonnement a été annulé avec succès.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'annulation de l'abonnement.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnement</CardTitle>
        <CardDescription>
          Gérez votre abonnement et vos optimisations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Type d&apos;abonnement</p>
          <p className="text-2xl font-bold capitalize">
            {profileData?.subscription_type || 'Gratuit'}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Optimisations restantes</p>
          <Progress 
            value={getProgressValue()}
            className="mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {getRemainingOptimizations()} optimisation{getRemainingOptimizations() !== 1 ? 's' : ''} restante{getRemainingOptimizations() !== 1 ? 's' : ''}
            {getNextResetDate() && ` (Réinitialisation le ${getNextResetDate()})`}
          </p>
        </div>

        {profileData?.subscription_type === 'free' ? (
          <Button 
            onClick={handleUpgrade} 
            className="w-full" 
            disabled={isUpgrading}
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection vers le paiement...
              </>
            ) : (
              "Passer à l'abonnement Premium (5€/mois)"
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleCancel} 
            variant="destructive"
            className="w-full" 
            disabled={isCanceling}
          >
            {isCanceling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Annulation en cours...
              </>
            ) : (
              "Annuler mon abonnement Premium"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};