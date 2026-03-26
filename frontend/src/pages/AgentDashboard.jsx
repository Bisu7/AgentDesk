import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, Inbox, CheckCircle, Clock, AlertTriangle, AlertCircle, BarChart2, MessageSquare, Zap } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned'); // assigned, unassigned, all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let url = '/tickets/';
      // If we are showing 'unassigned', we need admin/agent capable endpoint.
      // For now, we fetch all agent-assigned or all open.
      const res = await api.get(url, { params: { per_page: 50 } });
      let filtered = res.data.tickets;
      
      if (activeTab === 'assigned') {
          filtered = filtered.filter(t => t.agent_id === user.id && t.status !== 'closed');
      } else if (activeTab === 'unassigned') {
          // This requires admin route or modified ticket route. 
          // Assuming the api returns everything if agent hits /tickets/ if we changed it, wait.
          // Actually get_tickets() says: if role == 'agent': query = query.filter_by(agent_id=identity['id'])
          // This means agents CANNOT see unassigned tickets. 
          // That's fine, let's keep it 'assigned' only for this view to match backend constraints.
          filtered = filtered.filter(t => t.status !== 'closed');
      }
      
      setTickets(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (e, ticketId, newStatus) => {
    e.stopPropagation();
    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (prio) => {
      switch(prio) {
          case 'critical': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1"><AlertTriangle size={12}/> Critical</span>;
          case 'high': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">High</span>;
          case 'medium': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Medium</span>;
          default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Low</span>;
      }
  };

  return (
    <div className="h-screen bg-[#F3F4F6] flex font-sans overflow-hidden selection:bg-indigo-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="text-white" size={16} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Agent Console</h2>
            </div>
        </div>
        
        <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white shadow-inner border border-gray-700">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                     <p className="text-sm font-semibold text-white">{user?.name}</p>
                     <p className="text-[11px] text-indigo-400 font-medium">{user?.department || 'General Support'}</p>
                </div>
            </div>

            <nav className="space-y-2">
                <button 
                    onClick={() => setActiveTab('assigned')}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition font-medium text-sm ${activeTab === 'assigned' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
                >
                    <Inbox size={18} /> My Dashboard
                </button>
            </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-800">
             <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-gray-800 rounded-xl transition font-medium text-sm">
                <LogOut size={18} /> Logout
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-l-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-100 z-10">
        <header className="px-10 py-8 border-b border-gray-100 shrink-0 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Support Queue</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage and resolve your assigned customer inquiries efficiently.</p>
            </div>
            {user?.performance_score !== undefined && (
                <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 flex items-center gap-2">
                    <BarChart2 className="text-green-600" size={18} />
                    <span className="text-sm font-bold text-green-800">Perf Score: {user.performance_score}</span>
                </div>
            )}
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#FAFAFA]">
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-white border text-center border-gray-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center opacity-70">
                     <CheckCircle className="text-gray-300 mb-4" size={48} />
                     <h3 className="text-xl font-bold text-gray-500">Inbox Zero</h3>
                     <p className="text-gray-400 text-sm mt-2">You have no assigned tickets right now. Great job!</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider w-20 text-center">ID</th>
                                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Info</th>
                                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & SLA</th>
                                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right rounded-tr-2xl">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tickets.map(ticket => {
                                const isBreached = ticket.sla_deadline && isPast(new Date(ticket.sla_deadline));
                                return (
                                <tr key={ticket.id} onClick={() => window.location.href = `/ticket/${ticket.id}`} className="hover:bg-blue-50/50 transition cursor-pointer group">
                                    <td className="p-5 text-center">
                                        <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition">#{ticket.id}</span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-sm">{ticket.title}</h4>
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 flex items-center gap-3">
                                                <span className="flex items-center gap-1"><Clock size={12}/> {formatDistanceToNow(new Date(ticket.created_at))} ago</span>
                                                {ticket.category && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{ticket.category}</span>}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                 <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                                                    ticket.status === 'open' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    ticket.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            
                                            {ticket.status !== 'resolved' && ticket.sla_deadline && (
                                                <div className={`text-[10px] font-bold flex items-center gap-1 ${isBreached ? 'text-red-600' : 'text-orange-500'}`}>
                                                    {isBreached ? <AlertCircle size={12} /> : <Clock size={12} />}
                                                    {isBreached ? 'SLA BREACHED' : 'SLA DUE SOON'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); window.location.href=`/ticket/${ticket.id}` }}
                                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                                title="Open Chat"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            
                                            {ticket.status !== 'resolved' && (
                                                <button 
                                                    onClick={(e) => updateStatus(e, ticket.id, 'resolved')}
                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                                                    title="Mark Resolved"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
