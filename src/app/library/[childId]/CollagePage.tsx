import Image from "next/image";
import type { CSSProperties } from "react";
import { getCollageTemplate } from "@/lib/collage";

type Photo = { id: number; url: string; caption: string | null };

export function CollagePage({ photos }: { photos: Photo[] }) {
  const template = getCollageTemplate(photos.length);

  return (
    <div
      className="grid h-full w-full gap-2"
      style={
        {
          gridTemplateColumns: template.gridTemplateColumns,
          gridTemplateRows: template.gridTemplateRows,
          gridTemplateAreas: template.gridTemplateAreas,
        } as CSSProperties
      }
    >
      {photos.slice(0, template.areas.length).map((photo, i) => (
        <div key={photo.id} className="relative overflow-hidden rounded-lg bg-black/5" style={{ gridArea: template.areas[i] }}>
          {/* object-top since a vertical phone photo of a kid/pet almost always has the face
              near the top — plain center-crop on a wide tile chops the head off. */}
          <Image src={photo.url} alt={photo.caption ?? ""} fill sizes="50vw" className="object-cover object-top" />
        </div>
      ))}
    </div>
  );
}
