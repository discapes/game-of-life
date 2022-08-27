<script>
  import { onMount } from "svelte";
  import { parse_rle } from "./parser";

  const initialW = 10;
  const initialH = 10;
  let current = new Set();
  let maxx = initialW;
  let minx = -1;
  let miny = -1;
  let maxy = initialH;
  let interval = 0;
  let stopped = true;
  let canvas;
  let blur = false;

  function reset() {
    stopped = true;
    maxx = initialW;
    minx = -1;
    miny = -1;
    maxy = initialH;
    current = new Set();
    draw();
  }

  function play() {
    stopped = !stopped;
    function f() {
      if (stopped) return;
      if (isNaN(interval) || typeof interval !== "number") {
        setTimeout(f, 10);
      } else {
        if (interval < 0) {
          for (let i = 0; i < -interval - 1; i++) iter();
        }
        iter();
        draw();
        setTimeout(f, interval);
      }
    }
    if (!stopped) {
      setTimeout(f, 0);
    }
  }

  onMount(draw);

  async function load(e) {
    current = new Set();
    const text = new FormData(e.target).get("text");
    const out = parse_rle(text);
    minx = miny = Infinity;
    maxx = maxy = -Infinity;
    for (let i = 0; i < out.field_x.length; i++) {
      const x = out.field_x[i];
      const y = out.field_y[i];
      current.add([x, y].join(","));
      minx = Math.min(x, minx);
      miny = Math.min(y, miny);
      maxx = Math.max(x, maxx);
      maxy = Math.max(y, maxy);
    }
    minx--;
    miny--;
    maxx++;
    maxy++;
    draw();
  }

  function iter() {
    if (!current.size) return;
    minx = miny = Infinity;
    maxx = maxy = -Infinity;

    const next = new Set();
    const deadNeighbours = new Set();
    for (const s of current.values()) {
      const [x, y] = s.split(",").map((s) => +s);
      let neighbours = 0;
      forNeighbours(x, y, (nx, ny) => {
        if (current.has([nx, ny].join(","))) neighbours++;
        else deadNeighbours.add([nx, ny].join(","));
      });
      if (neighbours === 2 || neighbours === 3) {
        next.add([x, y].join(","));
        minx = Math.min(x, minx);
        miny = Math.min(y, miny);
        maxx = Math.max(x, maxx);
        maxy = Math.max(y, maxy);
      }
    }

    for (const s of deadNeighbours.values()) {
      const [x, y] = s.split(",").map((s) => +s);
      let neighbours = 0;
      forNeighbours(x, y, (nx, ny) => {
        neighbours += +current.has([nx, ny].join(","));
      });
      if (neighbours === 3) {
        next.add([x, y].join(","));
        minx = Math.min(x, minx);
        miny = Math.min(y, miny);
        maxx = Math.max(x, maxx);
        maxy = Math.max(y, maxy);
      }
    }
    minx--;
    miny--;
    maxx++;
    maxy++;
    current = next;
  }
  let xbufs = 0;
  let ybufs = 0;
  function draw() {
    // const maxbufs = 0;
    // const buf = 10;
    // if (ybufs > maxbufs || Math.abs(canvas.height - (maxy - miny + 1)) > buf) {
    canvas.height = maxy - miny + 1;
    // ybufs = 0;
    // } else ybufs++;
    // if (xbufs > maxbufs || Math.abs(canvas.width - (maxx - minx + 1)) > buf) {
    canvas.width = maxx - minx + 1;
    // xbufs = 0;
    // } else xbufs++;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    for (const s of current.values()) {
      const [x, y] = s.split(",").map((s) => +s);
      ctx.fillRect(x - minx, y - miny, 1, 1);
    }
  }
  function forNeighbours(x, y, cb) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        cb(x + dx, y + dy);
      }
    }
  }

  function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const yMultiplier = canvas.clientHeight / canvas.height;
    const xMultiplier = canvas.clientWidth / canvas.width;
    const m = Math.min(xMultiplier, yMultiplier);
    const sx = canvas.width * m;
    const sy = canvas.height * m;
    const leftBar = (canvas.clientWidth - sx) / 2;
    const topBar = (canvas.clientHeight - sy) / 2;
    const x = Math.floor(
      ((event.clientX - rect.left - leftBar) * canvas.width) / sx
    );
    const y = Math.floor(
      ((event.clientY - rect.top - topBar) * canvas.height) / sy
    );
    return { x, y };
  }

  function md(e) {
    const { x, y } = getCursorPosition(canvas, e);
    lastMO = { x, y };
    toggle(x + minx, y + miny);
  }

  let lastMO = {};
  function mo(e) {
    if (e.buttons & 0b1) {
      const { x, y } = getCursorPosition(canvas, e);
      if (lastMO.x === x && lastMO.y === y) return;
      lastMO = { x, y };
      enable(x + minx, y + miny);
    } else if (e.buttons & 0b10) {
      const { x, y } = getCursorPosition(canvas, e);
      if (lastMO.x === x && lastMO.y === y) return;
      lastMO = { x, y };
      disable(x + minx, y + miny);
    }
  }

  function disable(x, y) {
    current.delete([x, y].join(","));
    draw();
  }

  function enable(x, y) {
    current.add([x, y].join(","));
    draw();
  }

  function toggle(x, y) {
    if (!current.delete([x, y].join(","))) current.add([x, y].join(","));
    draw();
  }
</script>

<svelte:window on:keyup={(e) => e.key == " " && iter()} />

<main
  class="inline-flex min-w-full flex-col justify-center overflow-y-hidden items-center h-screen w-full gap-5 p-10">
  <div class="inline-flex gap-5 items-center">
    <h1 class="text-xl">game of life</h1>
    <div class="flex gap-5 items-stretch">
      <button on:click={iter}>Iterate</button>
      <button data-on={!stopped} on:click={play}>Play</button>
      <button on:click={reset}>Reset</button>
      <button data-on={blur} on:click={() => (blur = !blur)}>Blur</button>
      <div class="flex items-center border border-black gap-3 px-[10px]">
        Interval:
        <input
          class="h-full w-20 p-1 outline-none"
          type="number"
          bind:value={interval} />
      </div>
      <form on:submit|preventDefault={load} class="flex gap-1">
        <textarea
          class="resize-none border-black border p-1 min-h-full h-0 w-28"
          name="text"
          placeholder="rle file" />
        <button type="submit">Load</button>
      </form>
    </div>
    <pre>click = toggle
LMB drag = enable
RMB drag = disable</pre>
  </div>

  <canvas
    style={blur ? "" : "image-rendering: pixelated;"}
    class="w-full h-full object-contain"
    bind:this={canvas}
    on:mousedown={md}
    on:mousemove={mo}
    on:contextmenu|preventDefault />
</main>

<style>
  button {
    border: 1px solid black;
    padding: 10px;
  }
  button[data-on="true"] {
    background-color: rgb(235, 255, 255) !important;
  }
  button:hover {
    background-color: #f0f0f0;
  }
</style>
