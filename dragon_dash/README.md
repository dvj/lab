# Dragon Dash (text edition)

This folder contains a lightweight, terminal-friendly version of the cooperative board game **Dragon Dash**. Guide the hero across the maze while a dragon gives chase. The board, start, goal, and dragon placements are loaded from an ASCII file so you can swap in different maps without changing the code.

## Quick start

```bash
python -m dragon_dash.main --help
python -m dragon_dash.main  # plays the default board
```

Use `W`, `A`, `S`, or `D` (or the numbered menu) to step through the maze after each die roll.

## Rules implemented

- **Board** – Walkable spaces are `.` along with the start `S`, goal `G`, and dragon `D` tiles. Walls are `#`.
- **Hero turn** – The hero rolls a die for **1–4** steps, choosing the direction for every step. You cannot step onto the dragon’s current tile.
- **Dragon turn** – The dragon rolls **1–3** steps and automatically follows the shortest available path toward the hero. If the path is blocked, the dragon waits.
- **Winning and losing** – Reach `G` first to win. Landing on the same tile as the dragon ends the game immediately.
- **Round cap** – Games time out after 60 rounds by default; you can override with `--max-rounds`.

## Board format

Boards live in `dragon_dash/boards/` and must be rectangular text files.

- `S` – Start (exactly one)
- `G` – Goal (exactly one)
- `D` – Dragon start (at least one)
- `#` – Wall (impassable)
- `.` – Open path

Example (`boards/default_board.txt`):

```
#############
#S...#.....G#
#.#.#.###.#.#
#.#.#...#.#.#
#.#.###.#.#.#
#...#...#.#.#
###.#.#.#.#.#
#...#.#...#.#
#.#.#.#.###.#
#.#...#...#.#
#.#####.#.#D#
#############
```

You can build your own map and point the CLI at it with `--board path/to/board.txt`.
