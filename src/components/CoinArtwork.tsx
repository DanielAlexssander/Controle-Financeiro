import { useId } from 'react';

function Coin({ x, y, radius, layers }: { x: number; y: number; radius: number; layers: number }) {
  const id = useId();
  const rimId = `${id}-rim`;
  const faceId = `${id}-face`;
  const ry = radius * 0.34;
  const grooves = Array.from({ length: 33 }, (_, i) => {
    const angle = (Math.PI * i) / 32;
    return `M${radius * Math.cos(angle)} ${ry * Math.sin(angle) + 1}v5`;
  }).join(' ');

  return (
    <g className="coin-stack" transform={`translate(${x} ${y})`} stroke="#b6cba3" strokeWidth="1.2">
      <defs>
        <g id={rimId}>
          <path
            fill="#275647"
            d={`M${-radius},0 a${radius},${ry} 0 0 1 ${radius * 2},0 v7 a${radius},${ry} 0 0 1 ${-radius * 2},0z`}
          />
          <path d={grooves} strokeWidth=".75" opacity=".7" />
        </g>
        <g id={faceId}>
          <ellipse rx={radius} ry={ry} fill="#34634f" />
          <ellipse rx={radius * 0.9} ry={ry * 0.77} strokeWidth=".9" />
          <ellipse rx={radius * 0.84} ry={ry * 0.65} strokeDasharray="2.5 3" opacity=".75" />
          <g transform="matrix(1,-.13,.65,.46,-18,2)" stroke="none" fill="#cad8b0">
            <path d="M0 0l8-4v13l-8 4zm12-8 8-4v17l-8 4zm12-8 8-4V2l-8 4z" />
          </g>
        </g>
      </defs>
      {Array.from({ length: layers - 1 }, (_, i) => (
        <use key={i} href={`#${rimId}`} y={(layers - i - 1) * 8} />
      ))}
      <use href={`#${faceId}`} y={8} />
      <g className="coin-top">
        <use href={`#${rimId}`} />
        <use href={`#${faceId}`} />
      </g>
    </g>
  );
}
export function CoinArtwork() {
  return (
    <svg className="coin-art" aria-hidden="true" viewBox="0 0 400 185" fill="none">
      <g stroke="#a4c1a0" opacity=".15" strokeWidth=".8">
        {Array.from({ length: 11 }, (_, i) => (
          <ellipse key={i} cx="218" cy="140" rx={75 + i * 16} ry={18 + i * 4.5} />
        ))}
      </g>
      <Coin x={240} y={53} radius={62} layers={7} />
      <Coin x={145} y={103} radius={56} layers={4} />
      <Coin x={260} y={136} radius={43} layers={2} />
    </svg>
  );
}
