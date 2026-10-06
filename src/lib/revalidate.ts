import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Clear cached data after an admin edit. Throws outside a Next.js request (e.g. CLI scripts,
 * migrations), where there is nothing to refresh, so that case is ignored.
 */
export function refreshCache(tags: string[], paths: string[] = []) {
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    for (const path of paths) revalidatePath(path)
  } catch {}
}
