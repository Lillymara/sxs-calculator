// What's worth buying in the in-game shop. Content lives in src/data/spending.ts.
import { CHECKLIST, DEALS, TIERS, TIPS, type Tier } from "../../data/spending";

const ORDER: Tier[] = ["best", "good", "situational", "skip"];

export function SpendingPage() {
  return (
    <div className="tool spending">
      <section className="card honest-answer">
        <span className="salt" aria-hidden>🧂</span>
        <div>
          <p className="eyebrow">Read this first</p>
          <h2>The honest answer to "Is this worth it?"</h2>
          <p>
            <strong>No.</strong> Nothing in the shop is truly <em>worth</em> it. Sword x Staff is fully playable and fun without spending a
            cent. Most players won't still be playing three to six months from now, so whatever you buy may not matter for long.
          </p>
          <p>
            Gacha games are built around the same reward loops as slot machines, designed to make spending feel good. So take this guide,
            and any spending guide, with a grain of salt.
          </p>
          <p className="honest-next">If you do decide to spend, here's how to get the most for your money.</p>
        </div>
      </section>

      <p className="hint spending-fine-print">
        Community advice, not official. Pack contents and prices change and vary by region, so always check what's inside before you buy.
      </p>

      {ORDER.map((tier) => {
        const deals = DEALS.filter((d) => d.tier === tier);
        if (!deals.length) return null;
        return (
          <section key={tier} className={`card tier-card tier-${tier}`}>
            <div className="tier-head">
              <span className={`tier-badge tier-${tier}`}>{TIERS[tier].label}</span>
              <span className="hint">{TIERS[tier].blurb}</span>
            </div>
            <div className="deal-grid">
              {deals.map((d) => (
                <article key={d.name} className="deal">
                  <h3>{d.name}</h3>
                  <p className="deal-verdict">{d.verdict}</p>
                  <ul>
                    {d.why.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                  {d.bestFor && <p className="hint"><b>Best for:</b> {d.bestFor}</p>}
                  {d.link && <p className="hint deal-link"><a href={d.link.href}>{d.link.label} →</a></p>}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <div className="tool-grid spending-extras">
        <section className="card">
          <h2 className="subhead">Before you buy anything</h2>
          <ol className="buy-check">
            {CHECKLIST.map((q) => <li key={q}>{q}</li>)}
          </ol>
        </section>
        <section className="card">
          <h2 className="subhead">Tips</h2>
          <ul className="buy-check">
            {TIPS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
