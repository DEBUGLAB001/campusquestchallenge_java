@REM ----------------------------------------------------------------------------
@REM NEXUSFLOW Maven Wrapper for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.

set "MVN_CMD=mvn"
where mvn >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.1.1.1\plugins\maven\lib\maven3\bin\mvn.cmd" (
        set "MVN_CMD=C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.1.1.1\plugins\maven\lib\maven3\bin\mvn.cmd"
    ) else if exist "%USERPROFILE%\Downloads\maven-mvnd-1.0.2-windows-amd64\maven-mvnd-1.0.2-windows-amd64\bin\mvnd.cmd" (
        set "MVN_CMD=%USERPROFILE%\Downloads\maven-mvnd-1.0.2-windows-amd64\maven-mvnd-1.0.2-windows-amd64\bin\mvnd.cmd"
    )
)

if "%1"=="test" goto run_tests
if "%2"=="test" goto run_tests
if "%1"=="spring-boot:run" goto run_app
if "%2"=="spring-boot:run" goto run_app

"%MVN_CMD%" %*
goto end

:run_app
if exist "%DIRNAME%api-gateway\target\api-gateway-1.0.0-SNAPSHOT-exec.jar" (
    java -jar "%DIRNAME%api-gateway\target\api-gateway-1.0.0-SNAPSHOT-exec.jar"
    goto end
)
"%MVN_CMD%" spring-boot:run -pl api-gateway
goto end

:run_tests
@REM Check if tests/target/classes exists, otherwise compile first quietly
if not exist "%DIRNAME%tests\target\classes" (
    "%MVN_CMD%" test-compile -q -DskipTests >nul 2>nul
)

@REM Execute NexusFlowBugTestRunner directly to print ONLY JSON with 0 Maven noise
java -Dfile.encoding=UTF-8 -cp "%DIRNAME%tests\target\classes;%DIRNAME%tests\target\test-classes;%DIRNAME%common-lib\target\classes;%DIRNAME%auth-service\target\classes;%DIRNAME%order-service\target\classes;%DIRNAME%inventory-service\target\classes;%DIRNAME%route-service\target\classes;%DIRNAME%driver-service\target\classes;%DIRNAME%analytics-service\target\classes;%DIRNAME%notification-service\target\classes;%DIRNAME%api-gateway\target\classes;%USERPROFILE%\.m2\repository\org\junit\jupiter\junit-jupiter-api\5.10.2\junit-jupiter-api-5.10.2.jar;%USERPROFILE%\.m2\repository\org\opentest4j\opentest4j\1.3.0\opentest4j-1.3.0.jar;*" com.nexusflow.tests.runner.NexusFlowBugTestRunner
if %ERRORLEVEL% neq 0 (
    @REM If direct java classpath failed, fallback to quiet maven exec plugin or surefire
    "%MVN_CMD%" test -q -Dtest=NexusFlowBugTestRunner -Dsurefire.useFile=false
)
goto end

:end
endlocal
