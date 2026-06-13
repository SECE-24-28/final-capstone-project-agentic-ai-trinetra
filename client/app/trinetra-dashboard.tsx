"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_TRINETRA_API_URL ?? "http://127.0.0.1:8000";

type ApiState = "idle" | "loading" | "ready" | "error";

type Health = {
  status?: string;
  service?: string;
  version?: string;
  mongodb?: string;
  redis?: string;
};

type RootInfo = {
  name?: string;
  version?: string;
  environment?: string;
  ai_provider?: string;
};

type SystemStatus = {
  status?: string;
  service?: string;
  version?: string;
  mongodb?: string;
  redis?: string;
  groq?: string;
  gpu?: { available?: boolean; device_count?: number; device_name?: string | null };
  cameras?: { total?: number; active?: number };
  active_connections?: number;
  uptime?: { seconds?: number; formatted?: string };
  timestamp?: string;
  message?: string;
};

type SystemMetrics = {
  cpu?: { usage_percent?: number; cores?: number };
  memory?: { total_bytes?: number; available_bytes?: number; used_bytes?: number; usage_percent?: number };
  disk?: { total_bytes?: number; used_bytes?: number; free_bytes?: number; usage_percent?: number };
  cameras?: { total?: number };
  active_connections?: number;
  uptime_seconds?: number;
  timestamp?: string;
  status?: string;
  message?: string;
};

type Analytics = {
  total_events?: number;
  total_alerts?: number;
  threat_distribution?: Record<string, number>;
  zone_activity?: Record<string, number>;
  camera_activity?: Record<string, number>;
  hourly_detections?: Record<string, number>;
  daily_detections?: Record<string, number>;
  weekly_detections?: Record<string, number>;
  average_ai_latency?: number;
  average_yolo_latency?: number;
};

type Camera = {
  id: string;
  name: string;
  zone: string;
  stream_url: string;
  status?: string;
  fps?: number | null;
  last_heartbeat?: string | null;
  created_at?: string;
  updated_at?: string;
};

type EventRecord = {
  id: string;
  event_id: string;
  camera_id: string;
  zone: string;
  timestamp: string;
  movement?: boolean;
  objects?: Array<{ type: string; confidence: number; tracking_id: number }>;
  confidence?: number;
  threat_category?: string | null;
  threat_level?: string | null;
  ai_summary?: string | null;
  recommended_action?: string | null;
  status?: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
};

type UserDraft = {
  username: string;
  email: string;
  password: string;
  role: string;
  full_name: string;
};

type NotificationPayload = {
  priority?: string;
  zone?: string;
  camera_id?: string;
  message?: string;
  event_id?: string;
  threat_category?: string;
  recommended_action?: string;
};

type Toast = {
  id: number;
  title: string;
  message: string;
  tone: "info" | "success" | "warning" | "danger";
};

type CameraDraft = {
  name: string;
  zone: string;
  stream_url: string;
};

type EventFilters = {
  zone: string;
  threat_level: string;
  status: string;
};

type EndpointRow = {
  method: string;
  path: string;
  auth: string;
  purpose: string;
  mapped: string;
};

const endpoints: EndpointRow[] = [
  { method: "GET", path: "/", auth: "open", purpose: "API identity", mapped: "Service header" },
  { method: "GET", path: "/health", auth: "open", purpose: "MongoDB and Redis health", mapped: "Health strip" },
  { method: "POST", path: "/auth/login", auth: "form", purpose: "JWT issue", mapped: "Access panel" },
  { method: "GET", path: "/auth/me", auth: "bearer", purpose: "Current operator", mapped: "Session card" },
  { method: "POST", path: "/auth/register", auth: "admin", purpose: "Create operator user", mapped: "User registration form" },
  { method: "GET", path: "/auth/users", auth: "admin", purpose: "User roster", mapped: "Users table" },
  { method: "GET", path: "/system/status", auth: "bearer", purpose: "Service dependencies", mapped: "System panel" },
  { method: "GET", path: "/system/metrics", auth: "bearer", purpose: "CPU, memory, disk", mapped: "Resource panel" },
  { method: "GET", path: "/analytics", auth: "bearer", purpose: "Detection intelligence", mapped: "Analytics grid" },
  { method: "GET", path: "/cameras", auth: "bearer", purpose: "Camera inventory", mapped: "Camera table" },
  { method: "POST", path: "/cameras", auth: "bearer", purpose: "Register camera", mapped: "Camera form" },
  { method: "DELETE", path: "/cameras/{id}", auth: "bearer", purpose: "Remove camera", mapped: "Camera actions" },
  { method: "GET", path: "/alerts / /events", auth: "bearer", purpose: "Detection events", mapped: "Event feed" },
  { method: "WS", path: "/ws", auth: "open", purpose: "Live notifications", mapped: "Popup toast" },
];

