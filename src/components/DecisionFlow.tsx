"use client";

import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Users,
  Lightbulb,
  DollarSign,
  CalendarClock,
  CheckCircle2,
  Clock3,
  XCircle,
  Paperclip,
  GitBranch,
  ArrowRightCircle,
} from "lucide-react";
import type { Decision } from "@/lib/types";

type NodeKind =
  | "center"
  | "people"
  | "reason"
  | "cost"
  | "schedule"
  | "evidence"
  | "ack"
  | "pending"
  | "declined"
  | "causedBy"
  | "ledTo";

interface NodeData {
  kind: NodeKind;
  title: string;
  subtitle?: string;
  /** When set, clicking the node opens this decision in the graph. */
  jumpTo?: string;
}

const KIND_STYLE: Record<NodeKind, { icon: typeof Users; ring: string; text: string }> = {
  center: { icon: Lightbulb, ring: "border-primary/60", text: "text-primary" },
  people: { icon: Users, ring: "border-sky-400/40", text: "text-sky-300" },
  reason: { icon: Lightbulb, ring: "border-amber-400/40", text: "text-amber-300" },
  cost: { icon: DollarSign, ring: "border-emerald-400/40", text: "text-emerald-300" },
  schedule: { icon: CalendarClock, ring: "border-emerald-400/40", text: "text-emerald-300" },
  evidence: { icon: Paperclip, ring: "border-violet-400/40", text: "text-violet-300" },
  ack: { icon: CheckCircle2, ring: "border-emerald-400/50", text: "text-emerald-300" },
  pending: { icon: Clock3, ring: "border-amber-400/40", text: "text-amber-300" },
  declined: { icon: XCircle, ring: "border-red-400/40", text: "text-red-300" },
  causedBy: { icon: GitBranch, ring: "border-fuchsia-400/40", text: "text-fuchsia-300" },
  ledTo: { icon: ArrowRightCircle, ring: "border-fuchsia-400/40", text: "text-fuchsia-300" },
};

function GraphNode({ data }: NodeProps<NodeData>) {
  const style = KIND_STYLE[data.kind];
  const Icon = style.icon;
  const isCenter = data.kind === "center";
  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-xl border ${style.ring} bg-surface/95 px-3.5 py-2.5 shadow-lg backdrop-blur ${
        isCenter ? "shadow-[0_0_40px_-8px_rgba(124,92,255,0.6)]" : ""
      } ${data.jumpTo ? "cursor-pointer hover:border-white/40" : ""}`}
      style={{ maxWidth: isCenter ? 280 : 235 }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ${style.text}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div
          className={`truncate text-sm font-semibold ${
            isCenter ? "text-foreground" : "text-foreground/90"
          }`}
        >
          {data.title}
        </div>
        {data.subtitle && (
          <div className="truncate text-[11px] text-muted-foreground">{data.subtitle}</div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { graphNode: GraphNode };

export function DecisionFlow({
  decision,
  onNavigate,
}: {
  decision: Decision;
  onNavigate?: (decisionId: string) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const n: Node<NodeData>[] = [];
    const e: Edge[] = [];

    n.push({
      id: "center",
      type: "graphNode",
      position: { x: 380, y: 260 },
      data: { kind: "center", title: decision.title, subtitle: decision.id },
    });

    // Causality chain: caused by (upstream, left) -> center -> led to (right).
    if (decision.causedBy) {
      n.push({
        id: "causedBy",
        type: "graphNode",
        position: { x: 20, y: 260 },
        data: {
          kind: "causedBy",
          title: decision.causedBy.title,
          subtitle: "Caused by · " + decision.causedBy.id,
          jumpTo: decision.causedBy.id,
        },
      });
      e.push(edge("causedBy", "center", false, true));
    }

    decision.ledTo.slice(0, 3).forEach((ref, i) => {
      const id = "ledTo-" + i;
      n.push({
        id,
        type: "graphNode",
        position: { x: 760, y: 180 + i * 90 },
        data: {
          kind: "ledTo",
          title: ref.title,
          subtitle: "Led to · " + ref.id,
          jumpTo: ref.id,
        },
      });
      e.push(edge("center", id, false, true));
    });

    if (decision.people.length > 0) {
      n.push({
        id: "people",
        type: "graphNode",
        position: { x: 360, y: 60 },
        data: {
          kind: "people",
          title: decision.people
            .slice(0, 3)
            .map((p) => p.name.split(" ")[0])
            .join(" + "),
          subtitle: "People involved",
        },
      });
      e.push(edge("people", "center"));
    }

    if (decision.reason) {
      n.push({
        id: "reason",
        type: "graphNode",
        position: { x: 60, y: 110 },
        data: {
          kind: "reason",
          title: "Reason",
          subtitle:
            decision.reason.length > 42 ? decision.reason.slice(0, 39) + "…" : decision.reason,
        },
      });
      e.push(edge("reason", "center"));
    }

    n.push({
      id: "cost",
      type: "graphNode",
      position: { x: 700, y: 40 },
      data: {
        kind: "cost",
        title: decision.costImpact ? "Cost impact" : "No cost impact",
        subtitle: decision.costImpact ?? "$0",
      },
    });
    e.push(edge("center", "cost"));

    n.push({
      id: "schedule",
      type: "graphNode",
      position: { x: 730, y: 110 },
      data: {
        kind: "schedule",
        title: decision.scheduleImpact ? "Schedule impact" : "No schedule impact",
        subtitle: decision.scheduleImpact ?? "0 days",
      },
    });
    e.push(edge("center", "schedule"));

    decision.evidence.slice(0, 3).forEach((ev, i) => {
      const id = "ev-" + i;
      n.push({
        id,
        type: "graphNode",
        position: { x: 110 + i * 30, y: 420 + i * 78 },
        data: { kind: "evidence", title: ev.label, subtitle: ev.meta },
      });
      e.push(edge("center", id));
    });

    decision.approvals.slice(0, 3).forEach((a, i) => {
      const id = "ap-" + i;
      const kind: NodeKind =
        a.status === "approved" ? "ack" : a.status === "declined" ? "declined" : "pending";
      n.push({
        id,
        type: "graphNode",
        position: { x: 560, y: 430 + i * 80 },
        data: {
          kind,
          title:
            a.status === "approved"
              ? "Approved by " + a.name.split(" ")[0]
              : a.status === "declined"
                ? "Declined by " + a.name.split(" ")[0]
                : "Awaiting " + a.name.split(" ")[0],
          subtitle: a.role,
        },
      });
      e.push(edge("center", id, a.status === "pending"));
    });

    return { nodes: n, edges: e };
  }, [decision]);

  const handleNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node<NodeData>) => {
      if (node.data.jumpTo && onNavigate) onNavigate(node.data.jumpTo);
    },
    [onNavigate]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
        minZoom={0.35}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#2a2a35" />
      </ReactFlow>
    </div>
  );
}

function edge(source: string, target: string, dashed = false, causal = false): Edge {
  return {
    id: source + "-" + target,
    source,
    target,
    type: "smoothstep",
    animated: !dashed,
    style: dashed
      ? { strokeDasharray: "4 4" }
      : causal
        ? { stroke: "rgba(232,121,249,0.6)", strokeWidth: 2 }
        : undefined,
  };
}
