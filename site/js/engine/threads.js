// Connection threads: the lines that show which phrase each phrase attaches to.
// Pure layout maths; the page draws them (render.js / breakdown.js).
//
// threadEdges(chunks) → [{ from, to }] over the phrases that are words (not bare
// punctuation), as row indices. arcDepths(edges) gives each edge a lane so that a
// longer thread runs outside every thread it encloses and nothing crosses needlessly.

export function threadEdges(chunks) {
  const rows = chunks.filter((b) => b.tokens.some((t) => t.pos !== '記号'));
  const rowOf = new Map(rows.map((b, i) => [b.id, i]));
  const edges = [];
  rows.forEach((b, i) => {
    let dep = b.dep;
    // A head that is only punctuation: follow it to the next real phrase.
    while (dep >= 0 && !rowOf.has(dep)) dep = chunks[dep].dep;
    if (dep >= 0 && rowOf.get(dep) !== i) edges.push({ from: i, to: rowOf.get(dep) });
  });
  return { rows, edges };
}

// Lane for each edge (1 = innermost): 1 + the deepest edge nested inside its span.
export function arcDepths(edges) {
  const span = (e) => [Math.min(e.from, e.to), Math.max(e.from, e.to)];
  const order = edges.map((e, i) => i).sort((a, b) => span(edges[a])[1] - span(edges[a])[0] - (span(edges[b])[1] - span(edges[b])[0]));
  const depth = new Array(edges.length).fill(1);
  for (const i of order) {
    const [a, b] = span(edges[i]);
    for (const j of order) {
      if (j === i) continue;
      const [c, d] = span(edges[j]);
      // Nested inside this one (sharing an end row counts): this one runs outside it.
      if (c >= a && d <= b && d - c < b - a) depth[i] = Math.max(depth[i], depth[j] + 1);
    }
  }
  return depth;
}
