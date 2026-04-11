import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
    }}>
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-pink-500/10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Reset Password</h1>
          <p className="text-indigo-200/80 font-medium tracking-wide text-sm">Enter your email and we'll send a reset link</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-indigo-100" htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/25 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Send Reset Link
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-indigo-200/70">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-pink-400 hover:text-pink-300 transition-colors">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
