#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

# 1. Recompile latest source and package JAR (send all compiler output to stderr)
if command -v mvn.cmd >/dev/null 2>&1; then
    mvn.cmd -q compile jar:jar -DskipTests 1>&2
elif [ -x "./mvnw" ]; then
    ./mvnw -q compile jar:jar -DskipTests 1>&2
elif command -v mvn >/dev/null 2>&1; then
    mvn -q compile jar:jar -DskipTests 1>&2
else
    ./mvnw -q compile jar:jar -DskipTests 1>&2
fi

# Determine classpath separator (: on Linux, ; on Windows)
CP_SEP=":"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]] || [[ "$OS" == "Windows_NT" ]]; then
    CP_SEP=";"
fi

CP="target/classes${CP_SEP}target/app.jar"

# 2. Run TestRunner directly, printing pure JSON to stdout
exec java -cp "$CP" com.campusquest.TestRunner
