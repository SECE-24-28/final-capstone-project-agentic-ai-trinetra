import { useState, useEffect } from 'react';

const TrinvetraWorkflowDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeString, setTimeString] = useState('');
  const [systemMetrics, setSystemMetrics] = useState({
    videoStreams: 12,
    objectsDetected: 87,
    threatsActive: 5,
    agentsDeployed: 8,
    incidentsGenerated: 3,
    avgProcessingTime: '245ms'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const metricsTimer = setInterval(() => {
      setSystemMetrics(prev => {
        const randomChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newObjects = prev.objectsDetected + (Math.random() > 0.3 ? 1 : 0);
        const processingVal = parseInt(prev.avgProcessingTime) + randomChange;
        
        return {
          ...prev,
          objectsDetected: newObjects,
          avgProcessingTime: `${Math.max(200, Math.min(300, processingVal))}ms`,
          threatsActive: Math.max(1, prev.threatsActive + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
          agentsDeployed: Math.max(4, prev.agentsDeployed + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0))
        };
      });
    }, 3000);
    return () => clearInterval(metricsTimer);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '▦' },
    { id: 'video', label: 'VIDEO INGESTION', icon: '◉' },
    { id: 'detection', label: 'OBJECT DETECTION', icon: '◎' },
    { id: 'threat', label: 'THREAT ASSESSMENT', icon: '⚠' },
    { id: 'automation', label: 'AI AUTOMATION', icon: '⚡' },
    { id: 'command', label: 'COMMAND POST', icon: '🎖' },
    { id: 'tracking', label: 'LIVE TRACKING', icon: '📍' },
    { id: 'incidents', label: 'INCIDENTS', icon: '📋' },
    { id: 'history', label: 'DATABASE', icon: '📊' },
  ];

  return (
    <div style={styles.mainContainer}>
      {/* Top Banner */}
      <div style={styles.classifiedBanner}>
        CLASSIFIED · MINISTRY OF DEFENCE · GOVERNMENT OF INDIA · AUTHORIZED PERSONNEL ONLY
      </div>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>🇮🇳</div>
          <div>
            <h1 style={styles.title}>TRINETRA</h1>
            <p style={styles.subtitle}>Automated Border Surveillance Pipeline</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.timeDisplay}>{timeString}</div>
          <div style={styles.statusBadge}>
            <div style={styles.statusDot}></div>
            SYSTEM ONLINE
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.navTabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            style={{
              ...styles.navTab,
              borderBottomColor: activeTab === tab.id ? '#00FF00' : 'transparent',
              color: activeTab === tab.id ? '#00FF00' : '#666'
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={styles.navIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div style={styles.contentArea}>
        {activeTab === 'dashboard' && <DashboardView metrics={systemMetrics} />}
        {activeTab === 'video' && <VideoIngestionView />}
        {activeTab === 'detection' && <ObjectDetectionView />}
        {activeTab === 'threat' && <ThreatAssessmentView />}
        {activeTab === 'automation' && <AIAutomationView />}
        {activeTab === 'command' && <CommandPostView />}
        {activeTab === 'tracking' && <LiveTrackingView />}
        {activeTab === 'incidents' && <IncidentsView />}
        {activeTab === 'history' && <HistoryDatabaseView />}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div>● All Systems Operational | Data Sync: Real-Time | Encryption: AES-256</div>
        <div style={{fontSize: '11px'}}>Pipeline Status: PROCESSING</div>
      </footer>
    </div>
  );
};

// ==================== DASHBOARD VIEW ====================
const DashboardView = ({ metrics }) => {
  const workflowSteps = [
    { step: 1, name: 'Video Ingestion', status: 'ACTIVE', color: '#00BCD4' },
    { step: 2, name: 'Object Detection', status: 'PROCESSING', color: '#FFD700' },
    { step: 3, name: 'Movement Analysis', status: 'PROCESSING', color: '#FFD700' },
    { step: 4, name: 'Threat Assessment', status: 'ACTIVE', color: '#FF6F00' },
    { step: 5, name: 'Confirmation', status: 'ACTIVE', color: '#FF1744' },
    { step: 6, name: 'Incident Generate', status: 'COMPLETED', color: '#00FF00' },
    { step: 7, name: 'AI Automation', status: 'ACTIVE', color: '#00FF00' },
    { step: 8, name: 'Command Alert', status: 'PROCESSING', color: '#FFD700' },
    { step: 9, name: 'Live Tracking', status: 'ACTIVE', color: '#00FF00' },
    { step: 10, name: 'Closure', status: 'PENDING', color: '#666' },
    { step: 11, name: 'Archive', status: 'READY', color: '#00BCD4' },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>WORKFLOW PIPELINE STATUS</h2>
        <div style={styles.pipelineContainer}>
          {workflowSteps.map((step, idx) => (
            <div key={step.step} style={{display: 'flex', alignItems: 'center'}}>
              <div style={{...styles.pipelineStep, borderColor: step.color, backgroundColor: `${step.color}15`}}>
                <div style={{color: step.color, fontWeight: 'bold', fontSize: '12px'}}>{step.step}</div>
                <div style={{fontSize: '9px', color: step.color, marginTop: '4px'}}>{step.status}</div>
              </div>
              <div style={{fontSize: '18px', color: step.color, margin: '0 8px', opacity: idx < workflowSteps.length - 1 ? 1 : 0}}>→</div>
            </div>
          ))}
        </div>
        <div style={styles.pipelineLabels}>
          {workflowSteps.map(step => (
            <div key={step.step} style={styles.stepLabel}>{step.name}</div>
          ))}
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard label="Video Streams" value={metrics.videoStreams} unit="Active" color="#00BCD4" />
        <MetricCard label="Objects Detected" value={metrics.objectsDetected} unit="Total" color="#FFD700" />
        <MetricCard label="Active Threats" value={metrics.threatsActive} unit="Critical" color="#FF1744" />
        <MetricCard label="Agents Deployed" value={metrics.agentsDeployed} unit="Units" color="#00FF00" />
        <MetricCard label="Incidents" value={metrics.incidentsGenerated} unit="Generated" color="#FF6F00" />
        <MetricCard label="Processing Time" value={metrics.avgProcessingTime} unit="Avg" color="#00FF00" />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>REAL-TIME ACTIVITY FEED</h2>
        <div style={styles.activityFeed}>
          <ActivityItem time="09:46:32" type="DETECTION" msg="Vehicle detected in Sector 4A" severity="HIGH" />
          <ActivityItem time="09:45:18" type="THREAT" msg="Threat level escalated to HIGH" severity="CRITICAL" />
          <ActivityItem time="09:44:55" type="AUTOMATION" msg="3 AI Agents deployed for tracking" severity="MEDIUM" />
          <ActivityItem time="09:44:10" type="INCIDENT" msg="Incident #INC-2026-0847 generated" severity="HIGH" />
          <ActivityItem time="09:43:22" type="COMMAND" msg="Alert sent to Command Post & nearby soldiers" severity="MEDIUM" />
        </div>
      </div>
    </div>
  );
};

// ==================== VIDEO INGESTION VIEW ====================
const VideoIngestionView = () => {
  const streams = [
    { id: 1, name: 'North Border Cam-1', resolution: '4K', fps: 30, bitrate: '25Mbps', status: 'STREAMING' },
    { id: 2, name: 'East Perimeter Cam-2', resolution: '2K', fps: 30, bitrate: '12Mbps', status: 'STREAMING' },
    { id: 3, name: 'South Drone Feed', resolution: '4K', fps: 60, bitrate: '45Mbps', status: 'STREAMING' },
    { id: 4, name: 'West Gate Cam-3', resolution: '2K', fps: 30, bitrate: '12Mbps', status: 'STREAMING' },
    { id: 5, name: 'Perimeter Drone', resolution: '4K', fps: 30, bitrate: '25Mbps', status: 'CONNECTING' },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>VIDEO STREAM INGESTION</h2>
        <p style={styles.sectionDescription}>Multiple video sources being continuously ingested and processed</p>
      </div>

      <div style={styles.streamGrid}>
        {streams.map((stream) => (
          <div key={stream.id} style={{...styles.streamCard, borderColor: stream.status === 'STREAMING' ? '#00FF00' : '#FFD700'}}>
            <div style={styles.streamScreenPlaceholder}></div>
            <div style={styles.streamInfo}>
              <div style={styles.streamName}>{stream.name}</div>
              <div style={styles.streamMeta}>
                <span>{stream.resolution}</span>
                <span>{stream.fps}fps</span>
                <span>{stream.bitrate}</span>
              </div>
              <div style={{...styles.streamStatus, color: stream.status === 'STREAMING' ? '#00FF00' : '#FFD700'}}>
                ● {stream.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>INGESTION METRICS</h2>
        <div style={styles.metricsTable}>
          <div style={styles.tableRow}>
            <div style={styles.tableCell}>Total Bandwidth</div>
            <div style={styles.tableCell}>151 Mbps</div>
          </div>
          <div style={styles.tableRow}>
            <div style={styles.tableCell}>Frame Drops</div>
            <div style={styles.tableCell}>0.2%</div>
          </div>
          <div style={styles.tableRow}>
            <div style={styles.tableCell}>Latency</div>
            <div style={styles.tableCell}>120ms avg</div>
          </div>
          <div style={styles.tableRow}>
            <div style={styles.tableCell}>Storage Rate</div>
            <div style={styles.tableCell}>45 GB/hour</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== OBJECT DETECTION VIEW ====================
const ObjectDetectionView = () => {
  const detections = [
    { id: 1, type: 'VEHICLE', confidence: 96, location: 'Sector 4A', time: '09:46:32', aiModel: 'YOLOv8' },
    { id: 2, type: 'PERSONNEL', confidence: 89, location: 'Sector 2B', time: '09:45:18', aiModel: 'ResNet50' },
    { id: 3, type: 'DRONE', confidence: 92, location: 'Airspace B1', time: '09:44:55', aiModel: 'Custom' },
    { id: 4, type: 'STRUCTURE', confidence: 78, location: 'Sector 5C', time: '09:43:40', aiModel: 'YOLOv8' },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>REAL-TIME OBJECT DETECTION</h2>
        <p style={styles.sectionDescription}>AI models detecting and classifying objects from video streams</p>
      </div>

      <div style={styles.detectionsTable}>
        {detections.map((det) => (
          <div key={det.id} style={styles.detectionRow}>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 'bold', color: '#00FF00', marginBottom: '4px'}}>{det.type}</div>
              <div style={{fontSize: '12px', color: '#00BCD4'}}>
                {det.location} • {det.time}
              </div>
            </div>
            <div style={{textAlign: 'center', flex: 0.5}}>
              <div style={{fontSize: '18px', color: '#FFD700', fontWeight: 'bold'}}>{det.confidence}%</div>
              <div style={{fontSize: '10px', color: '#666'}}>Confidence</div>
            </div>
            <div style={{textAlign: 'right', flex: 0.5}}>
              <div style={{fontSize: '11px', color: '#00BCD4'}}>{det.aiModel}</div>
              <ConfidenceBar confidence={det.confidence} />
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>DETECTION STATISTICS</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>847</div>
            <div style={styles.statLabel}>Total Detections/Hour</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>94.2%</div>
            <div style={styles.statLabel}>Average Accuracy</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>45ms</div>
            <div style={styles.statLabel}>Processing Latency</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== THREAT ASSESSMENT VIEW ====================
const ThreatAssessmentView = () => {
  const threats = [
    { id: 1, object: 'Vehicle-001', confidence: 96, threatLevel: 'CRITICAL', location: 'Sector 4A', analysis: 'Armed personnel detected in vehicle' },
    { id: 2, object: 'Personnel-004', confidence: 87, threatLevel: 'HIGH', location: 'Sector 2B', analysis: 'Suspicious movement pattern' },
    { id: 3, object: 'Drone-02', confidence: 92, threatLevel: 'HIGH', location: 'Airspace B1', analysis: 'Unauthorized aerial vehicle' },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>THREAT ASSESSMENT & CONFIRMATION</h2>
        <p style={styles.sectionDescription}>Analyzing movement patterns and classifying threat levels</p>
      </div>

      <div style={styles.threatsList}>
        {threats.map((threat) => (
          <div key={threat.id} style={{...styles.threatCard, borderLeftColor: getThreatColor(threat.threatLevel)}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
              <div>
                <div style={{fontWeight: 'bold', color: '#00FF00', fontSize: '14px'}}>{threat.object}</div>
                <div style={{fontSize: '12px', color: '#00BCD4', marginTop: '4px'}}>{threat.location}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{...styles.threatBadge, backgroundColor: getThreatColor(threat.threatLevel) + '25', color: getThreatColor(threat.threatLevel)}}>
                  {threat.threatLevel}
                </div>
                <div style={{fontSize: '12px', color: '#FFD700', marginTop: '4px'}}>{threat.confidence}% confidence</div>
              </div>
            </div>
            <div style={{padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '3px', marginBottom: '10px'}}>
              <div style={{fontSize: '12px', color: '#fff'}}>{threat.analysis}</div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button id={`threat-confirm-${threat.id}`} style={{...styles.threatButton, backgroundColor: 'rgba(0, 255, 0, 0.1)', color: '#00FF00', borderColor: '#00FF00'}}>CONFIRM</button>
              <button id={`threat-false-${threat.id}`} style={{...styles.threatButton, backgroundColor: 'rgba(100, 100, 100, 0.1)', color: '#999', borderColor: '#666'}}>FALSE ALARM</button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>THREAT STATISTICS</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={{...styles.statNumber, color: '#FF1744'}}>5</div>
            <div style={styles.statLabel}>Active Threats</div>
          </div>
          <div style={styles.statBox}>
            <div style={{...styles.statNumber, color: '#FF6F00'}}>2</div>
            <div style={styles.statLabel}>Confirmed</div>
          </div>
          <div style={styles.statBox}>
            <div style={{...styles.statNumber, color: '#FFD700'}}>3</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== AI AUTOMATION VIEW ====================
const AIAutomationView = () => {
  const agents = [
    { id: 1, name: 'Agent-Alpha-01', status: 'DEPLOYED', task: 'Tracking Vehicle-001', coverage: 'Sector 4A-4B', efficiency: 94 },
    { id: 2, name: 'Agent-Bravo-02', status: 'DEPLOYED', task: 'Tracking Personnel-004', coverage: 'Sector 2B-2C', efficiency: 87 },
    { id: 3, name: 'Agent-Charlie-03', status: 'DEPLOYING', task: 'Drone Intercept', coverage: 'Airspace B1-B2', efficiency: 0 },
    { id: 4, name: 'Agent-Delta-04', status: 'IDLE', task: 'Standby', coverage: 'All Sectors', efficiency: 100 },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>AI AGENT AUTOMATION</h2>
        <p style={styles.sectionDescription}>Autonomous agents deployed for threat tracking and mitigation</p>
      </div>

      <div style={styles.agentsList}>
        {agents.map((agent) => (
          <div key={agent.id} style={styles.agentCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              <div>
                <div style={{fontWeight: 'bold', color: '#00FF00', fontSize: '14px'}}>{agent.name}</div>
                <div style={{fontSize: '12px', color: '#00BCD4', marginTop: '4px'}}>{agent.task}</div>
              </div>
              <div style={{...styles.statusBadgeSmall, backgroundColor: agent.status === 'DEPLOYED' ? 'rgba(0, 255, 0, 0.2)' : agent.status === 'DEPLOYING' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(100, 100, 100, 0.2)', color: agent.status === 'DEPLOYED' ? '#00FF00' : agent.status === 'DEPLOYING' ? '#FFD700' : '#999'}}>
                {agent.status}
              </div>
            </div>
            <div style={{fontSize: '11px', color: '#666', marginBottom: '8px'}}>Coverage: {agent.coverage}</div>
            <div style={{...styles.efficencyBar}}>
              <div style={{width: `${agent.efficiency}%`, height: '100%', backgroundColor: agent.efficiency > 80 ? '#00FF00' : '#FFD700', borderRadius: '2px'}}></div>
            </div>
            <div style={{fontSize: '10px', color: '#FFD700', marginTop: '4px', textAlign: 'right'}}>Efficiency: {agent.efficiency}%</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>AUTOMATION ACTIONS TAKEN</h2>
        <div style={styles.actionsList}>
          <ActionItem action="DEPLOYMENT" agent="Agent-Alpha-01" time="09:46:35" status="COMPLETED" />
          <ActionItem action="TRACKING INITIATED" agent="Agent-Bravo-02" time="09:46:20" status="COMPLETED" />
          <ActionItem action="ALERT SENT" agent="System" time="09:46:10" status="COMPLETED" />
          <ActionItem action="INTERCEPT ATTEMPT" agent="Agent-Charlie-03" time="09:46:05" status="IN_PROGRESS" />
        </div>
      </div>
    </div>
  );
};

// ==================== COMMAND POST VIEW ====================
const CommandPostView = () => {
  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>COMMAND POST & SOLDIER NOTIFICATIONS</h2>
        <p style={styles.sectionDescription}>Real-time alerts sent to command center and nearby soldiers</p>
      </div>

      <div style={styles.commandGrid}>
        <div style={styles.commandCard}>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#FF1744', marginBottom: '10px'}}>⚠ CRITICAL ALERT</div>
          <div style={{backgroundColor: 'rgba(255, 23, 68, 0.1)', padding: '12px', borderRadius: '3px', marginBottom: '12px'}}>
            <div style={{color: '#FF1744', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px'}}>Vehicle with Armed Personnel</div>
            <div style={{color: '#fff', fontSize: '12px', lineHeight: '1.5'}}>Detected at Sector 4A. 2 armed individuals identified inside vehicle. Moving towards border gate.</div>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <div style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '3px'}}>
              <div style={{fontSize: '10px', color: '#666', marginBottom: '2px'}}>Nearest Command Post</div>
              <div style={{color: '#00BCD4', fontWeight: 'bold'}}>Post-47, 2.3 km</div>
            </div>
            <div style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '3px'}}>
              <div style={{fontSize: '10px', color: '#666', marginBottom: '2px'}}>Soldiers Alerted</div>
              <div style={{color: '#00FF00', fontWeight: 'bold'}}>12 units</div>
            </div>
          </div>
        </div>

        <div style={styles.commandCard}>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#FF6F00', marginBottom: '10px'}}>⚠ HIGH ALERT</div>
          <div style={{backgroundColor: 'rgba(255, 111, 0, 0.1)', padding: '12px', borderRadius: '3px', marginBottom: '12px'}}>
            <div style={{color: '#FF6F00', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px'}}>Unauthorized Drone Activity</div>
            <div style={{color: '#fff', fontSize: '12px', lineHeight: '1.5'}}>Unknown drone detected in airspace B1. Flight pattern indicates reconnaissance mission.</div>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <div style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '3px'}}>
              <div style={{fontSize: '10px', color: '#666', marginBottom: '2px'}}>Air Defense Status</div>
              <div style={{color: '#FFD700', fontWeight: 'bold'}}>READY</div>
            </div>
            <div style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '3px'}}>
              <div style={{fontSize: '10px', color: '#666', marginBottom: '2px'}}>Response Time</div>
              <div style={{color: '#00FF00', fontWeight: 'bold'}}>
  &lt;30 seconds
</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>NOTIFICATION DELIVERY STATUS</h2>
        <div style={styles.notificationStats}>
          <div style={styles.notifItem}>
            <span style={{color: '#00FF00', fontWeight: 'bold'}}>✓</span>
            <span>Command Post 47 - Received 09:46:36</span>
          </div>
          <div style={styles.notifItem}>
            <span style={{color: '#00FF00', fontWeight: 'bold'}}>✓</span>
            <span>Patrol Unit 12 - Received 09:46:37</span>
          </div>
          <div style={styles.notifItem}>
            <span style={{color: '#00FF00', fontWeight: 'bold'}}>✓</span>
            <span>Regional HQ - Received 09:46:38</span>
          </div>
          <div style={styles.notifItem}>
            <span style={{color: '#FFD700', fontWeight: 'bold'}}>⟳</span>
            <span>Air Defense Unit - Pending confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== LIVE TRACKING VIEW ====================
const LiveTrackingView = () => {
  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>REAL-TIME THREAT TRACKING</h2>
        <p style={styles.sectionDescription}>Continuous monitoring and tracking of active threats</p>
      </div>

      <div style={styles.trackingMap}>
        <svg style={{width: '100%', height: '300px'}} viewBox="0 0 800 400">
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00FF00" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#gridPattern)" />
          
          {/* Zones */}
          <rect x="50" y="50" width="300" height="150" fill="none" stroke="#00FF00" strokeWidth="2" opacity="0.3" strokeDasharray="5,5"/>
          <text x="70" y="80" style={{fontSize: '12px', fill: '#00FF00', opacity: 0.7}}>SECTOR 4A</text>
          
          {/* Threat marker */}
          <circle cx="200" cy="150" r="15" fill="none" stroke="#FF1744" strokeWidth="2"/>
          <circle cx="200" cy="150" r="25" fill="none" stroke="#FF1744" strokeWidth="1" opacity="0.5"/>
          <circle cx="200" cy="150" r="5" fill="#FF1744"/>
          
          {/* AI Agent */}
          <rect x="245" y="135" width="20" height="20" fill="#00FF00" opacity="0.8"/>
          <text x="270" y="150" style={{fontSize: '12px', fill: '#00FF00'}}>Agent-Alpha-01</text>
          
          {/* Command Post */}
          <polygon points="450,100 470,100 460,120" fill="#00BCD4" opacity="0.8"/>
          <text x="475" y="110" style={{fontSize: '12px', fill: '#00BCD4'}}>Command Post 47</text>
        </svg>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>TRACKING DETAILS</h2>
        <div style={styles.trackingDetails}>
          <div style={styles.trackDetail}>
            <div style={{color: '#666', fontSize: '11px'}}>Object ID</div>
            <div style={{color: '#00FF00', fontWeight: 'bold', fontSize: '13px'}}>Vehicle-001</div>
          </div>
          <div style={styles.trackDetail}>
            <div style={{color: '#666', fontSize: '11px'}}>Current Location</div>
            <div style={{color: '#00BCD4', fontWeight: 'bold', fontSize: '13px'}}>Sector 4A, Grid 245</div>
          </div>
          <div style={styles.trackDetail}>
            <div style={{color: '#666', fontSize: '11px'}}>Speed</div>
            <div style={{color: '#FFD700', fontWeight: 'bold', fontSize: '13px'}}>65 km/h</div>
          </div>
          <div style={styles.trackDetail}>
            <div style={{color: '#666', fontSize: '11px'}}>Direction</div>
            <div style={{color: '#FF6F00', fontWeight: 'bold', fontSize: '13px'}}>NE (040°)</div>
          </div>
          <div style={styles.trackDetail}>
            <div style={{color: '#666', fontSize: '11px'}}>ETA Border</div>
            <div style={{color: '#FF1744', fontWeight: 'bold', fontSize: '13px'}}>2:34 minutes</div>
          </div>
          <div style={styles.trackDetail}>
            <div style={{color: '#666', fontSize: '11px'}}>Tracking Agent</div>
            <div style={{color: '#00FF00', fontWeight: 'bold', fontSize: '13px'}}>Agent-Alpha-01</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>TRACK HISTORY (Last 10 minutes)</h2>
        <div style={styles.trackHistory}>
          <div style={styles.historyItem}>09:46:32 - Detected at Sector 4A, Grid 245</div>
          <div style={styles.historyItem}>09:46:45 - Threat level elevated to CRITICAL</div>
          <div style={styles.historyItem}>09:46:50 - Agent-Alpha-01 deployed for tracking</div>
          <div style={styles.historyItem}>09:46:55 - Vehicle moving towards border, speed 65 km/h</div>
          <div style={styles.historyItem}>09:47:02 - Command Post 47 notified</div>
        </div>
      </div>
    </div>
  );
};

// ==================== INCIDENTS VIEW ====================
const IncidentsView = () => {
  const incidents = [
    { id: 'INC-2026-0847', status: 'ACTIVE', severity: 'CRITICAL', title: 'Armed Vehicle Breach Attempt', created: '09:46:10', agent: 'Agent-Alpha-01', closure: 'PENDING' },
    { id: 'INC-2026-0846', status: 'ACTIVE', severity: 'HIGH', title: 'Unauthorized Drone Activity', created: '09:44:32', agent: 'Agent-Charlie-03', closure: 'IN_PROGRESS' },
    { id: 'INC-2026-0845', status: 'CLOSED', severity: 'MEDIUM', title: 'Personnel Detection - False Alarm', created: '09:42:15', agent: 'Agent-Bravo-02', closure: 'RESOLVED' },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>INCIDENT MANAGEMENT</h2>
        <p style={styles.sectionDescription}>Create, track, and manage incidents from detection to closure</p>
      </div>

      <div style={styles.incidentsList}>
        {incidents.map((incident) => (
          <div key={incident.id} style={{...styles.incidentCard, borderLeftColor: incident.status === 'ACTIVE' ? '#FF1744' : '#00FF00'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              <div>
                <div style={{fontWeight: 'bold', color: '#00FF00', fontSize: '14px'}}>{incident.id}</div>
                <div style={{fontSize: '13px', color: '#fff', marginTop: '4px'}}>{incident.title}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{...styles.statusBadgeSmall, backgroundColor: incident.status === 'ACTIVE' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 255, 0, 0.2)', color: incident.status === 'ACTIVE' ? '#FF1744' : '#00FF00'}}>
                  {incident.status}
                </div>
                <div style={{...styles.severityBadge, backgroundColor: incident.severity === 'CRITICAL' ? 'rgba(255, 23, 68, 0.2)' : incident.severity === 'HIGH' ? 'rgba(255, 111, 0, 0.2)' : 'rgba(255, 215, 0, 0.2)', color: incident.severity === 'CRITICAL' ? '#FF1744' : incident.severity === 'HIGH' ? '#FF6F00' : '#FFD700'}}>
                  {incident.severity}
                </div>
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,255,0,0.1)'}}>
              <div>
                <div style={{fontSize: '10px', color: '#666'}}>Created</div>
                <div style={{fontSize: '12px', color: '#00BCD4'}}>{incident.created}</div>
              </div>
              <div>
                <div style={{fontSize: '10px', color: '#666'}}>Assigned Agent</div>
                <div style={{fontSize: '12px', color: '#00FF00'}}>{incident.agent}</div>
              </div>
              <div>
                <div style={{fontSize: '10px', color: '#666'}}>Closure Status</div>
                <div style={{fontSize: '12px', color: incident.closure === 'RESOLVED' ? '#00FF00' : incident.closure === 'IN_PROGRESS' ? '#FFD700' : '#FF1744'}}>{incident.closure}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>INCIDENT STATISTICS</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={{...styles.statNumber, color: '#FF1744'}}>3</div>
            <div style={styles.statLabel}>Active Incidents</div>
          </div>
          <div style={styles.statBox}>
            <div style={{...styles.statNumber, color: '#FFD700'}}>45</div>
            <div style={styles.statLabel}>Resolved Today</div>
          </div>
          <div style={styles.statBox}>
            <div style={{...styles.statNumber, color: '#00FF00'}}>98.7%</div>
            <div style={styles.statLabel}>Resolution Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== HISTORY DATABASE VIEW ====================
const HistoryDatabaseView = () => {
  const history = [
    { id: 1, date: '2026-06-08', time: '08:32:15', type: 'THREAT', description: 'Armed personnel detected', result: 'RESOLVED', duration: '45min' },
    { id: 2, date: '2026-06-08', time: '07:15:42', type: 'INCIDENT', description: 'Vehicle breach attempt', result: 'INTERCEPTED', duration: '1h 23min' },
    { id: 3, date: '2026-06-08', time: '06:48:20', type: 'DETECTION', description: 'Drone activity', result: 'FALSE_ALARM', duration: '18min' },
    { id: 4, date: '2026-06-07', time: '23:45:00', type: 'THREAT', description: 'Personnel crossing', result: 'CAPTURED', duration: '3h 12min' },
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>HISTORICAL DATABASE & ANALYTICS</h2>
        <p style={styles.sectionDescription}>Archive of all incidents and system performance metrics</p>
      </div>

      <div style={styles.historyTable}>
        <div style={{...styles.tableHeader, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr'}}>
          <div>DATE & TIME</div>
          <div>TYPE</div>
          <div>DESCRIPTION</div>
          <div>RESULT</div>
          <div>DURATION</div>
        </div>
        {history.map((item) => (
          <div key={item.id} style={{...styles.tableRowHistory, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr'}}>
            <div style={{color: '#00BCD4'}}>{item.date} {item.time}</div>
            <div style={{color: '#FFD700', fontWeight: 'bold'}}>{item.type}</div>
            <div>{item.description}</div>
            <div style={{color: item.result === 'RESOLVED' || item.result === 'INTERCEPTED' ? '#00FF00' : '#FF6F00'}}>{item.result}</div>
            <div style={{color: '#666'}}>{item.duration}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>SYSTEM ANALYTICS</h2>
        <div style={styles.analyticsGrid}>
          <div style={styles.analyticBox}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Avg Detection Time</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#00FF00'}}>245ms</div>
            <div style={{fontSize: '10px', color: '#00BCD4', marginTop: '4px'}}>12ms improvement</div>
          </div>
          <div style={styles.analyticBox}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Threat Accuracy</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#00FF00'}}>96.4%</div>
            <div style={{fontSize: '10px', color: '#00BCD4', marginTop: '4px'}}>3.2% improvement</div>
          </div>
          <div style={styles.analyticBox}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Incidents/Day</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#FFD700'}}>47</div>
            <div style={{fontSize: '10px', color: '#FFD700', marginTop: '4px'}}>+12% vs last month</div>
          </div>
          <div style={styles.analyticBox}>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>System Uptime</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#00FF00'}}>99.8%</div>
            <div style={{fontSize: '10px', color: '#00BCD4', marginTop: '4px'}}>Excellent reliability</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================
const MetricCard = ({ label, value, unit, color }) => (
  <div style={{...styles.metricCardSmall, borderTopColor: color}}>
    <div style={{fontSize: '24px', fontWeight: 'bold', color}}>{value}</div>
    <div style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>{label}</div>
    <div style={{fontSize: '10px', color: '#999', marginTop: '2px'}}>{unit}</div>
  </div>
);

const ActivityItem = ({ time, type, msg, severity }) => (
  <div style={styles.activityItem}>
    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
      <span style={{color: '#00BCD4', fontSize: '11px'}}>{time}</span>
      <span style={{color: severity === 'CRITICAL' ? '#FF1744' : severity === 'HIGH' ? '#FF6F00' : '#FFD700', fontSize: '10px', fontWeight: 'bold'}}>{type}</span>
    </div>
    <div style={{color: '#fff', fontSize: '12px'}}>{msg}</div>
  </div>
);

const ConfidenceBar = ({ confidence }) => (
  <div style={{width: '100%', height: '4px', backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px'}}>
    <div style={{width: `${confidence}%`, height: '100%', backgroundColor: '#00FF00', borderRadius: '2px'}}></div>
  </div>
);

const ActionItem = ({ action, agent, time, status }) => (
  <div style={styles.actionItem}>
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      <span style={{color: '#00FF00', fontWeight: 'bold', fontSize: '12px'}}>{action}</span>
      <span style={{color: status === 'COMPLETED' ? '#00FF00' : '#FFD700', fontSize: '10px'}}>{status}</span>
    </div>
    <div style={{fontSize: '11px', color: '#00BCD4', marginTop: '3px'}}>{agent} • {time}</div>
  </div>
);

const getThreatColor = (level) => {
  switch(level) {
    case 'CRITICAL': return '#FF1744';
    case 'HIGH': return '#FF6F00';
    default: return '#FFD700';
  }
};

// ==================== STYLES ====================
const styles = {
  mainContainer: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0a0e27',
    color: '#fff',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  classifiedBanner: {
    width: '100%',
    padding: '8px 20px',
    backgroundColor: '#8B0000',
    textAlign: 'center',
    fontSize: '10px',
    letterSpacing: '2px',
    fontWeight: 'bold',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '2px solid #00FF00',
    backgroundColor: 'rgba(10, 14, 39, 0.9)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    fontSize: '28px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00FF00',
    letterSpacing: '2px',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#00BCD4',
    letterSpacing: '1px',
  },
  headerRight: {
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: '16px',
    fontFamily: "'Courier New', monospace",
    color: '#FFD700',
    letterSpacing: '1px',
    fontWeight: 'bold',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00FF00',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#00FF00',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  navTabs: {
    display: 'flex',
    overflowX: 'auto',
    borderBottom: '1px solid rgba(0,255,0,0.1)',
    backgroundColor: 'rgba(10, 14, 39, 0.5)',
    backdropFilter: 'blur(5px)',
  },
  navTab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#666',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  navIcon: {
    fontSize: '12px',
  },
  contentArea: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 30px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 30px',
    borderTop: '1px solid rgba(0,255,0,0.1)',
    backgroundColor: 'rgba(10, 14, 39, 0.9)',
    fontSize: '11px',
    color: '#666',
  },
  viewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00FF00',
    letterSpacing: '1px',
    borderBottom: '1px solid rgba(0,255,0,0.2)',
    paddingBottom: '10px',
  },
  sectionDescription: {
    margin: '8px 0 0 0',
    fontSize: '11px',
    color: '#666',
  },
  pipelineContainer: {
    display: 'flex',
    gap: '5px',
    overflowX: 'auto',
    padding: '15px 0',
    marginBottom: '15px',
  },
  pipelineStep: {
    minWidth: '70px',
    padding: '12px 8px',
    border: '1px solid',
    borderRadius: '3px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineLabels: {
    display: 'flex',
    gap: '5px',
    overflowX: 'auto',
    fontSize: '9px',
    color: '#666',
  },
  stepLabel: {
    minWidth: '70px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  metricCardSmall: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0, 255, 0, 0.2)',
    borderTop: '3px solid',
    padding: '15px',
    borderRadius: '3px',
    backdropFilter: 'blur(10px)',
  },
  activityFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '3px',
    border: '1px solid rgba(0,255,0,0.1)',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  activityItem: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '10px',
    borderLeft: '2px solid #00FF00',
    borderRadius: '2px',
  },
  streamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  streamCard: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  streamScreenPlaceholder: {
    width: '100%',
    height: '120px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottom: '1px solid rgba(0,255,0,0.1)',
  },
  streamInfo: {
    padding: '10px',
  },
  streamName: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: '6px',
  },
  streamMeta: {
    display: 'flex',
    gap: '10px',
    fontSize: '9px',
    color: '#00BCD4',
    marginBottom: '6px',
  },
  streamStatus: {
    fontSize: '10px',
    fontWeight: 'bold',
  },
  metricsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '15px',
    borderRadius: '3px',
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(0,255,0,0.1)',
    fontSize: '12px',
  },
  tableCell: {
    flex: 1,
  },
  detectionsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detectionRow: {
    display: 'flex',
    gap: '20px',
    backgroundColor: 'rgba(15, 52, 96, 0.2)',
    padding: '12px',
    borderRadius: '3px',
    borderLeft: '3px solid #FFD700',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  statBox: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    padding: '15px',
    textAlign: 'center',
    borderRadius: '3px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#666',
    letterSpacing: '1px',
  },
  threatsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  threatCard: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    borderLeft: '3px solid',
    padding: '15px',
    borderRadius: '3px',
  },
  threatBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  threatButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  agentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  agentCard: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    padding: '12px',
    borderRadius: '3px',
  },
  statusBadgeSmall: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: 'bold',
  },
  efficencyBar: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(0,255,0,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionItem: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '10px',
    borderLeft: '2px solid #00FF00',
    borderRadius: '2px',
  },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  commandCard: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    padding: '15px',
    borderRadius: '3px',
  },
  notificationStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  notifItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(0,255,0,0.1)',
    fontSize: '12px',
  },
  trackingMap: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    borderRadius: '3px',
    padding: '15px',
    marginBottom: '20px',
  },
  trackingDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px',
  },
  trackDetail: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '10px',
    borderRadius: '3px',
    borderLeft: '2px solid #00BCD4',
  },
  trackHistory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  historyItem: {
    padding: '8px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderLeft: '2px solid #00BCD4',
    fontSize: '11px',
    color: '#00BCD4',
  },
  incidentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  incidentCard: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    borderLeft: '3px solid',
    padding: '15px',
    borderRadius: '3px',
  },
  severityBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
  historyTable: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '30px',
  },
  tableHeader: {
    backgroundColor: 'rgba(0,255,0,0.1)',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '11px',
    color: '#00FF00',
    borderBottom: '1px solid rgba(0,255,0,0.2)',
    letterSpacing: '1px',
  },
  tableRowHistory: {
    padding: '12px',
    borderBottom: '1px solid rgba(0,255,0,0.1)',
    fontSize: '11px',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  analyticBox: {
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    border: '1px solid rgba(0,255,0,0.2)',
    padding: '15px',
    borderRadius: '3px',
    textAlign: 'center',
  },
};

export default TrinvetraWorkflowDashboard;