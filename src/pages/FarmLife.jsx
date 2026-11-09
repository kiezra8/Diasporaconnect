import React from 'react';

export default function FarmLife() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HERO ─ */}
      <header className="page-hero">
        <span className="page-hero-label">Ground Level</span>
        <h1 className="page-hero-title">FARM <span>LIFE</span></h1>
        <p className="page-hero-sub">Real land. Real produce. Real returns — see what your investment looks like on the ground.</p>
      </header>

      {/* ─ GROUND LEVEL VIDEOS (AT THE FARM) ─ */}
      <main className="farmlife-container">
        <div className="farmlife-grid">

          {/* farmvideo4starting.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farmvideo4starting.mp4" type="video/mp4" />
            </video>
            <div className="farm-vid-label">
              <span>The Farm</span>
              <p>Where it all begins</p>
            </div>
          </div>

          {/* farm video1.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farm video1.mp4" type="video/mp4" />
            </video>
            <div className="farm-vid-label">
              <span>Growing Strong</span>
              <p>Crops in full season</p>
            </div>
          </div>

          {/* farmvideo2.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farmvideo2.mp4" type="video/mp4" />
            </video>
            <div className="farm-vid-label">
              <span>Daily Operations</span>
              <p>Hands-on farm management</p>
            </div>
          </div>

          {/* farmvideo3.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farmvideo3.mp4" type="video/mp4" />
            </video>
            <div className="farm-vid-label">
              <span>Harvest Season</span>
              <p>The reward of patience</p>
            </div>
          </div>

          {/* farm video5.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farm video5.mp4" type="video/mp4" />
            </video>
            <div className="farm-vid-label">
              <span>Fertile Land</span>
              <p>Uganda's greatest asset</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

