'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md p-8 bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              placeholder="admin@mail.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100/50 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
