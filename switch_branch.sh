#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

TARGET_STATE="$1"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ -z "$TARGET_STATE" ]; then
    echo "Current active branch: $CURRENT_BRANCH"
    echo "Usage: ./switch_branch.sh [baseline | solved]"
    exit 0
fi

# Safety check: refuse if uncommitted changes exist
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Working tree has uncommitted modifications." >&2
    echo "Refusing to switch branches to prevent loss of candidate work." >&2
    echo "Please commit or stash your changes first." >&2
    git status --short >&2
    exit 1
fi

case "$TARGET_STATE" in
    baseline|challenge-baseline-campuquest)
        TARGET_BRANCH="challenge-baseline-campuquest"
        ;;
    solved|challenge-solved-campuquest)
        TARGET_BRANCH="challenge-solved-campuquest"
        ;;
    *)
        echo "Unknown target state: $TARGET_STATE" >&2
        echo "Valid targets: baseline, solved" >&2
        exit 1
        ;;
esac

if [ "$CURRENT_BRANCH" = "$TARGET_BRANCH" ]; then
    echo "Already on branch: $TARGET_BRANCH"
    exit 0
fi

echo "Switching from $CURRENT_BRANCH to $TARGET_BRANCH..."
git checkout "$TARGET_BRANCH"
echo "Successfully switched to: $(git rev-parse --abbrev-ref HEAD)"
