// ts-note: notes/#1862957a61f2773171da748e8a7065a0.ts
// js-note: notes/#7ddd9e88b607f54718bdadbcd2d77b3a.js
export type DAG = {
  title: string,
  srcs: DAG[],
  onclick?: () => void
}

type Pos = { x: number, y: number }

export type DrawGraphResult = {
  view: VDom
  highlight: (node: DAG | null) => void
  focus: (node: DAG | null) => void
  getViewport: () => {
    panX: number
    panY: number
    vpW: number
    vpH: number
  }
}

export const drawGraph = (
  graph: DAG,
  w: number,
  h: number,
  ctx: ViewContext,
  initialViewport: { panX: number, panY: number, vpW: number, vpH: number } | null = null,
): DrawGraphResult => {
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

  // label/layout constraints
  let maxLabelChars = 18
  let maxLabelLines = 3
  let maxLabelWidth = 170

  // layout world size: can exceed viewport, so pan/zoom has room.
  let padX = 40
  let padY = 30
  let minGapX = Math.max(140, maxLabelWidth + 24)
  let minGapY = 105
  let fullW = Math.max(w, padX * 2 + (maxPerLayer > 1 ? (maxPerLayer - 1) * minGapX : 0))
  let fullH = Math.max(h, padY * 2 + (layerCount > 1 ? (layerCount - 1) * minGapY : 0))
  let gapY = layerCount > 1 ? (fullH - padY * 2) / (layerCount - 1) : 0
  let pos = new Map<DAG, Pos>()

  layers.forEach((layer, lvl) => {
    let count = layer.length
    let gapX = count > 1 ? (fullW - padX * 2) / (count - 1) : 0
    layer.forEach((node, i) => {
      let x = count > 1 ? padX + i * gapX : fullW / 2
      let y = padY + lvl * gapY
      pos.set(node, { x, y })
    })
  })

  let fontSize = Math.max(6, Math.min(14, Math.round(fullW / maxPerLayer / 8)))
  let offset = fontSize * 0.7
  let wrapLabel = (text: string): string[] => {
    let raw = text.trim()
    if (raw.length <= maxLabelChars) return [raw]
    let words = raw.split(/\s+/)
    let lines: string[] = []
    let cur = ""
    words.forEach((w) => {
      let next = cur.length === 0 ? w : cur + " " + w
      if (next.length <= maxLabelChars) cur = next
      else {
        if (cur.length > 0) lines.push(cur)
        if (w.length > maxLabelChars) {
          let rest = w
          while (rest.length > maxLabelChars) {
            lines.push(rest.slice(0, maxLabelChars - 1) + "…")
            rest = rest.slice(maxLabelChars - 1)
          }
          cur = rest
        } else cur = w
      }
    })
    if (cur.length > 0) lines.push(cur)
    if (lines.length > maxLabelLines) {
      lines = lines.slice(0, maxLabelLines)
      let i = lines.length - 1
      lines[i] = lines[i].slice(0, Math.max(0, maxLabelChars - 1)) + "…"
    }
    return lines
  }

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
  let vpW = initialViewport ? initialViewport.vpW : w
  let vpH = initialViewport ? initialViewport.vpH : h
  let minVpW = Math.max(120, Math.floor(w * 0.2))
  let maxVpW = Math.max(w, Math.floor(fullW * 2))
  let panX = initialViewport ? initialViewport.panX : (fullW - vpW) / 2
  let panY = initialViewport ? initialViewport.panY : (fullH - vpH) / 2
  let dragging = false
  let dragMoved = false
  let justDragged = false
  let dragStartX = 0
  let dragStartY = 0
  let panStartX = 0
  let panStartY = 0

  let applyViewport = (el: Element | null) => {
    if (!el || !el.setAttribute) return
    el.setAttribute("viewBox", "" + panX + " " + panY + " " + vpW + " " + vpH)
    let styleEl = el as unknown as { style?: { cursor?: string } }
    if (styleEl.style) styleEl.style.cursor = dragging ? "grabbing" : "grab"
  }

  let applyRebuild = (next: VDom) => {
    root.children = next.children
    root.attrs = next.attrs
    root.style = next.style
    root.textContent = next.textContent
    root.onclick = next.onclick
    root.onmousedown = next.onmousedown
    root.onmouseup = next.onmouseup
    root.onmousemove = next.onmousemove
    root.onwheel = next.onwheel
  }

  let clamp = () => {
    let padPanX = vpW * 0.45
    let padPanY = vpH * 0.25
    let minX = Math.min((fullW - vpW) / 2 - padPanX, -padPanX)
    let maxX = Math.max((fullW - vpW) / 2 + padPanX, fullW - vpW + padPanX)
    let minY = Math.min((fullH - vpH) / 2 - padPanY, -padPanY)
    let maxY = Math.max((fullH - vpH) / 2 + padPanY, fullH - vpH + padPanY)
    panX = Math.max(minX, Math.min(panX, maxX))
    panY = Math.max(minY, Math.min(panY, maxY))
  }
  clamp()

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
        let lines = wrapLabel(node.title)
        let lineH = fontSize * 1.2
        let padX = fontSize * 0.45
        let padY = fontSize * 0.4
        let maxLen = Math.max(...lines.map(s => s.length))
        let bw = Math.max(20, Math.min(maxLabelWidth, maxLen * fontSize * 0.58 + padX * 2))
        let bh = Math.max(fontSize + padY * 2, lines.length * lineH + padY * 2)
        let bx = p.x - bw / 2
        let by = p.y - bh / 2
        let el: VDom = {
          tag: "g",
          textContent: "",
          id: "",
          style: {},
          attrs: {},
          children: [
            {
              tag: "rect",
              textContent: "",
              id: "",
              style: {},
              attrs: {
                x: "" + bx,
                y: "" + by,
                width: "" + bw,
                height: "" + bh,
                rx: "" + Math.max(2, fontSize * 0.35),
                fill: "var(--background)",
                stroke: lit ? "#f90" : "var(--color)",
                "stroke-width": lit ? "1.5" : "1",
                opacity: "0.95",
              },
              children: [],
            },
            ...lines.map((line, i) => ({
              tag: "text",
              textContent: line,
              id: "",
              style: {},
              attrs: {
                x: "" + p.x,
                y: "" + (p.y - (lines.length - 1) * lineH / 2 + i * lineH),
                fill: lit ? "#f90" : "var(--color)",
                "font-size": "" + fontSize,
                "text-anchor": "middle",
                "dominant-baseline": "middle",
              },
              children: [],
            })),
          ],
        }
        el.onclick = () => {
          if (justDragged) {
            justDragged = false
            return
          }
          selected = selected === node ? null : node
          if (node.onclick) node.onclick()
          let rebuilt = build()
          applyRebuild(rebuilt)
          ctx.update(root)
        }
        el.style.cursor = "pointer"
        nodeEls.push(el)
      })
    })

    // normal edges + highlighted edges on top + node labels
    let svgRoot = HTML.svgPath(
      normalPaths,
      { viewBox: "" + panX + " " + panY + " " + vpW + " " + vpH, width: "" + w, height: "" + h },
    )
    svgRoot.style.cursor = dragging ? "grabbing" : "grab"
    svgRoot.style.userSelect = "none"
    svgRoot.style.touchAction = "none"

    let stopDragging = () => {
      justDragged = dragging && dragMoved
      dragging = false
      dragMoved = false
    }

    svgRoot.onmousedown = (e: any) => {
      if (e && e.clientX != null) {
        dragging = true
        dragMoved = false
        dragStartX = e.clientX
        dragStartY = e.clientY || 0
        panStartX = panX
        panStartY = panY
      }
    }
    svgRoot.onmousemove = (e: any) => {
      if (!dragging || !e || e.clientX == null) return
      let rect = e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null
      if (!rect) return
      let dx = e.clientX - dragStartX
      let dy = (e.clientY || 0) - dragStartY
      if (!dragMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
      dragMoved = true
      panX = panStartX - dx * (vpW / rect.width)
      panY = panStartY - dy * (vpH / rect.height)
      clamp()
      applyViewport(e.currentTarget || null)
    }
    svgRoot.onmouseup = () => {
      stopDragging()
    }
    ;(svgRoot as any).onmouseleave = () => {
      stopDragging()
    }
    svgRoot.onwheel = (e: any) => {
      if (e && e.preventDefault) e.preventDefault()
      let rect = e && e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null
      if (!rect) return
      let zoom = e && e.deltaY > 0 ? 1.1 : 0.9
      let oldVpW = vpW
      let oldVpH = vpH
      let nextVpW = Math.max(minVpW, Math.min(maxVpW, oldVpW * zoom))
      let aspect = w > 0 && h > 0 ? w / h : 1
      let nextVpH = nextVpW / aspect
      let px = e && e.clientX != null ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) : 0.5
      let py = e && e.clientY != null ? Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)) : 0.5
      let worldX = panX + px * oldVpW
      let worldY = panY + py * oldVpH
      vpW = nextVpW
      vpH = nextVpH
      panX = worldX - px * vpW
      panY = worldY - py * vpH
      clamp()
      applyViewport(e.currentTarget || null)
    }
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
    applyRebuild(rebuilt)
    ctx.update(root)
  }

  const focus = (node: DAG | null) => {
    selected = node
    if (node && pos.has(node)) {
      let p = pos.get(node) as Pos
      panX = p.x - vpW / 2
      panY = p.y - vpH / 2
      clamp()
    }
    let rebuilt = build()
    applyRebuild(rebuilt)
    ctx.update(root)
  }

  const getViewport = () => ({ panX, panY, vpW, vpH })

  root = build()
  return { view: root, highlight, focus, getViewport }
}
