import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, Loader2, UserCog, User as UserIcon, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import type { ChatConversation, ChatMessage } from '../../lib/types';

interface ConversationRow extends ChatConversation {
  profile_full_name?: string | null;
  profile_email?: string | null;
}

export default function AdminLiveChat() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const listChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from('chat_conversations')
      .select('*, profiles:user_id(full_name, email)')
      .eq('is_escalated', true)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(100);
    const rows = (data || []).map((c: ChatConversation & { profiles: { full_name: string | null; email: string | null } | null }) => ({
      ...c,
      profile_full_name: c.profiles?.full_name || null,
      profile_email: c.profiles?.email || null,
    }));
    setConversations(rows);
    setLoadingList(false);
  }, []);

  const loadThread = useCallback(async (convId: string) => {
    setLoadingThread(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((data || []) as ChatMessage[]);
    setLoadingThread(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime: rifresko listen kur nje konvesacion behet escalated ose merr message te ri.
  useEffect(() => {
    if (listChannelRef.current) {
      supabase.removeChannel(listChannelRef.current);
    }
    const ch = supabase
      .channel('admin-live-chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        loadConversations();
      })
      .subscribe();
    listChannelRef.current = ch;
    return () => {
      if (listChannelRef.current) {
        supabase.removeChannel(listChannelRef.current);
        listChannelRef.current = null;
      }
    };
  }, [loadConversations]);

  // Realtime: dëgjo messages te reja per konvesacionin e zgjedhur.
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (!selectedId) return;
    loadThread(selectedId);
    const ch = supabase
      .channel(`admin-thread:${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${selectedId}`,
      }, payload => {
        const row = payload.new as ChatMessage;
        setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, row]);
      })
      .subscribe();
    channelRef.current = ch;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedId, loadThread]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selectedId,
      sender_type: 'admin',
      message: text,
    });
    if (!error) {
      setReply('');
    }
    setSending(false);
  }

  async function closeConversation(convId: string) {
    if (!confirm(t('adminLiveChat.confirmClose', 'Mbyll kete bisede?'))) return;
    await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', convId);
    if (selectedId === convId) setSelectedId(null);
    loadConversations();
  }

  const selected = conversations.find(c => c.id === selectedId);

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminLiveChat.title', 'Live Chat')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">
            {t('adminLiveChat.subtitle', 'Bisedat aktive te perdoruesve qe kerkojne agjent njerezor.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              <h2 className="text-sm font-semibold text-dark-900">
                {t('adminLiveChat.activeConversations', 'Bisedat aktive')}
              </h2>
            </div>
            <span className="text-xs text-dark-400">{conversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingList ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-dark-400">
                  {t('adminLiveChat.empty', 'Nuk ka biseda aktive per momentin.')}
                </p>
              </div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedId === c.id ? 'bg-primary-50/50 border-l-2 border-l-primary-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {(c.profile_full_name || c.visitor_id).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dark-900 truncate">
                        {c.profile_full_name || c.visitor_id}
                      </p>
                      <p className="text-[11px] text-dark-400 truncate">{c.profile_email || '—'}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-dark-400">
                    {new Date(c.last_message_at).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-dark-300">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm">{t('adminLiveChat.selectPrompt', 'Zgjidh nje bisede per ta hapur.')}</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center">
                    {(selected.profile_full_name || selected.visitor_id).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark-900">
                      {selected.profile_full_name || selected.visitor_id}
                    </p>
                    <p className="text-[11px] text-dark-400">{selected.profile_email || '—'}</p>
                  </div>
                </div>
                <button
                  onClick={() => closeConversation(selected.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  {t('adminLiveChat.closeConv', 'Mbyll bisedën')}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-dark-300 py-12">
                    {t('adminLiveChat.noMessages', 'Asnje mesazh akoma.')}
                  </p>
                ) : (
                  messages.map(m => {
                    const isAdmin = m.sender_type === 'admin';
                    const isBot = m.sender_type === 'bot';
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%]">
                          <div className={`flex items-center gap-1 mb-1 text-[10px] font-semibold uppercase tracking-wider ${
                            isAdmin ? 'text-blue-600 justify-end' : isBot ? 'text-purple-600' : 'text-dark-400'
                          }`}>
                            {isAdmin ? <><UserCog className="w-3 h-3" /> Ju</>
                              : isBot ? <><Bot className="w-3 h-3" /> Bot</>
                              : <><UserIcon className="w-3 h-3" /> Visitor</>}
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            isAdmin ? 'bg-blue-600 text-white rounded-br-md'
                              : isBot ? 'bg-purple-50 text-purple-900 border border-purple-100 rounded-bl-md'
                              : 'bg-gray-100 text-dark-800 rounded-bl-md'
                          }`}>
                            {m.message}
                          </div>
                          <p className="text-[10px] text-dark-300 mt-1 px-1">
                            {new Date(m.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEnd} />
              </div>

              <div className="border-t border-gray-100 p-3 shrink-0 bg-white">
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder={t('adminLiveChat.replyPlaceholder', 'Shkruani pergjigjen tuaj...')}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 transition-all active:scale-95"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
