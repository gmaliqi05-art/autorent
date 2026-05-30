import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Loader2, Car, ChevronRight, UserCog } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { findBestMatch, getSuggestedQuestions } from '../../lib/chatMatcher';
import { useStandaloneMode } from '../../lib/useStandaloneMode';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatResponse, ChatMessage as DbChatMessage } from '../../lib/types';

interface Message {
  id: string;
  type: 'bot' | 'user' | 'admin';
  text: string;
  timestamp: Date;
}

const BTN_SIZE = 56; // w-14 h-14
const POS_STORAGE_KEY = 'chat_btn_pos';
// Lartesia e bottom nav (64px) + buffer kur jemi ne app mode, qe butoni
// te mos mbuloje nav-in ne pozicionin default.
const APP_NAV_OFFSET = 84;

interface Pos { x: number; y: number }

function clampToViewport(x: number, y: number): Pos {
  if (typeof window === 'undefined') return { x, y };
  const maxX = window.innerWidth - BTN_SIZE - 8;
  const maxY = window.innerHeight - BTN_SIZE - 8;
  return {
    x: Math.min(Math.max(8, x), Math.max(8, maxX)),
    y: Math.min(Math.max(8, y), Math.max(8, maxY)),
  };
}

export default function ChatWidget() {
  const { isAppMode } = useStandaloneMode();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [suggestions, setSuggestions] = useState<ChatResponse[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Pozicioni i butonit fluturues — i ruajtur ne localStorage, draggable.
  const [pos, setPos] = useState<Pos | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Pozicioni default (poshte-djathtas), me offset mbi nav ne app mode.
  const defaultPos = useCallback((): Pos => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const bottomGap = (isAppMode ? APP_NAV_OFFSET : 24);
    return clampToViewport(
      window.innerWidth - BTN_SIZE - 24,
      window.innerHeight - BTN_SIZE - bottomGap,
    );
  }, [isAppMode]);

  useEffect(() => {
    // Rikuperoji pozicionin e ruajtur ose vendos default-in.
    try {
      const saved = localStorage.getItem(POS_STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved) as Pos;
        setPos(clampToViewport(p.x, p.y));
        return;
      }
    } catch { /* ignore */ }
    setPos(defaultPos());
  }, [defaultPos]);

  // Re-clamp kur ndryshon madhesia e dritares (rrotullim, resize).
  useEffect(() => {
    function onResize() {
      setPos(prev => prev ? clampToViewport(prev.x, prev.y) : prev);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    movedRef.current = false;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const nx = e.clientX - offsetRef.current.x;
    const ny = e.clientY - offsetRef.current.y;
    // Konsidero "moved" vetem mbi nje threshold te vogel (qe click te punoje).
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) movedRef.current = true;
    setPos(clampToViewport(nx, ny));
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (movedRef.current && pos) {
      try { localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
    } else {
      // Click i paster — hap chat-in.
      setOpen(true);
    }
  }

  useEffect(() => {
    if (open && !hasLoaded) {
      loadResponses();
    }
  }, [open, hasLoaded]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadResponses() {
    const { data } = await supabase.from('chat_responses').select('*').eq('is_active', true);
    const all = (data || []) as ChatResponse[];
    setResponses(all);
    setSuggestions(getSuggestedQuestions(all, 4));
    setHasLoaded(true);

    setMessages([{
      id: 'welcome',
      type: 'bot',
      text: 'Pershendetje! Jam asistenti virtual i RentaKar. Si mund t\'ju ndihmoj sot?',
      timestamp: new Date(),
    }]);

    // Per useri te loguar, krijo (ose riperdor) konvesacionin per persistencë + escalim.
    if (user) {
      await ensureConversation();
    }
  }

  async function ensureConversation(): Promise<string | null> {
    if (!user) return null;
    if (conversationId) return conversationId;

    // Riperdor konvesacionin me te fundit aktiv te perdoruesit, ose krijo nje te ri.
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id, is_escalated')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
      setIsEscalated(existing.is_escalated);
      await loadHistory(existing.id);
      return existing.id;
    }

    const { data: created, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, visitor_id: `user-${user.id.slice(0, 8)}`, status: 'active' })
      .select('id')
      .single();
    if (error || !created) return null;
    setConversationId(created.id);
    return created.id;
  }

  async function loadHistory(convId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(100);
    const rows = (data || []) as DbChatMessage[];
    if (rows.length === 0) return;
    setMessages(rows.map(r => ({
      id: r.id,
      type: r.sender_type === 'visitor' ? 'user' : r.sender_type === 'admin' ? 'admin' : 'bot',
      text: r.message,
      timestamp: new Date(r.created_at),
    })));
  }

  async function persistMessage(convId: string, senderType: 'visitor' | 'bot' | 'admin', text: string, matchedResponseId?: string | null) {
    await supabase.from('chat_messages').insert({
      conversation_id: convId,
      sender_type: senderType,
      message: text,
      matched_response_id: matchedResponseId || null,
    });
  }

  // Subscribe ne admin replies kur konvesacioni eshte i escalated.
  useEffect(() => {
    if (!conversationId || !isEscalated) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const ch = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const row = payload.new as DbChatMessage;
        if (row.sender_type !== 'admin') return;
        setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, {
          id: row.id,
          type: 'admin',
          text: row.message,
          timestamp: new Date(row.created_at),
        }]);
      })
      .subscribe();
    channelRef.current = ch;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, isEscalated]);

  async function handleEscalate() {
    if (!user || !conversationId || isEscalated) return;
    setEscalating(true);
    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_escalated: true })
      .eq('id', conversationId);
    if (!error) {
      setIsEscalated(true);
      const notice: Message = {
        id: `esc-${Date.now()}`,
        type: 'bot',
        text: 'Ju jeni lidhur me ekipin tone. Nje agjent do tju pergjigjet sa me shpejt.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, notice]);
      // Persistojme notification-in si bot message qe agjenti ta shohe.
      await persistMessage(conversationId, 'bot', '[Visitor escalated to live agent]');
    }
    setEscalating(false);
  }

  async function handleSend(text?: string) {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const convId = await ensureConversation();
    if (convId) {
      persistMessage(convId, 'visitor', msg).catch(() => { /* non-fatal */ });
    }

    // Ne mode live, agjenti pergjigjet vete — mos hap bot-in.
    if (isEscalated) {
      setLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));

    const match = findBestMatch(msg, responses);

    if (match) {
      const botMsg = { id: (Date.now() + 1).toString(), type: 'bot' as const, text: match.answer, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      if (convId) persistMessage(convId, 'bot', match.answer, match.id).catch(() => { /* non-fatal */ });
      supabase.from('chat_responses').update({ usage_count: (match.usage_count || 0) + 1 }).eq('id', match.id).then();
    } else {
      const fallback = user
        ? 'Nuk gjeta nje pergjigje te sakte. Mund ta lidhni me nje agjent njerezor permes butonit me poshte.'
        : 'Nuk gjeta nje pergjigje te sakte. Provoni te pyesni ndryshe ose kontaktoni:\n\nTelefon: +383 44 000 000\nEmail: info@rentakar.com';
      const botMsg = { id: (Date.now() + 1).toString(), type: 'bot' as const, text: fallback, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      if (convId) persistMessage(convId, 'bot', fallback).catch(() => { /* non-fatal */ });
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {!open && pos && (
        <button
          aria-label="Hap chat-in me asistentin"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
          className="fixed z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/30 flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <MessageSquare className="w-6 h-6 pointer-events-none" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white pointer-events-none" />
        </button>
      )}

      {open && (
        <div
          className={`fixed right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100svh-3rem)] bg-white rounded-2xl shadow-2xl shadow-dark-950/15 border border-gray-100 flex flex-col overflow-hidden animate-scale-in ${
            isAppMode ? 'bottom-[88px]' : 'bottom-6'
          }`}
        >
          <div className="bg-dark-950 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Car className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">{isEscalated ? 'RentaKar Agjent' : 'RentaKar Asistent'}</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isEscalated ? 'bg-blue-400' : 'bg-green-400'}`} />
                  <span className="text-gray-400 text-[11px]">{isEscalated ? 'Lidhur me agjent' : 'Online'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Mbyll chat-in"
              className="text-gray-400 hover:text-white transition-colors p-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.type === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : msg.type === 'admin'
                    ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-bl-md'
                    : 'bg-gray-100 text-dark-800 rounded-bl-md'
                }`}>
                  {msg.type === 'admin' && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                      <UserCog className="w-3 h-3" /> Agjent
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {user && conversationId && !isEscalated && messages.length > 1 && !loading && (
              <div className="pt-1">
                <button
                  onClick={handleEscalate}
                  disabled={escalating}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-100 transition-colors disabled:opacity-50"
                >
                  {escalating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCog className="w-3.5 h-3.5" />}
                  Lidhu me nje agjent
                </button>
              </div>
            )}

            {messages.length <= 1 && suggestions.length > 0 && !loading && (
              <div className="pt-2">
                <p className="text-[11px] text-dark-400 font-medium mb-2 uppercase tracking-wider">Pyetje te shpeshta:</p>
                <div className="space-y-1.5">
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSend(s.question)}
                      className="w-full text-left px-3.5 py-2.5 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-xl text-xs text-dark-700 hover:text-primary-700 transition-all flex items-center justify-between gap-2 group"
                    >
                      <span className="line-clamp-1">{s.question}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-primary-500 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>

          <div className="border-t border-gray-100 p-3 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Shkruani pyetjen tuaj..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-dark-300 mt-2">Asistenti virtual i RentaKar</p>
          </div>
        </div>
      )}
    </>
  );
}
