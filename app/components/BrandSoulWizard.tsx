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

const ACCEPTED_FILE_TYPES = ["application/pdf", "text/plain"];

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

  const totalSteps = 2;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const handleDrop = useCallback(
    async (_: File[], accepted: File[]) => {
      const file = accepted?.[0];
      if (!file) return;

      if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
        setError("Only PDF and text files are accepted.");
        return;
      }

      setFileName(file.name);
      setFileLoading(true);
      setError(null);
      try {
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
          });
          setFileText(text);
        } else {
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
        }
      } catch (e: any) {
        setError(e?.message || "Failed to extract text from file");
      } finally {
        setFileLoading(false);
      }
    },
    [app, backendApiUrl, getTokenOrThrow],
  );

  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getTokenOrThrow();
      const payload = {
        urls: parseUrls(urls),
        brand_persona: persona,
        core_pillars: [],
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
    backendApiUrl,
    fileText,
    getTokenOrThrow,
    onClose,
    onComplete,
    persona,
    rawNotes,
    urls,
  ]);

  return (
    <Modal open={open} onClose={onClose} title="Brand Soul Wizard" size="large">
      <Modal.Section>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p" variant="bodySm" tone="subdued">
              Step {step + 1} of {totalSteps}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {progress}%
            </Text>
          </InlineStack>
          <ProgressBar progress={progress} size="small" />

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
                label="Brand information (optional)"
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
                Additional Information
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
                <DropZone
                  onDrop={handleDrop}
                  allowMultiple={false}
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                >
                  <DropZone.FileUpload />
                </DropZone>
                <Text as="p" variant="bodySm" tone="subdued">
                  Upload a PDF or text file with brand guidelines (optional).
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
            {step < totalSteps - 1 ? (
              <Button variant="primary" onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}>
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
