/** A cartoon goat with googly eyes and its tongue out, for impossible planner inputs. */
export function SillyGoat({ className }: { className?: string }) {
  const ink = "#3b2f2f";
  return (
    <svg className={className} viewBox="0 0 240 240" role="img" aria-label="A silly cartoon goat sticking its tongue out">
      <circle cx="120" cy="120" r="116" fill="#fde9a8" />
      <circle cx="120" cy="120" r="116" fill="none" stroke="#f7c948" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
      <g transform="rotate(-9 120 128)">
        {/* Horns */}
        <path d="M96 76 C84 34 48 30 46 60 C45 72 54 78 62 74" fill="none" stroke="#b98c4e" strokeWidth="13" strokeLinecap="round" />
        <path d="M144 76 C156 34 192 30 194 60 C195 72 186 78 178 74" fill="none" stroke="#b98c4e" strokeWidth="13" strokeLinecap="round" />
        <path d="M90 58 l8 -3 M86 46 l9 -2 M150 58 l-8 -3 M154 46 l-9 -2" stroke="#8f6a37" strokeWidth="3" strokeLinecap="round" />
        {/* Ears: one perky, one flopped */}
        <ellipse cx="58" cy="108" rx="32" ry="13" transform="rotate(-18 58 108)" fill="#f8f4ec" stroke={ink} strokeWidth="4" />
        <ellipse cx="60" cy="108" rx="20" ry="6" transform="rotate(-18 60 108)" fill="#f4b6c2" />
        <ellipse cx="184" cy="122" rx="32" ry="13" transform="rotate(48 184 122)" fill="#f8f4ec" stroke={ink} strokeWidth="4" />
        <ellipse cx="182" cy="121" rx="20" ry="6" transform="rotate(48 182 121)" fill="#f4b6c2" />
        {/* Beard */}
        <path d="M104 186 C106 214 118 226 121 230 C124 220 136 210 138 186 Z" fill="#e9dfcf" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
        {/* Head */}
        <path d="M120 64 C160 64 176 96 174 132 C172 170 152 194 120 194 C88 194 68 170 66 132 C64 96 80 64 120 64 Z" fill="#f8f4ec" stroke={ink} strokeWidth="4" />
        {/* Hair tuft */}
        <path d="M104 72 C102 56 114 52 116 64 C118 50 132 52 128 66 C136 58 144 66 136 74" fill="#f8f4ec" stroke={ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Googly eyes, pointing different ways */}
        <circle cx="96" cy="114" r="18" fill="#fff" stroke={ink} strokeWidth="4" />
        <rect x="84" y="101" width="17" height="8" rx="4" fill={ink} transform="rotate(-20 92 105)" />
        <circle cx="147" cy="108" r="23" fill="#fff" stroke={ink} strokeWidth="4" />
        <rect x="148" y="114" width="19" height="9" rx="4.5" fill={ink} transform="rotate(15 157 118)" />
        <circle cx="152" cy="117" r="2.5" fill="#fff" />
        {/* Snout */}
        <ellipse cx="120" cy="158" rx="36" ry="25" fill="#f3c9c0" stroke={ink} strokeWidth="4" />
        <ellipse cx="108" cy="150" rx="4.5" ry="6" fill={ink} transform="rotate(-20 108 150)" />
        <ellipse cx="132" cy="150" rx="4.5" ry="6" fill={ink} transform="rotate(20 132 150)" />
        {/* Grin with the tongue hanging out */}
        <path d="M100 166 C110 178 130 178 142 164" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        <path d="M122 173 C122 192 140 196 142 184 C143 177 138 172 136 170 Z" fill="#ff7a9a" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M131 176 L134 187" stroke="#d94f73" strokeWidth="2.5" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="80" cy="146" rx="9" ry="5" fill="#f4a3b4" opacity="0.7" />
        <ellipse cx="162" cy="142" rx="9" ry="5" fill="#f4a3b4" opacity="0.7" />
      </g>
    </svg>
  );
}

/** Shown in place of the results when some inputs can't happen in the game. */
export function GoatCard({ messages, outlined }: { messages: string[]; outlined: boolean }) {
  return (
    <section className="card results goat-card" aria-live="polite">
      <SillyGoat className="silly-goat" />
      <p className="eyebrow">Hold on</p>
      <h2 className="goat-title">You silly goat! 🐐</h2>
      <p>
        {messages.length === 1 ? "This number can't" : "These numbers can't"} happen in the game, so the planner can't work out a
        real plan:
      </p>
      <ul className="goat-reasons">
        {messages.map((m) => <li key={m}>{m}</li>)}
      </ul>
      <p className="hint">
        Fix {messages.length === 1 ? "it" : "them"} and your plan comes right back.
        {outlined && " Problem levels in the upgrade tables are outlined in red."}
      </p>
    </section>
  );
}
