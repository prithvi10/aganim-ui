import { useState, useCallback } from "react";
import { Box, Text, BlockStack, InlineStack, Button } from "@shopify/polaris";

interface InstaPreviewProps {
  /** URL of the generated ad image */
  imageUrl: string;
  /** Caption text from social hooks */
  caption?: string;
  /** Brand/shop name for the header */
  brandName?: string;
  /** Brand avatar URL (optional, falls back to initials) */
  avatarUrl?: string;
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function InstaPreview({ imageUrl, caption, brandName, avatarUrl }: InstaPreviewProps) {
  const [copied, setCopied] = useState(false);
  const displayName = brandName || "your_brand";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleCopyCaption = useCallback(() => {
    if (caption) {
      navigator.clipboard.writeText(caption).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [caption]);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${displayName}-ad.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, displayName]);

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #dbdbdb",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* IG Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 14px",
          borderBottom: "1px solid #efefef",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
            marginRight: "10px",
            flexShrink: 0,
          }}
        >
          {!avatarUrl && initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#262626" }}>
            {displayName}
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e8e" }}>Sponsored</div>
        </div>
        <div style={{ color: "#262626", fontSize: "16px", cursor: "pointer" }}>•••</div>
      </div>

      {/* Image */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#fafafa",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={imageUrl}
          alt="Generated marketing ad"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {/* Action icons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 14px 6px",
        }}
      >
        <div style={{ display: "flex", gap: "14px", flex: 1, color: "#262626" }}>
          <div style={{ cursor: "pointer" }}><HeartIcon /></div>
          <div style={{ cursor: "pointer" }}><CommentIcon /></div>
          <div style={{ cursor: "pointer" }}><ShareIcon /></div>
        </div>
        <div style={{ color: "#262626", cursor: "pointer" }}><BookmarkIcon /></div>
      </div>

      {/* Likes */}
      <div style={{ padding: "0 14px 4px", fontSize: "13px", fontWeight: 600, color: "#262626" }}>
        Preview
      </div>

      {/* Caption */}
      {caption && (
        <div style={{ padding: "0 14px 10px", fontSize: "13px", color: "#262626", lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>{displayName}</span>{" "}
          {caption.length > 140 ? `${caption.slice(0, 140)}...` : caption}
        </div>
      )}

      {/* Actions bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 14px",
          borderTop: "1px solid #efefef",
        }}
      >
        <InlineStack gap="200">
          <Button size="slim" onClick={handleDownload}>
            ⬇ Download
          </Button>
          {caption && (
            <Button size="slim" onClick={handleCopyCaption}>
              {copied ? "✓ Copied!" : "📋 Copy Caption"}
            </Button>
          )}
        </InlineStack>
      </div>
    </div>
  );
}
