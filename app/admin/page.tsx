"use client";

import { useEffect, useState } from "react";

type PendingUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type Message = {
  role: string;
  content: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  updatedAt: string;
  messages: Message[];
};

export default function AdminPage() {

  const [currentTime, setCurrentTime] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // SELECTED CONVERSATION
  // ============================================================

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id === selectedConversationId
    ) || null;

  // ============================================================
  // COUNTS
  // ============================================================

  const conversationCount = conversations.length;

  const pendingCount = pendingUsers.length;

  const totalMessages = conversations.reduce(
    (total, conversation) =>
      total + conversation.messages.length,
    0
  );

  // ============================================================
  // CHECK ADMIN LOGIN
  // ============================================================

  async function checkAdminLogin() {
    try {
      const response = await fetch("/api/admin/check", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Login check failed");
      }

      const data = await response.json();

      if (!data.authenticated) {
        window.location.href = "/admin-login";
        return false;
      }

      return true;
    } catch (error) {
      console.error("Admin login check error:", error);

      setError("Could not connect to the AI server.");

      return false;
    }
  }

  // ============================================================
  // LOAD CONVERSATIONS
  // ============================================================

  async function loadConversations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/conversations",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin-login";
          return;
        }

        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Conversation loading error:",
        error
      );

      setError(
        "Could not connect to the AI server."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD PENDING USERS
  // ============================================================

  async function loadPendingUsers() {
    setPendingLoading(true);

    try {
      const response = await fetch(
        "/api/admin/users/pending",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin-login";
          return;
        }

        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      setPendingUsers(
        Array.isArray(data.users)
          ? data.users
          : []
      );
    } catch (error) {
      console.error(
        "Pending users loading error:",
        error
      );
    } finally {
      setPendingLoading(false);
    }
  }

  // ============================================================
  // REFRESH EVERYTHING
  // ============================================================

  async function refreshDashboard() {
    await Promise.all([
      loadConversations(),
      loadPendingUsers(),
    ]);
  }

  // ============================================================
  // APPROVE / REJECT USER
  // ============================================================

  async function updateUserStatus(
    userId: string,
    status: "APPROVED" | "REJECTED"
  ) {
    const action =
      status === "APPROVED"
        ? "accept"
        : "decline";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this registration?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not update user."
        );
      }

      await loadPendingUsers();
    } catch (error) {
      console.error(
        "User approval error:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Could not update user."
      );
    }
  }

  // ============================================================
  // DELETE CONVERSATION
  // ============================================================

  async function deleteConversation() {
    if (!selectedConversationId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this conversation?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/conversations/${selectedConversationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setSelectedConversationId(null);

      await loadConversations();
    } catch (error) {
      console.error(
        "Delete conversation error:",
        error
      );

      window.alert(
        "Could not delete conversation."
      );
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function logout() {
    try {
      await fetch(
        "/api/admin/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    window.location.href = "/admin-login";
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
  // Set browser time only after hydration
  setCurrentTime(new Date().toLocaleTimeString());

  async function start() {
    const loggedIn = await checkAdminLogin();

    if (!loggedIn) {
      return;
    }

    await Promise.all([
      loadConversations(),
      loadPendingUsers(),
    ]);
  }

  start();
}, []);

  // ============================================================
  // SORT CONVERSATIONS
  // ============================================================

  const sortedConversations =
    [...conversations].sort(
      (a, b) =>
        new Date(
          b.updatedAt
        ).getTime() -
        new Date(
          a.updatedAt
        ).getTime()
    );

  // Show only latest 5 in dashboard
  const recentConversations =
    sortedConversations.slice(0, 5);

  // ============================================================
  // GET FIRST CLIENT MESSAGE
  // ============================================================

  function getConversationPreview(
    conversation: Conversation
  ) {
    const firstClientMessage =
      conversation.messages.find(
        (message) =>
          message.role === "client"
      );

    return firstClientMessage
      ? firstClientMessage.content
      : "No message";
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

 <aside className="admin-sidebar">

  <div className="admin-logo">

    <img
      src="/images/logo.png"
      alt="Mining Discovery"
      className="admin-logo-image"
    />

    <span className="admin-logo-subtitle">
      AI Assistant — Admin
    </span>

  </div>


        <nav className="admin-nav">

          <button
            className="nav-item active"
            type="button"
          >
            <span>▦</span>
            Dashboard
          </button>


          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document
                .getElementById(
                  "conversations-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>◫</span>
            Conversations
          </button>


          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document
                .getElementById(
                  "pending-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>♙</span>
            Registrations
          </button>

        </nav>


        <div className="sidebar-bottom">

          <button
            className="nav-item"
            type="button"
            onClick={logout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="admin-main">


        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header className="admin-topbar">

          <div className="breadcrumb">

            <span>Admin</span>

            <span>›</span>

            <strong>
              Dashboard
            </strong>

          </div>


          <div className="admin-profile">

            <div className="profile-circle">
              A
            </div>

            <span>
              Admin
            </span>

          </div>

        </header>


        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="admin-content">


          {/* ==================================================
              PAGE HEADING
          ================================================== */}

          <div className="page-heading">

            <div>

              <h1>
                Dashboard
              </h1>

              <p>
                Mining Discovery AI assistant
                overview and system statistics.
              </p>

            </div>


            <div className="heading-actions">

          <span className="updated-text">
  {currentTime
    ? `Updated ${currentTime}`
    : "Updated"}
</span>
              <button
                className="refresh-button"
                type="button"
                onClick={
                  refreshDashboard
                }
                disabled={
                  loading ||
                  pendingLoading
                }
              >
                ↻ Refresh
              </button>

            </div>

          </div>


          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <div className="stats-grid">


            {/* CONVERSATIONS */}

            <div className="stat-card">

              <div className="stat-card-top">

                <span>
                  CONVERSATIONS
                </span>

                <div className="stat-icon">
                  ◫
                </div>

              </div>

              <strong>
                {conversationCount}
              </strong>

              <div className="stat-link">
                Total conversations
              </div>

            </div>


            {/* MESSAGES */}

            <div className="stat-card">

              <div className="stat-card-top">

                <span>
                  TOTAL MESSAGES
                </span>

                <div className="stat-icon">
                  ≡
                </div>

              </div>

              <strong>
                {totalMessages}
              </strong>

              <div className="stat-link">
                Client + AI messages
              </div>

            </div>


            {/* PENDING */}

            <div className="stat-card">

              <div className="stat-card-top">

                <span>
                  PENDING REGISTRATIONS
                </span>

                <div className="stat-icon">
                  ♙
                </div>

              </div>

              <strong>
                {pendingCount}
              </strong>

              <div className="stat-link">
                Awaiting approval
              </div>

            </div>


            {/* AI STATUS */}

            <div className="stat-card">

              <div className="stat-card-top">

                <span>
                  AI ASSISTANT
                </span>

                <div className="stat-icon">
                  ✦
                </div>

              </div>

              <strong>
                Active
              </strong>

              <div className="stat-link">
                System status
              </div>

            </div>

          </div>


          {/* ==================================================
              SECONDARY STATS
          ================================================== */}

          <div className="secondary-stats">

            <div className="secondary-stat">

              <span>
                RECENT CONVERSATIONS
              </span>

              <strong>
                {recentConversations.length}
              </strong>

            </div>


            <div className="secondary-stat">

              <span>
                PENDING USERS
              </span>

              <strong>
                {pendingCount}
              </strong>

            </div>


            <div className="secondary-stat">

              <span>
                SELECTED CONVERSATION
              </span>

              <strong>
                {selectedConversation
                  ? "1"
                  : "0"}
              </strong>

            </div>

          </div>


          {/* ==================================================
              LOWER PANELS
          ================================================== */}

          <div className="dashboard-panels">


            {/* =================================================
                PENDING REGISTRATIONS
            ================================================= */}

            <section
              id="pending-section"
              className="dashboard-panel"
            >

              <div className="panel-header">

                <div>

                  <h2>
                    Pending Registrations
                  </h2>

                  <p>
                    Users waiting for approval
                  </p>

                </div>


                <div className="panel-count">
                  {pendingCount}
                </div>

              </div>


              <div className="panel-body">

                {pendingLoading ? (

                  <div className="empty-message">
                    Loading registrations...
                  </div>

                ) : pendingUsers.length ===
                  0 ? (

                  <div className="empty-message">
                    No pending registrations.
                  </div>

                ) : (

                  pendingUsers.map(
                    (user) => (

                      <div
                        className="pending-user"
                        key={user.id}
                      >

                        <div className="user-info">

                          <div className="user-avatar">
                            {user.username
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {user.username}
                            </strong>

                            <span>
                              {user.email}
                            </span>

                            <small>
                              {user.role}
                            </small>

                          </div>

                        </div>


                        <div className="user-actions">

                          <button
                            type="button"
                            className="accept-button"
                            onClick={() =>
                              updateUserStatus(
                                user.id,
                                "APPROVED"
                              )
                            }
                          >
                            Accept
                          </button>


                          <button
                            type="button"
                            className="decline-button"
                            onClick={() =>
                              updateUserStatus(
                                user.id,
                                "REJECTED"
                              )
                            }
                          >
                            Decline
                          </button>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            </section>


            {/* =================================================
                RECENT CONVERSATIONS
            ================================================= */}

            <section
              id="conversations-section"
              className="dashboard-panel"
            >

              <div className="panel-header">

                <div>

                  <h2>
                    Recent Conversations
                  </h2>

                  <p>
                    Latest Mining Discovery AI chats
                  </p>

                </div>


                <div className="panel-count">
                  {conversationCount}
                </div>

              </div>


              <div className="panel-body">

                {loading ? (

                  <div className="empty-message">
                    Loading conversations...
                  </div>

                ) : error ? (

                  <div className="empty-message">
                    {error}
                  </div>

                ) : recentConversations.length ===
                  0 ? (

                  <div className="empty-message">
                    No conversations yet.
                  </div>

                ) : (

                  recentConversations.map(
                    (conversation) => {

                      const preview =
                        getConversationPreview(
                          conversation
                        );

                      const date =
                        new Date(
                          conversation.updatedAt
                        );

                      return (

                        <button
                          key={
                            conversation.id
                          }
                          type="button"
                          className="recent-conversation"
                          onClick={() => {
                            setSelectedConversationId(
                              conversation.id
                            );

                            setTimeout(() => {
                              document
                                .getElementById(
                                  "conversation-detail"
                                )
                                ?.scrollIntoView({
                                  behavior:
                                    "smooth",
                                });
                            }, 50);
                          }}
                        >

                          <div className="conversation-info">

                            <strong>
                              {preview}
                            </strong>

                            <span>
                              {date.toLocaleString()}
                            </span>

                          </div>


                          <div className="conversation-messages">

                            {
                              conversation
                                .messages
                                .length
                            }{" "}
                            messages

                          </div>

                        </button>

                      );
                    }
                  )

                )}

              </div>


              {conversationCount > 5 && (

                <button
                  type="button"
                  className="view-all-button"
                  onClick={() =>
                    document
                      .getElementById(
                        "conversation-detail"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  View all conversations →
                </button>

              )}

            </section>

          </div>


          {/* ==================================================
              CONVERSATION DETAIL
          ================================================== */}

          <section
            id="conversation-detail"
            className="conversation-detail-panel"
          >

            <div className="panel-header">

              <div>

                <h2>
                  Conversations
                </h2>

                <p>
                  Select a conversation to view
                  the complete client and AI chat.
                </p>

              </div>


              <div className="panel-count">
                {conversationCount}
              </div>

            </div>


            <div className="conversation-layout">


              {/* =================================================
                  CONVERSATION LIST
              ================================================= */}

              <div className="conversation-list">

                {sortedConversations.length ===
                0 ? (

                  <div className="empty-message">
                    No conversations.
                  </div>

                ) : (

                  sortedConversations.map(
                    (conversation) => {

                      const preview =
                        getConversationPreview(
                          conversation
                        );

                      const date =
                        new Date(
                          conversation.updatedAt
                        );

                      return (

                        <button
                          key={
                            conversation.id
                          }
                          type="button"
                          className={`conversation-list-item ${
                            conversation.id ===
                            selectedConversationId
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedConversationId(
                              conversation.id
                            )
                          }
                        >

                          <strong>
                            {preview}
                          </strong>

                          <span>
                            {date.toLocaleString()}
                          </span>

                          <small>
                            {
                              conversation
                                .messages
                                .length
                            }{" "}
                            messages
                          </small>

                        </button>

                      );
                    }
                  )

                )}

              </div>


              {/* =================================================
                  CONVERSATION VIEW
              ================================================= */}

              <div className="conversation-view">

                {!selectedConversation ? (

                  <div className="empty-conversation">

                    <h3>
                      Select a conversation
                    </h3>

                    <p>
                      Choose a conversation from
                      the list to view the complete
                      client and AI chat.
                    </p>

                  </div>

                ) : (

                  <>

                    <div className="conversation-view-header">

                      <h3>
                        Conversation
                      </h3>


                      <button
                        type="button"
                        className="delete-button"
                        onClick={
                          deleteConversation
                        }
                      >
                        Delete
                      </button>

                    </div>


                    <div className="messages-container">

                      {selectedConversation.messages.map(
                        (
                          message,
                          index
                        ) => (

                          <div
                            key={index}
                            className={`admin-message ${
                              message.role ===
                              "client"
                                ? "client"
                                : "ai"
                            }`}
                          >

                            <div className="message-role">
                              {message.role ===
                              "client"
                                ? "CLIENT"
                                : "AI"}
                            </div>


                            <div className="message-content">
                              {message.content}
                            </div>


                            <div className="message-time">
                              {new Date(
                                message.timestamp
                              ).toLocaleString()}
                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </>

                )}

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}