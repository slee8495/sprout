import fs from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Child } from "@/db/queries";
import { illustrationFilenameForAnimal } from "@/lib/animalIllustrations";
import { getCollageRects } from "@/lib/collage";
import { coverBackgroundHex } from "@/lib/covers";
import { formatEntryDate } from "@/lib/milestones";
import { CAPTION_HEIGHT_PT } from "@/lib/pdfLayout";
import type { PdfPageData } from "@/lib/pdfPhotos";

// react-pdf's <Image> only decodes JPEG/PNG, and only from a Buffer/base64/URL — a bare fs path
// string gets treated as a URL and fails on the server. Read the JPEG copy into a Buffer once per
// animal so the cover page and every month divider can reuse it without re-reading the file.
function loadIllustration(animal: string | null | undefined): Buffer | null {
  const filename = illustrationFilenameForAnimal(animal);
  if (!filename) return null;
  return fs.readFileSync(path.join(process.cwd(), "public", filename));
}

Font.register({
  family: "Playfair Display",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/PlayfairDisplay-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(process.cwd(), "public/fonts/PlayfairDisplay-Bold.ttf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  coverPage: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  coverTitle: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 40,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 12,
    color: "#6b6b6b",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverIllustrationWrap: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
  },
  coverIllustration: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  monthIllustrationWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
  },
  disclaimer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    width: "100%",
    textAlign: "center",
    fontSize: 7,
    color: "rgba(0,0,0,0.35)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  page: {
    padding: 24,
    flexDirection: "column",
  },
  rule: {
    width: 40,
    height: 1.5,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  captionRow: {
    height: CAPTION_HEIGHT_PT,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  captionDate: {
    fontSize: 7,
    color: "#8a8a8a",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  captionLabel: {
    fontFamily: "Playfair Display",
    fontWeight: 600,
    fontSize: 9,
    color: "#4a4a4a",
  },
  monthPage: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 14,
  },
  monthEyebrow: {
    fontSize: 10,
    color: "#5a5a5a",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  monthLabel: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 44,
    textAlign: "center",
  },
  collageArea: {
    position: "relative",
    width: "100%",
    flex: 1,
  },
  collageTile: {
    position: "absolute",
    borderRadius: 4,
  },
  collageImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

const GAP = 6;

function formatDateRange(dates: string[]) {
  const sorted = [...dates].sort();
  const first = formatEntryDate(sorted[0]);
  const last = formatEntryDate(sorted[sorted.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

export function AlbumPdfDocument({
  child,
  pages,
}: {
  child: Pick<Child, "name" | "coverBackground" | "coverAnimal">;
  pages: PdfPageData[];
}) {
  const dates = pages.flatMap((p) => p.dates).sort();
  const rangeLabel =
    dates.length > 0
      ? dates[0] === dates[dates.length - 1]
        ? formatEntryDate(dates[0])
        : `${formatEntryDate(dates[0])} – ${formatEntryDate(dates[dates.length - 1])}`
      : "";
  const coverColor = coverBackgroundHex(child.coverBackground, false);
  const illustration = loadIllustration(child.coverAnimal);

  return (
    <Document title={`${child.name}'s Album`}>
      <Page size="A4" orientation="landscape" style={[styles.coverPage, { backgroundColor: coverColor }]}>
        {illustration && (
          <View style={styles.coverIllustrationWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={illustration} style={styles.coverIllustration} />
          </View>
        )}
        <Text style={styles.coverTitle}>{child.name}</Text>
        {rangeLabel && <Text style={styles.coverSubtitle}>{rangeLabel}</Text>}
        {illustration && <Text style={styles.disclaimer}>AI-generated illustration</Text>}
      </Page>

      {pages.map((page, i) => {
        if (page.kind === "month") {
          return (
            <Page key={i} size="A4" orientation="landscape" style={[styles.page, { backgroundColor: coverColor }]}>
              <View style={styles.monthPage}>
                {illustration && (
                  <View style={styles.monthIllustrationWrap}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={illustration} style={styles.coverIllustration} />
                  </View>
                )}
                <Text style={styles.monthEyebrow}>{child.name}</Text>
                <View style={styles.rule} />
                <Text style={styles.monthLabel}>{page.label}</Text>
              </View>
              {illustration && <Text style={styles.disclaimer}>AI-generated illustration</Text>}
            </Page>
          );
        }

        return (
          <Page key={i} size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.captionRow}>
              <Text style={styles.captionDate}>{formatDateRange(page.dates)}</Text>
              {page.kind === "title" && <Text style={styles.captionLabel}>· {page.label}</Text>}
            </View>
            <View style={styles.collageArea}>
              {getCollageRects(page.photos.length).map((rect, idx) => {
                const photo = page.photos[idx];
                if (!photo) return null;
                return (
                  <View
                    key={photo.id}
                    style={[
                      styles.collageTile,
                      {
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.width * 100}%`,
                        height: `${rect.height * 100}%`,
                        padding: GAP / 2,
                      },
                    ]}
                  >
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={photo.buffer} style={styles.collageImage} />
                  </View>
                );
              })}
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
