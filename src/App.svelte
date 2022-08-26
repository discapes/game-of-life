<script>
  import { onMount, onDestroy } from "svelte";

  const initialW = 10;
  const initialH = 10;
  let current = new Set();
  let maxx = initialW;
  let minx = -1;
  let miny = -1;
  let maxy = initialH;
  const intervalSeconds = 0.0;
  let stopped = true;
  let borders = true;
  let canvas;
  let blur = false;
  let grid = true;

  function reset() {
    stopped = true;
    maxx = initialW;
    minx = -1;
    miny = -1;
    maxy = initialH;
    current = new Set();
    grid = true;
    draw();
  }

  function play() {
    stopped = !stopped;
    function f() {
      if (stopped) return;
      iter();
      setTimeout(f, intervalSeconds * 1000);
    }
    if (!stopped) {
      grid = false;
      setTimeout(f, intervalSeconds * 1000);
    }
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

    draw();
  }
  function draw() {
    canvas.height = maxy - miny + 1;
    canvas.width = maxx - minx + 1;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  function toggle(x, y) {
    if (!current.delete([x, y].join(","))) current.add([x, y].join(","));
    current = current;
  }
</script>

<svelte:window on:keyup={(e) => e.key == " " && iter()} />

<main
  class="inline-flex min-w-full flex-col justify-center items-center h-screen w-screen gap-10 p-10">
  <div class="flex gap-5 items-center">
    <h1 class="text-xl">game of life</h1>
    <button on:click={iter}>Iterate</button>
    <button data-on={!stopped} on:click={play}>Play</button>
    <button on:click={reset}>Reset</button>
    <button data-on={borders} on:click={() => (borders = !borders)}
      >Borders</button>
    <button data-on={blur} on:click={() => (blur = !blur)}>Blur</button>
    <button data-on={grid} on:click={() => (grid = !grid)}>Grid</button>
  </div>

  <canvas
    style={blur ? "" : "image-rendering: pixelated;"}
    class="h-full bg-black"
    bind:this={canvas} />

  {#if grid}
    <div
      style="grid-template-columns: repeat({maxx -
        minx +
        1}, minmax(0, 1fr)); grid-template-rows: repeat({maxy -
        miny +
        1}, minmax(0, 1fr)); 
      width: min(100%, {(maxx - minx + 1) * 40}px);
      height: min(100%, {(maxy - miny + 1) * 40}px)"
      class="inline-grid gap-x-0">
      {#each Array(maxy - miny + 1).fill(0) as _y, y}
        {#each Array(maxx - minx + 1).fill(0) as _x, x}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <div class="w-full">
            <div
              class="{borders
                ? 'border'
                : ''} w-full pt-[100%] max-w-[40px] max-h-[40px] bg-clip-padding {current.has(
                [x + minx, y + miny].join(',')
              )
                ? 'bg-white border-black'
                : 'bg-black border-white'}"
              on:mouseover={(e) =>
                e.buttons & 0b1 && toggle(x + minx, y + miny)}
              on:mousedown={() => toggle(x + minx, y + miny)} />
          </div>
        {/each}
      {/each}
    </div>
  {/if}
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
