import { FiCheckCircle, FiShield } from 'react-icons/fi';

const SHELL_UI = {
  bg: 'linear-gradient(135deg, #eef4ff 0%, #f8fbff 45%, #fffaf1 100%)',
  card: '#ffffff',
  border: '#dbe3ef',
  shadow: '0 30px 60px rgba(23, 32, 51, 0.12)',
};

const PANEL_VARIANTS = {
  login: 'linear-gradient(180deg, #163b8f 0%, #315efb 55%, #5d89ff 100%)',
  register: 'linear-gradient(180deg, #14544a 0%, #1f8f5f 52%, #4ebe8a 100%)',
};

const highlights = [
  'Create your account and start ordering inventory quickly.',
  'Use secure credentials and role-based access across the app.',
  'Keep your profile and shipping address ready for smooth ordering.',
];

export const authFieldStyle = {
  height: 52,
  borderRadius: 14,
  border: `1px solid ${SHELL_UI.border}`,
  background: '#fbfdff',
  paddingLeft: 44,
  fontSize: 14,
};

export const authPasswordButtonStyle = {
  width: 44,
  border: `1px solid ${SHELL_UI.border}`,
  borderLeft: 'none',
  borderRadius: '0 14px 14px 0',
  background: '#fbfdff',
  color: '#60708a',
};

export const authInputIconStyle = {
  minWidth: 40,
  justifyContent: 'center',
  borderRadius: '14px 0 0 14px',
  borderColor: SHELL_UI.border,
  background: '#fbfdff',
  color: '#60708a',
};

export default function AuthShell({ children, variant = 'register' }) {
  const panelBackground = PANEL_VARIANTS[variant] || PANEL_VARIANTS.register;

  return (
    <div className="d-flex flex-grow-1 align-items-center justify-content-center px-3 py-4" style={{ background: SHELL_UI.bg }}>
      <div
        className="w-100 overflow-hidden"
        style={{
          maxWidth: 840,
          background: SHELL_UI.card,
          border: `1px solid ${SHELL_UI.border}`,
          borderRadius: 20,
          boxShadow: SHELL_UI.shadow,
        }}
      >
        <div className="row g-0">
          <div className="col-lg-5 d-none d-lg-flex">
            <div className="h-100 w-100 p-3 text-white" style={{ background: panelBackground }}>
              <div
                className="mb-4 d-inline-flex align-items-center"
                style={{
                  borderRadius: 999,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Inventory MS
              </div>

              <h2 className="fw-semibold mb-3" style={{ fontSize: 24, lineHeight: 1.2 }}>
                Create an account and get started faster.
              </h2>
              <p className="mb-4" style={{ color: 'rgba(255,255,255,0.84)', fontSize: 13 }}>
                Join the platform to place orders, manage your profile, and work with a cleaner inventory experience.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="d-flex align-items-start gap-3"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.16)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FiCheckCircle size={16} />
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>{item}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 14,
                  padding: 12,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.16)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiShield size={18} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Secure and role-based</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12 }}>
                  Your account data and permissions stay aligned with your role in the system.
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="p-3 p-md-4">
              <div style={{ maxWidth: 470 }}>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
