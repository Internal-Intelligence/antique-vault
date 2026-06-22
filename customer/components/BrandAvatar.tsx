import Image from "next/image";
import Link from "next/link";

/** Swap this path when you drop a custom PNG/JPG into /public */
export const NFTBAY_AVATAR_SRC = "/nftbay-avatar.svg";

type Props = {
  size?: number;
  href?: string;
  active?: boolean;
  title?: string;
  className?: string;
};

export function BrandAvatar({ size = 36, href, active, title = "NFTBAY", className = "" }: Props) {
  const inner = (
    <span
      className={`brand-avatar ${active ? "brand-avatar--active" : ""} ${className}`.trim()}
      style={{ width: size, height: size }}
      title={title}
    >
      <Image
        src={NFTBAY_AVATAR_SRC}
        alt={title}
        width={size}
        height={size}
        className="brand-avatar__img"
        priority
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="brand-avatar-link" aria-label="Open profile">
        {inner}
      </Link>
    );
  }

  return inner;
}