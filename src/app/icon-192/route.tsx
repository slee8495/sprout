import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: "#047857",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🌱
      </div>
    ),
    { width: 192, height: 192 },
  );
}
