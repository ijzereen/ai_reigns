import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow, // Import useReactFlow hook
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom styling for nodes (optional, can be expanded)
const nodeStyles = {
  blue: {
    background: '#3B82F6', // Tailwind blue-500
    color: 'white',
    border: '1px solid #2563EB', // Tailwind blue-600
    borderRadius: '0.375rem', // Tailwind rounded-md
    padding: '10px 15px',
    minWidth: '150px',
    textAlign: 'center',
    // Add a subtle shadow or border change for selected state if needed
  },
  yellow: {
    background: '#F59E0B', // Tailwind amber-500
    color: 'white',
    border: '1px solid #D97706', // Tailwind amber-600
    borderRadius: '0.375rem', // Tailwind rounded-md
    padding: '10px 15px',
    minWidth: '150px',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 4, // Ensure buttons are above the flow canvas
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '10px 15px',
    borderRadius: '0.375rem',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  blueButton: {
    background: '#3B82F6', // Tailwind blue-500
  },
  yellowButton: {
    background: '#F59E0B', // Tailwind amber-500
  }
};

// Initial empty nodes and edges
const initialNodes = [
  {
    id: 'start',
    type: 'input', // Default input node
    data: { label: '[스토리 제목 넣기]' },
    position: { x: 50, y: 150 },
    style: { ...nodeStyles.blue, minWidth: '200px' },
  },
];
const initialEdges = [];

let idCounter = 0;
const getNodeId = (type) => `${type}_${idCounter++}`;

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const lastAddedNodeId = useRef('start'); // Keep track of the ID of the node added last
  // We no longer need lastNodePosition ref as position is calculated relative to source
  const { getNodes, getNode } = useReactFlow(); // Get access to React Flow instance methods

  // Callback for connecting nodes (manual connection)
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Function to add a new node and connect it
  const addNodeAndEdge = (nodeType) => {
    const newNodeId = getNodeId(nodeType);
    const style = nodeType === 'blue' ? nodeStyles.blue : nodeStyles.yellow;

    // Find the selected node, if any
    const selectedNodes = getNodes().filter((node) => node.selected);
    const sourceNodeId = selectedNodes.length > 0 ? selectedNodes[0].id : lastAddedNodeId.current;
    const sourceNode = getNode(sourceNodeId); // Get the source node details

    let sourceNodePosition = { x: 50, y: 150 }; // Default position if sourceNode is somehow null initially
    let sourceNodeWidth = 150; // Default width

    if (sourceNode) {
        // Use measured dimensions if available, otherwise calculate based on style/content
        sourceNodePosition = sourceNode.position || sourceNodePosition;
        sourceNodeWidth = sourceNode.width || sourceNodeWidth;
    }

    // Calculate position for the new node relative to the source node
    // Position new nodes to the right of the source node
    const spacing = 200; // Horizontal space between nodes
    const verticalOffset = 0; // Adjust if you want vertical staggering
    const newX = sourceNodePosition.x + sourceNodeWidth + spacing;
    const newY = sourceNodePosition.y + verticalOffset;

    const newNode = {
      id: newNodeId,
      type: 'default', // Using default node type, can be customized
      data: { label: `새로운 ${nodeType === 'blue' ? '남색' : '노란색'} 노드 ${idCounter}` },
      position: { x: newX, y: newY },
      style: style,
    };

    // Add the new node
    setNodes((nds) => nds.concat(newNode));

    // Add the edge connecting the source node to the new node
    const newEdge = {
      id: `e-${sourceNodeId}-${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
      animated: nodeType === 'blue', // Optional: animate blue edges
      style: { stroke: '#555', strokeWidth: 2 },
    };
    setEdges((eds) => eds.concat(newEdge));

    // Update the ID of the most recently added node
    lastAddedNodeId.current = newNodeId;
  };

  return (
    // Ensure the container has a defined height and width
    <div style={{ height: '100vh', width: '100%' }}>
      {/* Buttons to add nodes */}
      <div style={nodeStyles.buttonContainer}>
        <button
          onClick={() => addNodeAndEdge('blue')}
          style={{...nodeStyles.button, ...nodeStyles.blueButton}}
          title="선택된 노드 또는 마지막 노드에 남색 노드 추가" // Updated title
        >
          남색 +
        </button>
        <button
          onClick={() => addNodeAndEdge('yellow')}
          style={{...nodeStyles.button, ...nodeStyles.yellowButton}}
          title="선택된 노드 또는 마지막 노드에 노란색 노드 추가" // Updated title
        >
          노란색 +
        </button>
      </div>
      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView // Zooms out to fit all nodes initially
        attributionPosition="bottom-left"
        selectNodesOnDrag={true} // Ensure nodes can be selected
      >
        <Controls />
        <MiniMap nodeColor={(n) => n.style?.background || '#eee'} nodeStrokeWidth={3} zoomable pannable />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

// Wrap Flow component with ReactFlowProvider is essential
export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
