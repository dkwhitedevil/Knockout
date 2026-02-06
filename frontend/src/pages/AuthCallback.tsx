import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/services/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if user is authenticated
        const user = await getCurrentUser();

        if (user) {
          // User is authenticated, redirect to lobby
          navigate('/lobby');
        } else {
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold uppercase mb-4">AUTHENTICATING...</h1>
        {error && (
          <div className="mt-4 p-4 bg-destructive/20 border border-destructive text-destructive rounded">
            <p>{error}</p>
            <p className="text-sm mt-2">Redirecting to login...</p>
          </div>
        )}
        {!error && (
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        )}
      </div>
    </div>
  );
}
