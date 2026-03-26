import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-full mb-4 shadow text-white">
                <Shield size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">AI Service Cloud</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-medium border border-red-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Email address</label>
            <input 
              type="email" 
              className="w-full border-gray-300 border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="agent@company.com"
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
            <input 
              type="password" 
              className="w-full border-gray-300 border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow disabled:opacity-70 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold transition">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
