import type { AVLVizNode } from '../../dsa/AVLTree';
import type { Flight } from '../../types/flight';

interface Props {
  root: AVLVizNode<Flight> | null;
  min: number;
  max: number;
}

interface PNode {
  key: number;
  balance: number;
  count: number;
  x: number;
  y: number;
  left: PNode | null;
  right: PNode | null;
  inRange: boolean;
}

function buildPositions(
  root: AVLVizNode<Flight> | null,
  min: number,
  max: number,
): { tree: PNode | null; total: number; depth: number } {
  let counter = 0;
  let maxDepth = 0;
  const convert = (node: AVLVizNode<Flight> | null, depth: number): PNode | null => {
    if (!node) return null;
    const left = convert(node.left, depth + 1);
    const x = counter++;
    if (depth > maxDepth) maxDepth = depth;
    const right = convert(node.right, depth + 1);
    return {
      key: node.key,
      balance: node.balance,
      count: node.values.length,
      x,
      y: depth,
      left,
      right,
      inRange: node.key >= min && node.key <= max,
    };
  };
  const tree = convert(root, 0);
  return { tree, total: counter, depth: maxDepth + 1 };
}

export function AvlTreeView({ root, min, max }: Props) {
  const { tree, total, depth } = buildPositions(root, min, max);

  if (!tree || total === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-card bg-ink-50 text-sm text-ink-400">
        No flights to index — adjust your filters
      </div>
    );
  }

  const nodes: PNode[] = [];
  const walk = (n: PNode | null): void => {
    if (!n) return;
    nodes.push(n);
    walk(n.left);
    walk(n.right);
  };
  walk(tree);

  const levelH = 66;
  const r = 19;
  const width = Math.max(360, total * 48);
  const height = depth * levelH + 16;
  const px = (x: number): number => (x + 0.5) * (width / total);
  const py = (y: number): number => y * levelH + r + 4;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="mx-auto">
        {nodes.map((n) => (
          <g key={`edges-${n.key}`}>
            {n.left && (
              <line x1={px(n.x)} y1={py(n.y)} x2={px(n.left.x)} y2={py(n.left.y)} stroke="#D9DCE3" strokeWidth={1.5} />
            )}
            {n.right && (
              <line x1={px(n.x)} y1={py(n.y)} x2={px(n.right.x)} y2={py(n.right.y)} stroke="#D9DCE3" strokeWidth={1.5} />
            )}
          </g>
        ))}
        {nodes.map((n) => (
          <g key={`node-${n.key}`} className={n.inRange ? 'animate-pulse' : ''}>
            <circle
              cx={px(n.x)}
              cy={py(n.y)}
              r={r}
              fill={n.inRange ? '#0C73FE' : '#fff'}
              stroke="#0C73FE"
              strokeWidth={2}
            />
            <text
              x={px(n.x)}
              y={py(n.y) + 1}
              textAnchor="middle"
              fontSize={9.5}
              fontWeight={700}
              fill={n.inRange ? '#fff' : '#1A1E27'}
            >
              ${n.key}
            </text>
            <text x={px(n.x)} y={py(n.y) + 11} textAnchor="middle" fontSize={7} fill={n.inRange ? '#EBF3FF' : '#9BA3B2'}>
              bf {n.balance >= 0 ? '+' : ''}
              {n.balance}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
