"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { ApiError, ChatMessage, sendChatMessageRequest } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

const faqItems = [
  {
    question: "How does Rinse work?",
    answer: "We pickup your laundry, clean it professionally, and deliver it back to you.",
  },
  {
    question: "What are your service areas?",
    answer: "We currently serve major metropolitan areas. Check our website for availability.",
  },
  {
    question: "How much does it cost?",
    answer: "Pricing varies by service type. Visit our Services & Pricing page for details.",
  },
  {
    question: "Can I cancel or reschedule?",
    answer: "Yes! You can reschedule or cancel anytime before your pickup.",
  },
];

const initialAssistantMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm the Nadeef assistant. Ask me about your orders, pricing, delivery timing, or anything related to the laundry service.",
};

export default function Help() {
  const { user, isLoggedIn, isAuthReady } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messageContainerRef.current) return;

    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages, isChatOpen]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextMessage = draft.trim();
    if (!nextMessage || isSending) return;

    if (!user?.token) {
      setChatError("Please log in first so the assistant can securely access your account context.");
      setIsChatOpen(true);
      return;
    }

    const history = messages.filter((entry) => entry.role !== "system");
    const userMessage: ChatMessage = { role: "user", content: nextMessage };
    const assistantIndex = history.length + 1;

    setDraft("");
    setChatError(null);
    setIsChatOpen(true);
    setIsSending(true);
    setMessages([...history, userMessage, { role: "assistant", content: "" }]);

    try {
      const stream = await sendChatMessageRequest(user.token, {
        message: nextMessage,
        history,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventText of events) {
          const lines = eventText
            .split("\n")
            .filter((line) => line.length > 0);

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const payload = line.startsWith("data: ")
              ? line.slice(6)
              : line.slice(5);

            if (!payload || payload === "[DONE]") continue;

            if (payload.startsWith("{")) {
              try {
                const parsed = JSON.parse(payload) as { error?: string };
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (error) {
                if (error instanceof Error) {
                  throw error;
                }
              }
              continue;
            }

            setMessages((current) => {
              const next = [...current];
              const target = next[assistantIndex];

              if (!target || target.role !== "assistant") {
                next.push({ role: "assistant", content: payload });
                return next;
              }

              next[assistantIndex] = {
                ...target,
                content: `${target.content}${payload}`,
              };
              return next;
            });
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "We could not reach the chat service right now.";

      setChatError(message);
      setMessages((current) => {
        const next = [...current];
        const target = next[assistantIndex];

        if (target?.role === "assistant" && !target.content.trim()) {
          next[assistantIndex] = {
            role: "assistant",
            content:
              "I couldn't load a reply just now. Please try again in a moment.",
          };
        }

        return next;
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-6 md:mb-8">Help & Support</h1>

        {/* Contact Options */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-4 md:mb-5">CONTACT US</h2>
          <div className="space-y-3 md:space-y-4">
            <button
              type="button"
              onClick={() => setIsChatOpen((current) => !current)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-gray-900 font-medium text-base md:text-lg">Live Chat</h3>
                <p className="text-sm md:text-base text-gray-600">
                  {isLoggedIn
                    ? "Chat with our support assistant"
                    : "Log in to chat with our support assistant"}
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" strokeWidth={2} />
            </button>

            {isChatOpen ? (
              <section className="rounded-3xl border border-gray-200 bg-[#F7FBFC] overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 bg-white px-4 py-4 md:px-5">
                  <h3 className="text-gray-900 font-semibold text-base md:text-lg">Nadeef Assistant</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isAuthReady && isLoggedIn
                      ? "Your chat is connected to the secured backend assistant."
                      : "Sign in to let the assistant access your order context securely."}
                  </p>
                </div>

                <div
                  ref={messageContainerRef}
                  className="max-h-[420px] overflow-y-auto px-4 py-4 md:px-5 space-y-3"
                >
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed shadow-sm ${
                          message.role === "user"
                            ? "bg-[#1D6076] text-white"
                            : "bg-white text-gray-800 border border-gray-100"
                        }`}
                      >
                        {message.content || (isSending && index === messages.length - 1
                          ? "Typing..."
                          : "")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 bg-white px-4 py-4 md:px-5">
                  {chatError ? (
                    <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {chatError}
                    </p>
                  ) : null}

                  {!isLoggedIn ? (
                    <p className="text-sm text-gray-600">
                      <Link href="/login" className="font-medium text-[#1D6076] hover:underline">
                        Log in
                      </Link>{" "}
                      to start a secure chat session.
                    </p>
                  ) : (
                    <form onSubmit={handleSend} className="flex items-end gap-3">
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Ask about an order, pricing, delivery, or support."
                        rows={3}
                        disabled={isSending}
                        className="min-h-[88px] flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm md:text-base text-gray-900 outline-none transition focus:border-[#1D6076] focus:ring-2 focus:ring-[#1D6076]/10 disabled:bg-gray-50"
                      />
                      <button
                        type="submit"
                        disabled={isSending || !draft.trim()}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D6076] text-white transition hover:bg-[#174e60] disabled:cursor-not-allowed disabled:bg-gray-300"
                        aria-label="Send message"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  )}
                </div>
              </section>
            ) : null}

            <a href="mailto:support@rinse.com" className="block w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail size={20} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-gray-900 font-medium text-base md:text-lg">Email</h3>
                <p className="text-sm md:text-base text-gray-600">support@rinse.com</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" strokeWidth={2} />
            </a>

            <a href="tel:+15551234567" className="block w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={20} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-gray-900 font-medium text-base md:text-lg">Phone</h3>
                <p className="text-sm md:text-base text-gray-600">+1 (555) 123-4567</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-4 md:mb-5">FREQUENTLY ASKED QUESTIONS</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item, index) => (
              <details key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden group">
                <summary className="p-4 md:p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="text-gray-900 font-medium text-base md:text-lg pr-4">{item.question}</h3>
                  <ChevronRight size={20} className="text-gray-400 transform group-open:rotate-90 transition-transform shrink-0" strokeWidth={2} />
                </summary>
                <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-gray-600 leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
