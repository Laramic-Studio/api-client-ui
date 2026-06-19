import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { aiToolRegistry } from "@/ai-tools";
import { useAppStore } from "@/store/useAppStore";
import { useAiContext } from "@/providers/AiContextProvider";
import { aiChat, createAbortController, isCancelledError } from "@/lib/api/ai";
import { loadAiCatalogExtras } from "@/lib/ai/catalog";
import { autoRunProposedActions, runApprovedAction } from "@/lib/ai/auto-run";
import { finalizeAssistantContent, stripActionsBlock, truncatePromptForDisplay } from "@/lib/ai/format";
import { nanoUid } from "@/lib/generators";

function setAssistantStep(updateMessage, assistantId, label, status = "active", detail = null) {
  updateMessage(assistantId, {
    currentStep: { label, status, detail },
  });
}

function clearAssistantStep(updateMessage, assistantId) {
  updateMessage(assistantId, { currentStep: null, processing: false });
}

export function useAiChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { getContextBundle, executeAction } = useAiContext();
  const user = useAppStore((s) => s.user);
  const ai = useAppStore((s) => s.aiSettings);
  const appendMessage = useAppStore((s) => s.appendAiMessage);
  const updateMessage = useAppStore((s) => s.updateAiMessage);
  const bumpUsage = useAppStore((s) => s.bumpAiUsage);
  const messages = useAppStore((s) => s.aiMessages);
  const [streaming, setStreaming] = useState(false);
  const [processingActions, setProcessingActions] = useState(false);
  const [runningActionId, setRunningActionId] = useState(null);
  const [activeTurns, setActiveTurns] = useState(0);
  const abortRef = useRef(null);
  const runTurnRef = useRef(null);

  const beginTurn = () => {
    setActiveTurns((n) => n + 1);
  };

  const endTurn = () => {
    setActiveTurns((n) => Math.max(0, n - 1));
  };

  const isBusy = streaming || processingActions || runningActionId != null || activeTurns > 0;

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setProcessingActions(false);
    setActiveTurns(0);
  };

  runTurnRef.current = async (text, { appendUser = true } = {}) => {
    const history = [
      ...useAppStore.getState().aiMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    if (appendUser) {
      appendMessage({
        role: "user",
        content: text,
        displayContent: truncatePromptForDisplay(text),
      });
    }

    const assistantId = nanoUid("aim");
    appendMessage({
      role: "assistant",
      content: "",
      streaming: true,
      id: assistantId,
      proposedActions: [],
      currentStep: null,
      processing: false,
    });

    const onStep = (step) => {
      setAssistantStep(
        updateMessage,
        assistantId,
        step.label,
        step.status || "active",
        step.detail ?? null,
      );
    };

    const appendTurnMessage = (msg) => {
      if (msg?.role === "system") {
        onStep({ label: msg.content, status: "active" });
        return;
      }
      appendMessage(msg);
    };

    const controller = createAbortController();
    abortRef.current = controller;
    setStreaming(true);
    setAssistantStep(updateMessage, assistantId, "Echo is thinking", "active");

    const streamState = { full: "", proposedActions: [] };
    const syncAssistantMessage = (streamingFlag = true) => {
      updateMessage(assistantId, {
        content: finalizeAssistantContent(streamState.full, streamState.proposedActions),
        proposedActions: streamState.proposedActions,
        streaming: streamingFlag,
      });
    };

    try {
      const teamId = useAppStore.getState().activeWorkspaceId;
      const catalogExtras = await loadAiCatalogExtras(queryClient, teamId);
      const baseContext = getContextBundle();
      const context = {
        ...baseContext,
        catalog: {
          ...baseContext.catalog,
          ...catalogExtras,
        },
        availableTools: aiToolRegistry.getManifest(location.pathname),
      };

      const { full, proposedActions } = await aiChat({
        messages: history,
        context,
        userId: user?.id,
        ai,
        signal: controller.signal,
        onDelta: (_delta, fullText) => {
          streamState.full = fullText;
          syncAssistantMessage(true);
        },
        onActions: (actions) => {
          streamState.proposedActions = actions;
          syncAssistantMessage(true);
        },
      });

      streamState.full = full;
      streamState.proposedActions = proposedActions || [];
      syncAssistantMessage(false);

      const finalContent = finalizeAssistantContent(full, streamState.proposedActions);

      if (streamState.proposedActions.length) {
        setProcessingActions(true);
        updateMessage(assistantId, { processing: true, streaming: false });

        const autoRan = await autoRunProposedActions(streamState.proposedActions, {
          executeAction,
          navigate,
          appendMessage: appendTurnMessage,
          onStep,
        });

        if (autoRan.ran > 0 || autoRan.skippedIds?.length) {
          updateMessage(assistantId, {
            proposedActions: streamState.proposedActions.filter(
              (a) => a.risk !== "low" || !autoRan.completedIds?.includes(a.id),
            ),
          });

          const enrichmentParts = [];
          if (!stripActionsBlock(full)) {
            enrichmentParts.push(`${finalContent}\n\n✓ ${autoRan.ran} action(s) completed.`);
          } else if (finalContent) {
            enrichmentParts.push(finalContent);
          }
          if (autoRan.enrichments?.length) {
            enrichmentParts.push(...autoRan.enrichments);
          }

          if (enrichmentParts.length) {
            updateMessage(assistantId, {
              content: enrichmentParts.join("\n\n"),
            });
          }
        }

        clearAssistantStep(updateMessage, assistantId);
        setProcessingActions(false);

        for (const prompt of autoRan.chainSends || []) {
          await runTurnRef.current?.(prompt, { appendUser: true });
        }
      } else {
        clearAssistantStep(updateMessage, assistantId);
      }

      bumpUsage("chat");
      return assistantId;
    } catch (e) {
      if (isCancelledError(e)) {
        clearAssistantStep(updateMessage, assistantId);
        syncAssistantMessage(false);
        return assistantId;
      }
      setAssistantStep(updateMessage, assistantId, e.message || "Something went wrong.", "error");
      updateMessage(assistantId, {
        content: e.message || "Something went wrong.",
        streaming: false,
        processing: false,
      });
      toast.error(e.message || "AI request failed");
      return assistantId;
    } finally {
      setStreaming(false);
      setProcessingActions(false);
      abortRef.current = null;
    }
  };

  const runTurn = useCallback(async (text, options) => {
    return runTurnRef.current?.(text, options);
  }, []);

  const send = useCallback(async (text) => {
    beginTurn();
    try {
      await runTurn(text);
    } finally {
      endTurn();
    }
  }, [runTurn]);

  const runAction = async (action) => {
    setRunningActionId(action.id);

    try {
      const result = await runApprovedAction(action, {
        executeAction,
        navigate,
        appendMessage,
      });

      appendMessage({
        role: "system",
        content: result?.message || `${action.label} completed.`,
      });

      const msg = messages.find((m) => m.proposedActions?.some((a) => a.id === action.id));
      if (msg) {
        updateMessage(msg.id, {
          proposedActions: msg.proposedActions.filter((a) => a.id !== action.id),
        });
      }

      if (result?.chainSend) {
        beginTurn();
        try {
          await runTurn(result.chainSend, { appendUser: true });
        } finally {
          endTurn();
        }
      }
    } catch (e) {
      toast.error(e.message || "Action failed");
      appendMessage({
        role: "system",
        content: e.message || "Action failed.",
      });
    } finally {
      setRunningActionId(null);
    }
  };

  const dismissAction = (messageId, actionId) => {
    const msg = messages.find((m) => m.proposedActions?.some((a) => a.id === actionId));
    if (!msg) return;
    updateMessage(msg.id, {
      proposedActions: msg.proposedActions.filter((a) => a.id !== actionId),
    });
  };

  return {
    send,
    stop,
    streaming,
    processingActions,
    isBusy,
    runningActionId,
    runAction,
    dismissAction: (actionId) => {
      const msg = messages.find((m) => m.proposedActions?.some((a) => a.id === actionId));
      if (msg) dismissAction(msg.id, actionId);
    },
  };
}
