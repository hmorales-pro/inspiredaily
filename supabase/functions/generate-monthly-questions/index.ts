import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { OpenAI } from 'https://esm.sh/openai@4.26.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting question generation process...');
    
    // Get the current date and calculate first day of current and next month
    const today = new Date();
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Get existing questions for the period
    const { data: existingQuestions } = await supabase
      .from('daily_questions')
      .select('display_date')
      .gte('display_date', firstDayCurrentMonth.toISOString())
      .lt('display_date', new Date(firstDayNextMonth.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString())
      .order('display_date');

    // Create a Set of dates that already have questions
    const existingDates = new Set(existingQuestions?.map(q => q.display_date) || []);

    // Calculate missing dates for current and next month
    const missingDates = [];
    const currentDate = new Date(firstDayCurrentMonth);
    const endDate = new Date(firstDayNextMonth.getTime() + 31 * 24 * 60 * 60 * 1000); // End of next month

    while (currentDate < endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (!existingDates.has(dateString)) {
        missingDates.push(dateString);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Found ${missingDates.length} missing dates`);

    if (missingDates.length === 0) {
      console.log('No missing questions to generate');
      return new Response(
        JSON.stringify({ message: 'No missing questions to generate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate questions for missing dates
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en développement personnel et professionnel. Génère des questions de réflexion profondes et pertinentes pour aider les professionnels à progresser.'
        },
        {
          role: 'user',
          content: `Génère ${missingDates.length} questions uniques en français pour l'introspection quotidienne. Format: une question par ligne, sans numérotation ni ponctuation au début. Les questions doivent être variées et couvrir différents aspects du développement professionnel.`
        }
      ]
    });

    const questions = completion.choices[0].message.content!.split('\n')
      .filter(q => q.trim().length > 0)
      .map((question, index) => ({
        question: question.trim(),
        display_date: missingDates[index]
      }));

    console.log(`Generated ${questions.length} new questions`);

    // Insert new questions
    const { error } = await supabase
      .from('daily_questions')
      .insert(questions);

    if (error) throw error;

    console.log('Successfully inserted new questions');

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsGenerated: questions.length,
        dates: missingDates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});