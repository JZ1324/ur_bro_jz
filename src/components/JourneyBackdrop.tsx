/** Quiet chapter scenery, behind the 3D stage and outside the reading column. */
export function JourneyBackdrop() {
  return <div className="journey-atmosphere" aria-hidden="true">
    <div className="atmosphere-wash" />
    <div className="garden-weather-wash" />
    <div className="atmosphere-art">
      <svg className="atmosphere-layer" data-atmosphere="opening" viewBox="0 0 900 700" />
      <svg className="atmosphere-layer" data-atmosphere="about" viewBox="0 0 900 700">
        <circle cx="470" cy="330" r="248" fill="currentColor" opacity=".055" />
        <g fill="none" stroke="currentColor" opacity=".17">
          <path d="M140 400C85 175 280 55 485 70S830 225 788 423" />
          <path d="M125 438C70 230 245 98 395 90" />
          <path d="M646 590Q769 567 800 471" />
        </g>
        <g fill="currentColor" opacity=".18">
          {[[170, 230, -30], [706, 166, 40], [773, 384, -15], [250, 529, 65], [667, 550, 20]].map(([x, y, rotation]) =>
            <path key={x} d="M0 0Q25-27 38-3Q21 13 0 0" transform={`translate(${x} ${y}) rotate(${rotation})`} />)}
        </g>
      </svg>
      <svg className="atmosphere-layer" data-atmosphere="projects" viewBox="0 0 900 700">
        <defs>
          <pattern id="journey-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth=".8" /></pattern>
          <radialGradient id="journey-grid-fade"><stop offset=".4" stopColor="white" /><stop offset="1" stopColor="black" /></radialGradient>
          <mask id="journey-grid-mask"><ellipse cx="450" cy="345" rx="420" ry="330" fill="url(#journey-grid-fade)" /></mask>
        </defs>
        <rect width="900" height="700" fill="url(#journey-grid)" mask="url(#journey-grid-mask)" opacity=".36" />
        <g fill="none" stroke="currentColor" opacity=".25">
          <path d="M180 210V148H244M661 148H725V210M725 485V548H661M244 548H180V485" strokeWidth="1.4" />
          <path d="M158 349H202M180 327V371M703 349H747M725 327V371" />
          <path d="M275 126H630M275 120V132M630 120V132" strokeDasharray="3 6" />
        </g>
      </svg>
      <svg className="atmosphere-layer" data-atmosphere="school" viewBox="0 0 900 700">
        <g transform="rotate(-6 450 350)">
          <path d="M152 89H698L762 155V612H152Z" fill="currentColor" opacity=".025" />
          <g stroke="currentColor" opacity=".17" fill="none">
            {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M145 ${136 + i * 49}H765`} />)}
            <path d="M217 90V612" strokeWidth="1.4" />
            <path d="M698 89V155H762" />
          </g>
          <path d="M698 89L762 155H698Z" fill="currentColor" opacity=".07" />
        </g>
      </svg>
      <svg className="atmosphere-layer" data-atmosphere="music" viewBox="0 0 900 700">
        <circle cx="450" cy="342" r="255" fill="currentColor" opacity=".045" />
        <g fill="none" stroke="currentColor" opacity=".20">
          {[174, 205, 237, 270, 304].map(radius => <circle key={radius} cx="450" cy="342" r={radius} />)}
        </g>
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".28">
          {[18, 36, 58, 83, 58, 36, 18].map((height, i) => <path key={i} d={`M${97 + i * 12} ${342 - height / 2}v${height}`} />)}
          {[18, 36, 58, 83, 58, 36, 18].map((height, i) => <path key={i} d={`M${731 + i * 12} ${342 - height / 2}v${height}`} />)}
        </g>
      </svg>
      <svg className="atmosphere-layer" data-atmosphere="memories" viewBox="0 0 900 700">
        <g transform="rotate(-7 450 350)">
          <path d="M160 87H744V631H160Z" fill="currentColor" opacity=".035" />
          <g fill="none" stroke="currentColor" opacity=".22">
            <path d="M160 87H744V631H160Z" />
            <path d="M187 115H717V559H187Z" />
            <path d="M131 108V59H182M722 59H772V108M772 611V661H722M182 661H131V611" />
            <path d="M217 593H334M356 593H402" strokeWidth="2" />
          </g>
        </g>
      </svg>
      <svg className="atmosphere-layer" data-atmosphere="contact" viewBox="0 0 900 700">
        <g transform="rotate(-8 450 350)" fill="none" stroke="currentColor" opacity=".20">
          <path d="M136 166H772V571H136ZM136 166L454 374L772 166M136 571L359 312M772 571L548 313" />
          <path d="M187 487H307M187 506H278" />
          <rect x="663" y="188" width="75" height="92" rx="2" strokeDasharray="3 5" />
        </g>
        <g fill="none" stroke="currentColor" opacity=".20">
          <circle cx="720" cy="130" r="68" /><circle cx="720" cy="130" r="58" />
          {[0, 15, 30].map(offset => <path key={offset} d={`M509 ${107 + offset}q36-20 71 0t71 0`} />)}
        </g>
      </svg>
    </div>
  </div>;
}
