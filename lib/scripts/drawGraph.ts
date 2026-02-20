// ts-note: notes/#97309c6ee9d58f410340e565180db6c0.ts
// js-note: notes/#ebc43d3fbb39d2a149a3503a8ba4d49e.js
export type DAG = {
  title: string,
  srcs: DAG[],
  onclick?: () => void
}

type Pos = { x: number, y: number }

export type DrawGraphResult = {
  view: VDom
  highlight: (node: DAG | null) => void
}

export const drawGraph = (graph: DAG, w: number, h: number, ctx: ViewContext): DrawGraphResult => {
  // collect all unique nodes and edges
  let allNodes: DAG[] = []
  let edges: [DAG, DAG][] = []
  let visited = new Set<DAG>()

  let collect = (node: DAG) => {
    if (visited.has(node)) return
    visited.add(node)
    allNodes.push(node)
    node.srcs.forEach(src => {
      edges.push([node, src])
      collect(src)
    })
  }
  collect(graph)

  // compute depth: leaves = 0, parents = 1 + max child depth
  let depth = new Map<DAG, number>()
  let depthOf = (node: DAG): number => {
    if (depth.has(node)) return depth.get(node)!
    let d = node.srcs.length > 0
      ? 1 + Math.max(...node.srcs.map(s => depthOf(s)))
      : 0
    depth.set(node, d)
    return d
  }
  allNodes.forEach(n => depthOf(n))

  // group into layers by depth
  let maxDepth = Math.max(0, ...allNodes.map(n => depth.get(n)!))
  let layers: DAG[][] = []
  for (let d = 0; d <= maxDepth; d++) {
    layers.push(allNodes.filter(n => depth.get(n) === d))
  }

  // barycenter ordering to reduce edge crossings
  // build adjacency: for each node, which nodes connect to it?
  let neighbors = new Map<DAG, DAG[]>()
  allNodes.forEach(n => neighbors.set(n, []))
  edges.forEach(e => {
    neighbors.get(e[0])!.push(e[1])
    neighbors.get(e[1])!.push(e[0])
  })

  // assign initial indices within each layer
  let indexOf = new Map<DAG, number>()
  layers.forEach(layer => layer.forEach((n, i) => indexOf.set(n, i)))

  // sweep: for each layer, sort nodes by average index of neighbors in adjacent layers
  let passes = 4
  for (let p = 0; p < passes; p++) {
    // down sweep (layer 0 to max)
    layers.forEach(layer => {
      layer.forEach(node => {
        let nbrs = neighbors.get(node)!
        let otherIdxs = nbrs.filter(n => depth.get(n) !== depth.get(node)).map(n => indexOf.get(n)!)
        if (otherIdxs.length > 0) {
          let sum = 0
          otherIdxs.forEach(v => { sum = sum + v })
          indexOf.set(node, sum / otherIdxs.length)
        }
      })
      layer.sort((a, b) => indexOf.get(a)! - indexOf.get(b)!)
      layer.forEach((n, i) => indexOf.set(n, i))
    })
  }

  let layerCount = layers.length
  let maxPerLayer = Math.max(1, ...layers.map(l => l.length))

  // layout: assign positions
  let padX = 40
  let padY = 30
  let gapY = layerCount > 1 ? (h - padY * 2) / (layerCount - 1) : 0
  let pos = new Map<DAG, Pos>()

  layers.forEach((layer, lvl) => {
    let count = layer.length
    let gapX = count > 1 ? (w - padX * 2) / (count - 1) : 0
    layer.forEach((node, i) => {
      let x = count > 1 ? padX + i * gapX : w / 2
      let y = padY + lvl * gapY
      pos.set(node, { x, y })
    })
  })

  let fontSize = Math.max(6, Math.min(14, Math.round(w / maxPerLayer / 8)))
  let offset = fontSize * 0.7

  // connected edges per node (index into edges array)
  let nodeEdges = new Map<DAG, number[]>()
  edges.forEach((e, i) => {
    let add = (n: DAG) => {
      let list = nodeEdges.get(n)
      if (!list) { list = []; nodeEdges.set(n, list) }
      list.push(i)
    }
    add(e[0])
    add(e[1])
  })

  // selection state
  let selected: DAG | null = null
  let root: VDom = HTML.div()

  let build = (): VDom => {
    let litEdges = new Set<number>()
    if (selected) {
      let ei = nodeEdges.get(selected)
      if (ei) ei.forEach(i => litEdges.add(i))
    }

    // edge paths: normal ones first, highlighted on top
    let normalPaths: string[] = []
    let litPaths: string[] = []
    edges.forEach((e, i) => {
      let pa = pos.get(e[0])!
      let ch = pos.get(e[1])!
      let cy = ch.y + offset
      let py = pa.y - offset
      let dy = Math.abs(py - cy) * 0.4
      let d = "M" + ch.x + " " + cy + " C" + ch.x + " " + (cy + dy) + " " + pa.x + " " + (py - dy) + " " + pa.x + " " + py
      if (litEdges.has(i)) litPaths.push(d)
      else normalPaths.push(d)
    })

    // node labels
    let nodeEls: VDom[] = []
    layers.forEach(layer => {
      layer.forEach(node => {
        let p = pos.get(node)!
        let lit = node === selected
        let el = HTML.svgText(node.title, {
          x: "" + p.x, y: "" + p.y,
          fontSize: "" + fontSize,
          fill: lit ? "#f90" : "var(--color)",
          background: "var(--background)",
        })
        el.onclick = () => {
          selected = selected === node ? null : node
          if (node.onclick) node.onclick()
          let rebuilt = build()
          root.children = rebuilt.children
          ctx.update(root)
        }
        el.style.cursor = "pointer"
        nodeEls.push(el)
      })
    })

    // normal edges + highlighted edges on top + node labels
    let svgRoot = HTML.svgPath(
      normalPaths,
      { viewBox: "0 0 " + w + " " + h, width: "" + w, height: "" + h },
    )
    // add highlighted edge paths
    litPaths.forEach(d => {
      svgRoot.children.push({
        tag: "path", textContent: "", id: "", style: {}, children: [],
        attrs: { d, fill: "none", stroke: "#f90", "stroke-width": "1.5" },
      })
    })
    // add node elements
    nodeEls.forEach(el => svgRoot.children.push(el))

    return svgRoot
  }

  const highlight = (node: DAG | null) => {
    selected = node
    let rebuilt = build()
    root.children = rebuilt.children
    ctx.update(root)
  }

  root = build()
  return { view: root, highlight }
}
