#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Maven command resolution
MVN_CMD="mvn"
if command -v mvn.cmd >/dev/null 2>&1; then
    MVN_CMD="mvn.cmd"
elif [ -x "./mvnw" ]; then
    MVN_CMD="./mvnw"
fi

SERVER_PID=""

cleanup() {
    echo "[watcher] Stopping CampusQuest server..." >&2
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Fingerprint candidate-edited sources, frontend assets, and pom.xml (excluding target/)
compute_fingerprint() {
    find src pom.xml -type f 2>/dev/null | sort | xargs stat -c '%n %s %Y' 2>/dev/null | md5sum | cut -d' ' -f1
}

build_app() {
    echo "[watcher] Building CampusQuest..." >&2
    $MVN_CMD package -DskipTests -B 1>&2
    return $?
}

start_server() {
    # Copy to runner.jar to prevent OS file locks on target/app.jar during recompilation
    cp target/app.jar target/runner.jar
    echo "[watcher] Launching server on 0.0.0.0:3000..." >&2
    java -jar target/runner.jar 1>&2 &
    SERVER_PID=$!
    echo "[watcher] Server running with PID $SERVER_PID" >&2
}

stop_server() {
    if [ -n "$SERVER_PID" ]; then
        echo "[watcher] Stopping server (PID $SERVER_PID)..." >&2
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
        sleep 1
        SERVER_PID=""
    fi
}

echo "[watcher] Initial build starting..." >&2
if ! build_app; then
    echo "[watcher] Initial build failed! Please check compilation errors." >&2
    exit 1
fi

start_server

LAST_FINGERPRINT=$(compute_fingerprint)
echo "[watcher] Persistent watcher active. Monitoring Java sources, templates, assets, and pom.xml..." >&2

while true; do
    sleep 1
    CURRENT_FINGERPRINT=$(compute_fingerprint)
    if [ "$CURRENT_FINGERPRINT" != "$LAST_FINGERPRINT" ]; then
        echo "[watcher] Detected file modification. Debouncing editor saves..." >&2
        sleep 0.8
        CURRENT_FINGERPRINT=$(compute_fingerprint)
        LAST_FINGERPRINT="$CURRENT_FINGERPRINT"

        echo "[watcher] Recompiling application..." >&2
        if build_app; then
            echo "[watcher] Recompile successful. Seamlessly restarting server process..." >&2
            stop_server
            start_server
        else
            echo "[watcher] Recompile failed! Leaving existing server process active to preserve preview." >&2
        fi
    fi
done
