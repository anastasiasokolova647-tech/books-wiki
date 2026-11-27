export const normalize = (s) => String(s).normalize('NFKC').toLocaleLowerCase('uk').replace(/[’ʼ']/g, '').replace(/[–—]/g, '-').replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim()
export function matches(row, query, book = '') {
  if (book && row.book !== book) return false
  const q = normalize(query)
  const address = q.match(/^(.*?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
  if (address) {
    const [, name, chapter, first, last] = address
    return row.references.some(r => normalize(r.book) === name && r.chapter === +chapter && (!first || (r.start <= +(last || first) && r.end >= +first)))
  }
  const text = normalize([row.title, row.book, row.epigraph, ...row.references.map(r => r.label)].join(' '))
  return q.split(' ').filter(Boolean).every(t => text.includes(t))
}
