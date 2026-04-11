import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
    }}>
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-purple-500/10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-indigo-200/80 font-medium tracking-wide">Join us and start scraping</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-indigo-100" htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-indigo-100" htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-indigo-100" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-indigo-200/70">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
