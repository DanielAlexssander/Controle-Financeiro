// Engraved coin stacks, drawn on a common elliptical grid.
function Coin({ x, y, radius, layers }: { x: number; y: number; radius: number; layers: number }) {
  const ry = radius * 0.34;
  const marks = Array.from({ length: 33 }, (_, i) => (Math.PI * i) / 32);
  return (
    <g className="coin-stack" transform={`translate(${x} ${y})`} stroke="#b6cba3" strokeWidth="1.2">
      {Array.from({ length: layers }, (_, i) => {
        const offset = (layers - i - 1) * 8;
        return (
          <g key={i} transform={`translate(0 ${offset})`}>
            <path
              fill="#275647"
              d={`M${-radius},0 a${radius},${ry} 0 0 1 ${radius * 2},0 v7 a${radius},${ry} 0 0 1 ${-radius * 2},0z`}
            />
            {marks.map((a) => (
              <path
                key={a}
                strokeWidth=".75"
                opacity=".7"
                d={`M${radius * Math.cos(a)} ${ry * Math.sin(a) + 1}v5`}
              />
            ))}
          </g>
        );
      })}
      <ellipse rx={radius} ry={ry} fill="#34634f" />
      <ellipse rx={radius * 0.9} ry={ry * 0.77} fill="none" strokeWidth=".9" />
      <ellipse
        rx={radius * 0.84}
        ry={ry * 0.65}
        fill="none"
        strokeDasharray="2.5 3"
        opacity=".75"
      />
      <g transform="matrix(1,-.13,.65,.46,-18,2)" stroke="none" fill="#cad8b0">
        <path d="M0 0l8-4v13l-8 4zm12-8 8-4v17l-8 4zm12-8 8-4V2l-8 4z" />
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
