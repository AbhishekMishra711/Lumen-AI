"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  generateMindMapAPI,
  saveMindMapAPI,
  getSavedMindMapsAPI,
  deleteMindMapAPI,
  getClientUserId,
  type MindMapNode,
  type MindMapHierarchy,
  type SavedMindMap,
} from "@/utils/api";

const LEVEL_COLORS = [
  "#00FFFF", // Level 0: Root (Cyan)
  "#FF00FF", // Level 1: Major Topic (Magenta)
  "#39FF14", // Level 2: Sub-topic (Lime)
  "#FFCC00", // Level 3: Detail (Yellow)
];

const LEVEL_TEXT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#000000",
  "#000000",
];

const LEVEL_BORDER_COLORS = [
  "#00B4D8",
  "#D90429",
  "#2B9348",
  "#E85D04",
];

const WIDTHS = [380, 270, 240, 220];
const HEIGHT_ESTIMATES = [150, 120, 100, 90];
const X_GAP = 55;
const Y_GAP = 220;

interface PlacedNode {
  id: string;
  label: string;
  description: string;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  children?: MindMapNode[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Connection {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  level: number;
}

// Pure React Tree Layout Engine (Zero Black Screen, 100% Reliable)
function calculateLayout(
  rootNode: MindMapNode,
  expandedSet: Set<string>
): {
  placedNodes: PlacedNode[];
  connections: Connection[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
} {
  const widths = new Map<string, number>();

  const measure = (node: MindMapNode): number => {
    const own = WIDTHS[node.level] || 220;
    const children = expandedSet.has(node.id) ? node.children || [] : [];
    const childrenW =
      children.reduce((sum, c) => sum + measure(c), 0) +
      Math.max(0, children.length - 1) * X_GAP;
    const width = Math.max(own, childrenW);
    widths.set(node.id, width);
    return width;
  };

  const totalWidth = measure(rootNode);
  const placedNodes: PlacedNode[] = [];
  const connections: Connection[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const place = (
    node: MindMapNode,
    left: number,
    depth: number,
    parentPos: { x: number; y: number; width: number; height: number } | null
  ) => {
    const subtreeW = widths.get(node.id) || 220;
    const nodeW = WIDTHS[node.level] || 220;
    const nodeH = HEIGHT_ESTIMATES[node.level] || 110;
    const x = Math.round(left + (subtreeW - nodeW) / 2);
    const y = Math.round(60 + depth * Y_GAP);

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + nodeW);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + nodeH);

    placedNodes.push({
      id: node.id,
      label: node.label,
      description: node.description,
      level: node.level,
      hasChildren: Boolean(node.children && node.children.length > 0),
      isExpanded: expandedSet.has(node.id),
      children: node.children,
      x,
      y,
      width: nodeW,
      height: nodeH,
    });

    if (parentPos) {
      connections.push({
        id: `${parentPos.x}-${parentPos.y}->${x}-${y}`,
        from: {
          x: Math.round(parentPos.x + parentPos.width / 2),
          y: Math.round(parentPos.y + parentPos.height),
        },
        to: {
          x: Math.round(x + nodeW / 2),
          y: Math.round(y),
        },
        level: node.level,
      });
    }

    const children = expandedSet.has(node.id) ? node.children || [] : [];
    const childrenW =
      children.reduce((sum, c) => sum + (widths.get(c.id) || 220), 0) +
      Math.max(0, children.length - 1) * X_GAP;

    let childLeft = left + (subtreeW - childrenW) / 2;
    children.forEach((c) => {
      place(c, childLeft, depth + 1, { x, y, width: nodeW, height: nodeH });
      childLeft += (widths.get(c.id) || 220) + X_GAP;
    });
  };

  place(rootNode, 0, 0, null);

  return {
    placedNodes,
    connections,
    bounds: {
      minX: isFinite(minX) ? minX : 0,
      maxX: isFinite(maxX) ? maxX : 800,
      minY: isFinite(minY) ? minY : 0,
      maxY: isFinite(maxY) ? maxY : 600,
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
    },
  };
}

export default function MindMapPage() {
  // Input State
  const [inputTab, setInputTab] = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [topicPrompt, setTopicPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // View Mode: Canvas, Outline, or Tree
  const [viewMode, setViewMode] = useState<"canvas" | "tree" | "outline">("canvas");

  // Mind map hierarchy tree state
  const [tree, setTree] = useState<MindMapNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("Interactive Mind Map");

  // Pan & Zoom State for Native Visual Canvas
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(0.85);
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Saved Maps Drawer (MongoDB)
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [savedMaps, setSavedMaps] = useState<SavedMindMap[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // Compute Layout when tree or expanded set changes
  const { placedNodes, connections, bounds } = useMemo(() => {
    if (!tree) {
      return {
        placedNodes: [],
        connections: [],
        bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600, width: 800, height: 600 },
      };
    }
    return calculateLayout(tree, expanded);
  }, [tree, expanded]);

  // Centering & Auto-fit function
  const fitToView = useCallback(
    (customBounds?: typeof bounds) => {
      const b = customBounds || bounds;
      const container = canvasContainerRef.current;
      if (!container || b.width <= 0 || b.height <= 0) return;

      const containerW = container.clientWidth || 1000;
      const containerH = container.clientHeight || 650;

      const padding = 70;
      const availableW = containerW - padding * 2;
      const availableH = containerH - padding * 2;

      const scaleX = availableW / b.width;
      const scaleY = availableH / b.height;
      const newZoom = Math.min(1.2, Math.max(0.35, Math.min(scaleX, scaleY)));

      const centerX = (b.minX + b.maxX) / 2;
      const centerY = (b.minY + b.maxY) / 2;

      const newPanX = containerW / 2 - centerX * newZoom;
      const newPanY = containerH / 2 - centerY * newZoom;

      setZoom(newZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    },
    [bounds]
  );

  // Auto-fit on layout update
  useEffect(() => {
    if (placedNodes.length > 0) {
      fitToView(bounds);
    }
  }, [tree?.id, expanded.size, fitToView, bounds, placedNodes.length]);

  // On mount: fetch saved maps from MongoDB Atlas and auto-display the latest map
  useEffect(() => {
    let mounted = true;
    const loadInitialSaved = async () => {
      try {
        const maps = await getSavedMindMapsAPI();
        if (!mounted) return;
        setSavedMaps(maps);

        // If saved maps exist in MongoDB Atlas, auto-load and display the most recent map
        if (maps && maps.length > 0) {
          const latest = maps[0];
          if (latest.hierarchy?.root) {
            const root = latest.hierarchy.root as MindMapNode;
            setTree(root);
            setCurrentTitle(latest.title || root.label || "Saved Mind Map");

            // Expand root and 1st level
            const initialExpanded = new Set<string>([root.id]);
            if (root.children) {
              root.children.forEach((c: MindMapNode) => initialExpanded.add(c.id));
            }
            setExpanded(initialExpanded);
            setSavedSuccess(true);
            showToast(`📂 Displaying latest map: "${latest.title}"`);
          }
        }
      } catch (err) {
        console.warn("Could not load initial mind maps from MongoDB:", err);
      }
    };
    loadInitialSaved();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = canvasContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const nextZoom = Math.min(2.5, Math.max(0.15, zoom * zoomFactor));

    // Zoom towards mouse position
    const nextPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
    const nextPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  };

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        // Find node in tree and remove descendants
        const findAndRemove = (curr: MindMapNode) => {
          if (curr.id === nodeId) {
            const removeChildren = (c: MindMapNode) => {
              (c.children || []).forEach((ch) => {
                next.delete(ch.id);
                removeChildren(ch);
              });
            };
            removeChildren(curr);
            next.delete(nodeId);
          } else {
            (curr.children || []).forEach(findAndRemove);
          }
        };
        if (tree) findAndRemove(tree);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand/Collapse all nodes
  const handleToggleAll = (expand: boolean) => {
    if (!tree) return;
    if (!expand) {
      setExpanded(new Set([tree.id]));
      return;
    }

    const allIds = new Set<string>();
    const collectIds = (node: MindMapNode) => {
      allIds.add(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };
    collectIds(tree);
    setExpanded(allIds);
  };

  // Generate Mind Map
  const handleGenerate = async (overrideTopic?: string) => {
    setErrorMsg(null);
    setGenerating(true);

    try {
      const formData = new FormData();
      const queryText = (overrideTopic || topicPrompt).trim();

      if (inputTab === "file" && selectedFile && !overrideTopic) {
        formData.append("file", selectedFile);
      } else {
        if (!queryText) {
          throw new Error("Please enter a topic name or select a study PDF");
        }
        formData.append("text", queryText);
        formData.append("title", queryText.substring(0, 40));
      }

      const result = await generateMindMapAPI(formData);

      if (!result.hierarchy || !result.hierarchy.root) {
        throw new Error("Mind map hierarchy could not be generated from source");
      }

      const root = result.hierarchy.root as MindMapNode;
      setTree(root);
      setCurrentTitle(result.title || root.label || "Mind Map");

      // Default expand root and first level
      const initialExpanded = new Set<string>([root.id]);
      if (root.children) {
        root.children.forEach((c) => initialExpanded.add(c.id));
      }
      setExpanded(initialExpanded);
      setSavedSuccess(false);

      // Auto-save to MongoDB Atlas so the database is in sync with the generated mindmap
      try {
        const userId = getClientUserId();
        const saved = await saveMindMapAPI({
          title: result.title || root.label || queryText,
          sourceName: selectedFile ? selectedFile.name : (queryText || "Text Notes"),
          hierarchy: result.hierarchy,
          userId,
        });
        setSavedSuccess(true);
        setSavedMaps((prev) => [
          saved,
          ...prev.filter((m) => (m._id || m.id) !== (saved._id || saved.id)),
        ]);
        showToast(`🧠 Generated & Saved: "${root.label}"`);
      } catch {
        showToast(`🧠 Generated: "${root.label}"`);
      }

      // Smoothly scroll canvas into view
      setTimeout(() => {
        canvasContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate mind map";
      setErrorMsg(msg);
      showToast(`❌ ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  // Quick Topic Picker
  const handleQuickTopic = (topic: string) => {
    setTopicPrompt(topic);
    setInputTab("text");
    handleGenerate(topic);
  };

  // Save Mind Map to MongoDB Atlas
  const handleSaveToMongoDB = async () => {
    if (!tree) return;

    try {
      const userId = getClientUserId();
      const saved = await saveMindMapAPI({
        title: currentTitle,
        sourceName: selectedFile ? selectedFile.name : (topicPrompt || "Text Notes"),
        hierarchy: { root: tree },
        userId,
      });

      setSavedSuccess(true);
      setSavedMaps((prev) => [
        saved,
        ...prev.filter((m) => (m._id || m.id) !== (saved._id || saved.id)),
      ]);
      showToast(`💾 Saved to MongoDB Atlas! (ID: ${saved._id})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save mind map";
      showToast(`❌ ${msg}`);
    }
  };

  // Open Saved Maps Drawer
  const openSavedDrawer = async () => {
    setShowSavedDrawer(true);
    setLoadingSaved(true);
    try {
      const maps = await getSavedMindMapsAPI();
      setSavedMaps(maps);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load saved maps";
      showToast(`❌ ${msg}`);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Load a Saved Mind Map from MongoDB
  const handleLoadMap = (savedMap: SavedMindMap) => {
    if (!savedMap.hierarchy?.root) {
      showToast("❌ Saved map has no hierarchy root");
      return;
    }
    const root = savedMap.hierarchy.root;
    setTree(root);
    setCurrentTitle(savedMap.title);

    const initialExpanded = new Set<string>([root.id]);
    if (root.children) {
      root.children.forEach((c) => initialExpanded.add(c.id));
    }
    setExpanded(initialExpanded);
    setSavedSuccess(true);
    setShowSavedDrawer(false);
    showToast(`📖 Loaded "${savedMap.title}" from MongoDB Atlas`);

    setTimeout(() => {
      canvasContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  // Delete Map from MongoDB
  const handleDeleteMap = async (mapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this mind map from MongoDB Atlas?")) return;

    try {
      await deleteMindMapAPI(mapId);
      setSavedMaps((prev) => prev.filter((m) => (m._id || m.id) !== mapId));
      showToast("🗑️ Mind map deleted from MongoDB");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      showToast(`❌ ${msg}`);
    }
  };

  // Download as JSON
  const handleDownloadJSON = () => {
    if (!tree) return;
    const exportData = {
      title: currentTitle,
      hierarchy: { root: tree },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTitle.toLowerCase().replace(/\\s+/g, "_")}_mindmap.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Exported Mind Map JSON file");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col font-mono text-black select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-black text-white border-2 border-[#00FFFF] font-press-start text-xs shadow-brutalist animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Navigation Header */}
      <nav className="border-b-4 border-lumen-black bg-white px-6 py-4 sticky top-0 z-30 shadow-brutalist">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-press-start text-xs border-2 border-lumen-black px-3 py-1.5 bg-white hover:bg-lumen-yellow transition-all shadow-brutalist"
            >
              &lt; DASHBOARD
            </Link>
            <span className="font-press-start text-lg tracking-wider text-lumen-black">
              LUMEN // MIND MAP
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSavedDrawer}
              className="px-4 py-2 border-3 border-lumen-black bg-[#00FFFF] font-press-start text-xs shadow-brutalist hover:bg-lumen-black hover:text-[#00FFFF] transition-all"
            >
              📂 SAVED MAPS ({savedMaps.length})
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 flex flex-col w-full">
        {/* Banner Section */}
        <div className="border-4 border-lumen-black bg-[#00FFFF] p-6 mb-6 shadow-brutalist text-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-2 py-1 bg-black text-[#00FFFF] font-press-start text-[10px] mb-2">
              VISUAL KNOWLEDGE HIERARCHY // MONGODB
            </div>
            <h1 className="font-press-start text-2xl md:text-3xl text-black">
              MIND MAP STUDIO
            </h1>
            <p className="font-mono text-sm mt-1 text-black/90">
              Type any academic topic or upload textbook PDFs to generate interactive branching mind maps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-black text-white font-mono text-xs flex items-center gap-2 border-2 border-white">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-pulse"></span>
              MongoDB Atlas Active
            </span>
          </div>
        </div>

        {/* Input Generator Panel */}
        <div className="border-4 border-lumen-black bg-white p-6 mb-6 shadow-brutalist">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 border-b-4 border-lumen-black pb-4 mb-4">
            <button
              onClick={() => setInputTab("text")}
              className={`py-2.5 px-4 font-press-start text-xs border-3 border-lumen-black transition-all ${
                inputTab === "text"
                  ? "bg-[#FFCC00] text-black shadow-brutalist"
                  : "bg-[#F4F4F0] text-black/70 hover:bg-gray-200"
              }`}
            >
              📝 TOPIC / NOTES PROMPT
            </button>
            <button
              onClick={() => setInputTab("file")}
              className={`py-2.5 px-4 font-press-start text-xs border-3 border-lumen-black transition-all ${
                inputTab === "file"
                  ? "bg-[#00FFFF] text-black shadow-brutalist"
                  : "bg-[#F4F4F0] text-black/70 hover:bg-gray-200"
              }`}
            >
              📁 UPLOAD PDF
            </button>
          </div>

          {inputTab === "text" ? (
            /* Tab 1: Topic Text Prompt */
            <div>
              {/* Quick Topic Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-press-start text-[10px] text-gray-600 mr-1">
                  SUGGESTIONS:
                </span>
                {[
                  "Photosynthesis",
                  "Operating Systems",
                  "Machine Learning",
                  "Quantum Computing",
                  "DNA Replication",
                  "Gravity",
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setTopicPrompt(sample);
                      handleQuickTopic(sample);
                    }}
                    className="px-2 py-0.5 border border-black bg-[#F4F4F0] font-mono text-xs hover:bg-[#FFCC00] transition-colors font-bold"
                  >
                    + {sample}
                  </button>
                ))}
              </div>

              <textarea
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
                rows={3}
                placeholder="Enter any topic (e.g. 'Photosynthesis', 'Laws of Motion', 'Calculus') or paste notes..."
                className="w-full p-4 border-3 border-lumen-black font-mono text-sm bg-[#F9F9F6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFCC00]"
              />
            </div>
          ) : (
            /* Tab 2: PDF Upload */
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-lumen-black p-6 text-center cursor-pointer bg-[#F9F9F6] hover:bg-[#EFFFFF] transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="text-3xl mb-2">📄</div>
                <h3 className="font-press-start text-xs text-black mb-1">
                  CLICK TO SELECT OR DROP STUDY PDF
                </h3>
                <p className="font-mono text-xs text-gray-500">
                  Extracts sections, headings, and visual hierarchy. Max 25MB.
                </p>
                {selectedFile && (
                  <div className="mt-3 inline-block px-3 py-1 bg-[#00FFFF] border-2 border-black font-mono text-xs font-bold">
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-4 pt-4 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-500 font-mono text-xs">
              Press <strong>Generate</strong> or click nodes to expand/collapse.
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className={`w-full sm:w-auto px-6 py-3 border-3 border-lumen-black font-press-start text-xs shadow-brutalist transition-all flex items-center justify-center gap-2 ${
                generating
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#00FFFF] text-black hover:bg-black hover:text-[#00FFFF]"
              }`}
            >
              {generating ? (
                <>
                  <span className="animate-spin text-sm">⚙️</span>
                  <span>BUILDING HIERARCHY...</span>
                </>
              ) : (
                <>
                  <span>🧠</span>
                  <span>GENERATE MIND MAP</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 border-2 border-black bg-[#FF4F00] text-white font-mono text-xs flex items-center justify-between">
              <div>
                <strong>Notice:</strong> {errorMsg}
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="font-press-start text-xs px-2 py-0.5 bg-black text-white hover:bg-white hover:text-black border border-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Mind Map Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="border-4 border-lumen-black bg-white shadow-brutalist flex-1 flex flex-col min-h-[640px] relative scroll-mt-6"
        >
          {/* Canvas Toolbar */}
          <div className="p-4 border-b-4 border-lumen-black bg-[#F4F4F0] flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3">
              <span className="font-press-start text-xs text-black truncate max-w-sm">
                {currentTitle}
              </span>
              {savedSuccess && (
                <span className="font-press-start text-[9px] px-2 py-0.5 bg-[#39FF14] text-black border border-black">
                  ✓ SAVED IN MONGODB
                </span>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center border-2 border-black bg-white">
              <button
                onClick={() => setViewMode("canvas")}
                className={`px-3 py-1.5 font-press-start text-[10px] transition-all ${
                  viewMode === "canvas" ? "bg-[#00FFFF] text-black font-bold" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                🗺️ CANVAS
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 font-press-start text-[10px] border-l-2 border-black transition-all ${
                  viewMode === "tree" ? "bg-[#FFCC00] text-black font-bold" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                🌳 TREE
              </button>
              <button
                onClick={() => setViewMode("outline")}
                className={`px-3 py-1.5 font-press-start text-[10px] border-l-2 border-black transition-all ${
                  viewMode === "outline" ? "bg-[#FF00FF] text-white font-bold" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                📋 OUTLINE
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleToggleAll(true)}
                disabled={!tree}
                className="px-2.5 py-1.5 border-2 border-black bg-white font-press-start text-[10px] hover:bg-black hover:text-white transition-all disabled:opacity-40"
              >
                + EXPAND ALL
              </button>
              <button
                onClick={() => handleToggleAll(false)}
                disabled={!tree}
                className="px-2.5 py-1.5 border-2 border-black bg-white font-press-start text-[10px] hover:bg-black hover:text-white transition-all disabled:opacity-40"
              >
                − COLLAPSE ALL
              </button>
              <button
                onClick={() => fitToView()}
                disabled={!tree}
                className="px-2.5 py-1.5 border-2 border-black bg-white font-press-start text-[10px] hover:bg-black hover:text-white transition-all disabled:opacity-40"
                title="Center and fit mind map in viewport"
              >
                ⊡ CENTER
              </button>
              <button
                onClick={handleSaveToMongoDB}
                disabled={!tree || savedSuccess}
                className="px-3 py-1.5 border-2 border-black bg-[#39FF14] font-press-start text-[10px] hover:bg-black hover:text-[#39FF14] transition-all disabled:opacity-40"
              >
                {savedSuccess ? "✓ SAVED" : "💾 SAVE TO MONGODB"}
              </button>
              <button
                onClick={handleDownloadJSON}
                disabled={!tree}
                className="px-3 py-1.5 border-2 border-black bg-[#FFCC00] font-press-start text-[10px] hover:bg-black hover:text-[#FFCC00] transition-all disabled:opacity-40"
              >
                📥 EXPORT JSON
              </button>
            </div>
          </div>

          {/* VIEW 1: Native Interactive Visual Canvas (Immune to ReactFlow bugs) */}
          {viewMode === "canvas" && (
            <div
              className="flex-1 w-full min-h-[600px] h-[650px] relative bg-[#16181D] overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                backgroundImage: "radial-gradient(#3E4452 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              {/* Generating Loading Overlay */}
              {generating && (
                <div className="absolute inset-0 z-40 bg-[#16181D]/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center pointer-events-auto">
                  <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#00FFFF] animate-spin" />
                    <div className="text-2xl animate-pulse">🧠</div>
                  </div>
                  <h3 className="font-press-start text-sm text-[#00FFFF] mb-2 tracking-wider">
                    GENERATING MIND MAP...
                  </h3>
                  <p className="font-mono text-xs text-white/70 max-w-sm mb-4">
                    Structuring concept taxonomy and assembling interactive visual branches.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-black border border-[#39FF14] text-[#39FF14] font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" />
                    <span>Connecting concepts & nodes...</span>
                  </div>
                </div>
              )}

              {/* Empty State Overlay when no tree loaded */}
              {!tree && !generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-10 z-20 pointer-events-auto bg-black/40 backdrop-blur-[2px]">
                  <div className="w-16 h-16 bg-[#00FFFF] border-3 border-black shadow-brutalist flex items-center justify-center text-3xl mb-4">
                    🧠
                  </div>
                  <h3 className="font-press-start text-sm sm:text-base text-white mb-2">
                    MIND MAP STUDIO READY
                  </h3>
                  <p className="font-mono text-xs text-gray-300 max-w-md mb-6 leading-relaxed">
                    Enter any topic prompt or upload study PDFs above to generate an interactive branching mind map.
                  </p>

                  <div className="w-full max-w-md bg-black/70 border-2 border-white/20 p-4 backdrop-blur-sm shadow-brutalist">
                    <span className="font-press-start text-[10px] text-[#FFCC00] block mb-3">
                      ⚡ CLICK TO TEST INSTANTLY:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {[
                        "Photosynthesis",
                        "Operating Systems",
                        "Machine Learning",
                        "Quantum Computing",
                        "DNA Replication",
                        "Gravity",
                      ].map((topic) => (
                        <button
                          key={topic}
                          onClick={() => handleQuickTopic(topic)}
                          className="px-2.5 py-1.5 border-2 border-black bg-[#F4F4F0] text-black font-mono text-xs hover:bg-[#00FFFF] hover:scale-105 transition-all shadow-sm active:translate-x-0.5 active:translate-y-0.5 font-bold"
                        >
                          {topic} →
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Transformed Visual Graph Container */}
              {tree && (
                <div
                  className="absolute inset-0 pointer-events-none origin-top-left transition-transform duration-75"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                >
                  {/* SVG Connecting Curves Layer */}
                  <svg
                    className="absolute top-0 left-0 overflow-visible pointer-events-none"
                    style={{ width: bounds.width + 1000, height: bounds.height + 1000 }}
                  >
                    <defs>
                      <marker
                        id="arrowhead-cyan"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 4, 0 8" fill="#00FFFF" />
                      </marker>
                      <marker
                        id="arrowhead-magenta"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 4, 0 8" fill="#FF00FF" />
                      </marker>
                      <marker
                        id="arrowhead-lime"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 4, 0 8" fill="#39FF14" />
                      </marker>
                      <marker
                        id="arrowhead-yellow"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 4, 0 8" fill="#FFCC00" />
                      </marker>
                    </defs>

                    {connections.map((c) => {
                      const midY = Math.round((c.from.y + c.to.y) / 2);
                      const pathData = `M ${c.from.x} ${c.from.y} C ${c.from.x} ${midY}, ${c.to.x} ${midY}, ${c.to.x} ${c.to.y}`;
                      const strokeColor = LEVEL_COLORS[c.level] || "#FFFFFF";
                      const markerId =
                        c.level === 0
                          ? "arrowhead-cyan"
                          : c.level === 1
                          ? "arrowhead-magenta"
                          : c.level === 2
                          ? "arrowhead-lime"
                          : "arrowhead-yellow";

                      return (
                        <g key={c.id}>
                          {/* Glow drop shadow line */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#000000"
                            strokeWidth={6}
                            strokeLinecap="round"
                          />
                          {/* Visible colored branch line */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={3}
                            strokeLinecap="round"
                            markerEnd={`url(#${markerId})`}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* HTML Node Cards Layer */}
                  {placedNodes.map((node) => {
                    const isRoot = node.level === 0;
                    const bgColor = LEVEL_COLORS[node.level] || "#FFFFFF";
                    const textColor = LEVEL_TEXT_COLORS[node.level] || "#000000";

                    return (
                      <div
                        key={node.id}
                        onClick={(e) => toggleNodeExpansion(node.id, e)}
                        className="absolute cursor-pointer transition-transform duration-100 hover:scale-[1.03] select-none pointer-events-auto p-4 border-4 border-black"
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          width: `${node.width}px`,
                          backgroundColor: bgColor,
                          color: textColor,
                          boxShadow: "5px 5px 0px #000000",
                          zIndex: isRoot ? 10 : 5,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-press-start text-[9px] px-1.5 py-0.5 bg-black text-[#FFCC00] inline-block">
                            {isRoot ? "ROOT TOPIC" : `LEVEL ${node.level}`}
                          </span>
                          {node.hasChildren && (
                            <button
                              onClick={(e) => toggleNodeExpansion(node.id, e)}
                              className="font-press-start text-xs font-bold px-2 py-0.5 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors"
                              title={node.isExpanded ? "Collapse children" : "Expand children"}
                            >
                              {node.isExpanded ? "−" : "+"}
                            </button>
                          )}
                        </div>

                        <h4 className="font-press-start text-xs leading-snug mb-2 break-words">
                          {node.label}
                        </h4>

                        {node.description && (
                          <p className="font-mono text-[11px] leading-relaxed opacity-95 border-t border-black/30 pt-1.5 break-words">
                            {node.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating Canvas Controls */}
              {tree && (
                <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 bg-white border-2 border-black p-1 shadow-brutalist">
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                    title="Zoom In"
                    className="w-8 h-8 font-press-start text-xs bg-[#F4F4F0] hover:bg-black hover:text-white flex items-center justify-center border border-black"
                  >
                    +
                  </button>
                  <button
                    onClick={() => fitToView()}
                    title="Fit View"
                    className="w-8 h-8 font-press-start text-xs bg-[#F4F4F0] hover:bg-black hover:text-white flex items-center justify-center border border-black"
                  >
                    ⊡
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))}
                    title="Zoom Out"
                    className="w-8 h-8 font-press-start text-xs bg-[#F4F4F0] hover:bg-black hover:text-white flex items-center justify-center border border-black"
                  >
                    −
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    title="Reset 100%"
                    className="px-2 h-8 font-press-start text-[9px] bg-[#F4F4F0] hover:bg-black hover:text-white flex items-center justify-center border border-black"
                  >
                    100%
                  </button>
                </div>
              )}

              {/* Legend Overlay */}
              {tree && (
                <div className="absolute bottom-5 right-5 z-20 bg-white border-2 border-black p-3 shadow-brutalist hidden sm:block">
                  <span className="font-press-start text-[9px] block mb-2 text-black">
                    LEVELS
                  </span>
                  <div className="space-y-1">
                    {["Central Topic", "Major Concept", "Sub-Topic", "Detail"].map(
                      (lbl, lvl) => (
                        <div key={lbl} className="flex items-center gap-2 font-mono text-[11px]">
                          <span
                            className="w-3 h-3 border border-black inline-block"
                            style={{ backgroundColor: LEVEL_COLORS[lvl] }}
                          />
                          <span>{lbl}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Interactive Concept Tree View */}
          {viewMode === "tree" && (
            <div className="p-6 bg-[#F9F9F6] flex-1 overflow-y-auto max-h-[700px]">
              {tree ? (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="p-4 border-4 border-black bg-[#00FFFF] shadow-brutalist">
                    <div className="flex items-center justify-between">
                      <span className="font-press-start text-xs bg-black text-[#00FFFF] px-2 py-0.5">
                        CENTRAL TOPIC
                      </span>
                      <button
                        onClick={() => toggleNodeExpansion(tree.id)}
                        className="px-2 py-0.5 border border-black bg-white font-press-start text-xs"
                      >
                        {expanded.has(tree.id) ? "COLLAPSE" : "EXPAND"}
                      </button>
                    </div>
                    <h3 className="font-press-start text-base mt-2 mb-1">{tree.label}</h3>
                    <p className="font-mono text-xs opacity-90">{tree.description}</p>
                  </div>

                  {/* Branches */}
                  {tree.children && (
                    <div className="pl-6 border-l-4 border-black space-y-4 ml-4">
                      {tree.children.map((branch) => (
                        <div
                          key={branch.id}
                          className="p-4 border-3 border-black bg-[#FF00FF] text-white shadow-brutalist"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-press-start text-[10px] bg-black text-[#FF00FF] px-2 py-0.5">
                              MAJOR CONCEPT
                            </span>
                            {branch.children && branch.children.length > 0 && (
                              <button
                                onClick={() => toggleNodeExpansion(branch.id)}
                                className="px-2 py-0.5 border border-white bg-black text-white font-press-start text-xs"
                              >
                                {expanded.has(branch.id) ? "−" : "+"}
                              </button>
                            )}
                          </div>
                          <h4 className="font-press-start text-sm mt-2 mb-1">{branch.label}</h4>
                          <p className="font-mono text-xs opacity-90">{branch.description}</p>

                          {/* Sub-branches */}
                          {branch.children && expanded.has(branch.id) && (
                            <div className="mt-3 pl-4 border-l-3 border-white space-y-2">
                              {branch.children.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="p-3 border-2 border-black bg-[#39FF14] text-black shadow-sm"
                                >
                                  <span className="font-press-start text-[9px] bg-black text-[#39FF14] px-1.5 py-0.5 inline-block mb-1">
                                    SUB-TOPIC
                                  </span>
                                  <h5 className="font-press-start text-xs mb-1">{sub.label}</h5>
                                  <p className="font-mono text-[11px]">{sub.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 font-mono text-sm">
                  Generate or load a mind map above to explore the concept tree.
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: Study Outline Cards */}
          {viewMode === "outline" && (
            <div className="p-6 bg-[#F9F9F6] flex-1 overflow-y-auto max-h-[700px]">
              {tree ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="p-5 border-4 border-black bg-[#00FFFF] shadow-brutalist">
                    <span className="font-press-start text-xs bg-black text-[#00FFFF] px-2 py-0.5">
                      EXAM REVIEW // {currentTitle}
                    </span>
                    <h2 className="font-press-start text-lg mt-3 mb-2">{tree.label}</h2>
                    <p className="font-mono text-sm leading-relaxed">{tree.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tree.children?.map((concept, idx) => (
                      <div
                        key={concept.id}
                        className="p-4 border-3 border-black bg-white shadow-brutalist flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-press-start text-[10px] px-2 py-0.5 bg-[#FF00FF] text-white border border-black">
                              CONCEPT #{idx + 1}
                            </span>
                          </div>
                          <h3 className="font-press-start text-xs mb-2 leading-snug">
                            {concept.label}
                          </h3>
                          <p className="font-mono text-xs text-gray-700 mb-3 leading-relaxed">
                            {concept.description}
                          </p>
                        </div>

                        {concept.children && concept.children.length > 0 && (
                          <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-2 space-y-2">
                            <span className="font-press-start text-[9px] text-gray-500 block">
                              KEY TAKEAWAYS:
                            </span>
                            {concept.children.map((sub) => (
                              <div
                                key={sub.id}
                                className="p-2 border border-black bg-[#EFFFFF] font-mono text-xs"
                              >
                                <strong>• {sub.label}</strong>: {sub.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 font-mono text-sm">
                  Generate or load a mind map above to read the structured outline.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Saved Mind Maps Drawer Modal (MongoDB Atlas) */}
      {showSavedDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border-4 border-lumen-black shadow-brutalist max-h-[85vh] flex flex-col">
            <div className="p-5 border-b-4 border-lumen-black bg-[#00FFFF] flex items-center justify-between">
              <div>
                <h3 className="font-press-start text-sm md:text-base text-black">
                  SAVED MIND MAPS // MONGODB
                </h3>
                <p className="font-mono text-xs text-black/80 mt-1">
                  Stored in your MongoDB Atlas cluster
                </p>
              </div>
              <button
                onClick={() => setShowSavedDrawer(false)}
                className="w-8 h-8 border-2 border-lumen-black bg-black text-white font-press-start text-xs hover:bg-white hover:text-black flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {loadingSaved ? (
                <div className="text-center py-12 font-mono text-sm">
                  <span className="animate-spin inline-block mr-2">⚙️</span>
                  Connecting to MongoDB Atlas...
                </div>
              ) : savedMaps.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-3xl">📭</div>
                  <h4 className="font-press-start text-xs text-gray-700">
                    NO SAVED MIND MAPS YET
                  </h4>
                  <p className="font-mono text-xs text-gray-500 max-w-xs mx-auto">
                    Generate a mind map and click &quot;SAVE TO MONGODB&quot; to preserve it in your database.
                  </p>
                </div>
              ) : (
                savedMaps.map((savedMap) => (
                  <div
                    key={savedMap._id || savedMap.id}
                    onClick={() => handleLoadMap(savedMap)}
                    className="p-4 border-3 border-lumen-black bg-[#F4F4F0] hover:bg-[#EFFFFF] cursor-pointer transition-all shadow-sm flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-press-start text-xs text-black mb-1">
                        {savedMap.title}
                      </h4>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-gray-600">
                        <span>Source: {savedMap.sourceName}</span>
                        {savedMap.createdAt && (
                          <span>
                            • {new Date(savedMap.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteMap(savedMap._id || savedMap.id || "", e)}
                        className="p-2 border-2 border-black bg-white hover:bg-[#FF4F00] hover:text-white transition-all text-xs"
                        title="Delete from MongoDB"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t-4 border-lumen-black bg-[#F4F4F0] flex justify-end">
              <button
                onClick={() => setShowSavedDrawer(false)}
                className="px-4 py-2 border-2 border-black bg-white font-press-start text-xs hover:bg-black hover:text-white"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
