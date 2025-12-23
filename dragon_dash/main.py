from __future__ import annotations

import argparse
import random
from pathlib import Path
from typing import List

from .board import Board, BoardLoadError, Coordinate
from .game import DragonDash, GameConfig

MOVE_LETTERS = {"w": (0, -1), "a": (-1, 0), "s": (0, 1), "d": (1, 0)}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Play a text version of Dragon Dash on an ASCII board. "
            "Use WASD to choose directions for the hero after each die roll."
        )
    )
    parser.add_argument(
        "--board",
        type=Path,
        default=Path(__file__).parent / "boards" / "default_board.txt",
        help="Path to a board text file (see README for format).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed for reproducible runs.",
    )
    parser.add_argument(
        "--max-rounds",
        type=int,
        default=None,
        help="Stop after this many rounds if neither side has won.",
    )
    return parser


def choose_direction_cli(current: Coordinate, options: List[Coordinate]) -> Coordinate:
    print("Choose a direction:")
    for idx, option in enumerate(options, start=1):
        print(f"  {idx}. {option}")
    while True:
        raw = input("Enter option number or WASD: ").strip().lower()
        if raw.isdigit():
            index = int(raw) - 1
            if 0 <= index < len(options):
                return options[index]
        elif raw in MOVE_LETTERS:
            dx, dy = MOVE_LETTERS[raw]
            desired = (current[0] + dx, current[1] + dy)
            if desired in options:
                return desired
        print("Invalid choice, try again.")


def print_status(game: DragonDash) -> None:
    print(game.describe_board())
    print()
    for entry in game.history[-3:]:
        print(entry)
    print()


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        board = Board.from_file(args.board)
    except BoardLoadError as exc:
        print(f"Could not load board: {exc}")
        return 1

    rng = random.Random(args.seed)
    config = GameConfig()
    game = DragonDash(board=board, rng=rng, config=config)

    print("Welcome to Dragon Dash!")
    print(
        "Get the hero (H) to the goal (G) before the dragon (D) catches you. "
        "Walls are shown as █ and walkable paths as ·"
    )
    print()
    round_limit = args.max_rounds or game.config.max_rounds

    while game.round <= round_limit:
        print_status(game)
        game.run_round(choose_direction=choose_direction_cli)
        if game.is_victory():
            print_status(game)
            print("You win! The hero escaped the dragon.")
            break
        if game.is_defeat():
            print_status(game)
            print("Oh no! The dragon caught the hero.")
            break
    else:
        print_status(game)
        print("The sun sets. The chase ends in a draw.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
