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
          background: '#0f1115',
          color: '#f8fafc',
          fontFamily: 'Arial, sans-serif',
          padding: '48px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '36px',
            background: 'radial-gradient(circle at top left, rgba(123, 97, 255, 0.28), transparent 28%), linear-gradient(135deg, #151821 0%, #11141c 55%, #171320 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            padding: '44px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '70%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '132px',
                  height: '132px',
                  borderRadius: '28px',
                  background: 'linear-gradient(135deg, #6f7ff8, #8b5cf6)',
                  boxShadow: '0 16px 40px rgba(111, 127, 248, 0.35)',
                  fontSize: '54px',
                  fontWeight: 800,
                  letterSpacing: '-0.05em'
                }}
              >
                RK
              </div>
              <div style={{ display: 'flex', color: '#a5b4fc', fontSize: '24px', fontWeight: 700 }}>
                reviewkok
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                fontSize: '22px',
                fontWeight: 700
              }}
            >
              campaign finder
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '78%' }}>
            <div
              style={{
                display: 'flex',
                color: '#e2e8f0',
                fontSize: '66px',
                lineHeight: 1.08,
                letterSpacing: '-0.06em',
                fontWeight: 800,
                flexDirection: 'column'
              }}
            >
              <span style={{ display: 'flex' }}>find better campaigns</span>
              <span style={{ display: 'flex' }}>for your next experience</span>
            </div>
            <div
              style={{
                display: 'flex',
                color: '#94a3b8',
                fontSize: '28px',
                lineHeight: 1.45
              }}
            >
              compare benefits, deadlines, and locations quickly
              <br />
              before you move to the original campaign page.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
