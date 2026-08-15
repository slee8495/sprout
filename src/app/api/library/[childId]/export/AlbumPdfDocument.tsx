import fs from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Child } from "@/db/queries";
import { illustrationFilenameForAnimal } from "@/lib/animalIllustrations";
import { getCollageRects } from "@/lib/collage";
import { coverBackgroundHex } from "@/lib/covers";
import { decorationForMonth, type DecorativeCorner, type DecorativeSize } from "@/lib/decorativeIllustrations";
import { formatEntryDate } from "@/lib/milestones";
import { CAPTION_HEIGHT_PT } from "@/lib/pdfLayout";
import type { PdfPageData } from "@/lib/pdfPhotos";

const MEDALLION_PT: Record<DecorativeSize, number> = { sm: 72, md: 96, lg: 128 };
const CORNER_PT: Record<DecorativeSize, number> = { sm: 100, md: 140, lg: 180 };
const FRAME_PT: Record<DecorativeSize, number> = { sm: 130, md: 170, lg: 210 };
const SIDE_WIDTH_PCT: Record<DecorativeSize, number> = { sm: 32, md: 40, lg: 50 };
const CORNER_POSITION: Record<DecorativeCorner, { top?: number; bottom?: number; left?: number; right?: number }> = {
  tl: { top: 16, left: 16 },
  tr: { top: 16, right: 16 },
  bl: { bottom: 16, left: 16 },
  br: { bottom: 16, right: 16 },
};

// react-pdf's <Image> only decodes JPEG/PNG, and only from a Buffer/base64/URL — a bare fs path
// string gets treated as a URL and fails on the server. Read the JPEG copy into a Buffer once per
// animal so the cover page and every month divider can reuse it without re-reading the file.
function loadIllustration(animal: string | null | undefined): Buffer | null {
  const filename = illustrationFilenameForAnimal(animal);
  if (!filename) return null;
  return fs.readFileSync(path.join(process.cwd(), "public", filename));
}

const decorationBufferCache = new Map<string, Buffer>();
function loadDecorationBuffer(pdfFilename: string): Buffer {
  const cached = decorationBufferCache.get(pdfFilename);
  if (cached) return cached;
  const buffer = fs.readFileSync(path.join(process.cwd(), "public", pdfFilename));
  decorationBufferCache.set(pdfFilename, buffer);
  return buffer;
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
  monthLabelSmall: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 32,
    textAlign: "center",
  },
  sideWrap: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  sideImageWrap: {
    width: "40%",
    height: "100%",
  },
  sideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  sideTextWrap: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  backdropWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  backdropImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  backdropCaption: {
    position: "absolute",
    bottom: 24,
    left: 0,
    width: "100%",
    alignItems: "center",
  },
  backdropCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cornerPage: {
    position: "relative",
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  cornerImageWrap: {
    position: "absolute",
    borderRadius: 16,
    overflow: "hidden",
  },
  cornerImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  framePhotoOuter: {
    backgroundColor: "#ffffff",
    padding: 6,
    borderRadius: 6,
  },
  framePhotoInner: {
    borderRadius: 3,
    overflow: "hidden",
  },
  frameImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
        {/* Disclosed once here for the whole album — not repeated on every month page. */}
        <Text style={styles.disclaimer}>All illustrations used in this app are AI-generated.</Text>
      </Page>

      {pages.map((page, i) => {
        if (page.kind === "month") {
          const decoration = decorationForMonth(page.dates[0].slice(0, 7));
          const decorationBuffer = loadDecorationBuffer(decoration.pdfFilename);
          const monthColor = coverBackgroundHex(decoration.background, false);

          if (decoration.variant === "backdrop") {
            return (
              <Page key={i} size="A4" orientation="landscape" style={styles.backdropWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={decorationBuffer} style={styles.backdropImage} />
                <View style={[styles.backdropCaption, decoration.flip ? { bottom: undefined, top: 24 } : {}]}>
                  <View style={styles.backdropCard}>
                    <Text style={styles.monthLabelSmall}>{page.label}</Text>
                  </View>
                </View>
              </Page>
            );
          }

          if (decoration.variant === "side") {
            const widthPct = SIDE_WIDTH_PCT[decoration.size];
            const imageFirst = !decoration.flip;
            const imageView = (
              <View key="image" style={[styles.sideImageWrap, { width: `${widthPct}%` }]}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={decorationBuffer} style={styles.sideImage} />
              </View>
            );
            const textView = (
              <View key="text" style={styles.sideTextWrap}>
                <View style={styles.rule} />
                <Text style={styles.monthLabelSmall}>{page.label}</Text>
              </View>
            );
            return (
              <Page key={i} size="A4" orientation="landscape" style={[styles.page, { padding: 0, backgroundColor: monthColor }]}>
                <View style={styles.sideWrap}>{imageFirst ? [imageView, textView] : [textView, imageView]}</View>
              </Page>
            );
          }

          if (decoration.variant === "corner") {
            const px = CORNER_PT[decoration.size];
            return (
              <Page key={i} size="A4" orientation="landscape" style={[styles.page, { backgroundColor: monthColor }]}>
                <View style={styles.cornerPage}>
                  <View style={[styles.cornerImageWrap, { width: px, height: px, ...CORNER_POSITION[decoration.corner] }]}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={decorationBuffer} style={styles.cornerImage} />
                  </View>
                  <View style={styles.rule} />
                  <Text style={styles.monthLabel}>{page.label}</Text>
                </View>
              </Page>
            );
          }

          if (decoration.variant === "frame") {
            const px = FRAME_PT[decoration.size];
            return (
              <Page key={i} size="A4" orientation="landscape" style={[styles.page, { backgroundColor: monthColor }]}>
                <View style={styles.monthPage}>
                  <View style={styles.framePhotoOuter}>
                    <View style={[styles.framePhotoInner, { width: px, height: px }]}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image src={decorationBuffer} style={styles.frameImage} />
                    </View>
                  </View>
                  <Text style={styles.monthLabelSmall}>{page.label}</Text>
                </View>
              </Page>
            );
          }

          const medallionPt = MEDALLION_PT[decoration.size];
          return (
            <Page key={i} size="A4" orientation="landscape" style={[styles.page, { backgroundColor: monthColor }]}>
              <View style={styles.monthPage}>
                <View style={[styles.monthIllustrationWrap, { width: medallionPt, height: medallionPt, borderRadius: medallionPt / 2 }]}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={decorationBuffer} style={styles.coverIllustration} />
                </View>
                <Text style={styles.monthEyebrow}>{child.name}</Text>
                <View style={styles.rule} />
                <Text style={styles.monthLabel}>{page.label}</Text>
              </View>
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
