import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlusCircle, MessageSquare, LogOut, Search, Filter, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets/', {
          params: {
              search: search || undefined,
              status: statusFilter || undefined
          }
      });
      setTickets(res.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets/', { title, description, priority, category });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert('Failed to submit ticket');
    }
  };
  
  const getStatusColor = (status) => {
      switch(status) {
          case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
          case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-gray-100 text-gray-800';
      }
  };
  
  const getPriorityColor = (prio) => {
      switch(prio) {
          case 'critical': return 'text-red-600 bg-red-50';
          case 'high': return 'text-orange-600 bg-orange-50';
          case 'medium': return 'text-blue-600 bg-blue-50';
          default: return 'text-gray-600 bg-gray-50';
      }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MessageSquare className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">SupportHub</h1>
        </div>
        <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 font-medium">{user?.name}</span>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition flex items-center gap-1.5 font-medium bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-red-50">
                <LogOut size={16}/> Logout
            </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Support Tickets</h2>
                <p className="text-gray-500 mt-1">Manage and track your inquiries with our AI-powered team.</p>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-gray-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-gray-200 hover:shadow-blue-500/30 flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
            >
                <PlusCircle size={18} /> New Ticket
            </button>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search titles or descriptions..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-700 transition"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-700 appearance-none cursor-pointer transition"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
            </div>
        </div>

        {loading ? (
             <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
             </div>
        ) : tickets.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex justify-center items-center mb-5">
                    <MessageSquare className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-500 max-w-sm">You haven't submitted any tickets yet, or none match your search criteria.</p>
                <button onClick={() => setShowModal(true)} className="mt-6 text-blue-600 font-medium hover:underline">Submit a new request &rarr;</button>
            </div>
        ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {tickets.map(ticket => (
                    <div 
                        key={ticket.id} 
                        onClick={() => window.location.href = `/ticket/${ticket.id}`} 
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 cursor-pointer group flex flex-col h-full relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-blue-400 group-hover:to-indigo-500 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <Clock size={12} />
                                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2 text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{ticket.title}</h4>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow">{ticket.description}</p>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                             <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
                                    <AlertCircle size={10} />
                                    {ticket.priority.toUpperCase()}
                                </span>
                             </div>
                             {ticket.category && (
                                 <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                     {ticket.category}
                                 </span>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* Advanced Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">Create New Ticket</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={createTicket}>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Title</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition text-gray-800" 
                            value={title} onChange={e => setTitle(e.target.value)} required 
                            placeholder="Brief summary of issue"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category (Optional)</label>
                            <input 
                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition text-gray-800 text-sm" 
                                value={category} onChange={e => setCategory(e.target.value)}
                                placeholder="e.g. Billing, Tech"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition text-gray-800 text-sm appearance-none" 
                                value={priority} onChange={e => setPriority(e.target.value)} required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition text-gray-800 h-32 resize-none leading-relaxed" 
                            value={description} onChange={e => setDescription(e.target.value)} required
                            placeholder="Please describe the issue in detail..."
                        />
                        <p className="text-xs text-gray-400 mt-2 font-medium">💡 Our AI will automatically prioritize your ticket based on your description.</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:bg-gray-800 transition-all">Submit Ticket</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
