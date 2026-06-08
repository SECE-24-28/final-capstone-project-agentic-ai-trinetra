import { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  Globe,
  Radar,
} from "lucide-react";

export default function TrinetraLogin({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.page}>
      {/* Dark Overlay */}
      <div style={styles.overlay}></div>

      {/* Top Security Bar */}
      <div style={styles.topBar}>
        🔒 CLASSIFIED • MINISTRY OF DEFENCE • AUTHORIZED PERSONNEL ONLY
      </div>

      {/* Animated Radar */}
      <div style={styles.radar}></div>

      {/* Main Content */}
      <div style={styles.container}>
        {/* Left Side */}
        <div style={styles.leftPanel}>
          <div style={styles.tagline}>
            AI BORDER SURVEILLANCE SYSTEM
          </div>

          <h1 style={styles.title}>
            TRINE<span style={styles.gold}>TRA</span>
          </h1>

          <p style={styles.subtitle}>
            THE THIRD EYE OF INDIA
          </p>

          <div style={styles.line}></div>

          <div style={styles.description}>
            Advanced AI-Powered Border Monitoring,
            Threat Detection, Autonomous Incident
            Management and Real-Time Command Operations.
          </div>

          <div style={styles.stats}>
            <div style={styles.statCard}>
              <Radar size={28} />
              <h2>128</h2>
              <span>ACTIVE CAMERAS</span>
            </div>

            <div style={styles.statCard}>
              <Globe size={28} />
              <h2>24/7</h2>
              <span>SURVEILLANCE</span>
            </div>

            <div style={styles.statCard}>
              <Shield size={28} />
              <h2>{"<"}2s</h2>
              <span>RESPONSE TIME</span>
            </div>
          </div>
        </div>

        {/* Login Panel */}
        <div style={styles.loginCard}>
          <div style={styles.logoCircle}>
            <Shield size={40} />
          </div>

          <h2 style={styles.loginTitle}>
            Secure Command Access
          </h2>

          <p style={styles.loginSub}>
            Access Restricted Military Network
          </p>

          <div style={styles.inputBox}>
            <User size={20} />
            <input
              id="officer-id-input"
              type="text"
              placeholder="Officer ID"
              style={styles.input}
            />
          </div>

          <div style={styles.inputBox}>
            <Lock size={20} />

            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              style={styles.input}
            />

            <button
              id="password-toggle-button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              style={styles.eyeButton}
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

        <button
  id="login-submit-button"
  style={styles.loginButton}
  onClick={onLogin}
>
  ACCESS COMMAND CENTER
</button>
          <div style={styles.footerInfo}>
            System Time: {time}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundImage: "url('/earth-bg.webp')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
    overflow: "hidden",
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to right, rgba(0,0,20,.92), rgba(0,0,20,.75))",
  },

  topBar: {
    position: "relative",
    zIndex: 5,
    textAlign: "center",
    background: "#7a0000",
    padding: "10px",
    fontSize: "12px",
    letterSpacing: "3px",
    fontWeight: "bold",
  },

  container: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: "calc(100vh - 40px)",
    padding: "0 8%",
  },

  leftPanel: {
    maxWidth: "650px",
  },

  tagline: {
    color: "#00ffcc",
    letterSpacing: "5px",
    marginBottom: "15px",
  },

  title: {
    fontSize: "7rem",
    margin: 0,
    fontWeight: "900",
  },

  gold: {
    color: "#D4AF37",
  },

  subtitle: {
    letterSpacing: "8px",
    fontSize: "1.3rem",
  },

  line: {
    width: "180px",
    height: "3px",
    background: "#00ffff",
    margin: "25px 0",
  },

  description: {
    fontSize: "18px",
    maxWidth: "600px",
    lineHeight: "1.8",
    opacity: 0.9,
  },

  stats: {
    display: "flex",
    gap: "20px",
    marginTop: "40px",
  },

  statCard: {
    background: "rgba(255,255,255,.08)",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,.15)",
    padding: "20px",
    borderRadius: "20px",
    width: "160px",
    textAlign: "center",
  },

  loginCard: {
    width: "430px",
    padding: "40px",
    borderRadius: "30px",
    backdropFilter: "blur(25px)",
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.15)",
    boxShadow:
      "0 0 40px rgba(0,255,255,.2)",
  },

  logoCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(0,255,255,.15)",
    margin: "0 auto 20px",
  },

  loginTitle: {
    textAlign: "center",
  },

  loginSub: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: "25px",
  },

  inputBox: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,.08)",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "15px",
  },

  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "white",
    marginLeft: "10px",
    fontSize: "15px",
  },

  eyeButton: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  loginButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "12px",
    marginTop: "10px",
    fontWeight: "bold",
    background: "#D4AF37",
    cursor: "pointer",
    fontSize: "15px",
  },

  footerInfo: {
    textAlign: "center",
    marginTop: "20px",
    opacity: 0.8,
  },

  radar: {
    position: "absolute",
    right: "-250px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "700px",
    height: "700px",
    borderRadius: "50%",
    border: "1px solid rgba(0,255,255,.15)",
    boxShadow:
      "0 0 120px rgba(0,255,255,.15)",
  },
};