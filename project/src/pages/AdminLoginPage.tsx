import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export function AdminLoginPage() {
  const { adminSignIn } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await adminSignIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4">
      <div className="card p-8 max-w-md w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Admin Portal</h1>
            <p className="text-sm text-stone-500">Restricted access — admins only</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11"
                placeholder="admin@pizzahub.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11"
                placeholder="Enter admin password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-secondary w-full flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In as Admin
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Not an admin?{' '}
          <button onClick={() => navigate('/login')} className="text-orange-600 font-semibold hover:underline">
            User Login
          </button>
        </p>
      </div>
    </div>
  );
}
