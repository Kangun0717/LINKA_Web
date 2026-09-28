const REFERENCING = ['fill', 'stroke', 'filter', 'mask', 'clip-path', 'style', 'href', 'xlink:href', 'marker-start', 'marker-end']

/**
 * Give a copied SVG subtree ids of its own.
 *
 * `url(#id)` resolves to the first element in the document with that id. A
 * copy of the map keeps the same filter, mask and clip-path ids as the live
 * map — so once the live map redraws for its destination, the copy would
 * quietly start using the destination's masks. Every id in the copy gets a
 * suffix, and every reference inside the copy follows it.
 */
export function isolateIds(root: Element, suffix: string): void {
  const renamed = new Map<string, string>()
  for (const element of root.querySelectorAll('[id]')) {
    const next = `${element.id}${suffix}`
    renamed.set(element.id, next)
    element.id = next
  }
  if (renamed.size === 0) return

  const pattern = /url\(#([^)]+)\)|^#(.+)$/g
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of REFERENCING) {
      const value = element.getAttribute(name)
      if (!value || !value.includes('#')) continue
      const next = value.replace(pattern, (match, inUrl?: string, inHref?: string) => {
        const id = inUrl ?? inHref
        const mapped = id ? renamed.get(id) : undefined
        if (!mapped) return match
        return inUrl ? `url(#${mapped})` : `#${mapped}`
      })
      if (next !== value) element.setAttribute(name, next)
    }
  }
}
