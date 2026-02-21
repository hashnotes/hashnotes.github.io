// page view

type MouseEventType = "click"| "mousemove" | "mouseup" | "mousedown" | "drag" | "wheel"
type KeyboardEventType = "keydown" | "keyup"
type DomEventType = MouseEventType | KeyboardEventType;

const mouseEvents : MouseEventType[] = ["click", "mousemove", "mouseup", "mousedown", "drag", "wheel"];
const keyboardEvents : KeyboardEventType[] = ["keydown", "keyup"];
const svgNamespace = "http://www.w3.org/2000/svg";
const svgTags = new Set(["svg", "path", "g", "line", "polyline", "polygon", "circle", "ellipse", "rect", "text"]);
const allowedAttributeNames = new Set(["viewBox","width","height","xmlns","d","fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","points","transform","opacity","font-size","font-family","font-weight","text-anchor","dominant-baseline","dx","dy","href","target","rel"]);




export type MouseEvent = {
  type: MouseEventType
  target: VDom
  clientX?: number
  clientY?: number
  deltaY?: number
  currentTarget?: Element
  preventDefault?: () => void
};

type KeyboardEvent = {
  type: KeyboardEventType
  key: string,
  metaKey: boolean,
  shiftKey: boolean,
  target: VDom,
}

export type ViewContext = {
  add: (parent: VDom, ...el: VDom[])=> void,
  del: (el: VDom) => void,
  update: (el: VDom) => void,
  onUserEvent?: (type: DomEventType) => void,
  location: { pathname: string },
  width: number,
  height: number,
}

export type VDom = {
  tag: string
  textContent: string
  id: string
  style: Record<string, string>
  attrs: Record<string, string>
  children: VDom[]
  onclick?: MouseListener
  onmousedown?: MouseListener
  onmouseup?: MouseListener
  onmousemove?: MouseListener
  onwheel?: MouseListener
  onkeydown?: KeyListener
  onkeyup?: KeyListener
  value?: string
}

type DomUpdate = { op: "DEL", el: VDom } | { op: "ADD", parent: VDom, el: VDom[]} | { op: "UPDATE", el: VDom }


let doms = new WeakMap<Element, VDom>();
let elements = new WeakMap<VDom, Element>();



export type View = (ctx: ViewContext) => VDom;

export const renderDom = (mker: View, location: { pathname: string } = { pathname: "/" }, width = globalThis.innerWidth ?? 0, height = globalThis.innerHeight ?? 0): HTMLElement => {

  let ctxRef: ViewContext | null = null

  const render = (dom:VDom) : Element=>{

    const el = svgTags.has(dom.tag) ? document.createElementNS(svgNamespace, dom.tag)
      : document.createElement(dom.tag);

    el.textContent = dom.textContent
    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && dom.value) el.value = dom.value
    elements.set(dom, el)
    doms.set(el, dom)
    el.append(...dom.children.map(c=>render(c)))
    Object.entries(dom.attrs).forEach(([k, v]) => {
      if (allowedAttributeNames.has(k)) el.setAttribute(k, v)
    })
    Object.entries(dom.style).forEach(st=>el.style.setProperty(...st))
    mouseEvents.forEach((type) => el.addEventListener(type, (e) => {
      if (ctxRef && ctxRef.onUserEvent) ctxRef.onUserEvent(type)
      const me = e as globalThis.MouseEvent
      const event: MouseEvent = {
        type,
        target: doms.get(e.target as HTMLElement)!,
        clientX: me.clientX,
        clientY: me.clientY,
        deltaY: type === "wheel" ? (me as globalThis.WheelEvent).deltaY : undefined,
        currentTarget: el,
        preventDefault: () => e.preventDefault(),
      }
      if (type === "click" && dom.onclick) dom.onclick(event)
      else if (type === "mousedown" && dom.onmousedown) dom.onmousedown(event)
      else if (type === "mouseup" && dom.onmouseup) dom.onmouseup(event)
      else if (type === "mousemove" && dom.onmousemove) dom.onmousemove(event)
      else if (type === "wheel" && dom.onwheel) dom.onwheel(event)
    }));
    keyboardEvents.forEach((type) => el.addEventListener(type, (e) =>{
      if (ctxRef && ctxRef.onUserEvent) ctxRef.onUserEvent(type)
      let {key, metaKey, shiftKey} = e as globalThis.KeyboardEvent;
      if (["INPUT" , "TEXTAREA"].includes((e.target as HTMLElement).tagName)) dom.value = (e.target as HTMLInputElement).value
      const event: KeyboardEvent = { type, key, metaKey, shiftKey, target: doms.get(e.target as HTMLElement)!}
      if (type === "keydown" && dom.onkeydown) dom.onkeydown(event)
      else if (type === "keyup" && dom.onkeyup) dom.onkeyup(event)
    }))
    return el

  }
  const ctx: ViewContext = {
    add: (parent: VDom, ...el: VDom[]) => {
      elements.get(parent)?.append(...el.map(e=>render(e)))
    },
    del: (el: VDom) => {
      doms.delete(elements.get(el)!)
      elements.get(el)?.remove()
      elements.delete(el)
    },
    update: (el: VDom) => {
      let oldel = elements.get(el)!
      if (!oldel) return
      oldel.replaceWith(render(el))
      doms.delete(oldel)
    },
    location,
    width,
    height,
  }
  ctxRef = ctx
  return render(mker(ctx)) as HTMLElement
}




