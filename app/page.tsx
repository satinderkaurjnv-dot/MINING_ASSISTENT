"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";

type Message = {
  text: string;
  type: "bot" | "user";
  html?: string;
  loading?: boolean;
};

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Hello! 👋

Welcome to Mining Discovery.
How can I help you today?`,
      type: "bot",
    },
  ]);

  // ============================================================
  // CONVERSATION ID
  // ============================================================

  useEffect(() => {
    let id = localStorage.getItem(
      "miningDiscoveryConversationId"
    );

    if (!id) {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {
        id = window.crypto.randomUUID();
      } else {
        id =
          "conversation-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2, 10);
      }

      localStorage.setItem(
        "miningDiscoveryConversationId",
        id
      );
    }

    setConversationId(id);
  }, []);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop =
        messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // ============================================================
  // OPEN CHAT
  // ============================================================

  function openChat() {
    setChatOpen(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  // ============================================================
  // CLOSE CHAT
  // ============================================================

  function closeChat() {
    setChatOpen(false);
  }

  // ============================================================
  // MARKDOWN
  // ============================================================

  function markdownToHtml(text: string) {
    const cleanText = text
      .replace(/\\\*/g, "*")
      .replace(/\\_/g, "_");

    return marked.parse(cleanText);
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage() {
    const text = input.trim();

    if (!text || sending) {
      return;
    }

    if (!conversationId) {
      console.error(
        "Conversation ID not ready"
      );
      return;
    }

    setMessages((previous) => [
      ...previous,

      {
        text,
        type: "user",
      },

      {
        text: "",
        type: "bot",
        loading: true,
      },
    ]);

    setInput("");
    setSending(true);

    try {
const response = await fetch(
  "/api/chat",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message: text,
      conversationId,
    }),
  }
);

      if (!response.ok) {
        let errorMessage =
          "AI request failed";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error ||
            errorMessage;
        } catch {
          // Ignore
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error(
          "Response body is empty"
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let buffer = "";

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(
          value,
          {
            stream: true,
          }
        );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          try {
            const event =
              JSON.parse(line);

            // ==================================================
            // ANSWER
            // ==================================================

            if (
              event.type ===
              "answer"
            ) {
              const chunk =
                String(
                  event.data || ""
                );

              if (!chunk) {
                continue;
              }

              setMessages(
                (previous) => {
                  const updated =
                    [...previous];

                  const lastIndex =
                    updated.length - 1;

                  const last =
                    updated[lastIndex];

                  if (
                    last &&
                    last.type === "bot"
                  ) {
                    updated[lastIndex] = {
                      ...last,

                      text:
                        last.text +
                        chunk,

                      loading: false,
                    };
                  }

                  return updated;
                }
              );
            }

            // ==================================================
            // SOURCES
            // ==================================================

            if (
              event.type ===
              "sources"
            ) {
              console.log(
                "Sources:",
                event.data
              );
            }
          } catch (error) {
            console.error(
              "Stream parsing error:",
              error
            );
          }
        }
      }

      // ==========================================================
      // FINAL BUFFER
      // ==========================================================

      if (buffer.trim()) {
        try {
          const event =
            JSON.parse(buffer);

          if (
            event.type === "answer"
          ) {
            const chunk =
              String(
                event.data || ""
              );

            if (chunk) {
              setMessages(
                (previous) => {
                  const updated =
                    [...previous];

                  const lastIndex =
                    updated.length - 1;

                  const last =
                    updated[lastIndex];

                  if (
                    last &&
                    last.type === "bot"
                  ) {
                    updated[lastIndex] = {
                      ...last,

                      text:
                        last.text +
                        chunk,

                      loading: false,
                    };
                  }

                  return updated;
                }
              );
            }
          }
        } catch (error) {
          console.error(
            "Final stream parsing error:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      setMessages(
        (previous) => {
          const updated =
            [...previous];

          if (
            updated.length > 0 &&
            updated[
              updated.length - 1
            ].type === "bot" &&
            updated[
              updated.length - 1
            ].text === ""
          ) {
            updated.pop();
          }

          updated.push({
            text:
              "Sorry, I couldn't connect to the AI right now. Please try again.",
            type: "bot",
          });

          return updated;
        }
      );
    } finally {
      setSending(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }

  // ============================================================
  // ENTER
  // ============================================================

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  // ============================================================
  // RENDER MESSAGE
  // ============================================================

  function renderBotMessage(
    message: Message
  ) {
    if (message.loading) {
      return (
        <div className="searching-animation">
          <span>Searching</span>

          <span className="dots">
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </div>
      );
    }

    /*
    ============================================================
    LINE-BY-LINE ANSWER
    ============================================================
    */

    return (
      <div className="bot-answer">
        {message.text
          .split("\n")
          .map(
            (line, lineIndex) => {
              if (
                !line.trim()
              ) {
                return (
                  <div
                    key={lineIndex}
                    className="answer-space"
                  />
                );
              }

              return (
                <div
                  key={lineIndex}
                  className="answer-line"
                >
                  {line}
                </div>
              );
            }
          )}
      </div>
    );
  }

  return (
    <main className="site">

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <div className="top-bar">

        <div className="top-left">

          <span className="trending-icon">
            ↗
          </span>

          <strong>
            TRENDING
          </strong>

          <span>
            Daily Newsletter
          </span>

        </div>

        <div className="top-right">

          <span>
            FOLLOW US:
          </span>

          <span>f</span>
          <span>𝕏</span>
          <span>◎</span>
          <span>in</span>
          <span>▶</span>

        </div>

      </div>


      {/* ======================================================
          MAIN HEADER
      ====================================================== */}

      <header className="main-header">

      <div className="logo-area">
  <img
    src="/images/logo.png"
    alt="Mining Discovery"
    className="main-logo"
  />
</div>


        <nav className="navigation">

          <a href="#">
            About Us
          </a>

          <a href="#">
            News
            <span>⌄</span>
          </a>

          <a href="#">
            Digital Editions
            <span>⌄</span>
          </a>

          <a href="#">
            Daily Newsletter
          </a>

          <a href="#">
            Services
          </a>

          <a href="#">
            Contact Us
          </a>

        </nav>


        <div className="header-actions">

          <div className="search-box">
            <span>
              ⌕
            </span>

            <input
              placeholder="Search articles..."
            />
          </div>

          <button className="journey-button">
            START YOUR JOURNEY
          </button>

        </div>

      </header>


      {/* ======================================================
          NEWS TICKER
      ====================================================== */}

      <div className="news-ticker">

        <div className="ticker-title">
          LATEST NEWS
        </div>

        <div className="ticker-content">

          <span>
            LBMA snapshot survey predicts
            gold price average near $4,500/oz
          </span>

          <b>|</b>

          <span>
            Global mining industry updates
          </span>

          <b>|</b>

          <span>
            Latest gold and silver developments
          </span>

          <b>|</b>

          <span>
            Mining projects and company news
          </span>

        </div>

      </div>


      {/* ======================================================
          HERO CONTENT
      ====================================================== */}

      <section className="content-wrapper">

        <div className="hero-grid">

          {/* LEFT STORY */}

          <article className="story-card">

            <div className="gold-image">
  <img
    src="/images/side-pic.png"
    alt="Gold mining"
  />

 
</div>

            <div className="story-category">
              LATEST NEWS
            </div>

            <h2>
              LBMA Snapshot Survey
              Predicts Gold Price
              Average Near
              $4,500/Oz By Year-End
            </h2>

            <div className="story-meta">

              <span>
                ♙ BY MINING DISCOVERY
              </span>

              <span>
                ◷ 13 AUGUST 2026
              </span>

            </div>

          </article>


          {/* CENTER STORY */}

          <article className="featured-story">
<div className="discovery-image">
  <img
    src="/images/main-pic.webp"
    alt="Mining Discovery"
  />

  <div className="discovery-overlay">
    
  </div>
</div>

            <div className="featured-label">
              LATEST NEWS
            </div>

            <h1>
              Mining Industry,
              Projects and
              Commodity Intelligence
            </h1>

            <p>
              Discover the latest developments
              across the global mining industry.
            </p>

          </article>


          {/* RIGHT STORIES */}

          <aside className="top-stories">

            <h2>
              Top <span>Stories</span>
            </h2>

            <div className="gold-line">
              <span />
            </div>


            <article className="side-story">

              <div>

                <small>
                  LATEST NEWS
                </small>

                <h3>
                  Canadian Gold
                  Developer Maiden
                  Resources For
                  Second Tanzanian
                  Project
                </h3>

                <p>
                  ◷ 12 AUGUST 2026
                </p>

              </div>

                <div className="story-circle">
    <img
      src="/images/circle2.jpg"
      alt="Canadian gold mining project"
    />
  </div>
            </article>


            <article className="side-story">

              <div>

                <small>
                  LATEST NEWS
                </small>

                <h3>
                  London-Listed
                  Mining Resources
                  Completes Major
                  Project Development
                </h3>

                <p>
                  ◷ 12 AUGUST 2026
                </p>

              </div>
    <div className="story-circle">
    <img
      src="/images/circle1.webp"
      alt="Canadian gold mining project"
    />
  </div>

            </article>

          </aside>

        </div>


        {/* ====================================================
            AI SECTION
        ==================================================== */}

        <section className="ai-section">

          <div className="ai-heading">

            <div className="ai-badge">
              AI
            </div>

            <div>
              <span>
                MINING DISCOVERY
              </span>

              <h2>
                Mining Intelligence
                Assistant
              </h2>
            </div>

          </div>

          <p>
            Ask about mining companies,
            projects, commodities, production,
            exploration and the global mining
            industry.
          </p>

          <button
            className="open-ai-button"
            onClick={openChat}
          >
            ASK MINING DISCOVERY AI
            <span>→</span>
          </button>

        </section>

      </section>


      {/* ======================================================
          CHAT BUTTON
      ====================================================== */}

      {!chatOpen && (
        <button
          className="chat-button-new"
          onClick={openChat}
          aria-label="Open Mining Discovery AI"
        >
          <span className="chat-icon">
            ✦
          </span>

          <span>
            Ask AI
          </span>
        </button>
      )}


      {/* ======================================================
          CHAT WINDOW
      ====================================================== */}

      {chatOpen && (
        <div className="chat-window-new">

          <div className="chat-header-new">

            <div>

              <strong>
                Mining Discovery
              </strong>

              <span>
                AI Assistant
              </span>

            </div>

            <button
              onClick={closeChat}
              aria-label="Close"
            >
              ×
            </button>

          </div>


          <div
            className="chat-messages-new"
            ref={messagesRef}
          >

            {messages.map(
              (message, index) => (

                <div
                  key={index}
                  className={`message-new ${message.type}`}
                >

                  {message.type ===
                  "bot"
                    ? renderBotMessage(
                        message
                      )
                    : (
                      <div>
                        {message.text}
                      </div>
                    )}

                </div>

              )
            )}

          </div>


          <div className="chat-input-new">

            <textarea
              ref={inputRef}
              value={input}
              disabled={sending}
              placeholder="Ask about mining..."
              rows={1}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
            />

            <button
              onClick={sendMessage}
              disabled={sending}
            >
              →
            </button>

          </div>

        </div>
      )}

    </main>
  );
}