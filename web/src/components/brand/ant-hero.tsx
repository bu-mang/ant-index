import Image from "next/image";
import { getAntMood, ANT_MOOD_IMAGES, ANT_MOOD_LABELS } from "@/lib/constants";

interface AntHeroProps {
  sb: number;
  gazua: number;
  size?: number;
}

export function AntHero({ sb, gazua, size = 320 }: AntHeroProps) {
  const mood = getAntMood(sb, gazua);

  return (
    <Image
      src={ANT_MOOD_IMAGES[mood]}
      alt={ANT_MOOD_LABELS[mood]}
      width={size}
      height={size}
      priority
    />
  );
}
