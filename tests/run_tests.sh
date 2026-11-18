#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c mvn -q compile jar:jar -DskipTests 1>&2
elif command -v mvn >/dev/null 2>&1; then
    mvn -q compile jar:jar -DskipTests 1>&2
elif [ -x "./mvnw" ]; then
    ./mvnw -q compile jar:jar -DskipTests 1>&2
elif command -v mvn.cmd >/dev/null 2>&1; then
    mvn.cmd -q compile jar:jar -DskipTests 1>&2
else
    ./mvnw -q compile jar:jar -DskipTests 1>&2
fi

JAVA_CMD="java"
if ! command -v java >/dev/null 2>&1 && command -v java.exe >/dev/null 2>&1; then
    JAVA_CMD="java.exe"
fi

CP_SEP=":"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]] || [[ "$OS" == "Windows_NT" ]] || [[ "$JAVA_CMD" == *".exe"* ]]; then
    CP_SEP=";"
fi

CP="target/classes${CP_SEP}target/app.jar"

exec "$JAVA_CMD" -cp "$CP" com.campusquest.TestRunner
