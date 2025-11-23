import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setCheckingAdmin(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      setCheckingAdmin(true);
      console.log('🔍 Checking admin status for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      console.log('📊 Admin check result:', { data, error, isAdmin: !!data });
      
      if (error) {
        console.error('❌ Error checking admin status:', error);
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }
      
      setIsAdmin(!!data);
      setCheckingAdmin(false);
      console.log('✅ Admin status set to:', !!data);
    } catch (error) {
      console.error('❌ Exception checking admin status:', error);
      setIsAdmin(false);
      setCheckingAdmin(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error (continuing anyway):', error);
    }
    
    // Limpa o estado local independentemente de erros
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    
    // Força limpeza do localStorage
    localStorage.removeItem('supabase.auth.token');
    
    // Pequeno delay para garantir que tudo foi limpo
    setTimeout(() => {
      navigate('/auth');
    }, 100);
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    checkingAdmin,
    signOut
  };
}
