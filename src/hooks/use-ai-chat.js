import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { aiToolRegistry } from "@/ai-tools";
import { useAppStore } from "@/store/useAppStore";
import { useAiContext } from "@/providers/AiContextProvider";
import { aiChat, createAbortController, isCancelledError } from "@/lib/api/ai";
import { loadAiCatalogExtras } from "@/lib/ai/catalog";
import { autoRunProposedActions } from "@/lib/ai/auto-run";
import { finalizeAssistantContent, stripActionsBlock } from "@/lib/ai/format";
import { nanoUid } from "@/lib/generators";

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
  const [runningActionId, setRunningActionId] = useState(null);
  const abortRef = useRef(null);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const send = async (text) => {
    const history = [
      ...useAppStore.getState().aiMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    appendMessage({ role: "user", content: text });
    const assistantId = nanoUid("aim");
    appendMessage({ role: "assistant", content: "", streaming: true, id: assistantId, proposedActions: [] });

    const controller = createAbortController();
    abortRef.current = controller;
    setStreaming(true);

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
          updateMessage(assistantId, {
            content: finalizeAssistantContent(fullText, []),
            streaming: true,
          });
        },
        onActions: (actions) => {
          updateMessage(assistantId, { proposedActions: actions });
        },
      });

      updateMessage(assistantId, {
        content: stripActionsBlock(full),
        streaming: false,
        proposedActions: proposedActions || [],
      });

      if (proposedActions?.length) {
        const autoRan = await autoRunProposedActions(proposedActions, {
          executeAction,
          navigate,
          appendMessage,
        });
        if (autoRan.ran > 0) {
          updateMessage(assistantId, {
            proposedActions: proposedActions.filter((a) => a.risk !== "low"),
          });
        }
      }

      bumpUsage("chat");
    } catch (e) {
      if (isCancelledError(e)) {
        updateMessage(assistantId, { streaming: false });
        return;
      }
      updateMessage(assistantId, {
        content: e.message || "Something went wrong.",
        streaming: false,
      });
      toast.error(e.message || "AI request failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const runAction = async (action) => {
    setRunningActionId(action.id);

    try {
      if (!aiToolRegistry.isAllowed(action.type, location.pathname)) {
        throw new Error(`Action "${action.type}" is not available on this page.`);
      }

      const result = await executeAction(action.type, action.payload || {}, {
        navigate,
        route: location.pathname,
      });

      appendMessage({
        role: "system",
        content: result?.message || `${action.label} completed.`,
      });
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
    runningActionId,
    runAction,
    dismissAction: (actionId) => {
      const msg = messages.find((m) => m.proposedActions?.some((a) => a.id === actionId));
      if (msg) dismissAction(msg.id, actionId);
    },
  };
};
