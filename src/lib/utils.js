import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names, with later Tailwind utilities winning over
 * earlier ones for the same property.
 *
 * Required by the shadcn registry components, which are written against this
 * helper.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
