import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../providers/AuthProvider';

const AdminLinkButton: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // 1. If auth is still loading, wait.
      if (loading) return;

      // 2. If no user, definitely not admin.
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        // 3. Query 'profiles' table for authorization
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data.is_admin);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  // If loading, checking, or not admin -> render nothing (null)
  if (loading || checking || !isAdmin) {
    return null;
  }

  // Render the Admin Link
  return (
    <Link to="/admin/dashboard">
      <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 gap-2 font-semibold">
        <ShieldAlert className="h-4 w-4" />
        Painel Admin
      </Button>
    </Link>
  );
};

export default AdminLinkButton;