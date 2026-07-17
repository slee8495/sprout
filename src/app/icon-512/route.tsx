import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 260,
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
    { width: 512, height: 512 },
  );
}
