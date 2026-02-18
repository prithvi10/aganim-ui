import { useState, useCallback } from "react";
import { Card, Box, Text, BlockStack, InlineStack, Badge, ProgressBar } from "@shopify/polaris";

interface VisualAssets {
  refined_url?: string | null;
  ad_url?: string | null;
  original_image_url?: string | null;
}

interface VisualProgress {
  phase: string;
  pct: number;
  label: string;
}

interface VisualStepCardProps {
  progress?: VisualProgress | null;
  assets?: VisualAssets | null;
  isComplete?: boolean;
}

// Phase label and icon mapping
const PHASE_META: Record<string, { icon: string; color: string }> = {
  masking: { icon: "\u2702\uFE0F", color: "#9c6ade" },
  text_removal: { icon: "\uD83D\uDDD1\uFE0F", color: "#8e44ad" },
  object_removal: { icon: "\uD83E\uDDF9", color: "#6c3483" },
  inpainting: { icon: "\uD83C\uDFA8", color: "#2c6ecb" },
  ad_generation: { icon: "\uD83D\uDCF8", color: "#e67e22" },
  outpainting: { icon: "\uD83D\uDDBC\uFE0F", color: "#27ae60" },
  uploading: { icon: "\u2601\uFE0F", color: "#3498db" },
  complete: { icon: "\u2705", color: "#2ecc71" },
  error: { icon: "\u274C", color: "#e74c3c" },
};

interface CarouselSlide {
  url: string;
  label: string;
  sublabel: string;
  aspectRatio: string;
}

function ShimmerPlaceholder({ width, height, borderRadius = "8px" }: { width: string; height: string; borderRadius?: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

function ArrowButton({ direction, onClick, disabled }: { direction: "left" | "right"; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous image" : "Next image"}
      style={{
        position: "absolute",
        top: "50%",
        [direction === "left" ? "left" : "right"]: "8px",
        transform: "translateY(-50%)",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        background: disabled ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.15)",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        zIndex: 2,
        color: disabled ? "#ccc" : "#303030",
        fontSize: "18px",
        fontWeight: 700,
        padding: 0,
      }}
    >
      {direction === "left" ? "\u2039" : "\u203A"}
    </button>
  );
}

function ImageCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Image container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #e1e3e5",
          background: "#fafafa",
        }}
      >
        {/* Aspect-ratio wrapper */}
        <div style={{ position: "relative", width: "100%", aspectRatio: slide.aspectRatio }}>
          <img
            src={slide.url}
            alt={slide.label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "opacity 0.3s ease",
            }}
          />

          {/* Gradient overlay for label readability */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
              pointerEvents: "none",
            }}
          />

          {/* Bottom label */}
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "14px",
              right: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                {slide.label}
              </div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                {slide.sublabel}
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", fontWeight: 500 }}>
              {currentIndex + 1} / {slides.length}
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <ArrowButton direction="left" onClick={goToPrev} disabled={currentIndex === 0} />
            <ArrowButton direction="right" onClick={goToNext} disabled={currentIndex === slides.length - 1} />
          </>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            paddingTop: "10px",
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              style={{
                width: i === currentIndex ? "18px" : "6px",
                height: "6px",
                borderRadius: "3px",
                border: "none",
                background: i === currentIndex ? "#2c6ecb" : "#d9d9d9",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function VisualStepCard({ progress, assets, isComplete }: VisualStepCardProps) {
  const phase = progress?.phase || (isComplete ? "complete" : "masking");
  const pct = progress?.pct || (isComplete ? 100 : 0);
  const label = progress?.label || (isComplete ? "Visual pipeline complete" : "Initializing visual pipeline...");
  const meta = PHASE_META[phase] || PHASE_META.masking;

  // Build carousel slides from available assets
  const slides: CarouselSlide[] = [];
  if (assets?.refined_url) {
    slides.push({
      url: assets.refined_url,
      label: "Refined Product",
      sublabel: "AI-enhanced product image",
      aspectRatio: "1 / 1",
    });
  }
  if (assets?.ad_url) {
    slides.push({
      url: assets.ad_url,
      label: "Marketing Ad",
      sublabel: "Ready-to-post social creative",
      aspectRatio: "1 / 1",
    });
  }

  const hasAssets = slides.length > 0;

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack gap="200" blockAlign="center">
            <span style={{ fontSize: "20px" }}>{meta.icon}</span>
            <Text as="h3" variant="headingMd">
              Visual Generation
            </Text>
            {!isComplete && (
              <Text as="span" variant="bodySm" tone="subdued">
                {pct}%
              </Text>
            )}
          </InlineStack>

          {/* Progress bar */}
          {!isComplete && (
            <Box>
              <ProgressBar progress={pct} size="small" tone="highlight" />
            </Box>
          )}

          {/* Live status label */}
          <InlineStack gap="200" blockAlign="center">
            {!isComplete && (
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: meta.color,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            )}
            <Text as="p" variant="bodySm" tone="subdued">
              {label}
            </Text>
          </InlineStack>

          {/* Shimmer placeholders during generation */}
          {!isComplete && !hasAssets && (
            <div style={{ position: "relative", width: "100%", borderRadius: "10px", overflow: "hidden" }}>
              <ShimmerPlaceholder width="100%" height="300px" borderRadius="10px" />
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "14px",
                  display: "flex",
                  gap: "6px",
                }}
              >
                <ShimmerPlaceholder width="18px" height="6px" borderRadius="3px" />
                <ShimmerPlaceholder width="6px" height="6px" borderRadius="3px" />
                <ShimmerPlaceholder width="6px" height="6px" borderRadius="3px" />
              </div>
            </div>
          )}

          {/* Scrollable image carousel when assets are ready */}
          {hasAssets && <ImageCarousel slides={slides} />}
        </BlockStack>
      </Box>

      {/* CSS keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Card>
  );
}

export { ImageCarousel };
export type { VisualAssets, VisualProgress, CarouselSlide };
