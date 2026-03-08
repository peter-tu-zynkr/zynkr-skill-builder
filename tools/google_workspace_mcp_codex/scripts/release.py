# ruff: noqa

import json
import subprocess
import sys
import re
import webbrowser
from pathlib import Path


# Check for required dependencies before importing them
def check_dependencies():
    """Check if required dependencies are installed."""
    missing = []

    # Check for tomlkit
    try:
        import tomlkit
    except ImportError:
        missing.append("tomlkit")

    # Check for twine
    try:
        result = subprocess.run(["twine", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            missing.append("twine")
    except FileNotFoundError:
        missing.append("twine")

    if missing:
        print("❌ Error: Required dependencies are missing:", file=sys.stderr)
        for dep in missing:
            print(f"  - {dep}", file=sys.stderr)
        print("\nPlease install them with:", file=sys.stderr)
        print("  uv pip install --extra dev", file=sys.stderr)
        print("or:", file=sys.stderr)
        print("  uv sync --extra dev", file=sys.stderr)
        sys.exit(1)


check_dependencies()
import tomlkit

# --- Configuration ---
PYPROJECT_PATH = Path(__file__).parent.parent / "pyproject.toml"
SERVER_JSON_PATH = Path(__file__).parent.parent / "server.json"
README_PATH = Path(__file__).parent.parent / "README.md"
DIST_DIR = Path(__file__).parent.parent / "dist"

# --- Helper Functions ---


def run_command(command, check=True, interactive=False):
    """Executes a command, allowing for interactive input if specified."""
    try:
        print(f"🏃 Running: {' '.join(command)}")
        kwargs = {"check": check, "text": True, "encoding": "utf-8"}
        if not interactive:
            kwargs["capture_output"] = True

        result = subprocess.run(command, **kwargs)

        if not interactive:
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(result.stderr, file=sys.stderr)
        return result
    except FileNotFoundError:
        print(
            f"❌ Error: Command '{command[0]}' not found. Is it installed and in your PATH?",
            file=sys.stderr,
        )
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed with exit code {e.returncode}", file=sys.stderr)
        if not interactive and hasattr(e, "stderr"):
            print(e.stderr, file=sys.stderr)
        sys.exit(1)


def get_current_version():
    """Reads the current version from pyproject.toml."""
    if not PYPROJECT_PATH.exists():
        print(
            f"❌ Error: pyproject.toml not found at {PYPROJECT_PATH}", file=sys.stderr
        )
        sys.exit(1)
    with open(PYPROJECT_PATH, "r") as f:
        data = tomlkit.load(f)
    return data["project"]["version"]


def update_pyproject_version(new_version):
    """Updates the version in pyproject.toml."""
    with open(PYPROJECT_PATH, "r") as f:
        data = tomlkit.load(f)
    data["project"]["version"] = new_version
    with open(PYPROJECT_PATH, "w") as f:
        tomlkit.dump(data, f)
    print(f"✅ Version updated to {new_version} in pyproject.toml")


def update_server_json_version(new_version):
    """Updates the version fields in server.json."""
    if not SERVER_JSON_PATH.exists():
        print(f"❌ Error: server.json not found at {SERVER_JSON_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(SERVER_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    server_name = data.get("name", "").strip()
    if not server_name:
        print("❌ Error: server.json is missing a valid 'name' field.", file=sys.stderr)
        sys.exit(1)

    data["version"] = new_version

    packages = data.get("packages", [])
    if isinstance(packages, list):
        for package in packages:
            if package.get("registryType") == "pypi":
                package["version"] = new_version

    with open(SERVER_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    print(f"✅ Version updated to {new_version} in server.json")
    return server_name


def verify_readme_mcp_marker(server_name):
    """Ensure README contains the mcp-name ownership marker for PyPI validation."""
    if not README_PATH.exists():
        print(f"❌ Error: README.md not found at {README_PATH}", file=sys.stderr)
        sys.exit(1)

    expected_marker = f"mcp-name: {server_name}"
    readme_content = README_PATH.read_text(encoding="utf-8")
    if expected_marker not in readme_content:
        print(
            "❌ Error: README.md is missing the required MCP ownership marker.",
            file=sys.stderr,
        )
        print(f"Expected to find: {expected_marker}", file=sys.stderr)
        sys.exit(1)

    print("✅ README.md contains MCP ownership marker.")


def get_next_versions(current_version):
    """Calculates next patch, minor, and major versions."""
    major, minor, patch = map(int, current_version.split("."))
    return {
        "patch": f"{major}.{minor}.{patch + 1}",
        "minor": f"{major}.{minor + 1}.0",
        "major": f"{major + 1}.0.0",
    }


def select_version(current_version):
    """Prompts the user to select the next version."""
    next_versions = get_next_versions(current_version)
    print(f"\nCurrent version is {current_version}. Choose the next version:")
    options = list(next_versions.items())
    for i, (level, version) in enumerate(options):
        print(f"  {i + 1}) {level.capitalize()}: {version}")

    while True:
        try:
            choice = input(f"Enter your choice (1-{len(options)}): ")
            if 1 <= int(choice) <= len(options):
                return options[int(choice) - 1][1]
        except (ValueError, IndexError):
            pass
        print("Invalid choice. Please try again.")


# --- Main Release Logic ---


def main():
    """Main function to orchestrate the release process."""
    print("🚀 Starting the release process for google-workspace-mcp...")

    # 1. Pre-flight checks
    print("\n--- 1. Running Pre-flight Checks ---")
    git_status_output = run_command(["git", "status", "--porcelain"]).stdout
    if git_status_output:
        # Allow untracked files, but fail on modified or staged files.
        is_dirty = any(
            not line.startswith("??")
            for line in git_status_output.strip().split("\n")
            if line
        )
        if is_dirty:
            print(
                "❌ Error: Your git working directory has modified or staged files. Please commit or stash them.",
                file=sys.stderr,
            )
            print(git_status_output, file=sys.stderr)
            sys.exit(1)
    print("✅ Git working directory is clean (untracked files are ignored).")
    run_command(["git", "fetch", "--tags"])
    print("✅ Fetched latest git tags.")

    # 2. Version selection
    print("\n--- 2. Selecting Version ---")
    current_version = get_current_version()
    new_version = select_version(current_version)

    # 3. Update release metadata
    print("\n--- 3. Updating Version ---")
    update_pyproject_version(new_version)
    server_name = update_server_json_version(new_version)
    verify_readme_mcp_marker(server_name)

    # 4. Build the project
    print("\n--- 4. Building Project ---")
    if DIST_DIR.exists():
        print(f"🧹 Cleaning up old build artifacts in {DIST_DIR}...")
        import shutil

        shutil.rmtree(DIST_DIR)
    run_command(["uv", "build"])
    print(f"✅ Project built successfully in {DIST_DIR}")

    # 5. Git commit and tag
    print("\n--- 5. Committing and Tagging ---")
    tag_name = f"v{new_version}"
    run_command(["git", "add", str(PYPROJECT_PATH), str(SERVER_JSON_PATH)])
    run_command(["git", "commit", "-m", f"chore: release {tag_name}"])
    run_command(["git", "tag", "-a", tag_name, "-m", f"Release {tag_name}"])
    print(f"✅ Committed and tagged release {tag_name}")

    # 6. Push to GitHub
    print("\n--- 6. Pushing to GitHub ---")
    print("⚠️ Forcing push to overwrite remote branch history.")
    run_command(["git", "push", "--force", "origin", "HEAD", "--follow-tags"])
    print("✅ Pushed commit and tags to origin.")

    # 7. Upload to PyPI
    print("\n--- 7. Uploading to PyPI ---")
    print("🔑 You may be prompted to enter your PyPI API token.")
    run_command(
        ["twine", "upload", "--skip-existing", f"{DIST_DIR}/*"], interactive=True
    )
    print("✅ Successfully uploaded to PyPI (or skipped if already present).")

    # 8. Publish to MCP Registry
    print("\n--- 8. Publishing to MCP Registry ---")
    run_command(["mcp-publisher", "--version"])
    print(
        "🔑 Ensure you're authenticated (run 'mcp-publisher login github' once if needed)."
    )
    run_command(["mcp-publisher", "publish"], interactive=True)
    print("✅ Successfully published to MCP Registry.")

    # 9. Create GitHub Release
    print("\n--- 9. Creating GitHub Release ---")
    print("📝 Creating a draft release on GitHub...")

    # Get the list of distribution files
    dist_files = list(DIST_DIR.glob("*.whl")) + list(DIST_DIR.glob("*.tar.gz"))
    dist_file_paths = [str(f) for f in dist_files]

    if dist_file_paths:
        print(
            f"📦 Attaching {len(dist_file_paths)} distribution file(s) to the release:"
        )
        for file_path in dist_file_paths:
            print(f"  - {Path(file_path).name}")

    # Create release with distribution files
    release_command = [
        "gh",
        "release",
        "create",
        tag_name,
        "--draft",
        "--title",
        tag_name,
    ]
    release_command.extend(dist_file_paths)

    run_command(release_command, interactive=True)

    # Open the release in the browser for manual editing
    try:
        remote_url = run_command(["git", "remote", "get-url", "origin"]).stdout.strip()
        match = re.search(r"github\.com[/:](.+?)/(.+?)(?:\.git)?$", remote_url)
        if match:
            owner, repo = match.groups()
            release_url = f"https://github.com/{owner}/{repo}/releases/edit/{tag_name}"
            print(f"🌍 Opening your browser to edit the release: {release_url}")
            webbrowser.open(release_url)
        else:
            print("⚠️ Could not determine repository URL to open browser.")
    except Exception as e:
        print(f"⚠️ Could not open browser to edit release: {e}")

    print(f"✅ GitHub draft release for {tag_name} created.")

    print("\n🎉 Release process complete! 🎉")


if __name__ == "__main__":
    main()
