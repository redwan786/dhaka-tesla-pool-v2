export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="status-pill">STEP 01 · PROJECT FOUNDATION</div>
      <section className="hero-card">
        <p className="eyebrow">DHAKA TESLA POOL</p>
        <h1>Share a seat.<br /><span>Split the fare.</span></h1>
        <p className="intro">
          A production-minded ride-pooling MVP for Dhaka traffic. The passenger,
          driver, pool, fare, and lifecycle flows will be added incrementally.
        </p>
        <div className="story-cast">
          <div><strong>Passenger</strong><span>Nusrat · Rafiq · Shirin</span></div>
          <div><strong>Driver / Tesla</strong><span>Jashim · Bullet · 3 seats</span></div>
          <div><strong>Current layer</strong><span>Next.js + Express foundation</span></div>
        </div>
      </section>
      <footer>Architecture first · Build carefully · Explain everything</footer>
    </main>
  );
}
