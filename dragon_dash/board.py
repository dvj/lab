from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

Coordinate = Tuple[int, int]


class BoardLoadError(RuntimeError):
    """Raised when a board file cannot be parsed or is invalid."""


@dataclass
class Board:
    """Represents a grid-based Dragon Dash board."""

    grid: List[List[str]]

    @property
    def height(self) -> int:
        return len(self.grid)

    @property
    def width(self) -> int:
        return len(self.grid[0]) if self.grid else 0

    @classmethod
    def from_file(cls, path: Path | str) -> "Board":
        path = Path(path)
        if not path.exists():
            raise BoardLoadError(f"Board file not found: {path}")
        rows: List[List[str]] = []
        with path.open() as fh:
            for raw_line in fh:
                line = raw_line.rstrip("\n")
                if not line:
                    continue
                rows.append(list(line))

        if not rows:
            raise BoardLoadError(f"Board file is empty: {path}")

        width = len(rows[0])
        for idx, row in enumerate(rows):
            if len(row) != width:
                raise BoardLoadError(
                    f"Board is not rectangular: row {idx} length {len(row)} != {width}"
                )

        return cls(rows)

    def find(self, token: str) -> List[Coordinate]:
        positions: List[Coordinate] = []
        for y, row in enumerate(self.grid):
            for x, val in enumerate(row):
                if val == token:
                    positions.append((x, y))
        return positions

    def is_walkable(self, pos: Coordinate) -> bool:
        x, y = pos
        if not (0 <= x < self.width and 0 <= y < self.height):
            return False
        return self.grid[y][x] in {"S", "G", ".", "D"}

    def neighbors(self, pos: Coordinate) -> Iterable[Coordinate]:
        x, y = pos
        candidates = [
            (x, y - 1),
            (x + 1, y),
            (x, y + 1),
            (x - 1, y),
        ]
        for cand in candidates:
            if self.is_walkable(cand):
                yield cand

    def with_tokens(
        self, hero: Coordinate, dragon: Coordinate
    ) -> Sequence[str]:
        """Return a human-friendly board view with hero and dragon overlays."""
        rendered: List[str] = []
        for y, row in enumerate(self.grid):
            rendered_row: List[str] = []
            for x, cell in enumerate(row):
                coord = (x, y)
                if coord == hero and coord == dragon:
                    rendered_row.append("X")  # capture
                elif coord == hero:
                    rendered_row.append("H")
                elif coord == dragon:
                    rendered_row.append("D")
                elif cell == "#":
                    rendered_row.append("█")
                elif cell == ".":
                    rendered_row.append("·")
                else:
                    rendered_row.append(cell)
            rendered.append("".join(rendered_row))
        return rendered

    def stringify(self, hero: Coordinate, dragon: Coordinate) -> str:
        return "\n".join(self.with_tokens(hero, dragon))
