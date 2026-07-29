'use client';

import * as React from 'react';
import { Bot, Sparkles, Send, Mic, Square, Plus, BookOpen, Users, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { VoiceSettingsDialog } from '@shared/components/VoiceSettingsDialog';
import {
  Message,
  MessageContent,
  Bubble,
  BubbleContent,
  TypingIndicator,
} from '@shared/components/ui/message';
import { userSettingsApi } from '@/lib/api';

export type AiMode = 'doc' | 'manage' | 'free';
export type AiToolCall = { tool: string; args: Record<string, unknown>; result: string };
export type AiMessage = {
  role: 'user' | 'assistant';
  text: string;
  loading?: boolean;
  sources?: Array<{ document: string; metadata: Record<string, string>; score: number }>;
  tool_calls?: AiToolCall[];
};

export interface AITabProps {
  aiSessions: Array<{ session_id: string; title?: string; msg_count?: number; updated_at?: string }>;
  aiSessionId: string | null;
  setAiSessionId: (id: string | null) => void;
  aiMessages: AiMessage[];
  aiMode: AiMode;
  setAiMode: (mode: AiMode) => void;
  aiQuestion: string;
  setAiQuestion: (q: string) => void;
  aiLoading: boolean;
  isRecording: boolean;
  aiScrollRef: React.RefObject<HTMLDivElement>;
  createNewAiSession: () => Promise<void> | void;
  clearAiSession: () => Promise<void> | void;
  startRecording: () => Promise<void> | void;
  stopRecording: () => void;
  handleAiAsk: (audioBlob?: Blob) => Promise<void> | void;
  userSettingsApi: typeof userSettingsApi;
  AI_MODES: { key: AiMode; label: string; icon: React.ElementType; placeholder: string; description: string }[];
  formatDate: (v: string | null | undefined) => string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function AITab({
  aiSessions,
  aiSessionId,
  setAiSessionId,
  aiMessages,
  aiMode,
  setAiMode,
  aiQuestion,
  setAiQuestion,
  aiLoading,
  isRecording,
  aiScrollRef,
  createNewAiSession,
  clearAiSession,
  startRecording,
  stopRecording,
  handleAiAsk,
  userSettingsApi,
  AI_MODES,
  formatDate,
  t,
}: AITabProps) {
  return (
    <div className="flex h-[calc(100vh-260px)] animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
      <div className="w-72 bg-muted/20 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center justify-between bg-card">
          <h4 className="font-bold text-sm text-foreground">{t('classroom.ui.ai_history_title')}</h4>
          <Button variant="ghost" size="icon" onClick={createNewAiSession} className="h-8 w-8 rounded-lg hover:bg-primary-brand-light hover:text-primary-brand">
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {aiSessions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-muted-foreground">{t('classroom.ui.ai_no_conversations')}</p>
            </div>
          ) : (
            aiSessions.map((s) => (
              <Button
                key={s.session_id}
                variant="ghost"
                onClick={() => setAiSessionId(s.session_id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group justify-start ${
                  aiSessionId === s.session_id
                    ? '!bg-primary-brand !text-white shadow-md shadow-primary-brand/20 hover:!bg-primary-brand hover:!text-white'
                    : '!bg-transparent text-muted-foreground hover:!bg-primary-brand-light/50 hover:!text-primary-brand'
                }`}
              >
                <p className={`text-xs font-bold truncate ${aiSessionId === s.session_id ? 'text-white' : 'text-foreground group-hover:text-primary-brand'}`}>
                  {s.title || t('classroom.ui.ai_new_conversation')}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[10px] ${aiSessionId === s.session_id ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {t('classroom.ui.ai_messages_count', undefined, { count: s.msg_count })}
                  </span>
                  <span className={`text-[10px] ${aiSessionId === s.session_id ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {formatDate(s.updated_at)}
                  </span>
                </div>
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-card">
        <div className="px-8 py-5 bg-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-brand flex items-center justify-center shadow-lg shadow-primary-brand-muted shrink-0">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.ai_assistant')}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              {AI_MODES.find(m => m.key === aiMode)?.description}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <VoiceSettingsDialog
              getSettings={() => userSettingsApi.getSettings()}
              updateSettings={(data) => userSettingsApi.updateSettings(data)}
              getAvailableVoices={() => userSettingsApi.getAvailableVoices()}
              previewVoice={(voiceId, text) => userSettingsApi.previewVoice(voiceId, text)}
            />
            {aiMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAiSession}
                className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                {t('classroom.ui.ai_clear_history')}
              </Button>
            )}
          </div>
        </div>

        <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
          {aiMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary-brand-light flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-primary-brand" />
              </div>
              <p className="text-lg font-bold text-foreground">{t('classroom.ui.ai_greeting')}</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                {t('classroom.ui.ai_greeting_desc')}
              </p>
            </div>
          )}

          {aiMessages.map((msg, i) => (
            <Message
              key={i}
              from={msg.role === 'user' ? 'user' : 'assistant'}
              align={msg.role === 'user' ? 'left' : 'right'}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-primary-brand flex items-center justify-center shadow-md shrink-0 self-end">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <MessageContent>
                <Bubble
                  variant={msg.role === 'user' ? 'primary' : 'muted'}
                  size="md"
                  className={msg.role === 'user' ? 'rounded-bl-md shadow-md shadow-primary-brand/20' : 'rounded-br-md'}
                >
                  <BubbleContent>
                    <div className="text-sm font-medium leading-relaxed space-y-1.5">
                      {msg.text
                        ? msg.text.split('\n\n').map((para, pi) => (
                            <p key={pi}>
                              {para.split('\n').map((line, li, arr) => (
                                <React.Fragment key={li}>
                                  {line}
                                  {li < arr.length - 1 && <br />}
                                </React.Fragment>
                              ))}
                              {pi === msg.text.split('\n\n').length - 1 && msg.loading && (
                                <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse rounded align-middle" />
                              )}
                            </p>
                          ))
                        : msg.loading && <TypingIndicator />
                      }
                    </div>
                    {msg.tool_calls && msg.tool_calls.length > 0 && (
                      <div className="mt-3 pt-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('classroom.ui.ai_executed')}</p>
                        {msg.tool_calls.map((tc, j) => (
                          <div key={j} className="text-[11px] text-muted-foreground bg-background/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <span className="shrink-0 text-primary-brand">⚙</span>
                            <span className="font-mono font-semibold text-foreground">{tc.tool}</span>
                            {tc.args && Object.keys(tc.args).length > 0 && (
                              <span className="truncate text-muted-foreground">
                                ({Object.entries(tc.args).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(', ')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('classroom.ui.ai_sources')}</p>
                        {msg.sources.slice(0, 3).map((src, j) => (
                          <div key={j} className="text-[11px] text-muted-foreground bg-background/60 rounded-lg px-3 py-1.5 flex items-center justify-between gap-3">
                            <span className="truncate">{src.metadata?.doc_name ?? src.metadata?.resource_uid ?? t('classroom.ui.ai_doc_label')}</span>
                            <span className="shrink-0 font-bold text-primary-brand">{(src.score * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </BubbleContent>
                </Bubble>
              </MessageContent>
              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 self-end">
                  <Users size={16} className="text-muted-foreground" />
                </div>
              )}
            </Message>
          ))}
        </div>

        <div className="p-6 bg-muted/30">
          <div className="flex flex-wrap gap-2 mb-3">
            {AI_MODES.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => setAiMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aiMode === key
                    ? '!bg-primary-brand !text-white shadow-md shadow-primary-brand/20 hover:!bg-primary-brand hover:!text-white'
                    : '!bg-muted !text-muted-foreground hover:!bg-primary-brand-light hover:!text-primary-brand'
                }`}
              >
                <Icon size={13} />
                {label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] flex gap-2">
              {isRecording ? (
                <Button
                  variant="ghost"
                  onClick={stopRecording}
                  className="flex-1 h-12 flex items-center justify-center gap-2 !bg-rose-500 !text-white rounded-2xl text-xs font-black uppercase tracking-wide animate-pulse hover:!bg-rose-500 hover:!text-white"
                >
                  <Square size={14} fill="white" />
                  {t('classroom.ui.ai_speaking')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    disabled={aiLoading}
                    onClick={() => void startRecording()}
                    className="h-12 w-12 flex items-center justify-center !bg-muted !text-muted-foreground rounded-2xl hover:!bg-primary-brand-light hover:!text-primary-brand disabled:opacity-50 transition-all shrink-0"
                    title={t('classroom.ui.ai_mic_title')}
                  >
                    <Mic size={18} />
                  </Button>
                  <Input
                    type="text"
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAiAsk(); } }}
                    placeholder={AI_MODES.find(m => m.key === aiMode)?.placeholder ?? t('classroom.ui.ai_placeholder')}
                    disabled={aiLoading}
                    className="flex-1 h-12 min-w-0 rounded-2xl bg-background px-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-brand/30 disabled:opacity-60"
                  />
                </>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => void handleAiAsk()}
              disabled={!aiQuestion.trim() || aiLoading || isRecording}
              className="h-12 w-12 rounded-2xl !bg-primary-brand hover:!bg-primary-brand-dark !text-white p-0 shadow-lg shadow-primary-brand/20 disabled:opacity-50 shrink-0 hover:!text-white"
            >
              {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
