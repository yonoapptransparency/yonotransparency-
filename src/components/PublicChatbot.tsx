import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Loader2, BotMessageSquare, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function PublicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I am the RummyApp Assistant. How can I help you navigate the directory today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenExternal = () => setIsOpen(true);
    window.addEventListener('open-public-chatbot', handleOpenExternal);
    return () => window.removeEventListener('open-public-chatbot', handleOpenExternal);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/public/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to connect to the assistant.');
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) throw new Error('No response body');

        let isFirstMessage = true;
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.text) {
                  setMessages(prev => {
                    if (isFirstMessage) {
                       isFirstMessage = false;
                       return [...prev, { role: 'assistant', content: parsed.text }];
                    } else {
                       const newMessages = [...prev];
                       const lastMessage = newMessages[newMessages.length - 1];
                       if (lastMessage.role === 'assistant') {
                          lastMessage.content += parsed.text;
                       }
                       return newMessages;
                    }
                  });
                }
              } catch (e) {
                console.error("Error parsing stream data", e, data);
              }
            }
          }
        }
      }

    } catch (err: any) {
      setError(err.message);
      // Remove the empty assistant message placeholder if there was an error and it's empty
      setMessages(prev => {
         const lastMessage = prev[prev.length - 1];
         if (lastMessage.role === 'assistant' && !lastMessage.content) {
             return prev.slice(0, -1);
         }
         return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 40, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-[90vw] max-w-[400px] h-[650px] max-h-[85vh] bg-white/40 dark:bg-neutral-900/50 backdrop-blur-3xl rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border border-white/60 dark:border-white/10 z-50 ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="bg-white/40 dark:bg-black/20 border-b border-white/40 dark:border-white/10 p-6 pb-5 flex items-center justify-between shrink-0 relative overflow-hidden backdrop-blur-2xl">
              {/* Decorative background shapes */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 dark:bg-fuchsia-500/30 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 dark:bg-indigo-500/30 blur-3xl rounded-full transform -translate-x-1/2 translate-y-1/2 pointer-events-none" />
              
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/90 backdrop-blur-md shadow-sm border border-white/50 text-indigo-600 rounded-full flex items-center justify-center relative">
                  <MessageCircle className="w-6 h-6 text-indigo-600 fill-white" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-neutral-800"></span>
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-[17px] bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-300 tracking-tight">AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Online & Ready to Help</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 hover:bg-white/80 dark:hover:bg-neutral-800/80 hover:shadow-sm rounded-full flex items-center justify-center transition-all text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 z-10 bg-black/5 dark:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-[13px] font-medium border-b border-red-100 dark:border-red-900/30 shrink-0 text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 pb-2 space-y-6 bg-transparent relative scroll-smooth">
              {messages.map((msg, idx) => (
                <motion.div 
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
                  key={idx} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm backdrop-blur-md ${msg.role === 'user' ? 'bg-gradient-to-tr from-indigo-500/80 to-purple-500/80 text-white' : 'bg-white/60 dark:bg-neutral-800/60 text-indigo-600 dark:text-indigo-400 border border-white/50 dark:border-neutral-700/50'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <MessageCircle className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-3.5 text-[14.5px] leading-[1.6] max-w-[80%] shadow-sm backdrop-blur-md ${msg.role === 'user' ? 'bg-indigo-600/80 dark:bg-indigo-500/80 text-white rounded-[20px] rounded-br-sm font-medium shadow-indigo-500/20 border border-indigo-400/30' : 'bg-white/60 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 border border-white/50 dark:border-white/10 rounded-[20px] rounded-bl-sm'}`}>
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="m-0 mb-3 last:mb-0 leading-[1.65]" {...props}/>,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5 last:mb-0" {...props}/>,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 last:mb-0" {...props}/>,
                        li: ({node, ...props}) => <li className="mb-1 pl-1" {...props}/>,
                        strong: ({node, ...props}) => <strong className="font-semibold text-neutral-900 dark:text-white" {...props}/>,
                        a: ({node, ...props}) => <a className="underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-500 font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props}/>,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 text-neutral-900 dark:text-white" {...props}/>,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-neutral-900 dark:text-white" {...props}/>,
                        h3: ({node, ...props}) => <h3 className="text-[15px] font-semibold mt-2 mb-1 text-neutral-800 dark:text-neutral-100" {...props}/>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 flex-row"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md text-indigo-600 dark:text-indigo-400 shadow-sm border border-white/50 dark:border-white/10">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="px-5 py-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md shadow-sm border border-white/50 dark:border-white/10 rounded-2xl rounded-bl-sm flex items-center gap-1.5 h-[46px]">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/40 dark:bg-black/20 backdrop-blur-2xl border-t border-white/40 dark:border-white/10 shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 bg-white/60 dark:bg-black/40 border border-white/50 dark:border-white/10 focus:bg-white/80 dark:focus:bg-black/60 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none disabled:opacity-50 text-neutral-900 dark:text-white transition-all shadow-inner placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                />
                <motion.button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-[52px] h-[52px] bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md border border-indigo-400/50 text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-neutral-400/50 dark:disabled:bg-neutral-800/50 disabled:border-transparent dark:disabled:text-neutral-500 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </motion.button>
              </form>
              <div className="text-center mt-3 mb-1">
                 <span className="text-[11px] text-neutral-400 font-medium select-none">AI responses may occasionally be inaccurate.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
