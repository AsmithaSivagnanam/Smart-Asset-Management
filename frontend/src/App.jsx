import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowUpRight, BadgeCheck, Box, Check, ChevronRight, CircleAlert,
  ClipboardList, Fingerprint, Gauge, LayoutDashboard, Link2, LockKeyhole,
  Menu, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Terminal, UserRound,
  Users, X
} from 'lucide-react';
import {
  createAccessRequest, getAssetsByOwner, getAuditLogs, getHealth, getIdentity,
  mintAsset, registerIdentity, updateAccessRequestStatus
} from './services/trustmeshApi';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'identities', label: 'Identities', icon: Fingerprint },
  { id: 'assets', label: 'Asset registry', icon: Box },
  { id: 'access', label: 'Access control', icon: LockKeyhole },
  { id: 'audit', label: 'Audit trail', icon: ClipboardList }
];

const initialIdentity = { userId: '', did: '', name: '', email: '' };
const initialAsset = { assetId: '', ownerDid: '', tokenId: '', contractAddress: '', metadataUri: '' };
const initialAccess = { requesterDid: '', assetId: '', action: 'view', reputationScoreAtRequest: 80 };

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState('checking');
  const [notice, setNotice] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshOverview = async () => {
    setIsRefreshing(true);
    try {
      const [healthResult, logs] = await Promise.all([getHealth(), getAuditLogs()]);
      setHealth(healthResult.status === 'ok' ? 'online' : 'degraded');
      setAuditLogs(logs);
    } catch (error) {
      setHealth('offline');
      setNotice({ type: 'error', message: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { refreshOverview(); }, []);

  const navigate = (view) => {
    setActiveView(view);
    setMobileNavOpen(false);
    setNotice(null);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={21} /></div>
          <div><strong>TrustMesh</strong><span>Control room</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button className={activeView === id ? 'nav-item active' : 'nav-item'} key={id} onClick={() => navigate(id)}>
              <Icon size={17} /><span>{label}</span>{activeView === id && <ChevronRight size={15} className="nav-chevron" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-card"><div className="network-dot" /><div><span>Network status</span><strong>{health === 'online' ? 'Astra connected' : health}</strong></div></div>
          <div className="profile"><div className="avatar">AD</div><div><strong>Admin workspace</strong><span>Operator access</span></div><MoreIcon /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="crumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === activeView)?.label}</strong></div>
          <div className="topbar-actions"><span className="live-pill"><span />Live sync</span><button className="icon-button" onClick={refreshOverview} aria-label="Refresh data"><RefreshCw size={17} className={isRefreshing ? 'spin' : ''} /></button><div className="top-avatar">AD</div></div>
        </header>

        <div className="page-wrap">
          {notice && <div className={`notice ${notice.type}`}><CircleAlert size={17} /><span>{notice.message}</span><button onClick={() => setNotice(null)}><X size={16} /></button></div>}
          {activeView === 'overview' && <Overview logs={auditLogs} health={health} navigate={navigate} />}
          {activeView === 'identities' && <IdentityView setNotice={setNotice} />}
          {activeView === 'assets' && <AssetView setNotice={setNotice} />}
          {activeView === 'access' && <AccessView setNotice={setNotice} />}
          {activeView === 'audit' && <AuditView logs={auditLogs} refresh={refreshOverview} />}
        </div>
      </main>
    </div>
  );
}

function MoreIcon() { return <span className="more-icon">•••</span>; }

function Overview({ logs, health, navigate }) {
  const stats = useMemo(() => [
    { label: 'Identities verified', value: '—', note: 'Register an identity to begin', icon: Fingerprint, tone: 'blue' },
    { label: 'Protected assets', value: '—', note: 'Astra registry connected', icon: Box, tone: 'orange' },
    { label: 'Access decisions', value: logs.filter((log) => log.eventType?.includes('access')).length, note: 'Recorded in the audit trail', icon: LockKeyhole, tone: 'green' }
  ], [logs]);

  return <>
    <section className="hero-row"><div><div className="eyebrow"><span className="eyebrow-dot" />Trust infrastructure</div><h1>Make every permission<br /><em>provable.</em></h1><p className="hero-copy">A clear operating layer for decentralized identity, asset ownership, and access decisions.</p></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="core"><ShieldCheck size={32} /></div><div className="orbit-node node-one"><Fingerprint size={15} /></div><div className="orbit-node node-two"><Link2 size={15} /></div><div className="orbit-node node-three"><LockKeyhole size={15} /></div></div></section>
    <section className="stat-grid">{stats.map(({ label, value, note, icon: Icon, tone }) => <div className="stat-card" key={`stat-${label}`}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>)}</section>
    <section className="content-grid"><div className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">REAL-TIME</span><h2>Recent activity</h2></div><button className="text-button" onClick={() => navigate('audit')}>View all <ArrowUpRight size={15} /></button></div>{logs.length ? <div className="activity-list">{logs.slice(0, 5).map((log) => <ActivityRow key={log.auditId} log={log} />)}</div> : <EmptyState icon={Activity} title="Your trail starts here" text="Actions taken across TrustMesh will appear in this feed." />}</div><div className="panel launch-panel"><div className="section-kicker">QUICK LAUNCH</div><h2>Bring a new asset<br />under control.</h2><p>Register ownership, then define who can use it and why.</p><button className="primary-button" onClick={() => navigate('assets')}><Plus size={17} /> Mint an asset</button><div className="launch-foot"><span><Check size={14} /> Immutable audit events</span><span><Check size={14} /> Policy-ready access</span></div></div></section>
    <section className="system-strip"><div className="system-title"><span className={`status-dot ${health}`} /><div><strong>System operational</strong><span>API and persistence layer are responding normally</span></div></div><div className="system-metrics"><span><Terminal size={14} /> REST API <b>3001</b></span><span><Gauge size={14} /> Data API <b>Connected</b></span></div></section>
  </>;
}

function ActivityRow({ log }) { return <div className="activity-row"><div className="activity-icon"><Activity size={16} /></div><div className="activity-main"><strong>{formatEvent(log.eventType)}</strong><span>{log.entityType} · {shortId(log.entityId)}</span></div><time>{formatTime(log.timestamp)}</time></div>; }
function formatEvent(value = '') { return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
function shortId(value = '') { return value.length > 20 ? `${value.slice(0, 8)}...${value.slice(-5)}` : value; }
function formatTime(value) { if (!value) return 'Just now'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

function IdentityView({ setNotice }) {
  const [form, setForm] = useState(initialIdentity); const [lookupDid, setLookupDid] = useState(''); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { const identity = await registerIdentity(form); setResult(identity); setNotice({ type: 'success', message: 'Identity registered and audit event created.' }); setForm(initialIdentity); } catch (error) { setNotice({ type: 'error', message: error.message }); } finally { setBusy(false); } };
  const lookup = async (event) => { event.preventDefault(); setBusy(true); try { setResult(await getIdentity(lookupDid)); setNotice({ type: 'success', message: 'Identity found.' }); } catch (error) { setNotice({ type: 'error', message: error.message }); setResult(null); } finally { setBusy(false); } };
  return <ViewHeader kicker="IDENTITY LAYER" title="Identities" description="Anchor real people and organizations to verifiable decentralized identifiers." icon={Fingerprint}><div className="form-layout"><FormPanel title="Register identity" subtitle="Create a new trusted identity record." onSubmit={submit} busy={busy} submitLabel="Register identity"><Field label="User ID" value={form.userId} onChange={(value) => setForm({ ...form, userId: value })} placeholder="user-001" /><Field label="DID" value={form.did} onChange={(value) => setForm({ ...form, did: value })} placeholder="did:trustmesh:..." /><div className="field-row"><Field label="Display name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Avery Chen" /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="avery@example.com" /></div></FormPanel><div className="side-stack"><FormPanel title="Resolve an identity" subtitle="Look up a DID from the registry." onSubmit={lookup} busy={busy} submitLabel="Resolve DID"><Field label="Decentralized identifier" value={lookupDid} onChange={setLookupDid} placeholder="did:trustmesh:..." /></FormPanel>{result && <ResultCard title="Verified identity" data={result} />}</div></div></ViewHeader>;
}

function AssetView({ setNotice }) {
  const [form, setForm] = useState(initialAsset); const [ownerDid, setOwnerDid] = useState(''); const [assets, setAssets] = useState([]); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await mintAsset(form); setNotice({ type: 'success', message: 'Asset minted and ownership recorded.' }); setForm(initialAsset); } catch (error) { setNotice({ type: 'error', message: error.message }); } finally { setBusy(false); } };
  const lookup = async (event) => { event.preventDefault(); setBusy(true); try { setAssets(await getAssetsByOwner(ownerDid)); setNotice({ type: 'success', message: 'Asset registry loaded.' }); } catch (error) { setNotice({ type: 'error', message: error.message }); } finally { setBusy(false); } };
  return <ViewHeader kicker="ASSET REGISTRY" title="Protected assets" description="Create a durable ownership record before an asset enters the access layer." icon={Box}><div className="form-layout"><FormPanel title="Mint an asset" subtitle="Register an owned digital asset." onSubmit={submit} busy={busy} submitLabel="Mint asset"><div className="field-row"><Field label="Asset ID" value={form.assetId} onChange={(value) => setForm({ ...form, assetId: value })} placeholder="asset-001" /><Field label="Token ID" value={form.tokenId} onChange={(value) => setForm({ ...form, tokenId: value })} placeholder="42" /></div><Field label="Owner DID" value={form.ownerDid} onChange={(value) => setForm({ ...form, ownerDid: value })} placeholder="did:trustmesh:..." /><Field label="Contract address" value={form.contractAddress} onChange={(value) => setForm({ ...form, contractAddress: value })} placeholder="0x..." /><Field label="Metadata URI" value={form.metadataUri} onChange={(value) => setForm({ ...form, metadataUri: value })} placeholder="ipfs://..." /></FormPanel><div className="side-stack"><FormPanel title="Ownership lookup" subtitle="See assets held by a DID." onSubmit={lookup} busy={busy} submitLabel="Find owned assets"><Field label="Owner DID" value={ownerDid} onChange={setOwnerDid} placeholder="did:trustmesh:..." /></FormPanel>{assets.length > 0 && <div className="result-list">{assets.map((asset) => <ResultCard key={asset.assetId} title={asset.assetId} data={asset} />)}</div>}</div></div></ViewHeader>;
}

function AccessView({ setNotice }) {
  const [form, setForm] = useState(initialAccess); const [requestId, setRequestId] = useState(''); const [status, setStatus] = useState('approved'); const [busy, setBusy] = useState(false); const submit = async (event) => { event.preventDefault(); setBusy(true); try { const result = await createAccessRequest({ ...form, reputationScoreAtRequest: Number(form.reputationScoreAtRequest) }); setRequestId(result.requestId); setNotice({ type: 'success', message: `Access request created: ${shortId(result.requestId)}` }); } catch (error) { setNotice({ type: 'error', message: error.message }); } finally { setBusy(false); } }; const update = async (event) => { event.preventDefault(); setBusy(true); try { await updateAccessRequestStatus(requestId, status); setNotice({ type: 'success', message: `Request ${status}. Audit event created.` }); } catch (error) { setNotice({ type: 'error', message: error.message }); } finally { setBusy(false); } };
  return <ViewHeader kicker="POLICY ENGINE" title="Access control" description="Turn ownership and reputation into a decision that can be inspected later." icon={LockKeyhole}><div className="form-layout"><FormPanel title="New access request" subtitle="Ask for scoped access to an asset." onSubmit={submit} busy={busy} submitLabel="Create request"><Field label="Requester DID" value={form.requesterDid} onChange={(value) => setForm({ ...form, requesterDid: value })} placeholder="did:trustmesh:..." /><Field label="Asset ID" value={form.assetId} onChange={(value) => setForm({ ...form, assetId: value })} placeholder="asset-001" /><div className="field-row"><Field label="Requested action" value={form.action} onChange={(value) => setForm({ ...form, action: value })} placeholder="view" /><Field label="Reputation score" type="number" value={form.reputationScoreAtRequest} onChange={(value) => setForm({ ...form, reputationScoreAtRequest: value })} placeholder="80" /></div></FormPanel><FormPanel title="Decision desk" subtitle="Update a request after review." onSubmit={update} busy={busy} submitLabel="Apply decision"><Field label="Request ID" value={requestId} onChange={setRequestId} placeholder="Paste request ID" /><label className="field-label">Decision<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="approved">Approved</option><option value="denied">Denied</option><option value="revoked">Revoked</option><option value="pending">Pending</option></select></label><div className="decision-note"><BadgeCheck size={18} /><span>Every decision is appended to the immutable audit trail.</span></div></FormPanel></div></ViewHeader>;
}

function AuditView({ logs, refresh }) { return <ViewHeader kicker="OBSERVABILITY" title="Audit trail" description="A chronological record of every important action in the trust layer." icon={ClipboardList}><div className="panel audit-table-panel"><div className="panel-heading"><div><h2>Event ledger</h2><span className="muted">{logs.length} events loaded from Astra DB</span></div><button className="secondary-button" onClick={refresh}><RefreshCw size={15} /> Refresh</button></div>{logs.length ? <div className="table-wrap"><table><thead><tr><th>Event</th><th>Entity</th><th>Reference</th><th>Recorded</th></tr></thead><tbody>{logs.map((log) => <tr key={log.auditId}><td><span className="event-name"><span className="table-dot" />{formatEvent(log.eventType)}</span></td><td>{log.entityType}</td><td className="mono">{shortId(log.entityId)}</td><td>{formatTime(log.timestamp)}</td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="No events yet" text="Create an identity, asset, or access request to populate the ledger." />}</div></ViewHeader>; }

function ViewHeader({ kicker, title, description, icon: Icon, children }) { return <><section className="view-header"><div className="view-icon"><Icon size={23} /></div><div><div className="section-kicker">{kicker}</div><h1>{title}</h1><p>{description}</p></div></section>{children}</>; }
function FormPanel({ title, subtitle, onSubmit, busy, submitLabel, children }) { return <form className="panel form-panel" onSubmit={onSubmit}><div className="form-heading"><div><h2>{title}</h2><span className="muted">{subtitle}</span></div></div>{children}<button className="primary-button form-submit" disabled={busy} type="submit">{busy ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}{busy ? 'Working...' : submitLabel}</button></form>; }
function Field({ label, value, onChange, placeholder, type = 'text' }) { return <label className="field-label">{label}<input required={type !== 'number'} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>; }
function ResultCard({ title, data }) { return <div className="result-card"><div className="result-title"><BadgeCheck size={17} /><strong>{title}</strong></div>{Object.entries(data).slice(0, 5).map(([key, value]) => <div className="result-row" key={key}><span>{key}</span><b>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</b></div>)}</div>; }
function EmptyState({ icon: Icon, title, text }) { return <div className="empty-state"><Icon size={24} /><strong>{title}</strong><span>{text}</span></div>; }

export default App;
