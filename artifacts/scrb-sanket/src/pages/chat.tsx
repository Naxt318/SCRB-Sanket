import React, { useState, useRef, useEffect } from 'react';
import { useSendChatMessage, useGetChatHistory, useClearChatHistory, getGetChatHistoryQueryKey } from '@workspace/api-client-react';
import { ChatMessageRole, ChatMessageInputLanguage } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Send,
  Mic,
  Bot,
  User as UserIcon,
  Languages,
  Trash2,
  FileDown,
  ChevronDown,
  ChevronUp,
  MapPin,
  BarChart2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

// Sarvam AI speech-to-text (set VITE_SARVAM_API_KEY in your .env)
const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY as string | undefined;

export default function Chat() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<ChatMessageInputLanguage>('english');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: history, isLoading: loadingHistory } = useGetChatHistory(sessionId, {
    query: { queryKey: getGetChatHistoryQueryKey(sessionId) }
  });

  const sendMutation = useSendChatMessage();
  const clearMutation = useClearChatHistory(sessionId);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, sendMutation.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;

    const message = input.trim();
    setInput('');

    // Optimistic update
    const prevHistory = queryClient.getQueryData(getGetChatHistoryQueryKey(sessionId)) as any[] || [];
    queryClient.setQueryData(getGetChatHistoryQueryKey(sessionId), [
      ...prevHistory,
      { id: 'temp-' + Date.now(), role: ChatMessageRole.user, content: message, timestamp: new Date().toISOString() }
    ]);

    sendMutation.mutate({ data: { message, language, sessionId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey(sessionId) });
      },
      onError: () => {
        // Rollback on error
        queryClient.setQueryData(getGetChatHistoryQueryKey(sessionId), prevHistory);
        setInput(message);
      }
    });
  };

  const toggleLanguage = () => {
    setLanguage((prev: ChatMessageInputLanguage) => prev === 'english' ? 'kannada' : 'english');
  };

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey(sessionId) });
      }
    });
  };

  const transcribeWithSarvam = async (audioBlob: Blob) => {
    if (!SARVAM_API_KEY) {
      alert('Sarvam AI is not configured — set VITE_SARVAM_API_KEY in your .env file.');
      return;
    }

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'saaras:v3');
      formData.append('language_code', language === 'kannada' ? 'kn-IN' : 'en-IN');

      const res = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': SARVAM_API_KEY },
        body: formData,
      });

      if (!res.ok) throw new Error(`Sarvam API error: ${res.status}`);

      const data = await res.json();
      const transcript = data.transcript as string;
      if (transcript) {
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      }
    } catch (err) {
      console.error(err);
      alert('Voice transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoice = async () => {
    // Currently recording -> stop and send to Sarvam
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeWithSarvam(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
      alert('Microphone access denied or unavailable.');
    }
  };

  const exportPDF = async () => {
    const el = scrollRef.current;
    if (!el || !history || history.length === 0) {
      alert('No conversation to export yet — ask a question first.');
      return;
    }

    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0e14',
        height: el.scrollHeight,
        width: el.scrollWidth,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        useCORS: true,
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      pdf.save(`SANKET-chat-export-${stamp}.pdf`);
    } catch (err) {
      console.error('[SANKET] PDF export failed', err);
      alert('Failed to export chat as PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border/50 rounded-md overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-14 bg-card border-b border-border/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-sm tracking-wider uppercase text-foreground">SANKET AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleLanguage} className="text-xs h-8 px-2 border-border/50 hover:bg-muted">
            <Languages className="w-3 h-3 mr-1" />
            {language === 'english' ? 'ENG' : 'KAN'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={isExporting} className="text-xs h-8 px-2 border-border/50 hover:bg-muted">
            <FileDown className="w-3 h-3 mr-1" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} className="text-xs h-8 px-2 border-border/50 hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {loadingHistory ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 max-w-md ml-auto rounded-lg" />
            <Skeleton className="h-32 w-3/4 max-w-md rounded-lg" />
          </div>
        ) : history?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <Bot className="w-16 h-16 mb-4 text-primary" />
            <p className="text-sm tracking-wide uppercase">System ready. Enter query.</p>
          </div>
        ) : (
          history?.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        
        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 rounded-lg p-4 max-w-[85%] sm:max-w-[75%] flex items-center gap-3">
              <Bot className="w-4 h-4 text-secondary animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Analyzing intelligence...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border/50 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleVoice}
            disabled={isTranscribing}
            aria-label={isListening ? 'Stop voice recording' : isTranscribing ? 'Transcribing voice query' : 'Start voice query'}
            className={`shrink-0 ${isListening ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse' : isTranscribing ? 'opacity-60' : 'text-muted-foreground'}`}
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'english' ? "Query crime database..." : "ಅಪರಾಧ ಡೇಟಾಬೇಸ್ ಅನ್ನು ಪ್ರಶ್ನಿಸಿ..."}
            className="flex-1 bg-background border-border/50 focus-visible:ring-secondary"
            disabled={sendMutation.isPending}
          />
          <Button type="submit" size="icon" aria-label="Send intelligence query" disabled={!input.trim() || sendMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: any }) {
  const isUser = msg.role === ChatMessageRole.user;
  const [reasoningOpen, setReasoningOpen] = useState(false);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${isUser ? 'bg-muted border-border/50 text-foreground' : 'bg-primary/20 border-primary/50 text-secondary'}`}>
          {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`p-3 rounded-md text-sm ${isUser ? 'bg-muted text-foreground border border-border/50 rounded-tr-none' : 'bg-card text-card-foreground border border-border/50 rounded-tl-none shadow-sm'}`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>

          {/* Reasoning Panel */}
          {msg.reasoning && msg.reasoning.length > 0 && (
            <div className="w-full mt-1 border border-border/50 rounded-md overflow-hidden bg-background">
              <button 
                onClick={() => setReasoningOpen(!reasoningOpen)}
                className="w-full flex items-center justify-between p-2 text-xs text-muted-foreground bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <span className="font-mono tracking-wider">Sources & Reasoning</span>
                {reasoningOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {reasoningOpen && (
                <div className="p-3 text-xs font-mono text-muted-foreground bg-background space-y-3 border-t border-border/50">
                  {msg.sources && msg.sources.length > 0 && (
                    <div>
                      <strong className="text-foreground uppercase mb-1 block">Sources:</strong>
                      <ul className="list-disc pl-4 space-y-1">
                        {msg.sources.map((src: string, i: number) => <li key={i}>{src}</li>)}
                      </ul>
                    </div>
                  )}
                  <div>
                    <strong className="text-foreground uppercase mb-1 block">Execution Trace:</strong>
                    <ol className="list-decimal pl-4 space-y-1">
                      {msg.reasoning.map((step: string, i: number) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Charts Payload */}
          {msg.chartData && (
            <div className="w-full mt-2 border border-border/50 rounded-md p-3 bg-card h-64">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <BarChart2 className="w-3 h-3" />
                {msg.chartData.title || "Data Visualization"}
              </div>
              <ResponsiveContainer width="100%" height="100%">
                {msg.chartData.type === 'line' ? (
                  <LineChart data={formatChartData(msg.chartData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    {msg.chartData.datasets.map((ds: any, i: number) => (
                      <Line key={i} type="monotone" dataKey={`dataset_${i}`} name={ds.label} stroke={`hsl(var(--chart-${(i%5)+1}))`} strokeWidth={2} dot={{r:3}} />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={formatChartData(msg.chartData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    {msg.chartData.datasets.map((ds: any, i: number) => (
                      <Bar key={i} dataKey={`dataset_${i}`} name={ds.label} fill={`hsl(var(--chart-${(i%5)+1}))`} radius={[2,2,0,0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Map Payload Placeholder */}
          {msg.mapData && msg.mapData.length > 0 && (
            <div className="w-full mt-2 border border-border/50 rounded-md p-3 bg-card">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-destructive" />
                Location Data Provided ({msg.mapData.length} points)
              </div>
              <div className="text-xs text-muted-foreground">
                <Link href="/map" className="font-medium text-secondary hover:text-secondary/80 hover:underline">View on Hotspot Map →</Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function formatChartData(chartData: any) {
  return chartData.labels.map((label: string, idx: number) => {
    const point: any = { label };
    chartData.datasets.forEach((ds: any, dsIdx: number) => {
      point[`dataset_${dsIdx}`] = ds.data[idx];
    });
    return point;
  });
}
