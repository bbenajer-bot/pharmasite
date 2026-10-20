/** The logo's rounded cross (same path as `Logo`), cropped to the cross, for generated images. */
export function BrandCross({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="7.5 8.5 17 17">
      <path
        d="M13.5 8.5h5a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4h-4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4v-4a1 1 0 0 1 1-1Z"
        fill={color}
      />
    </svg>
  )
}
