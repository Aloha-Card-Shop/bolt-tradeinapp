import React, { useState } from "react";
import { supabase } from "../../integrations/supabase/client";

const JustTcgDiagnostics: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const runPing = async () => {
    setLoading(true);
    setOutput("Testing JustTCG connectivity...\n");
    try {
      const { data, error } = await supabase.functions.invoke("justtcg-ping");
      if (error) {
        setOutput((p) => p + `Error: ${error.message}\n`);
        if ((error as any)?.context?.response?.status === 401) {
          setOutput((p) => p + "Hint: JustTCG rejected the API key (401). Please verify the JUSTTCG_API_KEY in Supabase Edge Function secrets.\n");
        }
      } else {
        const d: any = data as any;
        const parts: string[] = [];
        if (d?.scheme) parts.push(`Scheme: ${d.scheme}`);
        if (d?.meta?.keyPreview) parts.push(`Key: ${d.meta.keyPreview}`);
        if (typeof d?.status !== "undefined") parts.push(`Status: ${d.status}`);
        if (parts.length) setOutput((p) => p + parts.join(" | ") + "\n");
        setOutput((p) => p + JSON.stringify(d, null, 2));
      }
    } catch (e: any) {
      setOutput((p) => p + `Unexpected error: ${e.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-2">JustTCG Diagnostics</h3>
      <p className="text-sm text-gray-600 mb-4">Quickly validates the configured JUSTTCG_API_KEY by calling the /games endpoint.</p>
      <button
        onClick={runPing}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run JustTCG Ping"}
      </button>
      {output && (
        <pre className="mt-4 bg-gray-50 p-3 rounded text-sm max-h-96 overflow-auto">{output}</pre>
      )}
    </div>
  );
};

export default JustTcgDiagnostics;
