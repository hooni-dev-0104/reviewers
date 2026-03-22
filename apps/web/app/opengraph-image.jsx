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
              'radial-gradient(circle at 20% 18%, rgba(111, 127, 248, 0.22), transparent 22%), radial-gradient(circle at 82% 78%, rgba(168, 85, 247, 0.16), transparent 18%)'
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '28px',
            zIndex: 1
          }}
        >
          <div
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #5b6cff 0%, #7c3aed 52%, #d946ef 100%)',
              boxShadow: '0 28px 80px rgba(109, 79, 255, 0.45)',
              border: '1px solid rgba(255,255,255,0.14)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '78px',
                lineHeight: 0.9,
                letterSpacing: '-0.08em',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              <span style={{ display: 'flex' }}>RE</span>
              <span style={{ display: 'flex' }}>KO</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
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
                color: '#a5b4fc',
                fontWeight: 600,
                letterSpacing: '-0.02em'
              }}
            >
              campaign finder
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
