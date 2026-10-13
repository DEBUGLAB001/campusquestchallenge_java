#!/bin/sh
# ----------------------------------------------------------------------------
# NEXUSFLOW Maven Wrapper for Linux/macOS
# ----------------------------------------------------------------------------

DIRNAME="$(cd "$(dirname "$0")" && pwd)"

# Find mvn command
if command -v mvn >/dev/null 2>&1; then
    MVN_CMD="mvn"
elif [ -f "/usr/share/maven/bin/mvn" ]; then
    MVN_CMD="/usr/share/maven/bin/mvn"
else
    MVN_CMD="mvn"
fi

# If executing spring-boot:run, start api-gateway on 0.0.0.0:8080
if [ "$1" = "spring-boot:run" ] || [ "$2" = "spring-boot:run" ]; then
    if [ -f "$DIRNAME/api-gateway/target/api-gateway-1.0.0-SNAPSHOT-exec.jar" ]; then
        exec java -jar "$DIRNAME/api-gateway/target/api-gateway-1.0.0-SNAPSHOT-exec.jar"
    fi
    exec "$MVN_CMD" spring-boot:run -pl api-gateway
fi

# If executing tests, run the test runner to ensure ONLY JSON is outputted
if [ "$1" = "test" ] || [ "$2" = "test" ]; then
    if [ ! -d "$DIRNAME/tests/target/classes" ]; then
        "$MVN_CMD" test-compile -q -DskipTests >/dev/null 2>&1
    fi
    # Execute Runner directly to output strictly JSON without Maven banners
    CP="$DIRNAME/tests/target/classes:$DIRNAME/tests/target/test-classes:$DIRNAME/common-lib/target/classes:$DIRNAME/auth-service/target/classes:$DIRNAME/order-service/target/classes:$DIRNAME/inventory-service/target/classes:$DIRNAME/route-service/target/classes:$DIRNAME/driver-service/target/classes:$DIRNAME/analytics-service/target/classes:$DIRNAME/notification-service/target/classes:$DIRNAME/api-gateway/target/classes"
    for jar in "$HOME/.m2/repository/org/junit/jupiter/junit-jupiter-api"/*/*.jar \
               "$HOME/.m2/repository/org/opentest4j/opentest4j"/*/*.jar \
               "$HOME/.m2/repository/org/mockito/mockito-core"/*/*.jar \
               "$HOME/.m2/repository/net/bytebuddy/byte-buddy"/*/*.jar \
               "$HOME/.m2/repository/net/bytebuddy/byte-buddy-agent"/*/*.jar; do
        if [ -f "$jar" ]; then
            CP="$CP:$jar"
        fi
    done
    java -Dfile.encoding=UTF-8 -cp "$CP:*" com.nexusflow.tests.runner.NexusFlowBugTestRunner 2>/dev/null
    exit $?
fi

exec "$MVN_CMD" "$@"
