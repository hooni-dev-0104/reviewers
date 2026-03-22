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
          background: 'linear-gradient(135deg, #f8fbff 0%, #eef2ff 45%, #f7f1ff 100%)',
          color: '#182538',
          fontFamily: 'Arial, sans-serif',
          padding: '52px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            borderRadius: '36px',
            background: '#ffffff',
            border: '1px solid #d9e1ec',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: '46%',
              height: '100%',
              display: 'flex',
              background:
                'radial-gradient(circle at top left, rgba(111, 127, 248, 0.22), transparent 30%), linear-gradient(135deg, #eaf0ff, #f6fbff 65%, #eefaf6)',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              padding: '34px'
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  padding: '12px 18px',
                  borderRadius: '999px',
                  background: '#ffffff',
                  border: '1px solid #dbe4f2',
                  fontSize: '24px',
                  fontWeight: 700
                }}
              >
                reviewkok
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: '12px 18px',
                  borderRadius: '999px',
                  background: '#eef2ff',
                  border: '1px solid #d7ddfb',
                  color: '#5564d8',
                  fontSize: '24px',
                  fontWeight: 700
                }}
              >
                campaign finder
              </div>
            </div>
          </div>
          <div
            style={{
              width: '54%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '48px 54px'
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#5f74a4',
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '18px'
              }}
            >
              Choose your next experience faster
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: '60px',
                lineHeight: 1.08,
                letterSpacing: '-0.05em',
                fontWeight: 800
              }}
            >
              <span style={{ display: 'flex' }}>Find matching campaigns</span>
              <span style={{ display: 'flex' }}>faster with reviewkok</span>
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: '28px',
                color: '#61748f',
                fontSize: '27px',
                lineHeight: 1.45
              }}
            >
              Browse more campaigns simply and
              <br />
              pick the experiences that fit you best.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
