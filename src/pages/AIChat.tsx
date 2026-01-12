import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, User, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getFullName } from '../utils/helpers';
import styles from './AIChat.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const currentUser = useStore((state) => state.currentUser);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${currentUser?.displayName || 'there'}! I'm your Family Tree AI assistant. I can help you with:\n\n• Finding relationships between family members\n• Suggesting missing information\n• Answering questions about your family tree\n• Providing genealogy tips\n\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for relationship questions
    if (lowerMessage.includes('how many') && lowerMessage.includes('member')) {
      return `Your family tree currently has ${persons.length} member${persons.length !== 1 ? 's' : ''}. ${
        persons.length === 0
          ? "You haven't added anyone yet. Would you like to start by adding yourself?"
          : `The members are: ${persons.map((p) => getFullName(p.firstName, p.lastName)).join(', ')}.`
      }`;
    }

    if (lowerMessage.includes('oldest') || lowerMessage.includes('eldest')) {
      const withBirthDates = persons.filter((p) => p.birthDate);
      if (withBirthDates.length === 0) {
        return "I don't have birth date information for any family members yet. Try adding birth dates to see who's the oldest!";
      }
      const oldest = withBirthDates.sort(
        (a, b) => new Date(a.birthDate!).getTime() - new Date(b.birthDate!).getTime()
      )[0];
      return `Based on the birth dates I have, ${getFullName(oldest.firstName, oldest.lastName)} appears to be the oldest family member, born on ${oldest.birthDate}.`;
    }

    if (lowerMessage.includes('youngest')) {
      const withBirthDates = persons.filter((p) => p.birthDate);
      if (withBirthDates.length === 0) {
        return "I don't have birth date information for any family members yet. Try adding birth dates to see who's the youngest!";
      }
      const youngest = withBirthDates.sort(
        (a, b) => new Date(b.birthDate!).getTime() - new Date(a.birthDate!).getTime()
      )[0];
      return `Based on the birth dates I have, ${getFullName(youngest.firstName, youngest.lastName)} appears to be the youngest family member, born on ${youngest.birthDate}.`;
    }

    if (lowerMessage.includes('missing') || lowerMessage.includes('incomplete')) {
      const incomplete = persons.filter(
        (p) => !p.birthDate || !p.birthPlace || p.parents.length === 0
      );
      if (incomplete.length === 0) {
        return 'Great news! All your family members have complete basic information.';
      }
      return `I found ${incomplete.length} member${incomplete.length !== 1 ? 's' : ''} with incomplete information:\n\n${incomplete
        .slice(0, 5)
        .map((p) => {
          const missing = [];
          if (!p.birthDate) missing.push('birth date');
          if (!p.birthPlace) missing.push('birthplace');
          if (p.parents.length === 0) missing.push('parents');
          return `• ${getFullName(p.firstName, p.lastName)}: missing ${missing.join(', ')}`;
        })
        .join('\n')}${incomplete.length > 5 ? `\n\n...and ${incomplete.length - 5} more.` : ''}`;
    }

    if (lowerMessage.includes('tip') || lowerMessage.includes('suggestion')) {
      const tips = [
        "Try to interview older family members while you can - they often have valuable stories and memories that aren't written down anywhere.",
        "Look for old photographs in family albums. The backs of photos sometimes have names and dates written on them.",
        "Consider creating a timeline of major family events to help visualize your family history.",
        "Don't forget to record not just dates and places, but also stories, occupations, and interesting facts about family members.",
        "Online genealogy databases and local archives can be great resources for finding birth, marriage, and death records.",
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you with several things:\n\n• **Family Statistics**: Ask me "how many members" or about the "oldest/youngest" person\n• **Data Quality**: Ask about "missing" or "incomplete" information\n• **Tips**: Ask for a genealogy "tip" or "suggestion"\n• **Navigation**: I can guide you to different parts of the app\n\nJust type your question and I'll do my best to help!`;
    }

    // Default responses
    const defaultResponses = [
      "That's an interesting question! While I'm a simple AI assistant, I can help you explore your family tree data. Try asking about your family members, missing information, or genealogy tips.",
      "I'd love to help with that! For complex genealogy questions, I recommend checking specialized resources. Meanwhile, I can help you with basic family tree information and suggestions.",
      "Great question! I'm here to help you make the most of your family tree. Feel free to ask about family statistics, data quality, or request genealogy tips.",
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateResponse(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.aiAvatar}>
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className={styles.title}>AI Assistant</h1>
            <span className={styles.status}>Online</span>
          </div>
        </div>
      </header>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.role]}`}
          >
            <div className={styles.messageAvatar}>
              {message.role === 'assistant' ? (
                <Sparkles size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className={styles.messageContent}>
              <p>{message.content}</p>
              <span className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageAvatar}>
              <Sparkles size={16} />
            </div>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <Loader size={16} className={styles.spinner} />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          placeholder="Ask me anything about your family tree..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.input}
          rows={1}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
