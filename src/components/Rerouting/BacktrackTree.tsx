import type { BTNode, BTStatus } from '../../dsa/Backtracking';

interface Props {
  tree: BTNode<string>;
  revealCount: number;
}

interface LNode {
  id: number;
  label: string;
  status: BTStatus;
  x: number;
  y: number;
  parentId: number | null;
}

const COLOR: Record<BTStatus, string> = {
  root: '#0C73FE',
  explore: '#0C73FE',
  success: '#00C176',
  deadend: '#F5222D',
  blocked: '#9BA3B2',
  visited: '#D9DCE3',
};

function layout(root: BTNode<string>): { nodes: LNode[]; leaves: number; depth: number } {
  const nodes: LNode[] = [];
  let leaf = 0;
  let maxDepth = 0;
  const visit = (n: BTNode<string>, depth: number, parentId: number | null): number => {
    const id = nodes.length;
    const node: LNode = { id, label: n.node, status: n.status, x: 0, y: depth, parentId };
    nodes.push(node);
    if (depth > maxDepth) maxDepth = depth;
    if (n.children.length === 0) {
      node.x = leaf++;
    } else {
      const childIds: number[] = [];
      for (const c of n.children) childIds.push(visit(c, depth + 1, id));
      node.x = (nodes[childIds[0]].x + nodes[childIds[childIds.length - 1]].x) / 2;
    }
    return id;
  };
  visit(root, 0, null);
  return { nodes, leaves: Math.max(leaf, 1), depth: maxDepth + 1 };
}

export function BacktrackTree({ tree, revealCount }: Props) {
  const { nodes, leaves, depth } = layout(tree);
  const colW = 50;
  const levelH = 60;
  const r = 15;
  const width = Math.max(360, leaves * colW);
  const height = depth * levelH + 12;
  const px = (x: number): number => (x + 0.5) * colW;
  const py = (y: number): number => y * levelH + r + 4;

  return (
    <div className="overflow-auto">
      <svg width={width} height={height}>
        {/* edges */}
        {nodes.map((n) =>
          n.parentId !== null && n.id < revealCount && n.parentId < revealCount ? (
            <line
              key={`e${n.id}`}
              x1={px(nodes[n.parentId].x)}
              y1={py(nodes[n.parentId].y)}
              x2={px(n.x)}
              y2={py(n.y)}
              stroke="#D9DCE3"
              strokeWidth={1.5}
            />
          ) : null,
        )}
        {/* nodes */}
        {nodes.map((n) =>
          n.id < revealCount ? (
            <g key={`n${n.id}`} className="animate-fade-in">
              <circle
                cx={px(n.x)}
                cy={py(n.y)}
                r={r}
                fill={n.status === 'success' || n.status === 'deadend' || n.status === 'blocked' ? COLOR[n.status] : '#fff'}
                stroke={COLOR[n.status]}
                strokeWidth={2}
              />
              <text
                x={px(n.x)}
                y={py(n.y) + 3}
                textAnchor="middle"
                fontSize={8}
                fontWeight={700}
                fill={n.status === 'success' || n.status === 'deadend' || n.status === 'blocked' ? '#fff' : '#1A1E27'}
              >
                {n.label}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
