import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { response } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAIApiKey) {
      console.error('OpenAI API key is missing from Edge Function configuration')
      throw new Error('Missing OpenAI API key in Edge Function configuration')
    }

    console.log('Calling OpenAI API to optimize response...')
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en communication sur les réseaux sociaux. Tu dois optimiser le message fourni pour le rendre plus engageant, tout en gardant son essence. Ajoute des hashtags pertinents à la fin.'
          },
          {
            role: 'user',
            content: response
          }
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      console.error('OpenAI API error:', errorData)
      
      // Gestion spécifique de l'erreur de quota
      if (errorData.error?.code === 'insufficient_quota') {
        return new Response(
          JSON.stringify({ 
            error: "Le service d'optimisation n'est pas disponible pour le moment. Veuillez réessayer plus tard." 
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
      
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`)
    }

    const data = await aiResponse.json()
    const optimizedContent = data.choices[0].message.content

    console.log('Successfully optimized response')
    return new Response(
      JSON.stringify({ optimizedContent }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in optimize-response function:', error)
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue lors de l'optimisation. Veuillez réessayer plus tard." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})