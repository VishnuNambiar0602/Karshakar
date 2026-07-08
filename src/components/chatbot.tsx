
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquare, Send, X, Loader2, Bot, Mic, Volume2, Play, Pause } from 'lucide-react';
import { appendUserHistoryAction, chatbotAction, listUserHistoryAction } from '@/lib/actions';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

type AudioState = 'idle' | 'generating' | 'playing' | 'paused';
interface MessageWithAudio extends ChatMessage {
    audioDataUri?: string;
    audioState?: AudioState;
}

const CHAT_STORAGE_KEY = 'earth-insights.chat-history';

// Add types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export function Chatbot({ lat, lon }: { lat?: string, lon?: string }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageWithAudio[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<MessageWithAudio[]>([]);
  const recognitionRef = useRef<any>(null);
  const hasInteracted = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    void (async () => {
      const remote = await listUserHistoryAction(30);
      const latestChat = remote.data?.find((item) => item.kind === 'chat');
      if (latestChat) {
        const payload = latestChat.payload as { messages?: MessageWithAudio[] };
        if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
          setMessages(payload.messages.slice(-40));
          messagesRef.current = payload.messages.slice(-40);
          return;
        }
      }

      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) {
        return;
      }
      try {
        const parsed = JSON.parse(raw) as MessageWithAudio[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-40));
          messagesRef.current = parsed.slice(-40);
        }
      } catch {
        window.localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    })();
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const compact = messages.slice(-40);
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(compact));
    void appendUserHistoryAction('chat', { messages: compact });
  }, [messages]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const resolvedInput = (textToSend ?? input).trim();
    if (resolvedInput === '') return;

    const userMessage: MessageWithAudio = { role: 'user', content: resolvedInput };
    const nextMessages = [...messagesRef.current, userMessage];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    const result = await chatbotAction({
      messages: nextMessages,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lon ? parseFloat(lon) : undefined,
    });

    setIsLoading(false);

    if (result.error || !result.data) {
      const errorMessage: MessageWithAudio = { role: 'model', content: t('chatbot.error.connection'), audioState: 'idle' };
      setMessages(prev => {
        const updated = [...prev, errorMessage];
        messagesRef.current = updated;
        return updated;
      });
      return;
    }

    const modelMessage: MessageWithAudio = {
      role: 'model',
      content: result.data.response,
      audioDataUri: result.data.audioDataUri,
      audioState: 'idle'
    };

    const modelIndex = nextMessages.length;

    setMessages(prev => {
      const updated = [...prev, modelMessage];
      messagesRef.current = updated;
      return updated;
    });

    if (result.data.audioDataUri && audioRef.current && hasInteracted.current) {
      audioRef.current.src = result.data.audioDataUri;
      audioRef.current.play().then(() => {
        setMessages(prev => prev.map((m, i) => i === modelIndex ? { ...m, audioState: 'playing' } : m));
      }).catch(() => {
        // Autoplay was blocked, user will have to click to play.
      });
      audioRef.current.onended = () => {
        setMessages(prev => prev.map((m, i) => i === modelIndex ? { ...m, audioState: 'idle' } : m));
      };
    }
  }, [input, lat, lon, t]);
  
  // Keep a stable reference for async handlers.
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          handleSend(transcript); 
        };
        recognition.onerror = (event: any) => {
           toast({ title: t('chatbot.error.voice.title'), description: event.error, variant: "destructive"});
           setIsRecording(false);
        };
        recognition.onend = () => {
           setIsRecording(false);
        };
        recognitionRef.current = recognition;
    }
  }, [handleSend, t, toast]);


  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'model', content: t('chatbot.greeting'), audioState: 'idle' }
      ]);
    }
  }, [isOpen, messages.length, t]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
       toast({ title: t('chatbot.error.unsupported.title'), description: t('chatbot.error.unsupported.description'), variant: "destructive" });
       return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };
  
  const handlePlayAudio = (index: number) => {
    const message = messages[index];
    if (!message.audioDataUri || !audioRef.current) return;

    // A crucial check to ensure audio only plays after user interaction
    if (!hasInteracted.current) {
        toast({ title: "Audio disabled", description: "Interact with the page to enable audio playback."});
        return;
    }

    if (audioRef.current.src === message.audioDataUri && message.audioState === 'playing') {
      // Pause current audio
      audioRef.current.pause();
      setMessages(prev => prev.map((m, i) => i === index ? { ...m, audioState: 'paused' as AudioState } : m));
    } else {
      // Stop any other audio that might be playing
      if (!audioRef.current.paused) {
          audioRef.current.pause();
      }
      // Reset all other message audio states to idle
      const newMessages: MessageWithAudio[] = messages.map((m, i) => {
          if (i === index) {
              return {...m, audioState: 'playing' as AudioState};
          }
          return {...m, audioState: 'idle' as AudioState};
      });
      setMessages(newMessages);
      
      // Play new audio
      audioRef.current.src = message.audioDataUri;
      audioRef.current.play();

      audioRef.current.onended = () => {
        setMessages(prev => prev.map((m, i) => i === index ? { ...m, audioState: 'idle' } : m));
      };
      audioRef.current.onerror = () => {
        toast({title: t('chatbot.error.audio.title'), description: t('chatbot.error.audio.description'), variant: "destructive"});
        setMessages(prev => prev.map((m, i) => i === index ? { ...m, audioState: 'idle' } : m));
      }
    }
  };
  

  const renderAudioIcon = (index: number) => {
      const state = messages[index]?.audioState || 'idle';

      if (state === 'playing') return <Pause className="h-4 w-4" />;
      if (state === 'paused') return <Play className="h-4 w-4" />;
      return <Volume2 className="h-4 w-4" />
  }

  const handleInteraction = () => {
      if (!hasInteracted.current) {
          hasInteracted.current = true;
          // Preload the audio element to prepare it for playback
          if(audioRef.current) {
              audioRef.current.load();
          }
      }
  }

  return (
    <>
      <audio ref={audioRef} className="hidden" preload="auto" />
      {isOpen ? (
        <Card 
          onClick={handleInteraction} 
          className="fixed bottom-6 right-6 w-[92vw] sm:w-[400px] h-[580px] sm:h-[620px] flex flex-col z-50 glass-card border border-primary/25 dark:border-primary/35 shadow-[0_20px_50px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in-40 zoom-in-95"
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-emerald-950/10 via-transparent to-transparent border-b border-primary/10">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-background rounded-full animate-pulse z-10" />
                <div className="bg-primary/10 p-2 rounded-xl border border-primary/25">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-base font-bold tracking-tight">{t('chatbot.title')}</CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  {t('chatbot.status.online') || "AI Farming Expert Online"}
                </p>
              </div>
            </div>
            <Button 
              aria-label="Close chatbot" 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
            >
              <span className="sr-only">Close chatbot</span>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto bg-grid-pattern bg-[size:20px_20px]">
            <ScrollArea className="h-full" ref={scrollAreaRef as any}>
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'model' && (
                       <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10">
                          <AvatarFallback className="text-[10px] font-bold text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                          'p-3.5 rounded-2xl max-w-[80%] relative group shadow-sm transition-all duration-300',
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground rounded-tr-none font-medium' 
                            : 'bg-muted/80 backdrop-blur-sm dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 rounded-tl-none border border-border/40 dark:border-primary/10'
                      )}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          {message.role === 'model' && message.audioDataUri && (
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="absolute -right-11 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-background border border-primary/20 hover:border-primary/50 text-primary opacity-0 group-hover:opacity-100 hover:scale-105 transition-all duration-200 shadow-md" 
                                onClick={() => handlePlayAudio(index)}
                              >
                                 {renderAudioIcon(index)}
                              </Button>
                          )}
                      </div>
                    {message.role === 'user' && (
                       <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10">
                          <AvatarFallback className="text-[10px] font-bold text-primary">U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                   <div className="flex items-start gap-3 justify-start">
                      <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10">
                          <AvatarFallback className="text-[10px] font-bold text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="p-3.5 rounded-2xl bg-muted/80 dark:bg-slate-900/60 border border-primary/10 rounded-tl-none flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t border-primary/15 bg-background/80 backdrop-blur-md">
              <div className="flex w-full items-center space-x-2">
                <Input
                  placeholder={t('chatbot.placeholder')}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  disabled={isLoading || isRecording}
                  className="rounded-xl border-emerald-950/20 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
                <Button 
                  aria-label="Start voice input" 
                  onClick={handleVoiceInput} 
                  disabled={isLoading} 
                  variant={isRecording ? "destructive" : "outline"} 
                  size="icon"
                  className={cn(
                    "rounded-xl transition-all duration-300",
                    isRecording ? "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "border-emerald-950/20 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <Mic className={cn("h-4 w-4", isRecording && "animate-bounce")} />
                </Button>
                <Button 
                  aria-label="Send message" 
                  onClick={() => handleSend()} 
                  disabled={isLoading || isRecording || !input.trim()}
                  className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Button
            onClick={() => {
                setIsOpen(true);
                handleInteraction();
            }}
            className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.6)] bg-primary text-primary-foreground border border-primary/20 hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center animate-bounce-slow"
            size="icon"
            aria-label="Open chatbot"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}
      </>
    );
}

    