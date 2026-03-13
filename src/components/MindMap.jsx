import React, { useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 50;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      targetPosition: direction === 'LR' ? 'left' : 'top',
      sourcePosition: direction === 'LR' ? 'right' : 'bottom',
    };
  });

  return { nodes: layoutedNodes, edges };
};

const nodeTypes = {};
const edgeTypes = {};

export const MindMap = ({ config, onNavigate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!config) return;

    const initialNodes = [];
    const initialEdges = [];

    const createNode = (id, label, style = {}, data = {}) => {
      initialNodes.push({
        id,
        data: { label, ...data },
        position: { x: 0, y: 0 },
        style: {
          padding: 10,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          textAlign: 'center',
          cursor: data.navTarget ? 'pointer' : 'default',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          ...style,
        },
      });
    };

    const createEdge = (source, target) => {
      initialEdges.push({
        id: `e-${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--accent-light)' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--accent-light)',
        },
      });
    };

    // Root node
    const routerName = config.metadata?.identity || config.system?.identity?.name || 'Router';
    createNode('root', routerName, { 
      background: 'var(--accent)', 
      color: '#fff',
      border: 'none',
    }, { navTarget: 'overview' });

    // Interfaces Category
    if (config.interfaces && config.interfaces.length > 0) {
      createNode('cat-interfaces', 'Interfaces', {}, { navTarget: 'interfaces-list' });
      createEdge('root', 'cat-interfaces');

      config.interfaces.slice(0, 5).forEach((iface, i) => {
        const id = `iface-${i}`;
        createNode(id, iface.name || iface.defaultName, { fontWeight: 400, fontSize: '0.75rem' });
        createEdge('cat-interfaces', id);
      });
      if (config.interfaces.length > 5) {
        createNode('iface-more', `+ ${config.interfaces.length - 5} more`, { border: 'none', background: 'transparent', boxShadow: 'none' });
        createEdge('cat-interfaces', 'iface-more');
      }
    }

    // IP Addresses Category
    if (config.ipAddresses && config.ipAddresses.length > 0) {
      createNode('cat-ip', 'IP Addresses', {}, { navTarget: 'ip-addresses' });
      createEdge('root', 'cat-ip');
      config.ipAddresses.slice(0, 5).forEach((ip, i) => {
        const id = `ip-${i}`;
        createNode(id, ip.address, { fontWeight: 400, fontSize: '0.75rem' });
        createEdge('cat-ip', id);
      });
      if (config.ipAddresses.length > 5) {
        createNode('ip-more', `+ ${config.ipAddresses.length - 5} more`, { border: 'none', background: 'transparent', boxShadow: 'none' });
        createEdge('cat-ip', 'ip-more');
      }
    }

    // DHCP Server
    if (config.dhcp?.servers?.length > 0) {
      createNode('cat-dhcp', 'DHCP Server', {}, { navTarget: 'ip-dhcp-server' });
      createEdge('root', 'cat-dhcp');
    }

    // Routes Category
    if (config.routes && config.routes.length > 0) {
      createNode('cat-routes', `Routes (${config.routes.length})`, {}, { navTarget: 'ip-routes' });
      createEdge('root', 'cat-routes');
    }

    // Firewall Category
    const fwCount = (config.firewall?.filter?.length || 0) + (config.firewall?.nat?.length || 0) + (config.firewall?.mangle?.length || 0);
    if (fwCount > 0) {
      createNode('cat-firewall', `Firewall (${fwCount} Rules)`, {}, { navTarget: 'firewall-filter' });
      createEdge('root', 'cat-firewall');
    }

    // VPN Category
    const vpnCount = (config.vpn?.wireguard?.length || 0) + (config.vpn?.ovpn?.length || 0) + (config.vpn?.l2tp?.length || 0);
    if (vpnCount > 0) {
      createNode('cat-vpn', `VPN (${vpnCount} Profiles)`, {}, { navTarget: 'vpn' });
      createEdge('root', 'cat-vpn');
    }

    // Bridges Category
    if (config.bridges && config.bridges.length > 0) {
      createNode('cat-bridges', 'Bridges', {}, { navTarget: 'bridge-list' });
      createEdge('root', 'cat-bridges');
      config.bridges.forEach((b, i) => {
        const id = `bridge-${i}`;
        createNode(id, b.name || b.defaultName, { fontWeight: 400, fontSize: '0.75rem' });
        createEdge('cat-bridges', id);
      });
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, 'LR');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [config, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    if (node.data?.navTarget && onNavigate) {
      onNavigate(node.data.navTarget);
    }
  }, [onNavigate]);

  return (
    <div className="glass-panel config-section animate-fade-in" style={{ height: 'calc(100vh - 120px)', padding: 0, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="var(--text-muted)" gap={16} size={1} />
        <Controls style={{ background: 'var(--bg-surface)', fill: 'var(--text-primary)', border: '1px solid var(--border)' }} />
        <MiniMap 
          nodeColor={(n) => n.style?.background || 'var(--bg-elevated)'} 
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};
