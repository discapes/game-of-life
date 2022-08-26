<script>
  import { onMount, onDestroy } from "svelte";

  const initialW = 10;
  const initialH = 10;
  let current = new Set();
  let maxx = initialW;
  let minx = -1;
  let miny = -1;
  let maxy = initialH;
  const intervalSeconds = 0.01;
  let stopped = false;

  function stop() {
    stopped = true;
  }

  function play() {
    stopped = false;
    function f() {
      if (stopped) return;
      iter();
      setTimeout(f, intervalSeconds * 1000);
    }
    f();
  }

  function iter() {
    minx = miny = Infinity;
    maxx = maxy = -Infinity;

    console.log("iterating..");
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
  function forNeighbours(x, y, cb) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        cb(x + dx, y + dy);
      }
    }
  }
</script>

<svelte:window on:keyup={(e) => e.key == " " && iter()} />

<main
  class="inline-flex min-w-full flex-col justify-center items-center h-screen">
  <div class="flex gap-5 p-5 items-center">
    <h1 class="text-xl">game of life</h1>
    <button on:click={iter}>Iterate</button>
    <button on:click={play}>Play</button>
    <button on:click={stop}>Stop</button>
  </div>

  <div class="w-full h-full flex justify-center">
    <div
      style="grid-template-columns: repeat({maxx -
        minx +
        1}, minmax(0, 1fr)); grid-template-rows: repeat({maxy -
        miny +
        1}, minmax(0, 1fr)); 
      width: min(100%, {(maxx - minx + 1) * 40}px);
      height: min(100%, {(maxy - miny + 1) * 40}px)"
      class="inline-grid gap-x-0 p-10 aspect-square">
      {#each Array(maxy - miny + 1).fill(0) as _y, y}
        {#each Array(maxx - minx + 1).fill(0) as _x, x}
          <div
            class="w-full h-full max-w-[40px] max-h-[40px] {current.has(
              [x + minx, y + miny].join(',')
            )
              ? 'bg-white border-black'
              : 'bg-black border-white'}"
            on:click={() => {
              if (!current.delete([x + minx, y + miny].join(",")))
                current.add([x + minx, y + miny].join(","));
              current = current;
            }} />
        {/each}
      {/each}
    </div>
  </div>
</main>

<style>
  button {
    border: 1px solid black;
    padding: 10px;
  }
  button:hover {
    background-color: #f0f0f0;
  }
</style>
