import React, { useState, useRef, useEffect } from 'react';
import { Assignment, ClassRoom, Student, Submission, Subject } from '../types';
import { MascotSiby } from './MascotSiby';

interface Message {
  id: string;
  sender: 'user' | 'siby';
  text: string;
  timestamp: string;
}

interface SibyAIChatWidgetProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  classes: ClassRoom[];
  subjects: Subject[];
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  initialQuery?: string;
  onOpenReminderModal: () => void;
  onNavigateToSeating: () => void;
}

export const SibyAIChatWidget: React.FC<SibyAIChatWidgetProps> = ({
  students,
  assignments,
  submissions,
  classes,
  subjects,
  isOpen: controlledIsOpen,
  onToggleOpen,
  initialQuery,
  onOpenReminderModal,
  onNavigateToSeating,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isWidgetOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (val: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'siby',
      text: 'โฮ่งๆ สวัสดีครับคุณครู! 🐺🐾 ผมคือ **ไซบี้ AI ผู้ช่วยอัจฉริยะ** พร้อมวิเคราะห์ข้อมูลผลการเรียน งานค้าง และแนวโน้มพฤติกรรมของนักเรียนในห้องเรียนให้คุณครูทันทีครับ ถามไซบี้ได้เลย!',
      timestamp: 'ตอนนี้',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isWidgetOpen) {
      scrollToBottom();
    }
  }, [messages, isWidgetOpen]);

  // Handle incoming initialQuery from Dashboard
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Suggested prompt questions
  const SUGGESTIONS = [
    'ใครกำลังเรียนตามไม่ทันในวิชาคณิตศาสตร์? (Who is falling behind in Math?)',
    'สรุปแนวโน้มผลการเรียนและพฤติกรรมล่าสุด (Summarize recent performance trends)',
    'ใครยังค้างงานมากที่สุดและควรตามอย่างไร?',
    'แนะนำการจับคู่บัดดี้ช่วยติวสำหรับกิจกรรมคาบหน้า',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `USR-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Send class data context to server endpoint
      const contextData = {
        students,
        assignments,
        submissions,
        classes,
        subjects,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          contextData,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `SIB-${Date.now()}`,
        sender: 'siby',
        text: data.reply || 'โฮ่ง! ไซบี้พร้อมแล้วครับ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('AI chat failed:', err);
      const fallbackMsg: Message = {
        id: `SIB-ERR-${Date.now()}`,
        sender: 'siby',
        text: 'โฮ่ง! ขออภัยครับคุณครู ไซบี้เกิดข้อขัดข้องในการเชื่อมต่อระบบวิเคราะห์ชั่วคราว กรุณาลองใหม่อีกครั้งนะครับ 🐾',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Slide-out / Pop-up Chat Window */}
      {isWidgetOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[580px] animate-fade-in">
          {/* Top Bar Header */}
          <div className="p-4 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <MascotSiby mood="detective" size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">ไซบี้ AI ผู้ช่วยครูอัจฉริยะ</h3>
                  <span className="text-[10px] bg-emerald-400/25 border border-emerald-300/40 text-emerald-200 px-1.5 py-0.2 rounded-full font-mono">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-sky-100">
                  วิเคราะห์ข้อมูลห้อง ม.3/1 (นักเรียน {students.length} คน · งาน {assignments.length} ชิ้น)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'siby',
                      text: 'โฮ่งๆ ล้างบทสนทนาเรียบร้อยครับ! ถามข้อมูลใหม่ได้เลยครับคุณครู 🐾',
                      timestamp: 'ตอนนี้',
                    },
                  ])
                }
                title="ล้างแชท"
                className="text-white/70 hover:text-white p-1.5 text-xs rounded-lg hover:bg-white/10"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1.5 text-sm rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'siby' && (
                  <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <MascotSiby mood="happy" size="sm" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs whitespace-pre-wrap'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                  <MascotSiby mood="detective" size="sm" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-500 font-medium ml-1">
                    ไซบี้กำลังอ่านข้อมูลและวิเคราะห์...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              💡 ตัวอย่างคำถาม:
            </span>
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item)}
                className="text-[11px] font-medium text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200/60 shrink-0"
              >
                {item.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {/* Quick Teacher Actions inside Assistant */}
          <div className="px-3 py-1.5 bg-sky-50/50 border-t border-sky-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">คำสั่งด่วน:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenReminderModal}
                className="text-sky-700 hover:underline font-semibold"
              >
                🔔 เปิดหน้าต่างทวงงาน
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={onNavigateToSeating}
                className="text-sky-700 hover:underline font-semibold"
              >
                🪑 ดูผังที่นั่ง
              </button>
            </div>
          </div>

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="พิมพ์คำถามถึงไซบี้ AI เช่น 'ใครเรียนคณิตไม่ทัน?'..."
              disabled={isLoading}
              className="flex-1 text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>ส่ง</span>
              <span>🐾</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
