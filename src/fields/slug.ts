import type { TextField } from 'payload'

/** "Ibuprofen 200 mg (50 ct)" → "ibuprofen-200-mg-50-ct" */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * URL slug, filled in from another field (e.g. `name`) when left empty. Runs before validation,
 * so it also works for documents created by scripts, not only in the admin form.
 */
export function slugField(from: string): TextField {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Part of the page address. Leave empty to fill in from the ${from}. Changing it later breaks old links.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === 'string' && value.trim()) return slugify(value)
          const source = data?.[from]
          return typeof source === 'string' && source.trim() ? slugify(source) : value
        },
      ],
    },
  }
}
