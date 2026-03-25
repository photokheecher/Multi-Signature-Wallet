"use client";

import { useState, useCallback } from "react";
import {
  initializeWallet,
  submitTransaction,
  approveTransaction,
  executeTransaction,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "init" | "submit" | "approve" | "execute";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("init");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Init state
  const [ownersInput, setOwnersInput] = useState("");
  const [threshold, setThreshold] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  // Submit state
  const [submitTo, setSubmitTo] = useState("");
  const [submitAmount, setSubmitAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTxId, setSubmittedTxId] = useState<number | null>(null);

  // Approve state
  const [approveTxId, setApproveTxId] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Execute state
  const [executeTxId, setExecuteTxId] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleInitialize = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!ownersInput.trim()) return setError("Enter at least one owner address");
    if (!threshold || parseInt(threshold) < 1) return setError("Enter a valid threshold");
    
    const owners = ownersInput.split(",").map((o) => o.trim()).filter((o) => o.length > 0);
    if (owners.length < 2) return setError("Need at least 2 owners");
    if (parseInt(threshold) > owners.length) return setError("Threshold cannot exceed number of owners");

    setError(null);
    setIsInitializing(true);
    setTxStatus("Awaiting signature...");
    try {
      await initializeWallet(walletAddress, owners, parseInt(threshold));
      setTxStatus("Wallet initialized on-chain!");
      setOwnersInput("");
      setThreshold("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsInitializing(false);
    }
  }, [walletAddress, ownersInput, threshold]);

  const handleSubmitTx = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!submitTo.trim()) return setError("Enter recipient address");
    if (!submitAmount || parseInt(submitAmount) <= 0) return setError("Enter a valid amount");

    setError(null);
    setIsSubmitting(true);
    setTxStatus("Awaiting signature...");
    try {
      const result = await submitTransaction(walletAddress, submitTo.trim(), BigInt(submitAmount));
      // Extract tx_id from result if available
      setSubmittedTxId(0); // First tx is 0
      setTxStatus("Transaction submitted! Note the TX ID for approval.");
      setSubmitTo("");
      setSubmitAmount("");
      setTimeout(() => setTxStatus(null), 8000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [walletAddress, submitTo, submitAmount]);

  const handleApprove = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!approveTxId || parseInt(approveTxId) < 0) return setError("Enter a valid transaction ID");

    setError(null);
    setIsApproving(true);
    setTxStatus("Awaiting signature...");
    try {
      await approveTransaction(walletAddress, parseInt(approveTxId), walletAddress);
      setTxStatus("Transaction approved!");
      setApproveTxId("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsApproving(false);
    }
  }, [walletAddress, approveTxId]);

  const handleExecute = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!executeTxId || parseInt(executeTxId) < 0) return setError("Enter a valid transaction ID");

    setError(null);
    setIsExecuting(true);
    setTxStatus("Awaiting signature...");
    try {
      await executeTransaction(walletAddress, parseInt(executeTxId));
      setTxStatus("Transaction executed!");
      setExecuteTxId("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsExecuting(false);
    }
  }, [walletAddress, executeTxId]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "init", label: "Setup", icon: <WalletIcon />, color: "#7c6cf0" },
    { key: "submit", label: "Submit", icon: <SendIcon />, color: "#4fc3f7" },
    { key: "approve", label: "Approve", icon: <KeyIcon />, color: "#34d399" },
    { key: "execute", label: "Execute", icon: <PlayIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("executed") || txStatus.includes("approved") || txStatus.includes("initialized") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Multi-Sig Wallet</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
              <Badge variant="warning" className="text-[10px] bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20">Multi-Sig</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Initialize */}
            {activeTab === "init" && (
              <div className="space-y-5">
                <MethodSignature name="initialize" params="(owners: Vec<Address>, threshold: u32)" color="#7c6cf0" />
                <Input label="Owner Addresses (comma separated)" value={ownersInput} onChange={(e) => setOwnersInput(e.target.value)} placeholder="G..., G..., G..." />
                <Input label="Threshold (required approvals)" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="e.g. 2" type="number" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleInitialize} disabled={isInitializing} shimmerColor="#7c6cf0" className="w-full">
                    {isInitializing ? <><SpinnerIcon /> Initializing...</> : <><WalletIcon /> Initialize Wallet</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to initialize
                  </button>
                )}
                <p className="text-xs text-white/25">Enter at least 2 owner addresses. Threshold must be &gt;= 2 and &lt;= number of owners.</p>
              </div>
            )}

            {/* Submit Transaction */}
            {activeTab === "submit" && (
              <div className="space-y-5">
                <MethodSignature name="submit_tx" params="(to: Address, amount: i128) -&gt; u32" color="#4fc3f7" />
                <Input label="Recipient Address" value={submitTo} onChange={(e) => setSubmitTo(e.target.value)} placeholder="G..." />
                <Input label="Amount (in stroops)" value={submitAmount} onChange={(e) => setSubmitAmount(e.target.value)} placeholder="e.g. 1000000" type="number" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleSubmitTx} disabled={isSubmitting} shimmerColor="#4fc3f7" className="w-full">
                    {isSubmitting ? <><SpinnerIcon /> Submitting...</> : <><SendIcon /> Submit Transaction</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#4fc3f7]/20 bg-[#4fc3f7]/[0.03] py-4 text-sm text-[#4fc3f7]/60 hover:border-[#4fc3f7]/30 hover:text-[#4fc3f7]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to submit
                  </button>
                )}
              </div>
            )}

            {/* Approve Transaction */}
            {activeTab === "approve" && (
              <div className="space-y-5">
                <MethodSignature name="approve_tx" params="(tx_id: u32, approver: Address)" color="#34d399" />
                <Input label="Transaction ID" value={approveTxId} onChange={(e) => setApproveTxId(e.target.value)} placeholder="e.g. 0" type="number" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleApprove} disabled={isApproving} shimmerColor="#34d399" className="w-full">
                    {isApproving ? <><SpinnerIcon /> Approving...</> : <><KeyIcon /> Approve Transaction</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to approve
                  </button>
                )}
                <p className="text-xs text-white/25">Each owner must approve. Once threshold is reached, the transaction can be executed.</p>
              </div>
            )}

            {/* Execute Transaction */}
            {activeTab === "execute" && (
              <div className="space-y-5">
                <MethodSignature name="execute_tx" params="(tx_id: u32)" color="#fbbf24" />
                <Input label="Transaction ID" value={executeTxId} onChange={(e) => setExecuteTxId(e.target.value)} placeholder="e.g. 0" type="number" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleExecute} disabled={isExecuting} shimmerColor="#fbbf24" className="w-full">
                    {isExecuting ? <><SpinnerIcon /> Executing...</> : <><PlayIcon /> Execute Transaction</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to execute
                  </button>
                )}
                <p className="text-xs text-white/25">Transaction must have enough approvals (meet threshold) before execution.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Multi-Sig Wallet &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#7c6cf0]" />
                <span className="font-mono text-[9px] text-white/15">Setup</span>
              </span>
              <span className="text-white/10 text-[8px]">&rarr;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#4fc3f7]" />
                <span className="font-mono text-[9px] text-white/15">Submit</span>
              </span>
              <span className="text-white/10 text-[8px]">&rarr;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[9px] text-white/15">Approve</span>
              </span>
              <span className="text-white/10 text-[8px]">&rarr;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#fbbf24]" />
                <span className="font-mono text-[9px] text-white/15">Execute</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
