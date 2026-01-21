import { Icon, Text } from "@shopify/polaris";
import { XSmallIcon } from "@shopify/polaris-icons";

type Props = {
  /** The plan the UI is currently showing as active (effective plan). */
  currentPlanName: string;
  pendingPlanName?: string | null;
  pendingPlanEffectiveAt?: string | null;
  lastPlanChangeType?: string | null;
  /** Optional: show a close button (X) and call onDismiss when clicked. */
  dismissible?: boolean;
  onDismiss?: () => void;
};

function safeDateLabel(iso: string): string {
  const d = new Date(String(iso));
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : String(iso);
}

export function DowngradeScheduledBanner({
  currentPlanName,
  pendingPlanName,
  pendingPlanEffectiveAt,
  lastPlanChangeType,
  dismissible,
  onDismiss,
}: Props) {
  const next = String(pendingPlanName || "").trim();
  const effAt = String(pendingPlanEffectiveAt || "").trim();
  const isDowngrade = !lastPlanChangeType || String(lastPlanChangeType).trim() === "downgrade";

  if (!next || !effAt || !isDowngrade) return null;

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#FFF8DC", // subtle yellow (cornsilk)
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      {dismissible && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss downgrade notice"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            borderRadius: 8,
          }}
        >
          <Icon source={XSmallIcon} />
        </button>
      ) : null}
      <Text as="h3" variant="headingSm">
        Downgrade scheduled
      </Text>
      <div style={{ marginTop: 6 }}>
        <Text as="p" variant="bodyMd">
          Your plan will switch to <strong>{next}</strong> on {safeDateLabel(effAt)}. Until then,
          your current plan remains <strong>{String(currentPlanName)}</strong>.
        </Text>
      </div>
    </div>
  );
}

