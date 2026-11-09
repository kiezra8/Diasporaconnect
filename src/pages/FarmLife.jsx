import React from 'react';

export default function FarmLife() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HEADER ─ */}
      <header className="page-header-clean">
        <span className="page-header-badge">Ground Level Footage</span>
        <h1 className="page-header-title">FARM <span>LIFE</span></h1>
        <p className="page-header-sub">Ground-level farm videos from our operational commercial dairy and agricultural acreage in Uganda.</p>
        <div className="page-header-divider" aria-hidden="true"></div>
      </header>

      {/* ─ GROUND LEVEL VIDEOS (AT THE FARM) ─ */}
      <main className="farmlife-container">
        <div className="farmlife-grid">

          {/* farmvideo4starting.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farmvideo4starting.mp4" type="video/mp4" />
            </video>
          </div>

          {/* farm video1.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farm video1.mp4" type="video/mp4" />
            </video>
          </div>

          {/* farmvideo2.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farmvideo2.mp4" type="video/mp4" />
            </video>
          </div>

          {/* farmvideo3.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farmvideo3.mp4" type="video/mp4" />
            </video>
          </div>

          {/* farm video5.mp4 */}
          <div className="farm-vid-card">
            <video className="farm-video" muted playsInline loop preload="metadata" controls>
              <source src="/videos/farm video5.mp4" type="video/mp4" />
            </video>
          </div>

        </div>
      </main>
    </div>
  );
}
