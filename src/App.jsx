import React, { useState, useEffect, useRef } from 'react';
import { chatManager } from './utils/ChatManager';
import { Send, Plus, Copy, MessageSquare, Edit2, Check, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#313338] text-[#dbdee1] p-4 text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="mb-4 text-[#949ba4]">The application crashed. Please check the console for details.</p>
          <pre className="bg-[#1e1f22] p-4 rounded text-left text-xs font-mono overflow-auto max-w-full border border-red-500/20 text-red-400">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-[#5865F2] text-white px-6 py-2 rounded hover:bg-[#4752C4] transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Username state
  const [username, setUsername] = useState('User');
  const [isEditingName, setIsEditingName] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("App mounted, initializing ChatManager...");
    try {
      chatManager.initialize((id) => {
        console.log("ChatManager initialized with ID:", id);
        setMyId(id);
      });
      chatManager.onStatusChange((s) => {
        console.log("ChatManager status changed:", s);
        setStatus(s);
      });
      chatManager.onMessage((data) => {
        console.log("Received message:", data);
        setMessages((prev) => [...prev, { ...data, isMe: false }]);
      });
    } catch (err) {
      console.error("Failed to initialize ChatManager:", err);
    }

    // Load username from local storage if available
    try {
      const savedName = localStorage.getItem('discord-lite-username');
      if (savedName) setUsername(savedName);
    } catch (e) {
      console.warn("Could not access localStorage:", e);
    }

    return () => {
      console.log("App unmounting, destroying ChatManager...");
      chatManager.destroy();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConnect = (e) => {
    e.preventDefault();
    if (remoteId) {
      console.log("Connecting to:", remoteId);
      chatManager.connect(remoteId);
      setIsConnecting(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const msgData = {
      text: inputMsg,
      timestamp: new Date().toISOString(),
      sender: myId,
      senderName: username // Send the username!
    };
    console.log("Sending message:", msgData);
    chatManager.sendMessage(msgData);
    setMessages((prev) => [...prev, { ...msgData, isMe: true }]);
    setInputMsg('');
  };

  const saveUsername = () => {
    setIsEditingName(false);
    try {
      localStorage.setItem('discord-lite-username', username);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  };

  // Helper to get a consistent color from an ID string
  const getColor = (id) => {
    if (!id) return '#5865F2';
    const colors = ['#5865F2', '#23A559', '#DA373C', '#F0B232', '#EB459E'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-screen bg-[#313338] text-[#dbdee1] font-sans overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-[#26272d] flex items-center justify-between px-4 bg-[#2b2d31] shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold">
            DL
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Discord Lite</h1>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Username Editor */}
          <div className="flex items-center gap-2 bg-[#1e1f22] px-3 py-1.5 rounded">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-white text-sm w-24 outline-none border-b border-[#5865F2]"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
                />
                <Check size={14} className="text-green-500 cursor-pointer" onClick={saveUsername} />
              </div>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => setIsEditingName(true)}>
                <span className="text-sm font-medium">{username}</span>
                <Edit2 size={12} className="text-[#949ba4]" />
              </div>
            )}
          </div>

          <div
            className="hidden md:flex items-center gap-2 bg-[#1e1f22] px-3 py-1.5 rounded cursor-pointer hover:bg-[#35373c] transition-colors"
            onClick={() => navigator.clipboard.writeText(myId)}
          >
            <span className="text-xs font-mono text-[#949ba4]">ID: {myId.slice(0, 8)}...</span>
            <Copy size={14} className="text-[#dbdee1]" />
          </div>
          <button
            onClick={() => setIsConnecting(!isConnecting)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${isConnecting ? 'bg-[#35373c] text-white' : 'bg-[#23a559] text-white hover:bg-[#1f8b4c]'}`}
          >
            {status === 'connected' ? 'Connected' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Connection Panel */}
      {isConnecting && (
        <div className="bg-[#2b2d31] p-4 border-b border-[#1f2023]">
          <form onSubmit={handleConnect} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              placeholder="Enter Friend's ID"
              className="flex-1 bg-[#1e1f22] text-[#dbdee1] px-3 py-2 rounded border border-[#1f2023] focus:border-[#5865F2]"
            />
            <button type="submit" className="bg-[#5865F2] text-white px-4 py-2 rounded hover:bg-[#4752C4]">
              Join
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-[#949ba4] md:hidden">
            Your ID: <span className="font-mono select-all text-[#dbdee1]">{myId}</span>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#949ba4] opacity-50">
            <MessageSquare size={48} className="mb-4" />
            <p>No messages yet.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="flex gap-4 group hover:bg-[#2e3035] -mx-4 px-4 py-1">
              {/* CSS Avatar */}
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm mt-0.5"
                style={{ backgroundColor: getColor(msg.sender) }}
              >
                {/* Use first letter of username if available, else ID */}
                {(msg.senderName || msg.sender || '?').substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-white hover:underline cursor-pointer">
                    {msg.isMe ? username : (msg.senderName || 'Friend')}
                  </span>
                  <span className="text-[12px] text-[#949ba4]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#313338] flex-shrink-0">
        <div className="bg-[#383a40] rounded-lg px-4 py-2.5 flex items-center gap-3">
          <button className="text-[#b5bac1] hover:text-[#dbdee1]">
            <Plus size={24} className="bg-[#b5bac1] text-[#383a40] rounded-full p-0.5 hover:text-white transition-colors" />
          </button>
          <form onSubmit={handleSend} className="flex-1">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Message @${status === 'connected' ? 'Friend' : 'Nobody'}`}
              className="w-full bg-transparent text-[#dbdee1] placeholder-[#949ba4] focus:outline-none"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
