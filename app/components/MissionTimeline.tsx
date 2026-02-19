import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Box, Text, BlockStack, InlineStack, Badge, Button, Banner, ProgressBar, Divider, Spinner } from "@shopify/polaris";
import { AgentCard, type AgentStatus } from "./AgentCard";
import { MissionSummary, type MissionState as SummaryMissionState } from "./MissionSummary";
import { StepApproval, type AgentOutput } from "./StepApproval";
import { RegenerateFeedbackModal } from "./RegenerateFeedbackModal";
import { TEMPLATE_DEFINITIONS } from "./MissionArchitect";
import { VisualStepCard, ImageCarousel, type VisualAssets, type VisualProgress, type CarouselSlide } from "./VisualStepCard";


interface MissionState {
  product_id: string;
  shop_id: string;
  plan_tier: string;
  status: string;
  draft_content?: string;
  draft_title?: string;
  seo_title?: string;
  seo_description?: string;
  seo_alt_text?: string;
  seo_insights?: {
    lsi_keywords_used?: string[];
  };
  pricing_analysis?: {
    recommended_price?: number;
    price_position?: string;
    confidence?: number;
    reasoning?: string;
    competitors?: Array<{
      name: string;
      price: number;
    }>;
  };
  compliance_flags?: string[];
  discovered_values?: Array<{
    label?: string;
    evidence?: string;
    name?: string;
    value?: string;
    source?: string;
  }>;
  social_hooks?: Array<{
    type: string;
    caption: string;
  }>;
  logs?: string[];
  error_message?: string;
  accumulated_usage?: {
    total_tokens?: number;
    call_count?: number;
  };
  // Visual agent fields (Pro tier)
  visual_assets?: VisualAssets | null;
  visual_progress?: VisualProgress | null;
  // Content hero agent fields (blog/collection hero banners)
  content_hero_assets?: {
    hero_url?: string;
    content_type?: string;
    theme_context?: string;
  } | null;
  // Ad-hoc mode fields
  is_adhoc?: boolean;
  requested_agents?: string[];
  // Step-by-step journey fields
  current_agent_index?: number;
  skipped_agents?: string[];
  agent_outputs?: Record<string, Record<string, unknown>>;
  regeneration_feedback?: string;
  workflow_agents?: string[];
  workflow_config?: Array<{ agent_name: string; has_gate: boolean; template_id?: string }>;
}

interface AgentInfo {
  name: string;
  status: AgentStatus;
  logs: string[];
  startTime?: number;
  endTime?: number;
}

interface MissionTimelineProps {
  /** Mission ID to stream updates for */
  missionId: string;
  /** Backend API base URL */
  apiBaseUrl: string;
  /** Shop domain for authentication fallback */
  shop?: string;
  /** Auth token for API requests */
  authToken?: string;
  /** Callback when mission completes successfully */
  onComplete?: (state: MissionState) => void;
  /** Callback when mission fails */
  onError?: (error: string) => void;
  /** Callback when user clicks "Publish" in the summary */
  onPublish?: (state: MissionState) => void;
  /** Callback when user clicks "Discard" in the summary */
  onDiscard?: () => void;
  /** Callback when user clicks "Edit" in the summary */
  onEdit?: (state: MissionState) => void;
  /** 
   * Initial list of agents to show in the timeline.
   * Use this for ad-hoc mode to only show relevant agents.
   * If not provided, agents are inferred from plan_tier.
   */
  initialAgents?: string[];
  /** Whether to show the mission summary at the end */
  showSummary?: boolean;
  /** Whether to show compact view (sidebar style) */
  compact?: boolean;
  /**
   * Enable step-by-step mode where merchant approves each agent before proceeding.
   * When true, the component will use /run-step instead of /stream and show
   * approval buttons after each agent completes.
   */
  stepMode?: boolean;
  /** Callback when merchant approves current step and wants to continue */
  onStepApprove?: () => void;
  /** Callback when merchant wants to regenerate current agent with feedback */
  onStepRegenerate?: (feedback: string) => void;
  /** Callback when merchant wants to skip current agent */
  onStepSkip?: () => void;
  /** External social hooks (used as fallback when mission state has no hooks, e.g. Digital Marketing page) */
  externalSocialHooks?: Array<{ type: string; caption: string; hashtags?: string[] }>;
}

