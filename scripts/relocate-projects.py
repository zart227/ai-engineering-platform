#!/usr/bin/env python3
"""Move scattered projects into ~/Projects and keep Cursor chats attached.

Default is a dry-run. Close Cursor on your computer, then:

  python3 scripts/relocate-projects.py
  python3 scripts/relocate-projects.py --apply
  python3 scripts/relocate-projects.py --apply --clean-junk

Cursor keys chats by folder path. After a move this script:
  1. leaves a symlink at the old path
  2. rewrites workspace.json / recently-opened URIs
  3. renames ~/.cursor/projects/<old-slug> to the new slug
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable
from urllib.parse import quote, unquote, urlparse

HOME = Path.home()
TARGET = Path(os.environ.get("PROJECTS_DIR", str(HOME / "Projects")))

SKIP_TOP = {
    "Projects",
    "projects",
    "Library",
    "Applications",
    "Desktop",
    "Downloads",
    "Documents",
    "Pictures",
    "Music",
    "Movies",
    "Public",
    "Sites",
    ".Trash",
    "Trash",
    "node_modules",
    ".cursor",
    ".cursor-server",
    ".npm",
    ".nvm",
    ".git",
    "go",
    "snap",
    "bin",
}

SCAN_EXTRA = ("Desktop", "Documents")

PROJECT_MARKERS = (
    ".git",
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "composer.json",
    "Gemfile",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "xcodeproj",
    "Package.swift",
)

JUNK_ROOT_EXACT = {".DS_Store", ".localized", "Thumbs.db", "desktop.ini"}
JUNK_ROOT_SUFFIXES = (".tmp", ".temp", ".log", ".bak")
JUNK_EMPTY_NAMES = {
    "untitled folder",
    "untitled folder 1",
    "untitled folder 2",
    "новая папка",
    "новая папка 2",
    "new folder",
    "new folder 1",
}


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def cursor_app_running() -> bool:
    if platform.system() != "Darwin":
        return False
    try:
        out = subprocess.run(
            ["pgrep", "-x", "Cursor"],
            capture_output=True,
            text=True,
            check=False,
        )
        return out.returncode == 0 and bool(out.stdout.strip())
    except FileNotFoundError:
        return False


def is_project(path: Path) -> bool:
    if not path.is_dir() or path.is_symlink():
        return False
    if (path / ".git").exists():
        return True
    for name in PROJECT_MARKERS:
        if name == ".git":
            continue
        if name == "xcodeproj":
            if any(path.glob("*.xcodeproj")):
                return True
            continue
        if (path / name).exists():
            return True
    return False


def iter_candidates() -> Iterable[Path]:
    for child in sorted(HOME.iterdir()):
        if child.name.startswith(".") and child.name not in {".Trash"}:
            continue
        if child.name in SKIP_TOP:
            continue
        if child.is_dir() and not child.is_symlink():
            yield child
    for extra in SCAN_EXTRA:
        root = HOME / extra
        if not root.is_dir():
            continue
        try:
            children = sorted(root.iterdir())
        except PermissionError:
            continue
        for child in children:
            if child.name.startswith("."):
                continue
            if child.is_dir() and not child.is_symlink():
                yield child


def cursor_project_slug(path: Path) -> str:
    resolved = str(path.expanduser().absolute())
    if platform.system() == "Windows":
        resolved = resolved.replace("\\", "/")
        if len(resolved) >= 2 and resolved[1] == ":":
            resolved = resolved[0] + resolved[2:]
    return resolved.lstrip("/").replace("/", "-")


def slug_aliases(path: Path) -> list[str]:
    slug = cursor_project_slug(path)
    aliases = [slug, f"-{slug}"]
    # Some Cursor builds used only the folder name.
    aliases.append(path.name)
    seen: list[str] = []
    for item in aliases:
        if item and item not in seen:
            seen.append(item)
    return seen


def path_to_uri(path: Path) -> str:
    parts = path.expanduser().absolute().parts
    if parts and parts[0] == "/":
        encoded = "/".join(quote(part, safe="") for part in parts[1:])
        return "file:///" + encoded
    encoded = "/".join(quote(part, safe="") for part in parts)
    return "file:///" + encoded


def cursor_workspace_roots() -> list[Path]:
    roots: list[Path] = []
    if platform.system() == "Darwin":
        roots.append(
            HOME
            / "Library/Application Support/Cursor/User/workspaceStorage"
        )
    roots.extend(
        [
            HOME / ".config/Cursor/User/workspaceStorage",
            HOME / ".cursor-server/data/User/workspaceStorage",
        ]
    )
    return [root for root in roots if root.is_dir()]


def cursor_storage_json_paths() -> list[Path]:
    paths = [
        HOME / "Library/Application Support/Cursor/User/globalStorage/storage.json",
        HOME / ".config/Cursor/User/globalStorage/storage.json",
        HOME / ".cursor-server/data/User/globalStorage/storage.json",
    ]
    return [path for path in paths if path.is_file()]


def replace_uri_tree(data: object, old_uri: str, new_uri: str) -> tuple[object, bool]:
    changed = False
    if isinstance(data, str):
        if old_uri in data:
            return data.replace(old_uri, new_uri), True
        # Also match decoded / encoded variants.
        old_decoded = unquote(old_uri)
        if old_decoded != old_uri and old_decoded in data:
            return data.replace(old_decoded, unquote(new_uri)), True
        return data, False
    if isinstance(data, list):
        out = []
        for item in data:
            new_item, item_changed = replace_uri_tree(item, old_uri, new_uri)
            changed = changed or item_changed
            out.append(new_item)
        return out, changed
    if isinstance(data, dict):
        out = {}
        for key, value in data.items():
            new_value, item_changed = replace_uri_tree(value, old_uri, new_uri)
            changed = changed or item_changed
            out[key] = new_value
        return out, changed
    return data, False


def rewrite_json_file(path: Path, old_uri: str, new_uri: str, apply: bool) -> bool:
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
    except (OSError, json.JSONDecodeError):
        return False
    new_data, changed = replace_uri_tree(data, old_uri, new_uri)
    extra, extra_changed = replace_uri_tree(
        new_data,
        unquote(urlparse(old_uri).path),
        unquote(urlparse(new_uri).path),
    )
    new_data, changed = extra, changed or extra_changed
    if not changed:
        return False
    print(f"  Cursor JSON: {path}")
    if apply:
        backup = path.with_suffix(path.suffix + ".bak")
        if not backup.exists():
            shutil.copy2(path, backup)
        path.write_text(json.dumps(new_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return True


def remap_cursor(old: Path, new: Path, apply: bool) -> None:
    old_uri = path_to_uri(old)
    new_uri = path_to_uri(new)
    for root in cursor_workspace_roots():
        for json_path in root.glob("*/workspace.json"):
            rewrite_json_file(json_path, old_uri, new_uri, apply)
    for storage in cursor_storage_json_paths():
        rewrite_json_file(storage, old_uri, new_uri, apply)

    projects_root = HOME / ".cursor" / "projects"
    if not projects_root.is_dir():
        return
    new_slug = cursor_project_slug(new)
    dest_cache = projects_root / new_slug
    for old_slug in slug_aliases(old):
        src_cache = projects_root / old_slug
        if not src_cache.is_dir():
            continue
        if src_cache.resolve() == dest_cache.resolve():
            continue
        print(f"  Cursor chats: {src_cache} -> {dest_cache}")
        if not apply:
            continue
        if dest_cache.exists():
            print(f"  skip cache rename, already exists: {dest_cache}")
            continue
        dest_cache.parent.mkdir(parents=True, exist_ok=True)
        src_cache.rename(dest_cache)


def unique_dest(name: str) -> Path:
    dest = TARGET / name
    if not dest.exists():
        return dest
    n = 2
    while True:
        candidate = TARGET / f"{name}-{n}"
        if not candidate.exists():
            return candidate
        n += 1


def move_project(src: Path, apply: bool) -> Path:
    dest = unique_dest(src.name)
    print(f"Project: {src} -> {dest}")
    remap_cursor(src, dest, apply)
    if apply:
        TARGET.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
        if not src.exists():
            src.symlink_to(dest, target_is_directory=True)
        print("  moved, symlink left at the old path")
    return dest


def junk_candidates() -> list[Path]:
    found: list[Path] = []
    try:
        children = list(HOME.iterdir())
    except PermissionError:
        return found
    for child in children:
        name = child.name
        if name in JUNK_ROOT_EXACT:
            found.append(child)
            continue
        if name.startswith("._"):
            found.append(child)
            continue
        lower = name.lower()
        if any(lower.endswith(suffix) for suffix in JUNK_ROOT_SUFFIXES):
            found.append(child)
            continue
        if child.is_dir() and not child.is_symlink() and lower in JUNK_EMPTY_NAMES:
            try:
                if not any(child.iterdir()):
                    found.append(child)
            except PermissionError:
                pass
    return found


def clean_junk(apply: bool) -> None:
    items = junk_candidates()
    if not items:
        print("Junk at home root: none")
        return
    print("Junk at home root:")
    for item in items:
        print(f"  {item}")
        if apply:
            if item.is_dir() and not item.is_symlink():
                shutil.rmtree(item)
            else:
                item.unlink(missing_ok=True)
            print("    deleted")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Собрать проекты из домашней папки в ~/Projects и не потерять чаты Cursor."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Действительно перенести. Без флага только показывает план.",
    )
    parser.add_argument(
        "--clean-junk",
        action="store_true",
        help="Удалить явный мусор в корне домашней папки (.DS_Store, пустые «Новая папка», .tmp).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Не останавливаться, если Cursor ещё открыт.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    apply = args.apply
    print(f"Home:    {HOME}")
    print(f"Target:  {TARGET}")
    print(f"Mode:    {'APPLY' if apply else 'DRY-RUN'}")
    print()

    if apply and cursor_app_running() and not args.force:
        eprint("Cursor ещё открыт. Закрой приложение и запусти снова, либо добавь --force.")
        return 1

    projects = [path for path in iter_candidates() if is_project(path)]
    others = [path for path in iter_candidates() if not is_project(path)]

    if not projects:
        print("Git/code проектов в корне домашней, Desktop и Documents не нашлось.")
    else:
        for path in projects:
            move_project(path, apply)

    leftover = [path for path in others if path.parent == HOME]
    if leftover:
        print()
        print("Не проекты, оставляю:")
        for path in leftover:
            print(f"  {path}")

    print()
    clean_junk(apply and args.clean_junk)
    if args.clean_junk and not apply:
        print("(мусор не удалён: это dry-run, нужен --apply --clean-junk)")

    print()
    if not apply:
        print("Ничего не трогал. Если список ок, закрой Cursor и запусти:")
        print("  python3 scripts/relocate-projects.py --apply --clean-junk")
        print()
        print("После переноса открывай проект из ~/Projects. Симлинк на старом месте")
        print("и правка workspace.json нужны, чтобы старые чаты остались на месте.")
    else:
        print("Готово. Открой Cursor заново через ~/Projects/<имя>.")
        print("Если чатов не видно, зайди по старому пути (там симлинк).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
