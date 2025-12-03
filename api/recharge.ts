import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key for Admin privileges
// This allows us to write to tables that might be RLS-protected (like user_credits)
// and ensures we can manipulate balances without user interaction.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase Environment Variables in Server Function");
}

// IMPORTANT: Set persistSession to false to ensure this client always acts as the Service Role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Configuration
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
    // 2. Input Validation
    const { user_id, tokens_to_add } = req.body;

    if (!user_id || !tokens_to_add || typeof tokens_to_add !== 'number') {
      return res.status(400).json({ error: 'Invalid parameters. Required: user_id (string), tokens_to_add (number)' });
    }

    console.log(`[RECHARGE] Processing recharge for User: ${user_id}, Amount: ${tokens_to_add}`);

    // 3. Update User Credits (Atomic Increment)
    // IMPORTANT: Mapping 'user_id' from the request body to 'profile_id' column in the database
    // as per schema requirements.
    
    // We try to use RPC first. Note: The RPC itself must be updated to use profile_id in its SQL definition.
    const { error: updateError } = await supabase.rpc('increment_credits', {
      user_id: user_id, // Pass as arg (SQL func likely maps this arg to profile_id col)
      amount: tokens_to_add
    });

    if (updateError) {
      console.error("Error updating credits via RPC:", updateError);
      
      // Fallback: Read-Modify-Write directly
      // Explicitly using 'profile_id' for the column name
      const { data: currentData } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('profile_id', user_id) // Changed from user_id to profile_id
          .single();
          
      const currentBalance = currentData?.balance || 0;
      
      const { error: fallbackError } = await supabase
        .from('user_credits')
        .upsert({ 
            profile_id: user_id, // Key column
            balance: currentBalance + tokens_to_add 
        });

      if (fallbackError) {
         console.error("Fallback update failed:", fallbackError);
         return res.status(500).json({ error: 'Failed to update credit balance.' });
      }
    }

    // 4. Register Transaction Log
    const { error: logError } = await supabase.from('transactions').insert({
      user_id: user_id, // usually same as profile_id
      type: 'RECHARGE',
      credits_added: tokens_to_add,
      status: 'COMPLETED',
      created_at: new Date().toISOString()
    });

    if (logError) {
      // We log this but don't fail the request since the credits were already given.
      console.error("Failed to log transaction:", logError);
    }

    // 5. Success Response
    return res.status(200).json({
      success: true,
      message: 'Créditos adicionados com sucesso.',
      added: tokens_to_add
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}