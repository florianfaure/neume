import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "title" | "width" | "height" | "viewBox"> {
  /** Any number; snapped down to a multiple of 4 between 12 and 64. Default 24. */
  size?: number;
  /** Accessible name. Without it the icon is decorative (`aria-hidden`). */
  title?: string;
}
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

export function createIcon(
  name: string,
  grand: [ox: number, oy: number, hex: string],
  petit?: [ox: number, oy: number, hex: string],
): Icon;