type KeyListener = (e:KeyboardEvent) => void
type MouseListener = (e:MouseEvent) => void
type Subscriber = {
  "onkeyup"? : KeyListener
  "onkeydown"? : KeyListener
  "onmouseup"? : MouseListener
  "onmousedown"? : MouseListener
  "onmousemove"? : MouseListener
  "onclick"? :MouseListener
  "onwheel"? : MouseListener
};

type Content = string | VDom | Content[] | {id: string} | {style: Record<string, string>} | Subscriber | {value: string} | {attrs: Record<string, string>}


const mkDom = (tag: string) => (...content:Content[]) =>{

  let dm : VDom = {tag: tag, style: {}, attrs: {}, textContent: "", id: "", children: []};
  let strings: string[] = []
  let addcontent = (c: Content) => {
    if (c instanceof Array) c.forEach(addcontent);
    else if (typeof c == "string") strings.push(c)
    else if (c instanceof Object) {
      if ("tag" in c) return dm.children.push(c as VDom)
      if ("id" in c) dm.id = c.id as string;
      if ("value" in c) dm.value = c.value;
      if ("attrs" in c) Object.entries(c.attrs).forEach(([k, v]) => dm.attrs[k] = v)
      if ("style" in c) Object.entries(c.style).forEach(s=> dm.style[s[0].replace(/([A-Z])/g, '-$1')] = s[1])
      if ("onclick" in c) dm.onclick = (c as Subscriber).onclick
      if ("onmousedown" in c) dm.onmousedown = (c as Subscriber).onmousedown
      if ("onmouseup" in c) dm.onmouseup = (c as Subscriber).onmouseup
      if ("onmousemove" in c) dm.onmousemove = (c as Subscriber).onmousemove
      if ("onwheel" in c) dm.onwheel = (c as Subscriber).onwheel
      if ("onkeydown" in c) dm.onkeydown = (c as Subscriber).onkeydown
      if ("onkeyup" in c) dm.onkeyup = (c as Subscriber).onkeyup
    }
  }

  addcontent(content)
  dm.textContent += strings.join(" ")

  return dm
}

let div= mkDom("div")
let svg = mkDom("svg")
let path = mkDom("path")
let g = mkDom("g")
let rect = mkDom("rect")
let text = (attrs: Record<string, string> , ...content: string[]) => ({tag: "text", style: {}, attrs: attrs as {pos:string}, textContent: content.join(" "), id: "", children: []});

const popup = (...cs:VDom[])=>{

  const dialogfield = div(
    {
      style: {
        background: "var(--background-color)",
        color: "var(--color)",
        padding: "1em",
        paddingBottom: "2em",
        borderRadius: "1em",
        zIndex: "2000",
        overflowY: "scroll",
      }
    },
    ...cs)

  const popupbackground = div(
    {style:{
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(166, 166, 166, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "2000",
    }},
    dialogfield
  )

  return popupbackground

}


export const HTML = {
  div,
  svg,
  span: mkDom("span"),
  p: mkDom("p"),
  h1: mkDom("h1"),
  h2: mkDom("h2"),
  h3: mkDom("h3"),
  h4: mkDom("h4"),
  h5: mkDom("h5"),
  h6: mkDom("h6"),
  a: mkDom("a"),
  button: mkDom("button"),
  input: mkDom("input"),
  textarea: mkDom("textarea"),
  pre: mkDom("pre"),
  svgPath: (pathData: string | string[], options: {
    viewBox?: string,
    width?: string,
    height?: string,
    fill?: string,
    stroke?: string,
    strokeWidth?: string
  } = {}, ...children: VDom[]) => {
    const paths = pathData instanceof Array ? pathData : [pathData]
    const { viewBox = "0 0 100 100", width = "100", height = "100", fill = "none", stroke = "var(--color)", strokeWidth = "1" } = options
    const pathAttrs: Record<string, string> = { fill, stroke, "stroke-width": strokeWidth }
    return svg(
      { attrs: { viewBox, width, height, xmlns: svgNamespace } },
      ...paths.map(d => path({ attrs: { ...pathAttrs, d } })),
      ...children
    )
  },
  svgText: (
    content: string,
    options: {
      x?: string,
      y?: string,
      fill?: string,
      background?: string,
      fontSize?: string,
      fontFamily?: string,
      fontWeight?: string,
      textAnchor?: string,
      dominantBaseline?: string,
      dx?: string,
      dy?: string
    } = {}
  ) => {
    const fs = Number(options.fontSize ?? 12)
    const x = options.x ?? "50"
    const y = options.y ?? "50"
    const attrs: Record<string, string> = {
      fill: options.fill ?? "var(--color)",
      "font-size": String(fs),
      x, y,
      "text-anchor": options.textAnchor ?? "middle",
      "dominant-baseline": options.dominantBaseline ?? "middle",
    }
    if (options.fontFamily) attrs["font-family"] = options.fontFamily
    if (options.fontWeight) attrs["font-weight"] = options.fontWeight
    if (options.dx) attrs.dx = options.dx
    if (options.dy) attrs.dy = options.dy
    const textNode = text(attrs, content)
    if (!options.background) return textNode
    const pad = fs * 0.4
    const rw = content.length * fs * 0.6 + pad * 2
    const rh = fs + pad * 2
    const rx = Number(x) - rw / 2
    const ry = Number(y) - rh / 2
    return g(
      rect({ attrs: { x: String(rx), y: String(ry), width: String(rw), height: String(rh), fill: options.background, rx: String(pad) } }),
      textNode,
    )
  },
  popup
}
