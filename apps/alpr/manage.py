import argparse
import os
import subprocess
import sys
import venv
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
VENV_DIR = ROOT / ".venv"
REQUIREMENTS_FILE = ROOT / "requirements.txt"


def _venv_bin(executable: str) -> Path:
    suffix = "Scripts" if os.name == "nt" else "bin"
    return VENV_DIR / suffix / executable


def _run(cmd: list[str], *, env: dict[str, str] | None = None) -> None:
    subprocess.run(cmd, check=True, cwd=ROOT, env=env)


def ensure_venv() -> None:
    if not VENV_DIR.exists():
        venv.create(VENV_DIR, with_pip=True)
    pip_executable = _venv_bin("pip")
    _run([str(pip_executable), "install", "-r", str(REQUIREMENTS_FILE)])


def cmd_setup(_: argparse.Namespace) -> None:
    ensure_venv()


def cmd_dev(args: argparse.Namespace) -> None:
    ensure_venv()
    python_executable = _venv_bin("python")
    port = os.getenv("PORT", "8000")
    cmd = [
        str(python_executable),
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "0.0.0.0",
        "--port",
        port,
    ]
    if args.reload:
        cmd.append("--reload")
    _run(cmd)


def cmd_start(args: argparse.Namespace) -> None:
    cmd_dev(args)


def cmd_build(_: argparse.Namespace) -> None:
    ensure_venv()
    python_executable = _venv_bin("python")
    _run([str(python_executable), "-m", "compileall", "main.py"])


def cmd_lint(_: argparse.Namespace) -> None:
    print("No lint step configured for apps/alpr", file=sys.stderr)


def cmd_check_types(_: argparse.Namespace) -> None:
    print("No type-check step configured for apps/alpr", file=sys.stderr)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage the ALPR service.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("setup", help="Create venv and install dependencies").set_defaults(
        func=cmd_setup
    )

    dev_parser = subparsers.add_parser("dev", help="Run the service with live reload")
    dev_parser.add_argument(
        "--no-reload", dest="reload", action="store_false", default=True
    )
    dev_parser.set_defaults(func=cmd_dev)

    start_parser = subparsers.add_parser("start", help="Run the service without reload")
    start_parser.set_defaults(func=cmd_start, reload=False)

    subparsers.add_parser("build", help="Compile python bytecode").set_defaults(func=cmd_build)
    subparsers.add_parser("lint", help="Placeholder lint task").set_defaults(func=cmd_lint)
    subparsers.add_parser("check-types", help="Placeholder type-check task").set_defaults(
        func=cmd_check_types
    )

    return parser


def main(argv: list[str] | None = None) -> None:
    parser = _parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main(sys.argv[1:])
