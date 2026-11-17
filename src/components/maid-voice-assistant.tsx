"use client";

import { useRef, useState } from "react";
import type { MaidView, WorkspaceData } from "@/lib/crm-types";
import { Card } from "@/components/ui";
import { Check, LoaderCircle, Mic, MicOff, Pencil, Play, RotateCcw, Sparkles, Volume2, X } from "lucide-react";

type MaidPatch = Partial<Record<"name" | "phone" | "age" | "location" | "serviceTypes" | "availability" | "workNotes", string>>;
type VoicePlan = {
  operation: "create" | "update" | "clarify" | "unsupported";
  targetId: number | null;
  targetName: string;
  patch: MaidPatch;
  summaryMalayalam: string;
  clarificationMalayalam: string;
  missingFields: string[];
};

type SpeechResult = { transcript: string };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<ArrayLike<SpeechResult> & { isFinal?: boolean }> };
type SpeechErrorEvent = { error: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const labels: Record<keyof MaidPatch, string> = {
  name: "പേര്",
  phone: "ഫോൺ നമ്പർ",
  age: "പ്രായം",
  location: "സ്ഥലം",
  serviceTypes: "ജോലി / കഴിവുകൾ",
  availability: "ലഭ്യത",
  workNotes: "കുറിപ്പുകൾ",
};

function speakMalayalam(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ml-IN";
  utterance.rate = 0.94;
  window.speechSynthesis.speak(utterance);
}

export function MaidVoiceAssistant({ data, onSave }: {
  data: WorkspaceData;
  onSave: (payload: Record<string, unknown>, success: string) => Promise<boolean>;
}) {
  const [command, setCommand] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<VoicePlan | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startListening = () => {
    setError("");
    setPlan(null);
    const SpeechRecognitionCtor = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("ഈ ബ്രൗസറിൽ Malayalam voice input ലഭ്യമല്ല. താഴെയുള്ള ബോക്സിൽ മലയാളത്തിൽ ടൈപ്പ് ചെയ്യാം.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ml-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const piece = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText += piece;
        else interimText += piece;
      }
      if (finalText) setCommand((previous) => [previous.trim(), finalText.trim()].filter(Boolean).join(" "));
      setInterim(interimText);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error === "not-allowed"
        ? "Microphone permission അനുവദിച്ചിട്ടില്ല. Chrome address bar-ൽ microphone permission allow ചെയ്യുക."
        : `Voice recognition error: ${event.error}. Malayalam text type ചെയ്ത് തുടരാം.`);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Microphone start ചെയ്യാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.");
    }
  };

  const reviewCommand = async () => {
    if (!command.trim()) return;
    setBusy(true);
    setError("");
    setPlan(null);
    try {
      const response = await fetch("/api/ai/maid-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });
      const result = await response.json() as VoicePlan & { error?: string };
      if (!response.ok) throw new Error(result.error || "Voice command analyse ചെയ്യാൻ കഴിഞ്ഞില്ല.");
      setPlan(result);
      if (result.operation === "clarify" || result.operation === "unsupported") {
        speakMalayalam(result.clarificationMalayalam || result.summaryMalayalam || "കൂടുതൽ വ്യക്തത വേണം.");
      } else {
        speakMalayalam(result.summaryMalayalam || "മാറ്റങ്ങൾ തയ്യാറാക്കി. ദയവായി പരിശോധിക്കുക.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI assistant unavailable.");
    } finally {
      setBusy(false);
    }
  };

  const confirmSave = async () => {
    if (!plan || (plan.operation !== "create" && plan.operation !== "update")) return;
    setSaving(true);
    setError("");
    const payload = plan.operation === "create"
      ? { action: "createMaid", ...plan.patch }
      : { action: "updateMaid", id: plan.targetId, ...plan.patch };
    const ok = await onSave(
      payload,
      plan.operation === "create" ? "Voice command: new maid profile saved" : "Voice command: maid profile updated",
    );
    setSaving(false);
    if (ok) {
      const message = plan.operation === "create" ? "പുതിയ മെയിഡിന്റെ പ്രൊഫൈൽ സേവ് ചെയ്തു." : "മെയിഡിന്റെ പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്തു.";
      speakMalayalam(message);
      setPlan(null);
      setCommand("");
    }
  };

  const selectedMaid: MaidView | undefined = plan?.targetId
    ? data.maids.find((maid) => maid.id === plan.targetId)
    : undefined;

  return (
    <Card>
      <div className="setting-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={17} />
            <strong>HOMIGO Malayalam Voice AI</strong>
          </div>
          <small>മലയാളത്തിൽ സംസാരിച്ച് മെയിഡ് പ്രൊഫൈലുകൾ ചേർക്കുകയും തിരുത്തുകയും ചെയ്യാം.</small>
        </div>
        <span className="badge badge-gray">Voice + Text</span>
      </div>
      <div className="field full" style={{ marginTop: 14 }}>
        <span className="field-label">നിങ്ങളുടെ കമാൻഡ്</span>
        <textarea
          value={command}
          onChange={(event) => { setCommand(event.target.value); setPlan(null); }}
          rows={3}
          placeholder="ഉദാ: ഷീബയുടെ പ്രൊഫൈലിൽ സ്ഥലം കോഴിക്കോട് ആക്കി മാറ്റുക. അല്ലെങ്കിൽ പുതിയ മെയിഡ് പേര് ലത, ഫോൺ നമ്പർ..."
          aria-label="Malayalam maid profile command"
        />
        {interim && <small className="muted-note">കേൾക്കുന്നു: {interim}</small>}
      </div>
      <div className="toolbar-actions" style={{ marginTop: 12 }}>
        <button type="button" className={listening ? "btn btn-primary" : "btn btn-secondary"} onClick={listening ? stopListening : startListening}>
          {listening ? <MicOff size={15} /> : <Mic size={15} />}
          {listening ? "Stop listening" : "മലയാളത്തിൽ സംസാരിക്കുക"}
        </button>
        <button type="button" className="btn btn-primary" disabled={!command.trim() || busy || listening} onClick={() => void reviewCommand()}>
          {busy ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />}
          {busy ? "പരിശോധിക്കുന്നു..." : "Review changes"}
        </button>
        <button type="button" className="btn btn-secondary" disabled={!command && !plan} onClick={() => { setCommand(""); setPlan(null); setError(""); }}>
          <RotateCcw size={14} /> Clear
        </button>
      </div>
      <small className="muted-note" style={{ display: "block", marginTop: 10 }}>
        Chrome microphone permission അനുവദിക്കുക. Voice recognition ലഭ്യമല്ലെങ്കിൽ മലയാളത്തിൽ ടൈപ്പ് ചെയ്തും ഉപയോഗിക്കാം. AI മറുപടി കേൾക്കാൻ speaker button അമർത്താം.
      </small>
      {error && <p role="alert" className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      {plan && (
        <div className="ai-preview" style={{ marginTop: 16 }}>
          <div className="setting-row">
            <div>
              <strong>{plan.operation === "create" ? "പുതിയ പ്രൊഫൈൽ" : plan.operation === "update" ? "പ്രൊഫൈൽ മാറ്റങ്ങൾ" : plan.operation === "clarify" ? "കൂടുതൽ വിവരം വേണം" : "ഈ കമാൻഡ് ലഭ്യമല്ല"}</strong>
              <small>{plan.operation === "update" ? `തിരഞ്ഞെടുത്ത വ്യക്തി: ${selectedMaid?.name || plan.targetName}` : plan.summaryMalayalam}</small>
            </div>
            {(plan.summaryMalayalam || plan.clarificationMalayalam) && <button type="button" className="btn btn-icon btn-secondary" aria-label="Speak AI response" onClick={() => speakMalayalam(plan.clarificationMalayalam || plan.summaryMalayalam)}><Volume2 size={16} /></button>}
          </div>
          {(plan.operation === "create" || plan.operation === "update") && (
            <>
              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table className="data-table">
                  <thead><tr><th>വിവരം</th><th>പുതിയ മൂല്യം</th></tr></thead>
                  <tbody>
                    {Object.entries(plan.patch).map(([key, value]) => (
                      <tr key={key}><td>{labels[key as keyof MaidPatch] || key}</td><td>{value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {plan.operation === "create" && (!plan.patch.name || !plan.patch.phone) && <p className="error-text">പേറും ഫോൺ നമ്പറും ആവശ്യമാണ്.</p>}
              <div className="toolbar-actions" style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-primary" disabled={saving || (plan.operation === "create" && (!plan.patch.name || !plan.patch.phone))} onClick={() => void confirmSave()}>
                  {saving ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />} Confirm &amp; Save
                </button>
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => setPlan(null)}><Pencil size={14} /> Edit command</button>
                <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => { setPlan(null); setCommand(""); }}><X size={14} /> Cancel</button>
              </div>
            </>
          )}
          {plan.operation === "clarify" && (
            <div style={{ marginTop: 12 }}>
              <p>{plan.clarificationMalayalam || "കൂടുതൽ വിവരം പറയാമോ?"}</p>
              {plan.missingFields.length > 0 && <small className="muted-note">വേണ്ട വിവരങ്ങൾ: {plan.missingFields.join(", ")}</small>}
              <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => speakMalayalam(plan.clarificationMalayalam)}><Volume2 size={14} /> മറുപടി കേൾക്കുക</button>
            </div>
          )}
          {plan.operation === "unsupported" && <p style={{ marginTop: 10 }}>{plan.clarificationMalayalam}</p>}
        </div>
      )}
    </Card>
  );
}
