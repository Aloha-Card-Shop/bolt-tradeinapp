import React, { useState } from "react";
import { supabase } from "../../integrations/supabase/client";

const SECRETS_URL = `https://supabase.com/dashboard/project/qgsabaicokoynabxgdco/settings/functions`;

const JustTcgKeyCard: React.FC = () => {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");

  const testKey = async () => {
    setLoading(true);
    setOutput("Testing provided key against JustTCG...\n");
    try {
      const { data, error } = await supabase.functions.invoke("justtcg-ping", {
        method: "POST",
        body: { key },
      });
      if (error) {
        setOutput((p) => p + `Error: ${error.message}\n`);
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
      <h3 className="text-lg font-semibold mb-2">JUSTTCG_API_KEY</h3>
      <p className="text-sm text-gray-600 mb-4">
        Secure key used by Edge Functions to access JustTCG. The current value is stored in Supabase Secrets and cannot be displayed here.
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-1">New API Key</label>
      <div className="flex items-center gap-2">
        <input
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="tcg_..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="px-3 py-2 text-sm border rounded"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={SECRETS_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Open Supabase Secrets to Save
        </a>
        <button
          onClick={testKey}
          disabled={!key || loading}
          className="inline-flex items-center px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test with This Key"}
        </button>
      </div>

      {output && (
        <pre className="mt-4 bg-gray-50 p-3 rounded text-sm max-h-96 overflow-auto">{output}</pre>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Tip: After saving the secret, re-run the JustTCG Ping below to verify the active key.
      </p>
    </div>
  );
};

export default JustTcgKeyCard;
