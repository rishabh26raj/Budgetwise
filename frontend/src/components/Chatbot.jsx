import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS = [
    { q: 'What is budget?', a: 'A budget is a plan to manage your income and expenses over a period of time.' },
    { q: 'How to add expense?', a: 'Go to the Expenses page and click the "Add Expense" button.' },
    { q: 'How to view reports?', a: 'Navigate to the Reports page to see visual analytics of your spending.' },
    { q: 'Is my data safe?', a: 'Yes, your data is stored securely and only accessible by you.' },
];

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: 'Hi! I am XepoL, your AI assistant. How can I help you?', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simple bot logic
        setTimeout(() => {
            const lowerInput = input.toLowerCase();
            const match = QUESTIONS.find(q => lowerInput.includes(q.q.toLowerCase().replace('?', '')));

            let botResponse = 'I am not sure about that. Try asking one of the suggested questions.';
            if (match) botResponse = match.a;
            else if (lowerInput.includes('hello') || lowerInput.includes('hi')) botResponse = 'Hello! How can I assist you today?';

            setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
        }, 500);
    };

    const handleQuestionClick = (q) => {
        const userMsg = { text: q, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            const match = QUESTIONS.find(item => item.q === q);
            if (match) {
                setMessages(prev => [...prev, { text: match.a, sender: 'bot' }]);
            }
        }, 500);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all z-50 ${isOpen ? 'hidden' : 'block'}`}
            >
                <MessageCircle size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[500px]"
                    >
                        <div className="bg-primary p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    🤖
                                </div>
                                <span className="font-bold">XepoL Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'user'
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />

                            {messages.length < 3 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {QUESTIONS.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuestionClick(q.q)}
                                            className="text-xs bg-white border border-primary/20 text-primary px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors"
                                        >
                                            {q.q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-50 border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;
