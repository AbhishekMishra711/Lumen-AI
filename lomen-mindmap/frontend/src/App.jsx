import { useEffect, useRef, useState } from 'react';
import ReactFlow, { Background, Handle, MarkerType, MiniMap, Position, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

const API = import.meta.env.VITE_API_URL || `${location.protocol}//${location.hostname}:8000`;
const COLORS = ['#9333ea', '#0d9488', '#22c55e', '#f97316'];
const WIDTH = [430, 280, 280, 280];
const X_GAP = 80;
const Y_GAP = 260;
const color = level => COLORS[level] || '#6b7280';

function MindMapNode({ data }) {
  const root = data.level === 0;
  return (
    <div className={`mind-map-node ${root ? 'root-node' : ''}`} style={{ backgroundColor: color(data.level) }}>
      {!root && <Handle type="target" position={Position.Top} className="node-handle" isConnectable={false} />}
      <div className="node-heading">
        {!root && <span className="point-marker">•</span>}
        <span>{data.label}</span>
        {data.hasChildren && <span className="expand-indicator">{data.isExpanded ? '−' : '+'}</span>}
      </div>
      {data.description && <div className="node-description">{data.description}</div>}
      {data.hasChildren && <Handle type="source" position={Position.Bottom} className="node-handle" isConnectable={false} />}
    </div>
  );
}

const nodeTypes = { custom: MindMapNode };
const edgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#6b7280', strokeWidth: 3 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280', width: 18, height: 18 },
};

function layoutTree(root, expanded) {
  const widths = new Map();
  const measure = node => {
    const own = WIDTH[node.level] || 280;
    const children = expanded.has(node.id) ? node.children || [] : [];
    const childrenWidth = children.reduce((sum, child) => sum + measure(child), 0) + Math.max(0, children.length - 1) * X_GAP;
    const width = Math.max(own, childrenWidth);
    widths.set(node.id, width);
    return width;
  };

  const nodes = [];
  const edges = [];
  const total = measure(root);
  const place = (node, left, depth, parent) => {
    const subtreeWidth = widths.get(node.id);
    const nodeWidth = WIDTH[node.level] || 280;
    const children = expanded.has(node.id) ? node.children || [] : [];
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x: left + (subtreeWidth - nodeWidth) / 2, y: depth * Y_GAP },
      data: { ...node, hasChildren: Boolean(node.children?.length), isExpanded: expanded.has(node.id) },
    });
    if (parent) edges.push({ id: `${parent}-${node.id}`, source: parent, target: node.id });

    const childrenWidth = children.reduce((sum, child) => sum + widths.get(child.id), 0) + Math.max(0, children.length - 1) * X_GAP;
    let childLeft = left + (subtreeWidth - childrenWidth) / 2;
    children.forEach(child => {
      place(child, childLeft, depth + 1, node.id);
      childLeft += widths.get(child.id) + X_GAP;
    });
  };

  place(root, -total / 2, 0, null);
  return { nodes, edges };
}

async function responseJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

export default function App() {
  const [tree, setTree] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const flow = useRef(null);

  useEffect(() => {
    const graph = tree ? layoutTree(tree, expanded) : { nodes: [], edges: [] };
    setNodes(graph.nodes);
    setEdges(graph.edges);
    const timer = setTimeout(() => flow.current?.fitView({ padding: 0.18, duration: 500, maxZoom: 1 }), 50);
    return () => clearTimeout(timer);
  }, [tree, expanded, setNodes, setEdges]);

  const toggleNode = (_, node) => {
    if (!node.data.hasChildren) return;
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(node.id)) {
        const removeDescendants = item => (item.children || []).forEach(child => {
          next.delete(child.id);
          removeDescendants(child);
        });
        next.delete(node.id);
        removeDescendants(node.data);
      } else next.add(node.id);
      return next;
    });
  };

  const uploadPdf = async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return setError('Please upload a PDF file');
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await responseJson(await fetch(`${API}/api/upload-pdf`, { method: 'POST', body: form }));
      const root = data.nodes?.[0];
      if (!root) throw new Error('The PDF did not produce a mind map');
      setExpanded(new Set());
      setTree({ id: root.id, ...root.data });
    } catch (uploadError) {
      setError(uploadError.message || 'Error processing PDF');
    } finally {
      setUploading(false);
    }
  };

  const download = () => {
    if (!flow.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(flow.current.toObject(), null, 2)], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: 'mindmap.json' });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-left">
          <h1 className="nav-title">Mind Map Studio</h1>
          <div className="nav-controls">
            <select className="nav-select">{[1, 2, 3, 4].map(n => <option key={n}>Week {n}</option>)}</select>
            <select className="nav-select">{[1, 2, 3, 4].map(n => <option key={n}>Lesson {n}</option>)}</select>
            <button className="nav-button go-button">Go</button>
          </div>
        </div>
        <div className="nav-right">
          <input type="file" ref={fileInput} onChange={uploadPdf} accept=".pdf" hidden />
          <button className="nav-button upload-button" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? 'Processing...' : 'Upload PDF'}
          </button>
          <button className="nav-button download-button" onClick={download} disabled={!tree}>↓ Download</button>
        </div>
      </nav>

      {error && <div className="error-message">{error}<button onClick={() => setError('')} className="error-close">×</button></div>}

      <div className="flow-container">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={toggleNode} nodeTypes={nodeTypes} onInit={instance => { flow.current = instance; }}
          fitView minZoom={0.08} maxZoom={2} defaultEdgeOptions={edgeOptions}>
          <Background color="#374151" gap={20} />
          <MiniMap nodeColor={node => color(node.data.level)} className="custom-minimap" maskColor="rgba(0,0,0,.8)" />
        </ReactFlow>

        <div className="custom-zoom-controls">
          <button onClick={() => flow.current?.zoomIn()} className="zoom-btn">+</button>
          <button onClick={() => flow.current?.fitView({ padding: .18 })} className="zoom-btn">⟲</button>
          <button onClick={() => flow.current?.zoomOut()} className="zoom-btn">−</button>
        </div>
        <div className="helper-text">Drag to pan · Scroll to zoom · Click nodes to expand/collapse</div>
        <div className="legend">
          <div className="legend-title">Legend</div>
          {['Root', 'Main Topic', 'Sub-topic', 'Detail'].map((label, level) => (
            <div key={label} className="legend-item"><i style={{ backgroundColor: color(level) }} />{label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
