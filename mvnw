#!/bin/sh

DIRNAME="$(cd "$(dirname "$0")" && pwd)"

if command -v mvn >/dev/null 2>&1; then
    MVN_CMD="mvn"
elif [ -f "/usr/share/maven/bin/mvn" ]; then
    MVN_CMD="/usr/share/maven/bin/mvn"
else
    MVN_CMD="mvn"
fi

if [ "$1" = "spring-boot:run" ] || [ "$2" = "spring-boot:run" ]; then
    if [ -f "$DIRNAME/target/app.jar" ]; then
        exec java -jar "$DIRNAME/target/app.jar"
    fi
    exec "$MVN_CMD" spring-boot:run
fi

if [ "$1" = "test" ] || [ "$2" = "test" ]; then
    exec "$MVN_CMD" test
fi

exec "$MVN_CMD" "$@"