function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(1)}%`;
}

function formatCount(value?: number) {
  return value === undefined ? "0" : Intl.NumberFormat().format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusTone(status?: string | null): "info" | "success" | "warning" | "danger" {
  const normalized = status?.toLowerCase();
  if (!normalized) return "info";
  if (["ok", "healthy", "connected", "online", "resolved", "acknowledged"].includes(normalized)) return "success";
  if (["degraded", "processing", "motion_detected", "yolo_analyzed", "ai_analyzed", "notified"].includes(normalized)) return "warning";
  if (["error", "critical", "high", "offline", "disconnected"].includes(normalized)) return "danger";
  return "info";
}

function wsUrlFromApi(apiUrl: string) {
  try {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    return url.toString();
  } catch {
    return "ws://127.0.0.1:8000/ws";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function notificationFromMessage(value: unknown): NotificationPayload | null {
  if (!isRecord(value)) return null;
  if (value.type === "heartbeat") return { message: "Backend heartbeat received", priority: "LOW" };
  if (value.type !== "notification" || !isRecord(value.data)) return null;
  return value.data as NotificationPayload;
}

export function TrinetraDashboard() {
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<ApiState>("idle");
  const [error, setError] = useState("");
  const [rootInfo, setRootInfo] = useState<RootInfo | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [wsState, setWsState] = useState<"offline" | "connecting" | "connected" | "error">("offline");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cameraDraft, setCameraDraft] = useState<CameraDraft>({
    name: "North Gate Camera",
    zone: "Sector A",
    stream_url: "rtsp://127.0.0.1:554/stream1",
  });
  const [userDraft, setUserDraft] = useState<UserDraft>({
    username: "operator1",
    email: "operator1@example.com",
    password: "",
    role: "viewer",
    full_name: "",
  });
  const [filters, setFilters] = useState<EventFilters>({ zone: "", threat_level: "", status: "" });
  const wsRef = useRef<WebSocket | null>(null);
  const toastId = useRef(1);

  const authorized = token.trim().length > 0;
  const wsUrl = useMemo(() => wsUrlFromApi(apiUrl), [apiUrl]);

  const pushToast = useCallback((title: string, message: string, tone: Toast["tone"] = "info") => {
    const id = toastId.current;
    toastId.current += 1;
    setToasts((current) => [{ id, title, message, tone }, ...current].slice(0, 4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  const apiFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (authorized) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

      const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
      if (!response.ok) {
        let message = `${response.status} ${response.statusText}`;
        try {
          const payload = (await response.json()) as { detail?: string };
          if (payload.detail) message = payload.detail;
        } catch {
          // Keep the HTTP status message when the backend has no JSON body.
        }
        throw new Error(message);
      }

      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [apiUrl, authorized, token],
  );

  const loadOpenEndpoints = useCallback(async () => {
    const [rootResult, healthResult] = await Promise.allSettled([
      apiFetch<RootInfo>("/"),
      apiFetch<Health>("/health"),
    ]);
    if (rootResult.status === "fulfilled") setRootInfo(rootResult.value);
    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    if (rootResult.status === "rejected" && healthResult.status === "rejected") {
      throw healthResult.reason instanceof Error ? healthResult.reason : new Error("Backend is unreachable");
    }
  }, [apiFetch]);

  const loadProtectedEndpoints = useCallback(async () => {
    if (!authorized) return;
    const query = new URLSearchParams({ limit: "25" });
    if (filters.zone) query.set("zone", filters.zone);
    if (filters.threat_level) query.set("threat_level", filters.threat_level);
    if (filters.status) query.set("status", filters.status);

    const [meResult, statusResult, metricsResult, analyticsResult, camerasResult, eventsResult, usersResult] =
      await Promise.allSettled([
        apiFetch<User>("/auth/me"),
        apiFetch<SystemStatus>("/system/status"),
        apiFetch<SystemMetrics>("/system/metrics"),
        apiFetch<Analytics>("/analytics"),
        apiFetch<Camera[]>("/cameras?limit=100"),
        apiFetch<EventRecord[]>(`/events?${query.toString()}`),
        apiFetch<User[]>("/auth/users"),
      ]);

    if (meResult.status === "fulfilled") setMe(meResult.value);
    if (statusResult.status === "fulfilled") setSystemStatus(statusResult.value);
    if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
    if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
    if (camerasResult.status === "fulfilled") setCameras(camerasResult.value);
    if (eventsResult.status === "fulfilled") setEvents(eventsResult.value);
    if (usersResult.status === "fulfilled") setUsers(usersResult.value);

    const firstError = [meResult, statusResult, metricsResult, analyticsResult, camerasResult, eventsResult].find(
      (result) => result.status === "rejected",
    );
    if (firstError?.status === "rejected") {
      throw firstError.reason instanceof Error ? firstError.reason : new Error("A protected endpoint failed");
    }
  }, [apiFetch, authorized, filters.status, filters.threat_level, filters.zone]);

  const refreshAll = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      await loadOpenEndpoints();
      await loadProtectedEndpoints();
      setState("ready");
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Unable to reach Trinetra backend";
      setError(message);
      setState("error");
    }
  }, [loadOpenEndpoints, loadProtectedEndpoints]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => window.clearTimeout(initialRefresh);
  }, [refreshAll]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadOpenEndpoints().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadOpenEndpoints]);

  const connectWebSocket = useCallback(() => {
    wsRef.current?.close();
    setWsState("connecting");
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.addEventListener("open", () => {
      setWsState("connected");
      pushToast("WebSocket online", "Live notification channel is connected.", "success");
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = notificationFromMessage(JSON.parse(event.data as string));
        if (!payload) return;
        const priority = payload.priority ?? "LOW";
        const title = priority === "LOW" ? "Trinetra detected presence" : `${priority} notification`;
        const message = payload.message ?? `${payload.threat_category ?? "Activity"} at ${payload.zone ?? "unknown zone"}`;
        pushToast(title, message, statusTone(priority));
      } catch {
        pushToast("Notification received", String(event.data), "info");
      }
    });

    socket.addEventListener("error", () => {
      setWsState("error");
      pushToast("WebSocket error", "Unable to maintain live notification channel.", "danger");
    });

    socket.addEventListener("close", () => {
      setWsState((current) => (current === "error" ? "error" : "offline"));
    });
  }, [pushToast, wsUrl]);

  const disconnectWebSocket = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setWsState("offline");
  }, []);

  useEffect(() => () => wsRef.current?.close(), []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setError("");
    try {
      const body = new URLSearchParams();
      body.set("username", username);
      body.set("password", password);
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Invalid username or password" : `${response.status} ${response.statusText}`);
      const payload = (await response.json()) as { access_token: string };
      setToken(payload.access_token);
      pushToast("Access token accepted", "Authenticated backend endpoints are now available.", "success");
      setState("ready");
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Login failed";
      setError(message);
      setState("error");
    }
  }

  async function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await refreshAll();
  }

  async function createCamera(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiFetch<Camera>("/cameras", { method: "POST", body: JSON.stringify(cameraDraft) });
      pushToast("Camera registered", `${cameraDraft.name} was sent to /cameras.`, "success");
      await refreshAll();
    } catch (createError) {
      pushToast("Camera registration failed", createError instanceof Error ? createError.message : "Unknown error", "danger");
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authorized) {
      pushToast("Authentication required", "Paste an admin bearer token in Access control before creating users.", "warning");
      return;
    }
    try {
      const payload = {
        username: userDraft.username.trim(),
        email: userDraft.email.trim(),
        password: userDraft.password,
        role: userDraft.role,
        ...(userDraft.full_name.trim() ? { full_name: userDraft.full_name.trim() } : {}),
      };
      await apiFetch<User>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
      pushToast("User registered", `${payload.username} was added to the operator roster.`, "success");
      setUserDraft((draft) => ({ ...draft, password: "", full_name: "" }));
      await refreshAll();
    } catch (createError) {
      pushToast("User registration failed", createError instanceof Error ? createError.message : "Unknown error", "danger");
    }
  }

  async function deleteCamera(cameraId: string) {
    try {
      await apiFetch<void>(`/cameras/${encodeURIComponent(cameraId)}`, { method: "DELETE" });
      pushToast("Camera removed", `${cameraId} was deleted.`, "warning");
      await refreshAll();
    } catch (deleteError) {
      pushToast("Delete failed", deleteError instanceof Error ? deleteError.message : "Unknown error", "danger");
    }
  }

  const totalThreats = Object.values(analytics?.threat_distribution ?? {}).reduce((sum, value) => sum + value, 0);

  return (
    <main className="console-shell">
      <aside className="sidebar" aria-label="Trinetra navigation">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <p className="brand-name">Trinetra</p>
            <p className="brand-subtitle">AI Surveillance Backend</p>
          </div>
        </div>
        <nav className="nav-list">
          {["Overview", "Access", "System", "Cameras", "Events", "Analytics", "API Map"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}>
              {item}
            </a>
          ))}
        </nav>
        <div className="sidebar-status">
          <StatusPill label={health?.status ?? "unknown"} tone={statusTone(health?.status)} />
          <span>{apiUrl}</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar" id="overview">
          <div>
            <p className="kicker">MVP Operations Console</p>
            <h1>Backend capability map for Trinetra.</h1>
            <p className="lede">
              Authenticate, inspect service readiness, register cameras, review detection events, and connect to live backend notifications.
            </p>
          </div>
          <div className="topbar-actions">
            <button className="button button-secondary" type="button" onClick={() => void refreshAll()}>
              Refresh all
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={wsState === "connected" || wsState === "connecting" ? disconnectWebSocket : connectWebSocket}
            >
              {wsState === "connected" || wsState === "connecting" ? "Stop live channel" : "Start live channel"}
            </button>
          </div>
        </header>

        {error ? <div className="alert-banner">Backend response: {error}</div> : null}

        <section className="status-grid" aria-label="System summary">
          <MetricCard label="Backend" value={rootInfo?.name ?? health?.service ?? "Trinetra"} meta={rootInfo?.environment ?? "environment pending"} tone={statusTone(health?.status)} />
          <MetricCard label="Events" value={formatCount(analytics?.total_events)} meta={`${formatCount(analytics?.total_alerts)} alert-grade`} tone="info" />
          <MetricCard label="Cameras" value={formatCount(systemStatus?.cameras?.total ?? cameras.length)} meta={`${formatCount(systemStatus?.cameras?.active)} active reported`} tone={statusTone(cameras[0]?.status)} />
          <MetricCard label="Live channel" value={wsState} meta={wsUrl} tone={statusTone(wsState)} />
        </section>

        <section className="panel-grid two">
          <Panel title="Access control" id="access" meta="/auth/login · /auth/me · /auth/users">
            <form className="form-grid" onSubmit={login}>
              <label className="wide-field">
                Backend URL
                <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="http://127.0.0.1:8000" />
              </label>
              <label>
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" autoComplete="username" />
              </label>
              <label>
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="minimum 8 characters" type="password" autoComplete="current-password" />
              </label>
              <button className="button button-primary" type="submit">Login</button>
            </form>
            <form className="token-form" onSubmit={saveToken}>
              <label>
                Bearer token
                <textarea value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste an existing JWT here for demo access" />
              </label>
              <button className="button button-secondary" type="submit">Use token</button>
            </form>
            <div className="session-card">
              <StatusPill label={authorized ? "authenticated" : "open endpoints only"} tone={authorized ? "success" : "warning"} />
              <span>{me ? `${me.username} · ${me.role}` : "No operator profile loaded"}</span>
            </div>
          </Panel>

          <Panel title="Health and dependencies" id="system" meta="/health · /system/status">
            <div className="dependency-list">
              <Dependency label="MongoDB" value={systemStatus?.mongodb ?? health?.mongodb} />
              <Dependency label="Redis" value={systemStatus?.redis ?? health?.redis} />
              <Dependency label="Groq AI" value={systemStatus?.groq ?? "auth required"} />
              <Dependency label="GPU" value={systemStatus?.gpu?.available ? `${systemStatus.gpu.device_count ?? 1} device` : "not available"} />
              <Dependency label="WebSocket clients" value={String(systemStatus?.active_connections ?? 0)} />
              <Dependency label="Uptime" value={systemStatus?.uptime?.formatted ?? "pending"} />
            </div>
          </Panel>
        </section>

        <section className="panel-grid two">
          <Panel title="Resource metrics" meta="/system/metrics">
            <div className="meter-stack">
              <Meter label="CPU" value={metrics?.cpu?.usage_percent} detail={`${metrics?.cpu?.cores ?? "n/a"} cores`} />
              <Meter label="Memory" value={metrics?.memory?.usage_percent} detail={bytesLabel(metrics?.memory?.used_bytes, metrics?.memory?.total_bytes)} />
              <Meter label="Disk" value={metrics?.disk?.usage_percent} detail={bytesLabel(metrics?.disk?.used_bytes, metrics?.disk?.total_bytes)} />
            </div>
          </Panel>

          <Panel title="Threat intelligence" id="analytics" meta="/analytics">
            <div className="threat-grid">
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((level) => {
                const value = analytics?.threat_distribution?.[level] ?? analytics?.threat_distribution?.[level.toLowerCase()] ?? 0;
                const width = totalThreats > 0 ? (value / totalThreats) * 100 : 0;
                return (
                  <div className="threat-row" key={level}>
                    <span>{level}</span>
                    <div className="bar-track"><span style={{ width: `${width}%` }} /></div>
                    <strong>{value}</strong>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <section className="panel-grid two">
          <Panel title="Camera registry" id="cameras" meta="/cameras">
            <form className="camera-form" onSubmit={createCamera}>
              <label>
                Name
                <input value={cameraDraft.name} onChange={(event) => setCameraDraft((draft) => ({ ...draft, name: event.target.value }))} />
              </label>
              <label>
                Zone
                <input value={cameraDraft.zone} onChange={(event) => setCameraDraft((draft) => ({ ...draft, zone: event.target.value }))} />
              </label>
              <label className="wide-field">
                Stream URL
                <input value={cameraDraft.stream_url} onChange={(event) => setCameraDraft((draft) => ({ ...draft, stream_url: event.target.value }))} />
              </label>
              <button className="button button-primary" type="submit" disabled={!authorized}>Register camera</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Camera</th><th>Zone</th><th>Status</th><th>FPS</th><th /></tr>
                </thead>
                <tbody>
                  {cameras.length === 0 ? (
                    <tr><td colSpan={5}>No cameras returned yet. Login and refresh to load the registry.</td></tr>
                  ) : cameras.map((camera) => (
                    <tr key={camera.id}>
                      <td><span className="mono">{camera.id}</span><br />{camera.name}</td>
                      <td>{camera.zone}</td>
                      <td><StatusPill label={camera.status ?? "unknown"} tone={statusTone(camera.status)} /></td>
                      <td>{camera.fps ?? "n/a"}</td>
                      <td><button className="button button-danger" type="button" onClick={() => void deleteCamera(camera.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Alerts and events" id="events" meta="/alerts · /events">
            <form className="filter-row" onSubmit={(event) => { event.preventDefault(); void refreshAll(); }}>
              <input value={filters.zone} onChange={(event) => setFilters((draft) => ({ ...draft, zone: event.target.value }))} placeholder="Zone filter" />
              <select value={filters.threat_level} onChange={(event) => setFilters((draft) => ({ ...draft, threat_level: event.target.value }))}>
                <option value="">Any threat</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <select value={filters.status} onChange={(event) => setFilters((draft) => ({ ...draft, status: event.target.value }))}>
                <option value="">Any status</option>
                <option value="created">created</option>
                <option value="processing">processing</option>
                <option value="notified">notified</option>
                <option value="acknowledged">acknowledged</option>
                <option value="resolved">resolved</option>
              </select>
              <button className="button button-secondary" type="submit">Apply</button>
            </form>
            <div className="event-feed">
              {events.length === 0 ? (
                <div className="empty-state">No events returned. Generate detections in the backend or clear filters after login.</div>
              ) : events.map((event) => (
                <article className="event-row" key={event.id}>
                  <div>
                    <StatusPill label={event.threat_level ?? "UNRATED"} tone={statusTone(event.threat_level)} />
                    <h3>{event.threat_category ?? "Detection event"}</h3>
                    <p>{event.ai_summary ?? event.recommended_action ?? "Awaiting AI summary from backend."}</p>
                  </div>
                  <dl>
                    <div><dt>Camera</dt><dd>{event.camera_id}</dd></div>
                    <div><dt>Zone</dt><dd>{event.zone}</dd></div>
                    <div><dt>Objects</dt><dd>{event.objects?.length ?? 0}</dd></div>
                    <div><dt>Time</dt><dd>{formatDate(event.timestamp)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="panel-grid two">
          <Panel title="Operator users" meta="/auth/register · /auth/users">
            <form className="form-grid" onSubmit={createUser}>
              <label>
                Username
                <input value={userDraft.username} onChange={(event) => setUserDraft((draft) => ({ ...draft, username: event.target.value }))} placeholder="new.operator" />
              </label>
              <label>
                Email
                <input value={userDraft.email} onChange={(event) => setUserDraft((draft) => ({ ...draft, email: event.target.value }))} placeholder="new.operator@example.com" type="email" />
              </label>
              <label>
                Password
                <input value={userDraft.password} onChange={(event) => setUserDraft((draft) => ({ ...draft, password: event.target.value }))} placeholder="minimum 8 characters" type="password" />
              </label>
              <label>
                Role
                <select value={userDraft.role} onChange={(event) => setUserDraft((draft) => ({ ...draft, role: event.target.value }))}>
                  <option value="admin">admin</option>
                  <option value="command_officer">command_officer</option>
                  <option value="regional_officer">regional_officer</option>
                  <option value="soldier">soldier</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
              <label className="wide-field">
                Full name
                <input value={userDraft.full_name} onChange={(event) => setUserDraft((draft) => ({ ...draft, full_name: event.target.value }))} placeholder="Optional display name" />
              </label>
              <p className="hint-text wide-field">Requires an admin bearer token from the Access control panel.</p>
              <button className="button button-primary" type="submit">Create user</button>
            </form>
            <div className="user-list">
              {users.length === 0 ? (
                <div className="empty-state">Admin user roster will appear here when the token has manage-users permission.</div>
              ) : users.map((user) => (
                <div className="user-row" key={user.id}>
                  <div><strong>{user.full_name ?? user.username}</strong><span>{user.email}</span></div>
                  <StatusPill label={user.role} tone={user.is_active ? "success" : "danger"} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Backend endpoint map" id="api-map" meta="Implemented surface coverage">
            <div className="endpoint-list">
              {endpoints.map((endpoint) => (
                <div className="endpoint-row" key={`${endpoint.method}-${endpoint.path}`}>
                  <span className="method">{endpoint.method}</span>
                  <span className="mono">{endpoint.path}</span>
                  <span>{endpoint.purpose}</span>
                  <StatusPill label={endpoint.mapped} tone={endpoint.auth === "open" ? "info" : "success"} />
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </section>

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className={`loading-line ${state === "loading" ? "is-active" : ""}`} />
    </main>
  );
}

function bytesLabel(used?: number, total?: number) {
  if (!used || !total) return "bytes pending";
  const gb = 1024 ** 3;
  return `${(used / gb).toFixed(1)} GB / ${(total / gb).toFixed(1)} GB`;
}

function StatusPill({ label, tone }: { label: string; tone: "info" | "success" | "warning" | "danger" }) {
  return <span className={`status-pill status-${tone}`}>{label}</span>;
}

function MetricCard({ label, value, meta, tone }: { label: string; value: string; meta: string; tone: "info" | "success" | "warning" | "danger" }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{meta}</p>
    </article>
  );
}

function Panel({ title, meta, id, children }: { title: string; meta?: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="panel" id={id}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {meta ? <p>{meta}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Dependency({ label, value }: { label: string; value?: string }) {
  return (
    <div className="dependency-row">
      <span>{label}</span>
      <StatusPill label={value ?? "pending"} tone={statusTone(value)} />
    </div>
  );
}

function Meter({ label, value, detail }: { label: string; value?: number; detail: string }) {
  const safeValue = Math.max(0, Math.min(value ?? 0, 100));
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <strong>{formatPercent(value)}</strong>
      </div>
      <div className="meter-track" aria-hidden="true">
        <span style={{ width: `${safeValue}%` }} />
      </div>
      <p>{detail}</p>
    </div>
  );
}