// Map agent class names to display names
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  "RewriterAgent": "Rewriter",
  "CopywriterAgent": "Rewriter",  // Backward compat alias
  "SEOAgent": "SEO",
  "MarketingAgent": "Marketing",
  "PriceScoutAgent": "PriceScout",
  "VisualAgent": "Visual",
  "ImageRefinementAgent": "Image Refinement",
  "VisualMarketingAgent": "Visual Marketing",
  "ComplianceAgent": "Compliance",  // Kept for backward compat
  // Display name to display name (for backward compat)
  "Rewriter": "Rewriter",
  "Copywriter": "Rewriter",  // Backward compat
  "SEO": "SEO",
  "Marketing": "Marketing",
  "PriceScout": "PriceScout",
  "Visual": "Visual",
  "ImageRefinement": "Image Refinement",
  "VisualMarketing": "Visual Marketing",
  "ContentHeroAgent": "Content Hero",
  "ContentHero": "Content Hero",
  "Compliance": "Compliance",
};

// Get display name for a step, checking workflow_config for template_id
function getStepName(
  agentName: string,
  stepIndex: number,
  workflowConfig?: Array<{ agent_name: string; has_gate: boolean; template_id?: string }>,
): string {
  if (workflowConfig && stepIndex < workflowConfig.length) {
    const templateId = workflowConfig[stepIndex]?.template_id;
    if (templateId && TEMPLATE_DEFINITIONS[templateId]) {
      return `${TEMPLATE_DEFINITIONS[templateId].icon} ${TEMPLATE_DEFINITIONS[templateId].displayName}`;
    }
  }
  return AGENT_DISPLAY_NAMES[agentName] || agentName;
}

// Parse agent name from log message
function extractAgentFromLog(log: string): string | null {
  const match = log.match(/^([A-Za-z]+):/);
  return match ? match[1] : null;
}

// Get workflow agents based on plan tier (default full workflow)
function getWorkflowAgents(planTier: string): string[] {
  // Current workflow: Rewriter → SEO → Marketing → PriceScout
  return ["Rewriter", "SEO", "Marketing", "PriceScout"];
}

// Convert requested_agents to display names
function normalizeAgentNames(agents: string[]): string[] {
  return agents.map(a => AGENT_DISPLAY_NAMES[a] || a);
}

