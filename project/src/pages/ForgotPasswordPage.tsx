import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Pizza, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-stone-50 to-amber-50 p-4">
      <div className="card p-8 max-w-md w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
            <Pizza className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Reset Password</h1>
            <p className="text-sm text-stone-500">We'll send you a reset link</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-3">Check Your Email</h2>
            <p className="text-stone-600 mb-6">
              We've sent a password reset link to <span className="font-semibold text-stone-900">{email}</span>.
              Follow the link in the email to reset your password.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-stone-500 mt-6">
          Remember your password?{' '}
          <button onClick={() => navigate('/login')} className="text-orange-600 font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
