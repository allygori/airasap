import { createElement } from "react";
import { IconSvgObject } from "@/types/icon";


type HugeIconProps = {
  icon: IconSvgObject;
  className?: string;
  size?: number;
}

export const HugeiconsIcon = ({
  icon,
  className,
  size = 24,
}: HugeIconProps) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.map(([tag, attrs], index) => {
        const iconKey = attrs.key;
        const { key, ...safeAttrs } = attrs;
        void key;

        return createElement(tag, {
          ...safeAttrs,
          key: String(iconKey ?? index),
        });
      })}
    </svg>
  );
}

export default HugeiconsIcon