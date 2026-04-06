"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_PROXY_BASE } from "../lib/admin-api";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);
  const clearChat = () => {
    setMessages([]);
    setStreamingText("");
  };

  const suggestions = [
    "ايه حالة طلبي؟",
    "أسعار الخدمات",
    "إزاي أعمل طلب جديد؟",
    "عايز ألغي طلب",
  ];

  // Fetch user's orders to give the AI real context
  const fetchUserOrders = async (): Promise<any[]> => {
    if (!user?.token) return [];
    try {
      const res = await fetch(`${BACKEND_PROXY_BASE}/Orders?PageIndex=1&PageSize=10`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) return [];
      const json = await res.json();
      // Handle paginated { data: [...] } or direct array
      return Array.isArray(json) ? json : (json.data ?? json.Data ?? []);
    } catch {
      return [];
    }
  };

  const buildOrderContext = (orders: any[]): string => {
    if (!orders.length) return "";
    const lines = orders.map((o: any) => {
      const id = o.id ?? o.Id ?? "?";
      const price = o.totalPrice ?? o.TotalPrice ?? 0;
      const status = o.status ?? o.Status ?? "Unknown";
      const laundry = o.laundryName ?? o.LaundryName ?? "";
      const pickup = o.pickupTime ?? o.PickupTime ?? "";
      return `- Order #${id} | ${laundry} | ${typeof price === "number" ? price.toFixed(2) : price} EGP | ${status} | Pickup: ${pickup}`;
    }).join("\n");
    return `\n\n[User's orders:\n${lines}\n]`;
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    // Fetch orders for context
    const orders = await fetchUserOrders();
    const orderContext = buildOrderContext(orders);

    // Build clean history
    const history = [...messages, userMessage]
      .filter((m) => m.role !== "system")
      .map(({ role, content }) => ({ role, content }));

    // Inject a system message with order data so Groq can answer accurately
    if (orderContext) {
      history.push({
        role: "system",
        content: `Here is the user's real order data from the Ndeef system:${orderContext}\nUse this data to answer questions about orders, prices, and status accurately.`,
      });
    }

    // Build headers with JWT token
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    // Embed context in the message too (backup in case backend strips system msgs)
    const messageWithContext = orderContext
      ? `${text}${orderContext}`
      : text;

    try {
      const response = await fetch(`${BACKEND_PROXY_BASE}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: messageWithContext,
          history: history,
        }),
      });

      if (response.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "يرجى تسجيل الدخول أولاً حتى أتمكن من مساعدتك! 🔐\n\nPlease log in first so I can assist you.",
          },
        ]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("[ChatWidget] Server error:", response.status, errText);
        throw new Error(`Server error: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        console.error("[ChatWidget] Got HTML instead of SSE.");
        throw new Error("HTML_RESPONSE");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // ── SSE Stream Reader ──
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const trimmed = event.trim();
          if (!trimmed) continue;

          for (const line of trimmed.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);

            if (payload === "[DONE]") break;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) {
                fullResponse += `\n❌ Error: ${parsed.error}`;
                setStreamingText(fullResponse);
                continue;
              }
            } catch {
              fullResponse += payload;
              setStreamingText(fullResponse);
            }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (const line of buffer.trim().split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload !== "[DONE]") {
            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) fullResponse += `\n❌ Error: ${parsed.error}`;
            } catch {
              fullResponse += payload;
            }
          }
        }
      }

      const finalContent = fullResponse.trim() || "...";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: finalContent },
      ]);
      setStreamingText("");
    } catch (err: unknown) {
      console.error("[ChatWidget] Error:", err);
      const errMsg = err instanceof Error ? err.message : "";

      let errorContent =
        "عذراً، حصل خطأ في الاتصال بالسيرفر. حاول تاني بعد شوية. 🔄";
      if (errMsg === "HTML_RESPONSE") {
        errorContent =
          "⚠️ خطأ في الإعداد: السيرفر رجّع صفحة ويب بدل رد الـ AI.\nتأكد إن الـ Backend شغال.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorContent },
      ]);
      setStreamingText("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AI Chat"
        >
          <div className="relative w-14 h-14 bg-gradient-to-br from-[#1D6076] to-[#2B7A94] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#1D6076]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#1D6076]/40 active:scale-95">
            <MessageCircle size={26} strokeWidth={2} />
            <span className="absolute inset-0 rounded-full bg-[#1D6076] animate-ping opacity-20" />
          </div>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
            Chat with Ndeef AI 💬
            <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 rotate-45 -translate-y-1" />
          </div>
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[92vw] sm:w-[400px] h-[560px] max-h-[85vh] bg-white rounded-3xl shadow-2xl shadow-black/15 flex flex-col z-50 overflow-hidden border border-gray-200/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1D6076] via-[#236b82] to-[#2B7A94] px-4 py-3.5 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] leading-tight">Ndeef AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-[11px] text-white/70 font-medium">
                    أونلاين • جاهز للمساعدة
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-white/60 hover:text-white hover:bg-white/15 p-2 rounded-xl transition-all"
                  title="Clear chat"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={toggleChat}
                className="text-white/60 hover:text-white hover:bg-white/15 p-2 rounded-xl transition-all"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 px-4 py-3 overflow-y-auto bg-gradient-to-b from-gray-50/80 to-white space-y-3 scrollbar-thin">
            {messages.length === 0 && !streamingText && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1D6076]/10 to-[#2B7A94]/10 rounded-2xl flex items-center justify-center">
                  <Bot size={32} className="text-[#1D6076]" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-gray-800 font-semibold text-base">
                    أهلاً بيك! 👋
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-[260px]">
                    أنا مساعد نضيف الذكي. اسألني أي سؤال عن طلباتك أو خدماتنا!
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[320px]">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-[#1D6076]/5 text-[#1D6076] hover:bg-[#1D6076]/15 border border-[#1D6076]/10 transition-all hover:scale-[1.03] active:scale-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1D6076] to-[#2B7A94] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#1D6076] text-white rounded-2xl rounded-br-md shadow-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md shadow-sm ring-1 ring-black/[0.03]"
                  }`}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-gray-500" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1D6076] to-[#2B7A94] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
                <div
                  className="max-w-[78%] px-3.5 py-2.5 text-[13.5px] leading-relaxed bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md shadow-sm ring-1 ring-black/[0.03]"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {streamingText ? (
                    <>
                      {streamingText}
                      <span className="inline-block w-1.5 h-4 bg-[#1D6076] ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                    </>
                  ) : (
                    <div className="flex gap-1.5 items-center py-1">
                      <div className="w-2 h-2 bg-[#1D6076]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-[#1D6076]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-[#1D6076]/40 rounded-full animate-bounce" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100/80">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                disabled={isLoading}
                dir="auto"
                className="flex-1 w-full pl-4 pr-12 py-3 bg-gray-50/80 border border-gray-200/60 focus:bg-white focus:ring-2 focus:ring-[#1D6076]/15 focus:border-[#1D6076]/40 rounded-2xl text-sm transition-all disabled:opacity-50 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-2.5 bg-gradient-to-r from-[#1D6076] to-[#2B7A94] rounded-xl text-white hover:opacity-90 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 transition-all shadow-sm disabled:shadow-none active:scale-95"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            </form>
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-gray-300 font-medium tracking-wider">
                Powered by Ndeef AI ✦
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
