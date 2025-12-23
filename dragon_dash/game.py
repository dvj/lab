from __future__ import annotations

import random
from collections import deque
from dataclasses import dataclass
from typing import Callable, Iterable, List, Optional, Tuple

from .board import Board, BoardLoadError, Coordinate


@dataclass
class GameConfig:
    """Configuration knobs for the Dragon Dash rules."""

    hero_roll: Tuple[int, int] = (1, 4)
    dragon_roll: Tuple[int, int] = (1, 3)
    max_rounds: int = 60


class DragonDash:
    """Runs the Dragon Dash game loop on a provided board."""

    def __init__(
        self,
        board: Board,
        rng: Optional[random.Random] = None,
        config: Optional[GameConfig] = None,
    ) -> None:
        self.board = board
        self.rng = rng or random.Random()
        self.config = config or GameConfig()

        start_positions = board.find("S")
        dragon_positions = board.find("D")
        goal_positions = board.find("G")

        if not start_positions:
            raise BoardLoadError("Board must contain a single start tile 'S'")
        if len(start_positions) > 1:
            raise BoardLoadError("Board must only have one start tile 'S'")
        if not goal_positions:
            raise BoardLoadError("Board must contain a goal tile 'G'")
        if len(goal_positions) > 1:
            raise BoardLoadError("Board must only have one goal tile 'G'")
        if not dragon_positions:
            raise BoardLoadError("Board must contain at least one dragon tile 'D'")

        self.hero: Coordinate = start_positions[0]
        self.dragon: Coordinate = dragon_positions[0]
        self.goal: Coordinate = goal_positions[0]
        self.round: int = 1
        self.history: List[str] = []

    def roll_hero_steps(self) -> int:
        steps = self.rng.randint(*self.config.hero_roll)
        self.history.append(f"Rolled {steps} for hero movement.")
        return steps

    def roll_dragon_steps(self) -> int:
        steps = self.rng.randint(*self.config.dragon_roll)
        self.history.append(f"Rolled {steps} for dragon movement.")
        return steps

    def _shortest_path_step(self, start: Coordinate, goal: Coordinate) -> Optional[Coordinate]:
        """Return the next step on a shortest path from start to goal."""
        queue: deque[Coordinate] = deque([start])
        came_from: dict[Coordinate, Optional[Coordinate]] = {start: None}

        while queue:
            current = queue.popleft()
            if current == goal:
                break
            for neighbor in self.board.neighbors(current):
                if neighbor not in came_from:
                    came_from[neighbor] = current
                    queue.append(neighbor)

        if goal not in came_from:
            return None

        step = goal
        while came_from[step] and came_from[step] != start:
            step = came_from[step]
        return step

    def move_dragon_toward_hero(self, steps: int) -> None:
        for _ in range(steps):
            next_step = self._shortest_path_step(self.dragon, self.hero)
            if not next_step:
                self.history.append("Dragon is blocked and cannot move this turn.")
                break
            self.dragon = next_step
            if self.dragon == self.hero:
                self.history.append("The dragon catches the hero!")
                break

    def hero_choices(self) -> List[Coordinate]:
        options = list(self.board.neighbors(self.hero))
        if self.dragon in options:
            options.remove(self.dragon)
        return options

    def move_hero(
        self,
        steps: int,
        choose_direction: Callable[[Coordinate, List[Coordinate]], Coordinate],
    ) -> None:
        for _ in range(steps):
            options = self.hero_choices()
            if not options:
                self.history.append("Hero is blocked and loses the remaining movement.")
                return
            chosen = choose_direction(self.hero, options)
            if chosen not in options:
                raise ValueError("Invalid move chosen.")
            self.hero = chosen
            if self.hero == self.goal:
                self.history.append("Hero reached the goal!")
                return

    def is_victory(self) -> bool:
        return self.hero == self.goal

    def is_defeat(self) -> bool:
        return self.hero == self.dragon

    def describe_board(self) -> str:
        return self.board.stringify(self.hero, self.dragon)

    def run_round(
        self,
        choose_direction: Callable[[Coordinate, List[Coordinate]], Coordinate],
    ) -> None:
        self.history.append(f"\nRound {self.round}")
        hero_steps = self.roll_hero_steps()
        self.move_hero(hero_steps, choose_direction)
        if not (self.is_victory() or self.is_defeat()):
            dragon_steps = self.roll_dragon_steps()
            self.move_dragon_toward_hero(dragon_steps)
        self.round += 1

    def play(
        self,
        choose_direction: Callable[[Coordinate, List[Coordinate]], Coordinate],
        max_rounds: Optional[int] = None,
    ) -> str:
        target_rounds = max_rounds or self.config.max_rounds
        while self.round <= target_rounds:
            self.run_round(choose_direction)
            if self.is_victory():
                return "victory"
            if self.is_defeat():
                return "defeat"
        return "timeout"
