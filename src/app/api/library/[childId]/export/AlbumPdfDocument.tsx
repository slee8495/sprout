import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Child } from "@/db/queries";
import { getCollageRects } from "@/lib/collage";
import { coverBackgroundHex } from "@/lib/covers";
import { formatEntryDate } from "@/lib/milestones";
import type { PdfPageData } from "@/lib/pdfPhotos";

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
  page: {
    padding: 24,
  },
  titlePage: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 14,
  },
  titleDate: {
    fontSize: 10,
    color: "#8a8a8a",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  titleLabel: {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize: 32,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  titlePhotoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  titlePhoto: {
    width: 90,
    height: 90,
    borderRadius: 6,
    objectFit: "cover",
  },
  collageArea: {
    position: "relative",
    width: "100%",
    height: "100%",
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

export function AlbumPdfDocument({
  child,
  pages,
  orientation,
}: {
  child: Pick<Child, "name" | "coverBackground">;
  pages: PdfPageData[];
  orientation: "portrait" | "landscape";
}) {
  const dates = pages.flatMap((p) => p.dates).sort();
  const rangeLabel =
    dates.length > 0
      ? dates[0] === dates[dates.length - 1]
        ? formatEntryDate(dates[0])
        : `${formatEntryDate(dates[0])} – ${formatEntryDate(dates[dates.length - 1])}`
      : "";
  const coverColor = coverBackgroundHex(child.coverBackground, false);

  return (
    <Document title={`${child.name}'s Album`}>
      <Page size="A4" orientation={orientation} style={[styles.coverPage, { backgroundColor: coverColor }]}>
        <Text style={styles.coverTitle}>{child.name}</Text>
        {rangeLabel && <Text style={styles.coverSubtitle}>{rangeLabel}</Text>}
      </Page>

      {pages.map((page, i) => (
        <Page key={i} size="A4" orientation={orientation} style={styles.page}>
          {page.kind === "title" ? (
            <View style={styles.titlePage}>
              <Text style={styles.titleDate}>{formatEntryDate(page.dates[0])}</Text>
              <Text style={styles.titleLabel}>{page.label}</Text>
              {page.photos.length > 0 && (
                <View style={styles.titlePhotoRow}>
                  {page.photos.map((photo) => (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image key={photo.id} src={photo.buffer} style={styles.titlePhoto} />
                  ))}
                </View>
              )}
            </View>
          ) : (
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
          )}
        </Page>
      ))}
    </Document>
  );
}
