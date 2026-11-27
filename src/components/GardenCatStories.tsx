import { DaisyCat, daisyCatDef } from 'trazo-stickers';

// The sticker paths group both paw fills and their outlines in compound layers.
function splitClosedPaths(path: string) {
  let x = 0;
  let y = 0;
  return path.split(/(?=[Mm])/).map(part => {
    const move = /^([Mm])(-?[\d.]+)[ ,]*(-?[\d.]+)(.*)$/.exec(part);
    if (!move) return part;
    x = (move[1] === 'm' ? x : 0) + Number(move[2]);
    y = (move[1] === 'm' ? y : 0) + Number(move[3]);
    return `M${x} ${y}${move[4]}`;
  });
}

const pawFill = daisyCatDef.layers?.[19];
const pawOutline = daisyCatDef.layers?.[22];
const fills = pawFill ? splitClosedPaths(pawFill.d) : [];
const outlines = pawOutline ? splitClosedPaths(pawOutline.d) : [];

export function GardenDaisyCat() {
  const { viewBox, layers } = daisyCatDef;
  if (!layers || !pawFill || !pawOutline) return <DaisyCat className="scroll-cat-art" size="100%" overflow="visible" focusable="false" />;
  return <svg className="scroll-cat-art" width="100%" height="100%" viewBox={viewBox} overflow="visible" fillRule="evenodd" focusable="false">
    {layers.map(({ d, fill }, index) => {
      const path = index === 19 ? fills[0]
        : index === 22 ? [...outlines.slice(0, 3), ...outlines.slice(5)].join('')
        : d;
      return <path key={d} d={path} fill={fill} className={index >= 4 && index <= 18 ? 'cat-held-daisy' : undefined} />;
    })}
    <g className="cat-gesture-paw">
      <path d={fills[1]} fill={pawFill.fill} />
      <path d={outlines.slice(3, 5).join('')} fill={pawOutline.fill} />
    </g>
  </svg>;
}

export function GardenCatStories() {
  return <svg className="scroll-cat-stories" viewBox="0 0 96 96" fill="none" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <g className="cat-story cat-sleeping">
      <g className="cat-nap-breath">
        <path d="M20 81c-1-9 9-20 21-20l5 1 5-7 7 4q6-2 13 0l5-4 3 9c7 5 8 14 2 20-7 7-19 4-28 5-16 2-30 1-33-8Z" fill="#fffaf4" stroke="#fff" strokeWidth="6" />
        <path d="M20 81c-1-9 9-20 21-20l5 1 5-7 7 4q6-2 13 0l5-4 3 9c7 5 8 14 2 20-7 7-19 4-28 5-16 2-30 1-33-8Z" fill="#fffaf4" stroke="#262521" strokeWidth="2.4" />
        <path d="M33 68c-9 3-11 14-1 15 5 .4 9-2 8-5-1-2-3-1-5 0" stroke="#262521" strokeWidth="2.15" />
        <path d="m60 61 1 4m4-4 1 4m4-4 1 3" stroke="#b6b5ae" strokeWidth="2.7" />
        <path d="M55 73q2 3 5 1m9 0q3 2 5-1m-11 3q1 1 3 0" stroke="#262521" strokeWidth="1.65" />
        <path d="m52 77 3 .4m19 0 3-.6" stroke="#ecb0bd" strokeWidth="2.6" />
        <path d="m62 86 3-5 3 3" stroke="#6f9d61" strokeWidth="1.6" />
        <path d="M62 82c-3 0-3-3-1-3 0-3 3-3 4-1 2-2 4-1 4 1 2 1 2 4-1 4-1 2-4 2-4 0Z" fill="#efb4c7" stroke="#a96e83" strokeWidth="1" />
        <circle cx="65" cy="81" r="1.4" fill="#efca75" />
      </g>
      <path className="cat-nap-dream" d="m67 48 5-.4-4 5 5-.3m2-13 7-.8-5.8 7 6.7-.6" strokeWidth="1.5" />
    </g>
  </svg>;
}
