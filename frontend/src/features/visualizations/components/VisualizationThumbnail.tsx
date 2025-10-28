import VisualizationThumbnailNone from "../../../assets/visualization-thumbnails/Property_none.svg?react";
import VisualizationThumbnail1 from "../../../assets/visualization-thumbnails/Property_1.svg?react";
import VisualizationThumbnail2 from "../../../assets/visualization-thumbnails/Property_2.svg?react";
import VisualizationThumbnail3 from "../../../assets/visualization-thumbnails/Property_3.svg?react";
import VisualizationThumbnail4 from "../../../assets/visualization-thumbnails/Property_4.svg?react";
import VisualizationThumbnail5 from "../../../assets/visualization-thumbnails/Property_5.svg?react";
import VisualizationThumbnail6 from "../../../assets/visualization-thumbnails/Property_6.svg?react";
import VisualizationThumbnail7 from "../../../assets/visualization-thumbnails/Property_7.svg?react";
import VisualizationThumbnailMany from "../../../assets/visualization-thumbnails/Property_many.svg?react";

const sharedProps = {
  height: 65,
  width: 65,
};

function VisualizationThumbnailImage({ nTracks }: { nTracks: number | null }) {
  if (nTracks === null) {
    return VisualizationThumbnailNone;
  }
  if (nTracks === 0) {
    return VisualizationThumbnailNone;
  }
  if (nTracks === 1) {
    return VisualizationThumbnail1;
  }
  if (nTracks === 2) {
    return VisualizationThumbnail2;
  }
  if (nTracks === 3) {
    return VisualizationThumbnail3;
  }
  if (nTracks === 4) {
    return VisualizationThumbnail4;
  }
  if (nTracks === 5) {
    return VisualizationThumbnail5;
  }
  if (nTracks === 6) {
    return VisualizationThumbnail6;
  }
  if (nTracks === 7) {
    return VisualizationThumbnail7;
  }
  if (nTracks > 7) {
    return VisualizationThumbnailMany;
  }

  return VisualizationThumbnailNone;
}

export default function VisualizationThumbnail({
  nTracks,
}: {
  nTracks: number | null;
}) {
  const Image = VisualizationThumbnailImage({ nTracks });

  return <Image {...sharedProps} />;
}
