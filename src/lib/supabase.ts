import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = 'https://hpyvlzstxtdrqolmrlgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweXZsenN0eHRkcnFvbG1ybGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMjc3NjEsImV4cCI6MjA0ODcwMzc2MX0.2COQ2dIHh7HhMnNDJnplarmMaZ9wGjnPvnRN8kSDHyk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface Response {
  id?: number;
  question: string;
  response: string;
  created_at?: string;
  is_optimized: boolean;
  optimized_response?: string;
  user_id?: string;
}

export const saveResponse = async (response: Omit<Response, 'id' | 'created_at'>) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User must be logged in to save responses');

  const { data, error } = await supabase
    .from('responses')
    .insert({
      ...response,
      user_id: session.user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateResponse = async (id: number, response: Partial<Response>) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User must be logged in to update responses');

  const { data, error } = await supabase
    .from('responses')
    .update(response)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getResponses = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User must be logged in to get responses');

  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};