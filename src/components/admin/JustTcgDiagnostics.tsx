import React, { useState } from "react";
import { supabase } from "../../integrations/supabase/client";

const JustTcgDiagnostics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any | null>(null);
  const [copying, setCopying] = useState(false);

  const runPing = async () => {
    setLoading(true);
    setResp(null);
    try {
      const { data, error } = await supabase.functions.invoke("justtcg-ping");
      if (error) {
        setResp({ ok: false, error: error.message, status: (error as any)?.context?.response?.status });
      } else {
        setResp(data);
      }
    } catch (e: any) {
      setResp({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const copyJson = async () => {
    if (!resp) return;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(JSON.stringify(resp, null, 2));
    } finally {
      setCopying(false);
    }
  };

  const scheme = resp?.scheme ?? "X-API-Key";
  const keyPreview = resp?.meta?.keyPreview ?? "—";
  const status = typeof resp?.status !== "undefined" ? resp.status : "—";

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-2">JustTCG Diagnostics</h3>
      <p className="text-sm text-gray-600 mb-4">Quick check using GET /v1/games with X-API-Key.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded border p-3">
          <div className="text-xs text-gray-500">Scheme</div>
          <div className="font-medium">{scheme}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-gray-500">Key preview</div>
          <div className="font-mono">{keyPreview}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-gray-500">Status</div>
          <div className="font-medium">{status}</div>
        </div>
      </div>

      <button
        onClick={runPing}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run JustTCG Ping"}
      </button>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Response JSON</span>
          <button
            onClick={copyJson}
            disabled={!resp || copying}
            className="text-sm px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
          >
            {copying ? "Copying..." : "Copy"}
          </button>
        </div>
        {resp && (
          <pre className="bg-gray-50 p-3 rounded text-sm max-h-96 overflow-auto">
            {JSON.stringify(resp, null, 2)}
          </pre>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Secrets are read from Supabase Functions → JUSTTCG_API_KEY. Redeploy required after changing.
      </p>
    </div>
  );
};

export default JustTcgDiagnostics;
