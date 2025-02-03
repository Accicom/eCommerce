import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Estado para el control de intentos
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const saved = localStorage.getItem('loginAttempts');
    return saved ? JSON.parse(saved) : { count: 0, timestamp: null };
  });

  useEffect(() => {
    localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
  }, [loginAttempts]);

  const isAccountLocked = () => {
    if (loginAttempts.count >= MAX_LOGIN_ATTEMPTS && loginAttempts.timestamp) {
      const timeElapsed = Date.now() - loginAttempts.timestamp;
      return timeElapsed < LOCKOUT_TIME;
    }
    return false;
  };

  const getRemainingLockTime = () => {
    if (!loginAttempts.timestamp) return 0;
    const timeElapsed = Date.now() - loginAttempts.timestamp;
    return Math.max(0, Math.ceil((LOCKOUT_TIME - timeElapsed) / 1000 / 60));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAccountLocked()) {
      setError(`Demasiados intentos fallidos. Por favor, espere ${getRemainingLockTime()} minutos.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Resetear intentos después de un inicio de sesión exitoso
      setLoginAttempts({ count: 0, timestamp: null });
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin/dashboard');
    } catch (error: any) {
      // Incrementar contador de intentos fallidos
      const newCount = loginAttempts.count + 1;
      setLoginAttempts({
        count: newCount,
        timestamp: newCount >= MAX_LOGIN_ATTEMPTS ? Date.now() : loginAttempts.timestamp
      });

      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Panel de Administración
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading || isAccountLocked()}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading || isAccountLocked()}
              />
            </div>

            <button
              type="submit"
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg 
                transition-colors font-semibold flex items-center justify-center
                ${isLoading || isAccountLocked() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'}`}
              disabled={isLoading || isAccountLocked()}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}