// View module: counter UI that calls the server function.

import { counterFn } from "./#123";


const view = (upper: UPPER)=>{

  const label = HTML.p("count: loading")
  const inc = (delta: number) => remote(counterFn, {delta})

  inc(0)

  return HTML.div(
    HTML.h2("counter example"),
    label,
    HTML.button("increment", {onclick:()=>inc(1).then(count=>{
      label.textContent = "count: " + count,
      upper.update(label)
    })
    })
  )
}

export {view}