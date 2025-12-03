import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key for Admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase Environment Variables");
}

// IMPORTANT: persistSession false to avoid context leaking
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Verify User Token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;
    console.log(`[DELETE ACCOUNT] Starting deletion sequence for user: ${userId}`);

    // 2. Delete Public Data First (Manual Cascade)
    // We execute sequentially to respect potential foreign key constraints
    
    // A. Delete Generations
    const { error: genError } = await supabaseAdmin
        .from('generations')
        .delete()
        .eq('profile_id', userId);
    
    if (genError) console.error("Error deleting generations:", genError);

    // B. Delete Credits
    const { error: creditError } = await supabaseAdmin
        .from('user_credits')
        .delete()
        .eq('profile_id', userId);

    if (creditError) console.error("Error deleting credits:", creditError);

    // C. Delete Profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (profileError) console.error("Error deleting profile:", profileError);

    // 3. Delete Auth User (The Critical Step)
    // This prevents future logins and is the strict requirement.
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Failed to delete auth user:", deleteUserError);
      return res.status(500).json({ error: 'Falha crítica ao excluir usuário de autenticação.' });
    }

    return res.status(200).json({ success: true, message: 'Conta excluída permanentemente.' });

  } catch (err: any) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}