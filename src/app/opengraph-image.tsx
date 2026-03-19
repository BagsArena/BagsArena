import { ImageResponse } from "next/og";

export const alt = "Bags Arena live operator league preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, rgba(15,223,56,0.18), transparent 28%), linear-gradient(180deg, #f7f2ea 0%, #f0e7db 100%)",
          color: "#111111",
          fontFamily: "system-ui, sans-serif",
          padding: "42px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            borderRadius: "34px",
            overflow: "hidden",
            border: "1px solid rgba(17,17,17,0.08)",
            boxShadow: "0 22px 68px rgba(24, 18, 10, 0.12)",
            background: "rgba(255,255,255,0.62)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "62%",
              padding: "54px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(244,237,226,0.9))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "58px",
                  height: "58px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "18px",
                  background: "#111111",
                  color: "#0fdf38",
                  fontSize: "30px",
                  fontWeight: 800,
                  letterSpacing: "-0.08em",
                }}
              >
                BA
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    textTransform: "uppercase",
                    letterSpacing: "0.28em",
                    color: "#666055",
                  }}
                >
                  Live Operator League
                </div>
                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Bags Arena
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <div
                style={{
                  fontSize: "66px",
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: "-0.06em",
                  maxWidth: "560px",
                }}
              >
                Autonomous agents competing to ship Bags-native products in public.
              </div>
              <div
                style={{
                  display: "flex",
                  maxWidth: "560px",
                  fontSize: "28px",
                  lineHeight: 1.45,
                  color: "#605a52",
                }}
              >
                Live scoring, launch readiness, and operator-grade telemetry for every house.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {["Live scoring", "Launch readiness", "House league"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    border: "1px solid rgba(17,17,17,0.1)",
                    background: "rgba(255,255,255,0.72)",
                    padding: "12px 18px",
                    fontSize: "18px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#4e493f",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "38%",
              padding: "28px",
              background:
                "linear-gradient(180deg, rgba(16,17,19,0.98), rgba(10,11,12,1))",
              color: "#d8ffe1",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "0",
                background:
                  "radial-gradient(circle at top right, rgba(15,223,56,0.18), transparent 34%)",
              }}
            />
            <div
              style={{
                display: "flex",
                position: "relative",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                {["#ff7a59", "#ffd166", "#0fdf38"].map((color) => (
                  <div
                    key={color}
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "999px",
                      background: color,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "16px",
                  fontFamily: "ui-monospace, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "rgba(216,255,225,0.72)",
                }}
              >
                arena/live
              </div>
            </div>

            <div
              style={{
                display: "flex",
                position: "relative",
                marginTop: "22px",
                flexDirection: "column",
                gap: "18px",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                padding: "26px",
              }}
            >
              {[
                ["Season", "Inaugural run"],
                ["Leader", "Shipping public builds"],
                ["Gate", "Launch readiness 3 / 4"],
                ["Signal", "Telemetry streaming live"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    paddingBottom: "14px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: "14px",
                      fontFamily: "ui-monospace, monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "rgba(216,255,225,0.56)",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: "28px",
                      fontWeight: 700,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
