<script>
  // @ts-nocheck
  import { onMount, onDestroy } from "svelte";
  import { debug } from "svelte/internal";

  const w = 10;
  const h = 10;
  let current = Array(w)
    .fill(0)
    .map((col) => Array(h).fill(0));
  let next = Array(w)
    .fill(0)
    .map((col) => Array(h).fill(0));
  let intervalID;
  const intervalSeconds = 1;

  // onMount(() => setInterval(iter, intervalSeconds * 1000));
  // onDestroy(() => clearInterval(intervalID));

  function iter() {
    console.log("iterating..");
    for (let x = 0; x < current.length; x++) {
      for (let y = 0; y < current.length; y++) {
        changeCell(x, y);
      }
    }
    const old = current;
    current = next;
    next = old;
  }
  function changeCell(x, y) {
    let neighbours = 0;
    const minx = !x - 1;
    const miny = !y - 1;
    const maxx = !!(w - x - 1);
    const maxy = !!(h - y - 1);

    for (let dx = minx; dx <= maxx; dx++) {
      for (let dy = miny; dy <= maxy; dy++) {
        if (dx === 0 && dy === 0) continue;
        neighbours += current[x + dx][y + dy];
      }
    }
    switch (neighbours) {
      case 3:
        next[x][y] = 1;
        break;
      case 2:
        next[x][y] = current[x][y];
        break;
      default:
        next[x][y] = 0;
        break;
    }
  }
</script>

<main class="flex flex-col justify-center items-center overflow-auto h-screen">
  <div class="flex gap-5 p-5 items-center">
    <h1 class="text-xl">game of life</h1>
    <button on:click={iter}>Iterate</button>
  </div>

  <div style="column-count: {w}" class="col gap-x-0">
    {#each current as col, x}
      {#each col as cell, y}
        <div
          class="border w-10 h-10 {cell
            ? 'bg-white border-black'
            : 'bg-black border-white'}"
          on:click={() => (current[x][y] = !current[x][y])} />
      {/each}
    {/each}
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
