import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, Bot, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const TicketChat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchTicketAndMessages();
        
        // Initialize Socket.io connection
        socketRef.current = io('http://localhost:5000');
        
        const token = localStorage.getItem('token');
        socketRef.current.emit('join_ticket', { ticket_id: id, token });
        
        socketRef.current.on('new_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });
        
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        // Only fetch suggestion if agent/admin and the last message isn't theirs
        if (user?.role !== 'customer' && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.sender_id !== user.id) {
                fetchSuggestion();
            } else {
                setAiSuggestion('');
            }
        }
    }, [messages]);

    const fetchTicketAndMessages = async () => {
        try {
            const ticketRes = await api.get(`/tickets/${id}`);
            setTicket(ticketRes.data);
            const messagesRes = await api.get(`/chat/${id}/messages`);
            setMessages(messagesRes.data);
        } catch (err) {
            console.error('Failed to fetch ticket:', err);
            // Optionally redirect back if 404
        }
    };

    const fetchSuggestion = async () => {
        setIsTyping(true);
        try {
            const res = await api.get(`/chat/${id}/suggest`);
            setAiSuggestion(res.data.suggestion);
        } catch (err) {
            console.error(err);
        } finally {
            setIsTyping(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        const token = localStorage.getItem('token');
        
        // Emit via socket
        socketRef.current.emit('send_message', {
            ticket_id: id,
            token,
            message: newMessage
        });
        
        setNewMessage('');
        setAiSuggestion('');
    };

    const useSuggestion = () => {
        setNewMessage(aiSuggestion);
    };
    
    const getStatusDetails = (status) => {
        switch(status) {
            case 'open': return { color: 'text-yellow-600 bg-yellow-100', icon: <Clock size={14}/> };
            case 'in-progress': return { color: 'text-blue-600 bg-blue-100', icon: <AlertCircle size={14}/> };
            case 'resolved': return { color: 'text-green-600 bg-green-100', icon: <CheckCircle2 size={14}/> };
            case 'closed': return { color: 'text-gray-600 bg-gray-200', icon: <CheckCircle2 size={14}/> };
            default: return { color: 'text-gray-600 bg-gray-100', icon: <Clock size={14}/> };
        }
    };

    if (!ticket) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const statDetails = getStatusDetails(ticket.status);

    return (
        <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-blue-100 overflow-hidden">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-800 transition p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">#{ticket.id} - {ticket.title}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${statDetails.color}`}>
                                {statDetails.icon} {ticket.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-3">
                            <span>Started {formatDistanceToNow(new Date(ticket.created_at))} ago</span>
                            {ticket.category && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{ticket.category}</span>}
                        </p>
                    </div>
                </div>
                
                {user?.role === 'admin' && (
                    <div className="text-right">
                         <span className="text-xs font-semibold text-gray-400 block mb-1">SLA DEADLINE</span>
                         <span className={`text-sm font-bold ${new Date(ticket.sla_deadline) < new Date() ? 'text-red-500' : 'text-gray-700'}`}>
                             {ticket.sla_deadline ? format(new Date(ticket.sla_deadline), 'PP p') : 'None'}
                         </span>
                    </div>
                )}
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 flex justify-center w-full overflow-hidden">
                <div className="w-full max-w-4xl flex flex-col h-full shadow-2xl shadow-gray-200/50 bg-white">
                    {/* Ticket Description Context */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-blue-100 shrink-0">
                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Original Request</h3>
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">{ticket.description}</p>
                        {user?.role !== 'customer' && ticket.ai_priority_score && (
                            <div className="mt-3 flex gap-2 items-center">
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">AI SCORE: {ticket.ai_priority_score}</span>
                            </div>
                        )}
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50">
                                <MessageSquare size={40} className="text-gray-400" />
                                <p className="text-gray-500 font-medium text-sm">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((m) => {
                                const isMe = m.sender_id === user.id;
                                const isAI = m.is_ai || m.sender_id === null;
                                
                                return (
                                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            {!isMe && (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600'}`}>
                                                    {isAI ? <Bot size={16} /> : <span className="text-xs font-bold">{m.sender_name?.charAt(0) || 'A'}</span>}
                                                </div>
                                            )}
                                            
                                            {/* Bubble */}
                                            <div className="flex flex-col">
                                                {!isMe && <span className="text-[10px] text-gray-400 ml-1 mb-1 font-semibold">{m.sender_name || 'System'}</span>}
                                                <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                                    isMe ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm' : 
                                                    isAI ? 'bg-purple-50 border border-purple-100 text-purple-900 rounded-bl-sm' :
                                                    'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                                }`}>
                                                    <p>{m.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] text-gray-400 mt-1.5 font-medium ${isMe ? 'mr-10' : 'ml-10'}`}>
                                            {format(new Date(m.timestamp), 'h:mm a')}
                                            {m.sentiment_score && user.role !== 'customer' && <span className="ml-2">({m.sentiment_score > 0 ? 'Positive' : m.sentiment_score < 0 ? 'Negative' : 'Neutral'})</span>}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Agent Assist AI Block */}
                    {user?.role !== 'customer' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <div className="shrink-0 p-4 bg-gray-50 border-t border-gray-200">
                             {isTyping ? (
                                 <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold animate-pulse">
                                     <Bot size={14} /> AI is crafting a suggestion...
                                 </div>
                             ) : aiSuggestion ? (
                                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm transition-all hover:bg-indigo-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                                            <Bot size={14} /> AI AGENT ASSIST
                                        </div>
                                        <button onClick={useSuggestion} className="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm">
                                            Insert Reply
                                        </button>
                                    </div>
                                    <p className="text-sm text-indigo-900 leading-relaxed italic border-l-2 border-indigo-300 pl-3">"{aiSuggestion}"</p>
                                </div>
                             ) : null}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="shrink-0 p-4 bg-white border-t border-gray-100">
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                            <form onSubmit={sendMessage} className="flex gap-3">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner text-gray-700 transition font-medium"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()} 
                                    className="bg-gray-900 text-white px-6 rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-600 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-gray-900 disabled:hover:shadow-lg"
                                >
                                    <Send size={20} className={newMessage.trim() ? "translate-x-0" : "-translate-x-1"} />
                                </button>
                            </form>
                        ) : (
                            <div className="bg-gray-50 text-gray-500 text-center p-4 rounded-xl font-medium border border-gray-100 flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} className="text-green-500" />
                                This ticket has been resolved and is closed to new messages.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TicketChat;
