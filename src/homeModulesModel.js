export const HOME_MODULE_IDS = ['today', 'projects', 'debts', 'economy', 'summary']
export function normalizeHomeOrder(saved, ids = HOME_MODULE_IDS) {
  return [...new Set([...(Array.isArray(saved) ? saved.filter(id => ids.includes(id)) : []), ...ids])]
}
export function moveHomeModule(order, visible, active, destination) {
  const full = normalizeHomeOrder(order)
  const sorted = full.filter(id => visible.includes(id))
  const from = sorted.indexOf(active), to = sorted.indexOf(destination)
  if (from < 0 || to < 0 || from === to) return full
  sorted.splice(to, 0, sorted.splice(from, 1)[0])
  let index = 0
  return full.map(id => visible.includes(id) ? sorted[index++] : id)
}
