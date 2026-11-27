import { huggingCatsDef } from 'trazo-stickers';

const arrangements = {
  opening: ['sky-coil', 'crown-rays', 'bowtie-loop'],
  about: ['hugging-cats', 'open-book', 'heart-chevron', 'triple-heart-swirl'],
  projects: ['lightning-bolt', 'diamond', 'blue-crayon'],
  school: ['book-stack', 'highlighter', 'school-backpack'],
  music: ['loop-ribbon', 'peach-coil', 'zigzag-scribble'],
  memories: ['star-outline', 'circle-ring', 'heart-hug'],
  contact: ['down-arrow', 'asterisk'],
  reef: ['scallop-shell', 'pink-jellyfish', 'sea-bubble'],
} as const;

const colors = ['var(--sage)', 'var(--color-warm-accent)', '#bf9050', 'var(--color-warm-accent)'];
const rotations = [-14, 11, -8, 16];
const hugLayers = huggingCatsDef.layers!;

// The final three layers of this sticker are the foreground paw and its markings.
const hugBody = hugLayers.slice(0, -3);
const hugPaw = hugLayers.slice(-3);

function CatHug() {
  return <span className="garden-hug" data-cat-stop="hug">
    <svg className="garden-hug-waiting" viewBox="0 0 256 256" overflow="visible" focusable="false">
      <g transform="rotate(-14 128 128)"><g className="garden-hug-orange" fillRule="evenodd">
        <g className="garden-hug-waiting-paw" aria-hidden="true">
          <path d={hugPaw[0].d} fill="#fff" stroke="#fff" strokeWidth="16" strokeLinejoin="round" />
        </g>
        <path d="M129 104Q127 74 138 64Q144 58 157 78Q174 85 190 76Q209 57 216 68Q225 83 224 104Q240 106 241 116Q240 128 222 128Q228 166 216 191Q208 201 193 190Q175 197 160 188Q146 199 135 190Q125 177 128 133Q110 130 110 119Q111 109 129 104Z" fill="#fff" stroke="#fff" strokeWidth="14" strokeLinejoin="round" />
        <path d="M133 113Q128 75 138 65Q144 59 157 78Q172 85 190 76Q209 57 216 69Q224 77 224 100Q217 109 219 131Q226 162 216 191Q209 200 193 190Q175 197 160 188Q145 199 135 190Q124 177 130 137" fill="#f9cca0" stroke="#0b0b0d" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m159 86 2 9m11-8 2 11m12-14 1 9m20 57 8-3m-10 17 9-2" fill="none" stroke="#e09856" strokeWidth="7" strokeLinecap="round" />
        <path d="m121 111 8 3m-11 8 9 1m96-14 8-4m-7 13 10 1" fill="none" stroke="#0b0b0d" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="139" cy="133" rx="9" ry="4" fill="#f9b6cc" />
        <ellipse cx="214" cy="131" rx="9" ry="4" fill="#f9b6cc" />
        <circle cx="154" cy="118" r="5" fill="#0b0b0d" />
        <circle cx="198" cy="117" r="5" fill="#0b0b0d" />
        <path d="M165 121Q171 128 176 120Q183 126 187 119Q187 139 176 139Q166 139 165 121Z" fill="#f9b6cc" stroke="#0b0b0d" strokeWidth="6" strokeLinejoin="round" />
        <g className="garden-hug-waiting-paw">
          {hugPaw.map(layer => <path key={layer.d} d={layer.d} fill={layer.fill} />)}
        </g>
      </g></g>
    </svg>
    <svg className="garden-hug-embrace" viewBox="0 0 256 256" overflow="visible" focusable="false">
      <g transform="rotate(-14 128 128)" fillRule="evenodd">
        <g className="garden-hug-joined">
          {hugBody.map(layer => <path key={layer.d} d={layer.d} fill={layer.fill} />)}
          <g className="garden-hug-joined-paw">
            {hugPaw.map(layer => <path key={layer.d} d={layer.d} fill={layer.fill} />)}
          </g>
        </g>
      </g>
    </svg>
  </span>;
}

export function GardenDoodles({ arrangement }: { arrangement: keyof typeof arrangements }) {
  return (
    <div className="garden-doodles" data-arrangement={arrangement} aria-hidden="true">
      {arrangements[arrangement].map((id, index) => id === 'hugging-cats' ? <CatHug key={id} /> : (
        <svg key={id} viewBox="0 0 256 256" fill={colors[index]} overflow="visible" focusable="false">
          <use href={`${import.meta.env.BASE_URL}doodles.svg#${id}`} transform={`rotate(${rotations[index]} 128 128)`} />
        </svg>
      ))}
    </div>
  );
}
