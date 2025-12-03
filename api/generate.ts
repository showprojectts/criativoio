import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key for backend admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase Environment Variables in Server Function");
}

// IMPORTANT: Set persistSession to false to ensure this client always acts as the Service Role
// and doesn't try to inherit or persist any browser session, which can cause RLS errors.
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function callRealAIGenerator(prompt: string, model_id: string) {
  const IA_SERVICE_API_KEY = process.env.IA_SERVICE_API_KEY;
  if (!IA_SERVICE_API_KEY) {
      console.warn("Missing IA_SERVICE_API_KEY. Returning Mock response.");
      // Fallback Mock for development/demo
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return {
          job_id: `mock_job_${Date.now()}`,
          result_url: "https://criativoio.com/storage/mock-image.png"
      };
  }

  // Real API Call Implementation
  const response = await fetch('https://api.ia-service.com/generate', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IA_SERVICE_API_KEY}`
      },
      body: JSON.stringify({ prompt, model: model_id })
  });

  const data = await response.json();
  
  // Normalize response (adapt based on real provider)
  return {
      job_id: data.id, 
      result_url: data.image_url // might be null if pending
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
    }

    const { prompt, model_id, credits_cost } = req.body;
    
    if (!prompt || !model_id || !credits_cost) {
      return res.status(400).json({ error: 'Missing required fields (prompt, model_id, credits_cost)' });
    }

    const { error: transactionError } = await supabase.rpc('decrement_credits', {
      user_id: user.id,
      cost: Number(credits_cost)
    });

    if (transactionError) {
      console.error("Transaction Error:", transactionError);
      if (transactionError.message.includes('Insufficient credits')) {
        return res.status(403).json({ error: 'Créditos Insuficientes para esta operação.' });
      }
      return res.status(500).json({ error: 'Erro ao processar transação de créditos.' });
    }

    let aiResult;
    try {
      aiResult = await callRealAIGenerator(prompt, model_id);
    } catch (aiError) {
      return res.status(502).json({ error: 'Falha na geração da IA.' });
    }

    // Insert using profile_id to match schema
    const { error: dbError } = await supabase.from('generations').insert({
      profile_id: user.id, // Changed from user_id to profile_id
      prompt: prompt,
      model_id: model_id,
      credits_cost: credits_cost,
      result_url: aiResult.result_url || null,
      job_id: aiResult.job_id || null,
      status: aiResult.result_url ? 'completed' : 'pending'
    });

    if (dbError) {
      console.error("Failed to save history:", dbError);
    }

    if (!aiResult.result_url && aiResult.job_id) {
       return res.status(202).json({
          success: true,
          message: 'Geração iniciada (Assíncrona).',
          job_id: aiResult.job_id,
          status: 'pending'
       });
    }

    return res.status(200).json({
      success: true,
      message: 'Criativo gerado com sucesso!',
      result_url: aiResult.result_url,
      remaining_credits_hint: "updated"
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}