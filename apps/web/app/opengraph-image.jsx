import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0f14',
          color: '#f8fafc',
          fontFamily: 'Arial, sans-serif',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background:
              'radial-gradient(circle at 20% 18%, rgba(255, 132, 0, 0.18), transparent 20%), radial-gradient(circle at 82% 78%, rgba(255, 180, 92, 0.12), transparent 18%)'
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            zIndex: 1
          }}
        >
          <div
            style={{
              width: '260px',
              height: '260px',
              borderRadius: '58px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #ff9b2f 0%, #ff7a00 55%, #ff5a36 100%)',
              boxShadow: '0 28px 80px rgba(255, 122, 0, 0.35)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 0.88,
                letterSpacing: '-0.06em'
              }}
            >
              <span style={{ display: 'flex', fontSize: '60px' }}>review</span>
              <span style={{ display: 'flex', fontSize: '86px' }}>KOK</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '64px',
                fontWeight: 800,
                letterSpacing: '-0.05em',
                color: '#f8fafc'
              }}
            >
              reviewkok
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                color: '#fbbf24',
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              choose the experience that fits you best
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