export function MissionTimeline({
  missionId,
  apiBaseUrl,
  shop,
  authToken,
  onComplete,
  onError,
  onPublish,
  onDiscard,
  onEdit,
  initialAgents,
  showSummary = true,
  compact = false,
  stepMode = false,
  onStepApprove,
  onStepRegenerate,
  onStepSkip,
  externalSocialHooks,
}: MissionTimelineProps) {
  const [missionState, setMissionState] = useState<MissionState | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [stepCompleteData, setStepCompleteData] = useState<{
    current_agent: string;
    current_agent_index: number;
    total_agents: number;
    is_final: boolean;
    agent_output?: Record<string, unknown>;
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  // Track if we received any data - to prevent auto-reconnection loops
  const receivedDataRef = useRef(false);
  // Stable refs for callbacks & state — used inside EventSource handlers to avoid
  // re-creating the EventSource whenever mission state / callbacks change.
  const missionStateRef = useRef<MissionState | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;
  // State for regenerate feedback modal
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  // Track agents that were auto-proceeded (no human gate)
  const [autoProceededAgents, setAutoProceededAgents] = useState<string[]>([]);
  // Stable ref for initialAgents — prevents the getAgentsToShow → updateAgentFromLogs
  // → SSE useEffect dependency chain from re-firing on every render when the parent
  // passes an inline array literal (e.g. initialAgents={['ImageRefinementAgent']}).
  const initialAgentsRef = useRef(initialAgents);
  initialAgentsRef.current = initialAgents;

  // Determine which agents to show
  const getAgentsToShow = useCallback((state: MissionState | null): string[] => {
    // Priority 1: initialAgents prop (for ad-hoc mode)
    if (initialAgentsRef.current && initialAgentsRef.current.length > 0) {
      return normalizeAgentNames(initialAgentsRef.current);
    }
    
    // Priority 2: requested_agents from state
    if (state?.requested_agents && state.requested_agents.length > 0) {
      return normalizeAgentNames(state.requested_agents);
    }
    
    // Priority 3: workflow_agents from orchestrator (set from workflow_config)
    if (state?.workflow_agents && state.workflow_agents.length > 0) {
      return normalizeAgentNames(state.workflow_agents);
    }
    
    // Priority 4: plan tier default
    return getWorkflowAgents(state?.plan_tier || "Basic");
  }, []);

  // Update agent status based on logs
  const updateAgentFromLogs = useCallback((state: MissionState) => {
    const workflowAgents = getAgentsToShow(state);
    
    setAgents((prevAgents) => {
      // Initialize agents if empty or agents changed
      const currentAgentNames = prevAgents.map(a => a.name);
      const needsInit = prevAgents.length === 0 || 
        !workflowAgents.every(a => currentAgentNames.includes(a));
      
      if (needsInit) {
        return workflowAgents.map((name) => ({
          name,
          status: "idle" as AgentStatus,
          logs: [],
        }));
      }

      // Update based on logs
      const newAgents = [...prevAgents];
      const logs = state.logs || [];
      
      for (const log of logs) {
        const agentName = extractAgentFromLog(log);
        if (!agentName) continue;

        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
        const agentIndex = newAgents.findIndex(
          (a) => normalize(a.name) === normalize(agentName)
        );
        if (agentIndex === -1) continue;

        // Update agent logs
        if (!newAgents[agentIndex].logs.includes(log)) {
          newAgents[agentIndex].logs = [...newAgents[agentIndex].logs, log];
        }

        // Update agent status based on log content
        const isActivityLog = log.includes("Perceiving") || log.includes("Planning") ||
          log.includes("Executing") || log.includes("Running") || /\[\d+%\]/.test(log);
        if (isActivityLog) {
          if (newAgents[agentIndex].status !== "done" && newAgents[agentIndex].status !== "failed") {
            newAgents[agentIndex].status = "thinking";
            if (!newAgents[agentIndex].startTime) {
              newAgents[agentIndex].startTime = Date.now();
            }
          }
        }
        if (log.includes("Completed") || log.includes("complete")) {
          newAgents[agentIndex].status = "done";
          newAgents[agentIndex].endTime = Date.now();
        }
      }

      // Check for errors
      if (state.status === "ERROR") {
        const lastActiveAgent = newAgents.find((a) => a.status === "thinking");
        if (lastActiveAgent) {
          lastActiveAgent.status = "failed";
        }
      }

      return newAgents;
    });
  }, [getAgentsToShow]);

  // Connect to SSE stream (auto-flow mode) or wait for step triggers (step mode)
  useEffect(() => {
    if (!missionId) return;
    
    // In step mode, we don't auto-connect - we wait for explicit step triggers
    if (stepMode) {
      return;
    }

    // Reset received data flag
    receivedDataRef.current = false;

    // Build stream URL with shop param for authentication
    const streamUrl = new URL(`${apiBaseUrl}/api/missions/${missionId}/stream`);
    if (shop) {
      streamUrl.searchParams.set("shop", shop);
    }
    
    // Note: EventSource doesn't support custom headers
    // For auth, we use shop query param as fallback
    const eventSource = new EventSource(streamUrl.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener("state_update", (event) => {
      receivedDataRef.current = true;
      try {
        const state = JSON.parse(event.data) as MissionState;
        setMissionState(state);
        missionStateRef.current = state;
        updateAgentFromLogs(state);
        
        // Show summary when complete
        if (state.status === "COMPLETED" || state.status === "COMPLIANCE_REVIEW") {
          setShowSummaryCard(showSummary);
        }
      } catch (e) {
        console.error("Failed to parse state update:", e);
      }
    });

    eventSource.addEventListener("complete", (event) => {
      receivedDataRef.current = true;
      try {
        const data = JSON.parse(event.data);
        console.log("Mission complete:", data);
        // Use ref to read the latest missionState without adding it to deps
        const latestState = missionStateRef.current;
        if (latestState && onCompleteRef.current) {
          onCompleteRef.current(latestState);
        }
      } catch (e) {
        console.error("Failed to parse complete event:", e);
      }
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.addEventListener("error", (event) => {
      try {
        // Check if it's a custom error event with data
        const customEvent = event as MessageEvent;
        if (customEvent.data) {
          const data = JSON.parse(customEvent.data);
          setError(data.error || "Unknown error");
          if (onErrorRef.current) {
            onErrorRef.current(data.error || "Unknown error");
          }
          // Close on error event to prevent reconnection
          eventSource.close();
          setIsConnected(false);
        }
      } catch {
        // Standard SSE error (connection issue)
        if (eventSource.readyState === EventSource.CLOSED) {
          setIsConnected(false);
        }
      }
    });

    // CRITICAL: Prevent auto-reconnection loops
    eventSource.onerror = () => {
      // Only allow auto-reconnect if we never received any data (initial connection issue)
      if (receivedDataRef.current) {
        console.log("[MissionTimeline] SSE stream ended, not reconnecting (data was received)");
        eventSource.close();
        setIsConnected(false);
      }
      // If no data received yet, EventSource will auto-retry (which is fine for initial connection issues)
    };

    return () => {
      eventSource.close();
    };
    // NOTE: missionState, onComplete, onError intentionally excluded — accessed
    // via refs inside handlers to prevent re-creating the EventSource on every
    // state update (which was causing a reconnection storm).
  }, [missionId, apiBaseUrl, stepMode, updateAgentFromLogs, showSummary, shop]);

  // Handle publish action
  const handlePublish = useCallback(async () => {
    if (!missionState || !onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish(missionState);
    } finally {
      setIsPublishing(false);
    }
  }, [missionState, onPublish]);

  // Handle discard action
  const handleDiscard = useCallback(() => {
    if (onDiscard) {
      onDiscard();
    }
  }, [onDiscard]);

  // Handle edit action
  const handleEdit = useCallback(() => {
    if (missionState && onEdit) {
      onEdit(missionState);
    }
  }, [missionState, onEdit]);

  // Calculate overall progress — use different source of truth for step mode
  const stepModeTotal = missionState?.workflow_agents?.length
    || missionState?.workflow_config?.length
    || stepCompleteData?.total_agents
    || 0;
  const stepModeCompleted = missionState?.status === "COMPLETED"
    ? stepModeTotal
    : (missionState?.current_agent_index || 0);
  const totalAgents = stepMode && stepModeTotal > 0 ? stepModeTotal : agents.length;
  const completedAgents = stepMode && stepModeTotal > 0
    ? stepModeCompleted
    : agents.filter((a) => a.status === "done").length;
  const progress = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  // Determine overall status
  const getOverallStatus = () => {
    if (!missionState) return "Initializing...";
    if (missionState.status === "ERROR") return "Failed";
    if (missionState.status === "COMPLETED") return "Completed";
    if (missionState.status === "COMPLIANCE_REVIEW") return "Needs Review";
    if (missionState.status === "IN_PROGRESS") return "In Progress";
    return missionState.status;
  };

  // Determine if this is an ad-hoc run
  const isAdhoc = missionState?.is_adhoc || (initialAgents && initialAgents.length > 0);

  // Step mode: Run current step via SSE
  const runCurrentStep = useCallback(async () => {
    if (!missionId || !stepMode) return;
    
    setIsStepLoading(true);
    setError(null);
    setStepCompleteData(null);
    receivedDataRef.current = false;

    const stepUrl = new URL(`${apiBaseUrl}/api/missions/${missionId}/run-step`);
    if (shop) {
      stepUrl.searchParams.set("shop", shop);
    }

    const eventSource = new EventSource(stepUrl.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener("state_update", (event) => {
      receivedDataRef.current = true;
      try {
        const state = JSON.parse(event.data) as MissionState;
        setMissionState(state);
        updateAgentFromLogs(state);
      } catch (e) {
        console.error("Failed to parse step state update:", e);
      }
    });

    eventSource.addEventListener("step_auto_proceeded", (event) => {
      receivedDataRef.current = true;
      try {
        const data = JSON.parse(event.data);
        console.log("Step auto-proceeded:", data);
        // Track which agents were auto-proceeded for UI display
        const workflowAgents = missionState?.workflow_agents || [];
        const autoAgent = workflowAgents[data.auto_proceeded_from];
        if (autoAgent) {
          setAutoProceededAgents((prev) =>
            prev.includes(autoAgent) ? prev : [...prev, autoAgent]
          );
        }
      } catch (e) {
        console.error("Failed to parse step_auto_proceeded:", e);
      }
    });

    eventSource.addEventListener("step_complete", (event) => {
      receivedDataRef.current = true;
      try {
        const data = JSON.parse(event.data);
        console.log("Step complete:", data);
        setStepCompleteData(data);
        setIsStepLoading(false);
        
        // If final step, show summary
        if (data.is_final) {
          setShowSummaryCard(showSummary);
          if (missionState && onComplete) {
            onComplete(missionState);
          }
        }
      } catch (e) {
        console.error("Failed to parse step complete:", e);
      }
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.addEventListener("error", (event) => {
      try {
        const customEvent = event as MessageEvent;
        if (customEvent.data) {
          const data = JSON.parse(customEvent.data);
          setError(data.error || "Unknown error");
          if (onError) {
            onError(data.error || "Unknown error");
          }
        }
      } catch {
        if (eventSource.readyState === EventSource.CLOSED) {
          setIsConnected(false);
        }
      }
      setIsStepLoading(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      if (receivedDataRef.current) {
        eventSource.close();
        setIsConnected(false);
      }
    };
  }, [missionId, apiBaseUrl, stepMode, shop, updateAgentFromLogs, showSummary, onComplete, onError, missionState]);

  // Step mode: Continue to next step
  const handleStepContinue = useCallback(async () => {
    if (!missionId || !stepMode) return;
    
    setIsStepLoading(true);
    try {
      const continueUrl = `${apiBaseUrl}/api/missions/${missionId}/continue${shop ? `?shop=${shop}` : ""}`;
      const response = await fetch(continueUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to continue");
      }
      
      const result = await response.json();
      
      if (result.is_complete) {
        // Update state with COMPLETED status before showing summary
        const completedState = missionState ? { ...missionState, status: "COMPLETED" } : null;
        if (completedState) {
          setMissionState(completedState);
        }
        setShowSummaryCard(showSummary);
        if (completedState && onComplete) {
          onComplete(completedState);
        }
      } else {
        // Run next step
        setStepCompleteData(null);
        await runCurrentStep();
      }
      
      if (onStepApprove) {
        onStepApprove();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to continue");
      if (onError) {
        onError(e instanceof Error ? e.message : "Failed to continue");
      }
    } finally {
      setIsStepLoading(false);
    }
  }, [missionId, apiBaseUrl, stepMode, shop, showSummary, onComplete, onStepApprove, onError, missionState, runCurrentStep]);

  // Step mode: Regenerate current step with feedback
  const handleStepRegenerate = useCallback(async (feedback: string) => {
    if (!missionId || !stepMode) return;
    
    setIsStepLoading(true);
    try {
      const regenerateUrl = `${apiBaseUrl}/api/missions/${missionId}/regenerate${shop ? `?shop=${shop}` : ""}`;
      const response = await fetch(regenerateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback || null }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to regenerate");
      }
      
      // Re-run the step
      setStepCompleteData(null);
      await runCurrentStep();
      
      if (onStepRegenerate) {
        onStepRegenerate(feedback);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to regenerate");
      if (onError) {
        onError(e instanceof Error ? e.message : "Failed to regenerate");
      }
    } finally {
      setIsStepLoading(false);
    }
  }, [missionId, apiBaseUrl, stepMode, shop, onStepRegenerate, onError, runCurrentStep]);

  // Step mode: Plain regenerate (no feedback) - for non-Rewriter agents
  const handlePlainRegenerate = useCallback(async () => {
    await handleStepRegenerate("");
  }, [handleStepRegenerate]);

  // Step mode: Skip current step
  const handleStepSkip = useCallback(async () => {
    if (!missionId || !stepMode) return;
    
    setIsStepLoading(true);
    try {
      const skipUrl = `${apiBaseUrl}/api/missions/${missionId}/skip${shop ? `?shop=${shop}` : ""}`;
      const response = await fetch(skipUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to skip");
      }
      
      const result = await response.json();
      
      if (result.is_complete) {
        // Update state with COMPLETED status before showing summary
        const completedState = missionState ? { ...missionState, status: "COMPLETED" } : null;
        if (completedState) {
          setMissionState(completedState);
        }
        setShowSummaryCard(showSummary);
        if (completedState && onComplete) {
          onComplete(completedState);
        }
      } else {
        // Update state to show skipped agent
        if (missionState) {
          setMissionState({
            ...missionState,
            skipped_agents: result.skipped_agents || [],
            current_agent_index: result.current_agent_index,
          });
        }
        // Run next step
        setStepCompleteData(null);
        await runCurrentStep();
      }
      
      if (onStepSkip) {
        onStepSkip();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to skip");
      if (onError) {
        onError(e instanceof Error ? e.message : "Failed to skip");
      }
    } finally {
      setIsStepLoading(false);
    }
  }, [missionId, apiBaseUrl, stepMode, shop, showSummary, onComplete, onStepSkip, onError, missionState, runCurrentStep]);

  // Fetch initial mission status for step mode
  const fetchMissionStatus = useCallback(async () => {
    if (!missionId) return null;
    
    try {
      const statusUrl = `${apiBaseUrl}/api/missions/${missionId}/status${shop ? `?shop=${shop}` : ""}`;
      const response = await fetch(statusUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch mission status");
      }
      return await response.json();
    } catch (e) {
      console.error("Failed to fetch mission status:", e);
      return null;
    }
  }, [missionId, apiBaseUrl, shop]);

  // Auto-start first step in step mode (or show completed summary)
  useEffect(() => {
    if (stepMode && missionId && !missionState && !isStepLoading) {
      // First fetch status to check if mission is already completed
      fetchMissionStatus().then((statusData) => {
        if (statusData?.status === "COMPLETED") {
          // Mission is already completed, show summary with the stored state
          const completedState: MissionState = {
            product_id: statusData.product_id || "",
            shop_id: statusData.shop_id || "",
            plan_tier: statusData.plan_tier || "Basic",
            status: "COMPLETED",
            ...(statusData.current_state || {}),
          };
          setMissionState(completedState);
          setShowSummaryCard(showSummary);
          if (onComplete) {
            onComplete(completedState);
          }
        } else if (statusData?.status === "ERROR") {
          // Mission errored, show error state
          setError(statusData.error_message || "Mission failed");
          if (onError) {
            onError(statusData.error_message || "Mission failed");
          }
        } else {
          // Mission is in progress or awaiting approval, run the step
          runCurrentStep();
        }
      });
    }
  }, [stepMode, missionId, missionState, isStepLoading, runCurrentStep, fetchMissionStatus, showSummary, onComplete, onError]);

  return (
    <BlockStack gap="400">
      <Card>
        <Box padding={compact ? "300" : "400"}>
          <BlockStack gap="400">
            {/* Header */}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant={compact ? "headingMd" : "headingLg"}>
                {isAdhoc ? "Agent Run" : "Mission Timeline"}
              </Text>
              <InlineStack gap="200">
                {isConnected && (
                  <Badge tone="success">Live</Badge>
                )}
                <Badge tone={
                  missionState?.status === "ERROR" ? "critical" :
                  missionState?.status === "COMPLETED" ? "success" :
                  missionState?.status === "COMPLIANCE_REVIEW" ? "warning" :
                  "info"
                }>
                  {getOverallStatus()}
                </Badge>
              </InlineStack>
            </InlineStack>

            {/* Error banner */}
            {error && (
              <Banner tone="critical" title="Mission Error">
                <p>{error}</p>
              </Banner>
            )}

            {/* Progress bar */}
            <Box>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Progress
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  {completedAgents} of {totalAgents} step{totalAgents !== 1 ? "s" : ""} complete
                </Text>
              </InlineStack>
              <Box paddingBlockStart="200">
                <ProgressBar 
                  progress={progress} 
                  size="small" 
                  tone={missionState?.status === "ERROR" ? "critical" : "highlight"} 
                />
              </Box>
            </Box>

            {/* Agent cards - shown in auto-flow mode or as overview in step mode */}
            {!stepMode && (
              <BlockStack gap="300">
                {agents.map((agent) => {
                  const isVisual = [
                    "Visual", "VisualAgent",
                    "ImageRefinement", "ImageRefinementAgent", "Image Refinement",
                    "VisualMarketing", "VisualMarketingAgent", "Visual Marketing",
                    "ContentHeroAgent", "ContentHero", "Content Hero",
                  ].includes(agent.name);

                  return (
                    <AgentCard
                      key={agent.name}
                      agentName={agent.name}
                      status={agent.status}
                      logs={agent.logs}
                      duration={agent.endTime && agent.startTime ? agent.endTime - agent.startTime : undefined}
                      hideStatusBadge={isVisual}
                      visualLoading={isVisual}
                      output={
                        agent.name === "Copywriter" && missionState?.draft_title
                          ? {
                              title: missionState.draft_title,
                              description: missionState.draft_content?.slice(0, 200) + "...",
                            }
                          : agent.name === "Marketing" && (missionState?.seo_title || missionState?.social_hooks)
                          ? {
                              title: missionState.seo_title,
                              description: missionState.seo_description,
                            }
                          : agent.name === "PriceScout" && missionState?.pricing_analysis
                          ? {
                              pricing: missionState.pricing_analysis,
                            }
                          : undefined
                      }
                    />
                  );
                })}

                {/* Visual assets carousel — rendered incrementally as images arrive */}
                {(() => {
                  const va = missionState?.visual_assets;
                  if (!va) return null;
                  const slides: CarouselSlide[] = [];
                  if (va.refined_url) slides.push({ url: va.refined_url, label: "Refined Product", sublabel: "AI-enhanced product image", aspectRatio: "1 / 1" });
                  if (va.ad_url) slides.push({ url: va.ad_url, label: "Marketing Ad", sublabel: "Ready-to-post social creative", aspectRatio: "1 / 1" });
                  if (slides.length === 0) return null;
                  return <ImageCarousel slides={slides} />;
                })()}

                {/* Content hero banner */}
                {missionState?.content_hero_assets?.hero_url && (
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">🖼️ Content Hero Banner</Text>
                    <ImageCarousel slides={[{
                      url: missionState.content_hero_assets.hero_url,
                      label: "Hero Banner",
                      sublabel: `${missionState.content_hero_assets.content_type || "Content"} hero image`,
                      aspectRatio: "16 / 9",
                    }]} />
                  </BlockStack>
                )}
              </BlockStack>
            )}

            {/* Step-by-step mode: Show current step with approval buttons */}
            {stepMode && missionState && (
              <BlockStack gap="400">
                {/* Progress overview for completed/skipped/auto-approved steps */}
                {(missionState.current_agent_index || 0) > 0 && (
                  <Box>
                    <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                      Completed Steps:
                    </Text>
                    <InlineStack gap="100" wrap>
                      {(missionState.workflow_agents || []).slice(0, missionState.current_agent_index || 0).map((agent, i) => {
                        const isSkipped = (missionState.skipped_agents || []).includes(agent);
                        const isAutoProceeded = autoProceededAgents.includes(agent);
                        const stepName = getStepName(agent, i, missionState.workflow_config);
                        return (
                          <Badge 
                            key={`${agent}-${i}`} 
                            tone={isSkipped ? "info" : isAutoProceeded ? "attention" : "success"}
                          >
                            {isSkipped ? "⏭️" : isAutoProceeded ? "⚡" : "✓"} {stepName}
                            {isAutoProceeded && " (auto)"}
                          </Badge>
                        );
                      })}
                    </InlineStack>
                  </Box>
                )}

                {/* Current step approval card - pulse animation signals "machine idle, waiting for human" */}
                {stepCompleteData && missionState.status === "AWAITING_APPROVAL" && (
                  <div className="missionArchitectPulse">
                  {/* Visual Agent: single card with carousel + InstaPreview inside, buttons at bottom */}
                  {["VisualAgent", "Visual", "ImageRefinementAgent", "ImageRefinement", "VisualMarketingAgent", "VisualMarketing", "ContentHeroAgent", "ContentHero"].includes(stepCompleteData.current_agent) ? (
                    <StepApproval
                      agentName={stepCompleteData.current_agent}
                      stepIndex={stepCompleteData.current_agent_index}
                      totalSteps={stepCompleteData.total_agents}
                      workflowAgents={missionState.workflow_agents}
                      status="awaiting_approval"
                      isLoading={isStepLoading}
                      error={error || undefined}
                      onContinue={handleStepContinue}
                      onRegenerate={() => setShowRegenerateModal(true)}
                      onPlainRegenerate={handlePlainRegenerate}
                      onSkip={handleStepSkip}
                      supportsFeedback={false}
                    >
                      <BlockStack gap="400">
                        {/* Image carousel */}
                        {(() => {
                          const slides: CarouselSlide[] = [];
                          if (missionState.visual_assets?.refined_url) {
                            slides.push({ url: missionState.visual_assets.refined_url, label: "Refined Product", sublabel: "AI-enhanced product image", aspectRatio: "1 / 1" });
                          }
                          if (missionState.visual_assets?.ad_url) {
                            slides.push({ url: missionState.visual_assets.ad_url, label: "Marketing Ad", sublabel: "Ready-to-post social creative", aspectRatio: "1 / 1" });
                          }
                          return slides.length > 0 ? <ImageCarousel slides={slides} /> : null;
                        })()}

                        {/* Content hero banner */}
                        {missionState.content_hero_assets?.hero_url && (
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingMd">🖼️ Content Hero Banner</Text>
                            <ImageCarousel slides={[{
                              url: missionState.content_hero_assets.hero_url,
                              label: "Hero Banner",
                              sublabel: `${missionState.content_hero_assets.content_type || "Content"} hero image`,
                              aspectRatio: "16 / 9",
                            }]} />
                          </BlockStack>
                        )}
                      </BlockStack>
                    </StepApproval>
                  ) : (
                    <StepApproval
                      agentName={stepCompleteData.current_agent}
                      stepIndex={stepCompleteData.current_agent_index}
                      totalSteps={stepCompleteData.total_agents}
                      workflowAgents={missionState.workflow_agents}
                      status="awaiting_approval"
                      output={stepCompleteData.agent_output as AgentOutput | undefined}
                      isLoading={isStepLoading}
                      error={error || undefined}
                      onContinue={handleStepContinue}
                      onRegenerate={() => setShowRegenerateModal(true)}
                      onPlainRegenerate={handlePlainRegenerate}
                      onSkip={handleStepSkip}
                      supportsFeedback={
                        stepCompleteData.current_agent === "RewriterAgent" ||
                        stepCompleteData.current_agent === "CopywriterAgent"
                      }
                    />
                  )}
                  </div>
                )}

                {/* Running state */}
                {missionState.status === "IN_PROGRESS" && !stepCompleteData && (
                  <>
                    {/* Show VisualStepCard when a visual agent is running */}
                    {["VisualAgent", "Visual", "ImageRefinementAgent", "ImageRefinement", "Image Refinement",
                      "VisualMarketingAgent", "VisualMarketing", "Visual Marketing",
                      "ContentHeroAgent", "ContentHero", "Content Hero",
                    ].includes((missionState.workflow_agents || [])[missionState.current_agent_index || 0] || "") ? (
                      <VisualStepCard
                        progress={missionState.visual_progress}
                        assets={missionState.visual_assets}
                        isComplete={false}
                      />
                    ) : (
                      <Card>
                        <Box padding="400">
                          <BlockStack gap="200">
                            <InlineStack gap="200" blockAlign="center">
                              <div className="spinner" style={{ 
                                width: "20px", 
                                height: "20px", 
                                border: "2px solid #e1e3e5",
                                borderTopColor: "#2c6ecb",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite"
                              }} />
                              <Text as="span" variant="bodyMd">
                                {getStepName(
                                  (missionState.workflow_agents || [])[missionState.current_agent_index || 0] || "",
                                  missionState.current_agent_index || 0,
                                  missionState.workflow_config,
                                )} is working...
                              </Text>
                            </InlineStack>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Step {(missionState.current_agent_index || 0) + 1} of {(missionState.workflow_agents || []).length}
                            </Text>
                          </BlockStack>
                        </Box>
                      </Card>
                    )}
                  </>
                )}
              </BlockStack>
            )}

            {/* Inline actions when not showing summary */}
            {!showSummaryCard && missionState?.status === "COMPLETED" && (
              <Box paddingBlockStart="200">
                <InlineStack gap="200">
                  <Button variant="primary" onClick={handlePublish} loading={isPublishing}>
                    Apply Changes
                  </Button>
                  <Button onClick={handleEdit}>
                    Edit Before Applying
                  </Button>
                </InlineStack>
              </Box>
            )}
          </BlockStack>
        </Box>
      </Card>

      {/* Mission Summary Card */}
      {showSummaryCard && missionState && (
        <MissionSummary
          state={missionState as SummaryMissionState}
          onPublish={handlePublish}
          onDiscard={handleDiscard}
          onEdit={handleEdit}
          isPublishing={isPublishing}
        />
      )}

      {/* Regenerate Feedback Modal (step mode only) */}
      {stepMode && stepCompleteData && (
        <RegenerateFeedbackModal
          open={showRegenerateModal}
          agentName={stepCompleteData.current_agent}
          onClose={() => setShowRegenerateModal(false)}
          onSubmit={(feedback) => {
            setShowRegenerateModal(false);
            handleStepRegenerate(feedback);
          }}
          isLoading={isStepLoading}
        />
      )}
    </BlockStack>
  );
}

export type { MissionState, AgentInfo };
