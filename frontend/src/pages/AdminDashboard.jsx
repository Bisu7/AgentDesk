import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, BarChart3, Users, Ticket, AlertTriangle, Cpu, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState({ total_tickets: 0, open_tickets: 0, resolved_tickets: 0, escalated_tickets: 0, avg_resolution_time: '--' });
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, agentsRes, ticketsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/agents'),
        api.get('/tickets/', { params: { per_page: 50 } })
      ]);
      setMetrics(metricsRes.data);
      setAgents(agentsRes.data);
      setTickets(ticketsRes.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleAssign = async (ticketId, agentId) => {
    try {
      await api.post('/admin/assign-ticket', { ticket_id: ticketId, agent_id: agentId });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoRoute = async (ticketId) => {
      try {
          await api.post('/admin/auto-route', { ticket_id: ticketId });
          fetchData();
      } catch (err) {
          alert('Failed to auto-route ticket. Ensure there are active agents available.');
      }
  };
  
  // Mock chart data based on metrics
  const mockChartData = [
      { name: 'Mon', tickets: Math.max(0, metrics.total_tickets - 12), resolved: Math.max(0, metrics.resolved_tickets - 8) },
      { name: 'Tue', tickets: Math.max(0, metrics.total_tickets - 9), resolved: Math.max(0, metrics.resolved_tickets - 6) },
      { name: 'Wed', tickets: Math.max(0, metrics.total_tickets - 5), resolved: Math.max(0, metrics.resolved_tickets - 3) },
      { name: 'Thu', tickets: Math.max(0, metrics.total_tickets - 2), resolved: Math.max(0, metrics.resolved_tickets - 1) },
      { name: 'Fri', tickets: metrics.total_tickets, resolved: metrics.resolved_tickets },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-purple-100">
      <nav className="bg-white/90 border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 sticky top-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white" size={20} />
            </div>
            <div>
                 <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Admin Control Center</h1>
            </div>
        </div>
        <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest leading-none">System Admin</p>
                </div>
                 <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 border-2 border-white shadow-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-600 bg-gray-50 px-3 py-2 rounded-lg font-medium flex gap-2 transition hover:bg-red-50">
                <LogOut size={18} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
        </div>
      </nav>

      {loading ? (
             <div className="flex-1 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
             </div>
      ) : (
      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Ticket size={24} strokeWidth={2.5}/></div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">+12%</span>
                </div>
                <div className="relative z-10 mt-auto">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{metrics.total_tickets}</h3>
                    <p className="text-sm font-semibold text-gray-500 mt-1">Total Tickets</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 bg-orange-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-600"><Clock size={24} strokeWidth={2.5}/></div>
                </div>
                <div className="relative z-10 mt-auto">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{metrics.open_tickets}</h3>
                    <p className="text-sm font-semibold text-gray-500 mt-1">Open & In-Progress</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 bg-green-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="bg-green-100 p-3 rounded-2xl text-green-600"><CheckCircle size={24} strokeWidth={2.5}/></div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">89%</span>
                </div>
                <div className="relative z-10 mt-auto">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{metrics.resolved_tickets}</h3>
                    <p className="text-sm font-semibold text-gray-500 mt-1">Successfully Resolved</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-red-100 flex flex-col relative overflow-hidden group col-span-1 lg:col-span-2">
                 <div className="absolute -right-10 -bottom-10 bg-gradient-to-br from-red-50 to-orange-50 w-48 h-48 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                 <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600"><AlertTriangle size={24} strokeWidth={2.5}/></div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Resolution Time</p>
                        <p className="text-xl font-black text-gray-800">{metrics.avg_resolution_time}</p>
                    </div>
                </div>
                <div className="relative z-10 mt-auto flex justify-between items-end">
                    <div>
                        <h3 className="text-4xl font-black text-red-600 tracking-tight">{metrics.escalated_tickets}</h3>
                        <p className="text-sm font-semibold text-red-400 mt-1">Escalated / Breached Tickets</p>
                    </div>
                    <div className="h-10 flex items-center">
                        <TrendingUp className="text-red-400 opacity-50" size={32}/>
                    </div>
                </div>
            </div>
        </div>

        {/* Charts & Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                 <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><TrendingUp size={18}/> Volume Trend</h3>
                 <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Line type="monotone" name="Inbound Tickets" dataKey="tickets" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                            <Line type="monotone" name="Resolved" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
             </div>
             
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col">
                 <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Users size={18}/> Agent Performance</h3>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                     {agents.map(agent => (
                         <div key={agent.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                                      {agent.name.charAt(0)}
                                  </div>
                                  <div>
                                       <h4 className="font-bold text-sm text-gray-900">{agent.name}</h4>
                                       <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{agent.department || 'Support'}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="block text-xl font-bold text-gray-900">{agent.resolved_tickets}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">Resolved</span>
                              </div>
                         </div>
                     ))}
                     {agents.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No agents registered.</p>}
                 </div>
             </div>
        </div>

        {/* Master Ticket Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2"><Ticket size={20} className="text-purple-600"/> Ticket Dispatch Board</h2>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{tickets.length} Recent Tickets</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                            <th className="p-5 w-16 text-center">ID</th>
                            <th className="p-5">Details</th>
                            <th className="p-5">Status</th>
                            <th className="p-5">Current Agent</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tickets.map(t => (
                            <tr key={t.id} className="hover:bg-purple-50/30 transition group">
                                <td className="p-5 text-center font-bold text-gray-400 text-sm">#{t.id}</td>
                                <td className="p-5">
                                    <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{t.title}</h4>
                                    <p className="text-xs text-gray-500 font-medium flex gap-3">
                                        <span>Customer {t.user_id}</span>
                                        <span className={t.priority === 'critical' || t.priority === 'high' ? 'text-orange-500 font-bold' : ''}>
                                            PRIO: {t.priority.toUpperCase()}
                                        </span>
                                    </p>
                                </td>
                                <td className="p-5">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                        t.status === 'open' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        t.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        t.status === 'closed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                        'bg-green-50 text-green-700 border-green-200'
                                    }`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="p-5">
                                    {t.agent_id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex justify-center items-center text-[10px] font-bold">
                                                {agents.find(a => a.id === t.agent_id)?.name.charAt(0) || 'A'}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {agents.find(a => a.id === t.agent_id)?.name || `Agent #${t.agent_id}`}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">Unassigned</span>
                                    )}
                                </td>
                                <td className="p-5 flex items-center justify-end gap-3">
                                    {!t.agent_id && t.status === 'open' ? (
                                        <button 
                                            onClick={() => handleAutoRoute(t.id)}
                                            className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                        >
                                            <Cpu size={14}/> Smart Route
                                        </button>
                                    ) : (
                                        <select 
                                            className="border border-gray-200 bg-gray-50 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold text-gray-700 outline-none w-32 cursor-pointer transition"
                                            value={t.agent_id || ''}
                                            onChange={(e) => handleAssign(t.id, e.target.value)}
                                        >
                                            <option value="" disabled>Transfer...</option>
                                            {agents.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </main>
      )}
    </div>
  );
};

export default AdminDashboard;
