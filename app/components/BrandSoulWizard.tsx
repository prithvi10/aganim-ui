import { useCallback, useMemo, useState } from "react";
import type { ClientApplication } from "@shopify/app-bridge";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  DropZone,
  InlineStack,
  Modal,
  ProgressBar,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete?: (summary?: string) => void;
  backendApiUrl: string;
  planName: string;
};

const PERSONA_OPTIONS = [
  { label: "The Heritage Storyteller", value: "Heritage Storyteller" },
  { label: "The Modern Minimalist", value: "Modern Minimalist" },
  { label: "The Technical Expert", value: "Technical Expert" },
  { label: "The Lifestyle Curator", value: "Lifestyle Curator" },
];

function parseUrls(raw: string): string[] {
  return raw
    .split(/\s|,|\n/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"));
}

export function BrandSoulWizard({
  open,
  onClose,
  onComplete,
  backendApiUrl,
  planName,
}: Props) {
  const app = useAppBridge() as unknown as ClientApplication<any>;
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState(PERSONA_OPTIONS[0].value);
  const [pillar1, setPillar1] = useState("");
  const [pillar2, setPillar2] = useState("");
  const [pillar3, setPillar3] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [urls, setUrls] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTokenOrThrow = useCallback(async () => {
    const host = new URLSearchParams(window.location.search).get("host");
    const embedded = window.top !== window.self;
    const appKeys = Object.keys((app as any) || {}).join(",") || "none";

    if (!app) {
      throw new Error(
        `App Bridge not available (embedded=${embedded}, host=${host || "missing"}, appKeys=${appKeys})`,
      );
    }

    try {
      const idToken = (app as any)?.idToken;
      if (typeof idToken === "function") {
        return await idToken();
      }
      return await getSessionToken(app as any);
    } catch (e: any) {
      const msg = String(e?.message || e || "unknown");
      throw new Error(
        `App Bridge token failed (embedded=${embedded}, host=${host || "missing"}, appKeys=${appKeys}): ${msg}`,
      );
    }
  }, [app]);

  const isStandardPlus = useMemo(() => {
    const n = String(planName || "").toLowerCase();
    return n === "standard" || n === "pro";
  }, [planName]);

  const progress = Math.round(((step + 1) / 3) * 100);

  const handleDrop = useCallback(
    async (_: File[], accepted: File[]) => {
      const file = accepted?.[0];
      if (!file) return;
      setFileName(file.name);
      setFileLoading(true);
      setError(null);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        const match = dataUrl.match(/^data:(.*);base64,(.*)$/);
        if (!match) {
          throw new Error("Unsupported file format");
        }
        const mimeType = match[1];
        const fileB64 = match[2];

        const token = await getTokenOrThrow();
        const resp = await fetch(`${backendApiUrl}/api/admin/brand-context/extract-file`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ file_b64: fileB64, mime_type: mimeType }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data?.status !== "success") {
          throw new Error(data?.detail || "Failed to extract text");
        }
        setFileText(String(data?.text || ""));
      } catch (e: any) {
        setError(e?.message || "Failed to extract text from file");
      } finally {
        setFileLoading(false);
      }
    },
    [app, backendApiUrl],
  );

  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getTokenOrThrow();
      const payload = {
        urls: parseUrls(urls),
        brand_persona: persona,
        core_pillars: [pillar1, pillar2, pillar3].filter((p) => p?.trim()),
        raw_text: rawNotes,
        file_text: fileText,
      };

      const resp = await fetch(`${backendApiUrl}/api/admin/brand-context/ingest-async`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.status !== "accepted") {
        throw new Error(data?.detail || "Failed to ingest brand context");
      }
      if (onComplete) onComplete(data?.summary);
      onClose();
      setStep(0);
    } catch (e: any) {
      setError(e?.message || "Failed to save brand context");
    } finally {
      setSaving(false);
    }
  }, [
    app,
    backendApiUrl,
    fileText,
    getTokenOrThrow,
    onClose,
    onComplete,
    persona,
    pillar1,
    pillar2,
    pillar3,
    rawNotes,
    urls,
  ]);

  return (
    <Modal open={open} onClose={onClose} title="Brand Soul Wizard" size="large">
      <Modal.Section>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p" variant="bodySm" tone="subdued">
              Step {step + 1} of 3
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {progress}%
            </Text>
          </InlineStack>
          <ProgressBar progress={progress} size="small" />

          {!isStandardPlus ? (
            <Banner tone="info" title="Standard+ feature">
              Build your Brand Soul now. The “Enhance with Brand Soul” toggle is available
              on Standard and Pro plans.
            </Banner>
          ) : null}

          {error ? <Banner tone="critical">{error}</Banner> : null}

          {step === 0 ? (
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Brand Persona
              </Text>
              <Select
                label="Choose your brand archetype"
                options={PERSONA_OPTIONS}
                value={persona}
                onChange={(v) => setPersona(v)}
              />
              <TextField
                label="Additional notes (optional)"
                value={rawNotes}
                onChange={setRawNotes}
                multiline={4}
                autoComplete="off"
              />
            </BlockStack>
          ) : null}

          {step === 1 ? (
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Core Pillars
              </Text>
              <TextField label="Pillar 1" value={pillar1} onChange={setPillar1} autoComplete="off" />
              <TextField label="Pillar 2" value={pillar2} onChange={setPillar2} autoComplete="off" />
              <TextField label="Pillar 3" value={pillar3} onChange={setPillar3} autoComplete="off" />
            </BlockStack>
          ) : null}

          {step === 2 ? (
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Optional Upload or URLs
              </Text>
              <TextField
                label="Website URLs (About Us / Story / Blog)"
                value={urls}
                onChange={setUrls}
                multiline={3}
                helpText="Paste one or more URLs separated by commas or new lines."
                autoComplete="off"
              />
              <Box>
                <DropZone onDrop={handleDrop} allowMultiple={false}>
                  <DropZone.FileUpload />
                </DropZone>
                <Text as="p" variant="bodySm" tone="subdued">
                  Upload a PDF or image with brand guidelines (optional).
                </Text>
                {fileName ? (
                  <Text as="p" variant="bodySm">
                    {fileLoading ? "Extracting text..." : `File: ${fileName}`}
                  </Text>
                ) : null}
              </Box>
              {fileText ? (
                <TextField
                  label="Extracted file text"
                  value={fileText}
                  onChange={setFileText}
                  multiline={4}
                  autoComplete="off"
                />
              ) : null}
            </BlockStack>
          ) : null}

          <InlineStack align="space-between">
            <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving}>
              Back
            </Button>
            {step < 2 ? (
              <Button variant="primary" onClick={() => setStep((s) => Math.min(2, s + 1))}>
                Next
              </Button>
            ) : (
              <Button variant="primary" loading={saving} onClick={submit}>
                Save Brand Soul
              </Button>
            )}
          </InlineStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
