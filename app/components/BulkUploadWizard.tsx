import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Box,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Banner,
  Divider,
  Select,
  Checkbox,
  Badge,
  ProgressBar,
} from "@shopify/polaris";
import { ArrowLeftIcon, PlayIcon } from "@shopify/polaris-icons";

interface BulkUploadWizardProps {
  missionType: "text_only" | "full_launch";
  backendApiUrl: string;
  shop: string;
  defaultTargetLocale?: string;
  imageCreditsRemaining?: number;
  onBack: () => void;
  onLaunched: (bulkMissionId: string) => void;
  getAuthToken: () => Promise<string | null>;
}

export function BulkUploadWizard({
  missionType,
  backendApiUrl,
  shop,
  defaultTargetLocale = "en",
  imageCreditsRemaining = 150,
  onBack,
  onLaunched,
  getAuthToken,
}: BulkUploadWizardProps) {
  const { t } = useTranslation("missions");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [hasMarketMismatch, setHasMarketMismatch] = useState(false);

  // Preferences
  const [toneProfile, setToneProfile] = useState("professional");
  const [brandSoul, setBrandSoul] = useState(false);
  const [usUnits, setUsUnits] = useState(true);
  const [targetMarket, setTargetMarket] = useState(defaultTargetLocale);

  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const acceptType = missionType === "full_launch" ? ".zip" : ".csv";
  const isFullLaunch = missionType === "full_launch";

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setParseError(null);
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const name = selectedFile.name.toLowerCase();
      if (isFullLaunch && !name.endsWith(".zip")) {
        setParseError("Please upload a .zip file for full launch missions.");
        return;
      }
      if (!isFullLaunch && !name.endsWith(".csv")) {
        setParseError("Please upload a .csv file for text-only missions.");
        return;
      }

      setFile(selectedFile);

      // Client-side CSV validation for quick feedback.
      // Descriptions may contain newlines inside quoted fields, so a naive
      // line-split over-counts. We use a state machine to find real record
      // boundaries (newlines outside of quoted fields).
      if (name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;

          // Split text into CSV records respecting quoted fields.
          const records: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '"') {
              inQuotes = !inQuotes;
              current += ch;
            } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
              if (ch === "\r" && text[i + 1] === "\n") i++;
              if (current.trim()) records.push(current);
              current = "";
            } else {
              current += ch;
            }
          }
          if (current.trim()) records.push(current);

          if (records.length < 2) {
            setParseError("CSV contains no product rows.");
            setParsedCount(0);
            return;
          }

          const headers = records[0].split(",").map((h) => h.trim().toLowerCase());
          const required = [
            "row_id",
            "product_name_ja",
            "description_ja",
            "category",
            "target_market",
          ];
          const missing = required.filter((r) => !headers.includes(r));
          if (missing.length > 0) {
            setParseError(
              `Missing required columns: ${missing.join(", ")}`,
            );
            setParsedCount(0);
            return;
          }

          const rowCount = records.length - 1;
          if (rowCount > 10) {
            setParseError(
              `Maximum 10 products per upload. CSV has ${rowCount} rows.`,
            );
            setParsedCount(0);
            return;
          }
          setParsedCount(rowCount);

          // Check for market mismatch
          const marketIdx = headers.indexOf("target_market");
          if (marketIdx >= 0) {
            const hasOtherMarket = records.slice(1).some((row) => {
              const lastComma = row.lastIndexOf(",");
              const market = row.slice(lastComma + 1).trim();
              return market && market !== defaultTargetLocale;
            });
            setHasMarketMismatch(hasOtherMarket);
          }
        };
        reader.readAsText(selectedFile);
      } else {
        // For ZIPs, trust server-side validation
        setParsedCount(-1); // unknown until server parses
      }
    },
    [isFullLaunch, defaultTargetLocale],
  );

  const handleLaunch = useCallback(async () => {
    if (!file) return;
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "payload",
        JSON.stringify({
          mission_type: missionType,
          preferences: {
            tone_profile: toneProfile,
            brand_soul_enabled: brandSoul,
            us_units_conversion: usUnits,
            target_market: targetMarket,
          },
        }),
      );

      const url = new URL(`${backendApiUrl}/api/missions/bulk`);
      if (!token && shop) {
        url.searchParams.set("shop", shop);
      }

      const resp = await fetch(url.toString(), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      onLaunched(data.bulk_mission_id);
    } catch (err) {
      setLaunchError(
        err instanceof Error ? err.message : "Failed to launch bulk mission",
      );
    } finally {
      setIsLaunching(false);
    }
  }, [
    file,
    missionType,
    toneProfile,
    brandSoul,
    usUnits,
    targetMarket,
    backendApiUrl,
    shop,
    getAuthToken,
    onLaunched,
  ]);

  const toneOptions = [
    { label: "Professional", value: "professional" },
    { label: "Luxury", value: "luxury" },
    { label: "Minimalist", value: "minimalist" },
    { label: "Playful", value: "playful" },
  ];

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="500">
          {/* Header */}
          <InlineStack gap="300" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="plain"
              onClick={onBack}
              disabled={isLaunching}
              accessibilityLabel={t("backToMissions")}
            />
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="headingXl">
                {isFullLaunch ? "📦" : "📄"}
              </Text>
              <Text as="h2" variant="headingLg">
                {isFullLaunch ? t("bulkFullLaunch") : t("bulkTextOnly")}
              </Text>
              <Badge tone="info">Pro</Badge>
            </InlineStack>
          </InlineStack>

          {/* Progress indicator */}
          <InlineStack gap="200" blockAlign="center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background:
                    s <= step
                      ? "var(--p-color-bg-fill-brand)"
                      : "var(--p-color-bg-surface-secondary)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </InlineStack>
          <InlineStack gap="200">
            <Text
              as="span"
              variant="bodySm"
              fontWeight={step === 1 ? "bold" : "regular"}
              tone={step === 1 ? undefined : "subdued"}
            >
              1. {t("bulkUploadFile")}
            </Text>
            <Text
              as="span"
              variant="bodySm"
              fontWeight={step === 2 ? "bold" : "regular"}
              tone={step === 2 ? undefined : "subdued"}
            >
              2. {t("bulkUploadPreferences")}
            </Text>
            <Text
              as="span"
              variant="bodySm"
              fontWeight={step === 3 ? "bold" : "regular"}
              tone={step === 3 ? undefined : "subdued"}
            >
              3. {t("bulkConfirmLaunch")}
            </Text>
          </InlineStack>

          <Divider />

          {/* Step 1: File Upload */}
          {step === 1 && (
            <BlockStack gap="400">
              <div
                style={{
                  border: "2px dashed var(--p-color-border)",
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  cursor: "pointer",
                  background: "var(--p-color-bg-surface-secondary)",
                }}
                onClick={() =>
                  document.getElementById("bulk-file-input")?.click()
                }
              >
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="span" variant="headingXl">
                    {isFullLaunch ? "📦" : "📄"}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {t("bulkDropzoneLabel")}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {isFullLaunch
                      ? t("bulkZipStructure")
                      : t("bulkRequiredColumns")}
                  </Text>
                  {file && (
                    <Badge tone="success">{file.name}</Badge>
                  )}
                </BlockStack>
                <input
                  id="bulk-file-input"
                  type="file"
                  accept={acceptType}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              {parseError && (
                <Banner tone="critical">
                  <Text as="p" variant="bodySm">
                    {parseError}
                  </Text>
                </Banner>
              )}

              {parsedCount > 0 && (
                <Banner tone="success">
                  <Text as="p" variant="bodySm">
                    {t("bulkProductsParsed", { count: parsedCount })}
                  </Text>
                </Banner>
              )}

              <Text as="p" variant="bodySm" tone="subdued">
                {t("bulkMaxProducts")}
              </Text>

              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!file || !!parseError}
              >
                Continue
              </Button>
            </BlockStack>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <BlockStack gap="400">
              <Select
                label={t("bulkToneProfile")}
                options={toneOptions}
                value={toneProfile}
                onChange={setToneProfile}
              />

              <Checkbox
                label={t("bulkBrandSoul")}
                checked={brandSoul}
                onChange={setBrandSoul}
              />

              <Checkbox
                label={t("bulkUsUnits")}
                checked={usUnits}
                onChange={setUsUnits}
              />

              <Select
                label={t("bulkTargetMarket")}
                options={[
                  { label: "English (en)", value: "en" },
                  { label: "Chinese Traditional (zh-TW)", value: "zh-TW" },
                  { label: "Chinese Simplified (zh-CN)", value: "zh-CN" },
                  { label: "Korean (ko)", value: "ko" },
                  { label: "French (fr)", value: "fr" },
                  { label: "German (de)", value: "de" },
                  { label: "Spanish (es)", value: "es" },
                ]}
                value={targetMarket}
                onChange={setTargetMarket}
              />

              {hasMarketMismatch && (
                <Banner tone="warning">
                  <Text as="p" variant="bodySm">
                    {t("bulkTargetMarketWarning", {
                      default: defaultTargetLocale,
                    })}
                  </Text>
                </Banner>
              )}

              <InlineStack gap="200">
                <Button onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </InlineStack>
            </BlockStack>
          )}

          {/* Step 3: Confirm & Launch */}
          {step === 3 && (
            <BlockStack gap="400">
              {isFullLaunch && (
                <>
                  <Text as="h3" variant="headingMd">
                    {t("bulkCreditPreview")}
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm">
                      {t("bulkImageCredits", {
                        count: parsedCount > 0 ? parsedCount : "?",
                        remaining: imageCreditsRemaining,
                      })}
                    </Text>
                    {parsedCount > 0 &&
                      imageCreditsRemaining - parsedCount < 20 && (
                        <Banner tone="warning">
                          <Text as="p" variant="bodySm">
                            {t("bulkImageCreditsWarning", {
                              remaining:
                                imageCreditsRemaining - parsedCount,
                            })}
                          </Text>
                        </Banner>
                      )}
                  </BlockStack>
                </>
              )}

              <Divider />

              <BlockStack gap="100">
                <Text as="p" variant="bodySm">
                  <strong>File:</strong> {file?.name}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Products:</strong>{" "}
                  {parsedCount > 0 ? parsedCount : "Will be validated on server"}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Tone:</strong> {toneProfile}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Brand Soul:</strong> {brandSoul ? "Yes" : "No"}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>US Units:</strong> {usUnits ? "Yes" : "No"}
                </Text>
                <Text as="p" variant="bodySm">
                  <strong>Target Market:</strong> {targetMarket}
                </Text>
              </BlockStack>

              {launchError && (
                <Banner tone="critical">
                  <Text as="p" variant="bodySm">
                    {launchError}
                  </Text>
                </Banner>
              )}

              <InlineStack gap="200">
                <Button onClick={() => setStep(2)} disabled={isLaunching}>
                  Back
                </Button>
                <div style={{ flex: 1 }}>
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    icon={PlayIcon}
                    onClick={handleLaunch}
                    loading={isLaunching}
                    disabled={isLaunching}
                  >
                    {t("bulkLaunchButton")}
                  </Button>
                </div>
              </InlineStack>
            </BlockStack>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
