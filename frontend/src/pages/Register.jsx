import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <div className="bg-green-600 p-3 rounded-full mb-4 shadow text-white">
                <UserPlus size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-medium border border-red-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Full Name</label>
            <input 
              type="text" 
              className="w-full border-gray-300 border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition" 
              value={name} onChange={e => setName(e.target.value)} required 
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Email address</label>
            <input 
              type="email" 
              className="w-full border-gray-300 border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" 
              value={email} onChange={e => setEmail(e.target.value)} required 
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
            <input 
              type="password" 
              className="w-full border-gray-300 border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" 
              value={password} onChange={e => setPassword(e.target.value)} required 
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Role</label>
            <select 
              className="w-full border-gray-300 border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white" 
              value={role} onChange={e => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="agent">Support Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button 
            type="submit" disabled={loading}
            className="w-full bg-green-600 text-white p-2.5 rounded-lg hover:bg-green-700 transition font-medium shadow mt-4"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-green-600 hover:text-green-800 font-semibold transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
