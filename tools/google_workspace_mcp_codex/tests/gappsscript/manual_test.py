"""
Manual E2E test script for Apps Script integration.

This script tests Apps Script tools against the real Google API.
Requires valid OAuth credentials and enabled Apps Script API.

Usage:
    python tests/gappsscript/manual_test.py

Environment Variables:
    GOOGLE_CLIENT_SECRET_PATH: Path to client_secret.json (default: ./client_secret.json)
    GOOGLE_TOKEN_PATH: Path to store OAuth token (default: ./test_token.pickle)

Note: This will create real Apps Script projects in your account.
      Delete test projects manually after running.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle


SCOPES = [
    "https://www.googleapis.com/auth/script.projects",
    "https://www.googleapis.com/auth/script.deployments",
    "https://www.googleapis.com/auth/script.processes",
    "https://www.googleapis.com/auth/drive.readonly",  # For listing script projects
    "https://www.googleapis.com/auth/userinfo.email",  # Basic user info
    "openid",  # Required by Google OAuth
]

# Allow http://localhost for OAuth (required for headless auth)
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Default paths (can be overridden via environment variables)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DEFAULT_CLIENT_SECRET = os.path.join(PROJECT_ROOT, "client_secret.json")
DEFAULT_TOKEN_PATH = os.path.join(PROJECT_ROOT, "test_token.pickle")


def get_credentials():
    """
    Get OAuth credentials for Apps Script API.

    Credential paths can be configured via environment variables:
    - GOOGLE_CLIENT_SECRET_PATH: Path to client_secret.json
    - GOOGLE_TOKEN_PATH: Path to store/load OAuth token

    Returns:
        Credentials object
    """
    creds = None
    token_path = os.environ.get("GOOGLE_TOKEN_PATH", DEFAULT_TOKEN_PATH)
    client_secret_path = os.environ.get(
        "GOOGLE_CLIENT_SECRET_PATH", DEFAULT_CLIENT_SECRET
    )

    if os.path.exists(token_path):
        with open(token_path, "rb") as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(client_secret_path):
                print(f"Error: {client_secret_path} not found")
                print("\nTo fix this:")
                print("1. Go to Google Cloud Console > APIs & Services > Credentials")
                print("2. Create an OAuth 2.0 Client ID (Desktop application type)")
                print("3. Download the JSON and save as client_secret.json")
                print(f"\nExpected path: {client_secret_path}")
                print("\nOr set GOOGLE_CLIENT_SECRET_PATH environment variable")
                sys.exit(1)

            flow = InstalledAppFlow.from_client_secrets_file(client_secret_path, SCOPES)
            # Set redirect URI to match client_secret.json
            flow.redirect_uri = "http://localhost"
            # Headless flow: user copies redirect URL after auth
            auth_url, _ = flow.authorization_url(prompt="consent")
            print("\n" + "=" * 60)
            print("HEADLESS AUTH")
            print("=" * 60)
            print("\n1. Open this URL in any browser:\n")
            print(auth_url)
            print("\n2. Sign in and authorize the app")
            print("3. You'll be redirected to http://localhost (won't load)")
            print("4. Copy the FULL URL from browser address bar")
            print("   (looks like: http://localhost/?code=4/0A...&scope=...)")
            print("5. Paste it below:\n")
            redirect_response = input("Paste full redirect URL: ").strip()
            flow.fetch_token(authorization_response=redirect_response)
            creds = flow.credentials

        with open(token_path, "wb") as token:
            pickle.dump(creds, token)

    return creds


async def test_list_projects(drive_service):
    """Test listing Apps Script projects using Drive API"""
    print("\n=== Test: List Projects ===")

    from gappsscript.apps_script_tools import _list_script_projects_impl

    try:
        result = await _list_script_projects_impl(
            service=drive_service, user_google_email="test@example.com", page_size=10
        )
        print(result)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def test_create_project(service):
    """Test creating a new Apps Script project"""
    print("\n=== Test: Create Project ===")

    from gappsscript.apps_script_tools import _create_script_project_impl

    try:
        result = await _create_script_project_impl(
            service=service,
            user_google_email="test@example.com",
            title="MCP Test Project",
        )
        print(result)

        if "Script ID:" in result:
            script_id = result.split("Script ID: ")[1].split("\n")[0]
            return script_id
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None


async def test_get_project(service, script_id):
    """Test retrieving project details"""
    print(f"\n=== Test: Get Project {script_id} ===")

    from gappsscript.apps_script_tools import _get_script_project_impl

    try:
        result = await _get_script_project_impl(
            service=service, user_google_email="test@example.com", script_id=script_id
        )
        print(result)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def test_update_content(service, script_id):
    """Test updating script content"""
    print(f"\n=== Test: Update Content {script_id} ===")

    from gappsscript.apps_script_tools import _update_script_content_impl

    files = [
        {
            "name": "appsscript",
            "type": "JSON",
            "source": """{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}""",
        },
        {
            "name": "Code",
            "type": "SERVER_JS",
            "source": """function testFunction() {
  Logger.log('Hello from MCP test!');
  return 'Test successful';
}""",
        },
    ]

    try:
        result = await _update_script_content_impl(
            service=service,
            user_google_email="test@example.com",
            script_id=script_id,
            files=files,
        )
        print(result)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def test_run_function(service, script_id):
    """Test running a script function"""
    print(f"\n=== Test: Run Function {script_id} ===")

    from gappsscript.apps_script_tools import _run_script_function_impl

    try:
        result = await _run_script_function_impl(
            service=service,
            user_google_email="test@example.com",
            script_id=script_id,
            function_name="testFunction",
            dev_mode=True,
        )
        print(result)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def test_create_deployment(service, script_id):
    """Test creating a deployment"""
    print(f"\n=== Test: Create Deployment {script_id} ===")

    from gappsscript.apps_script_tools import _create_deployment_impl

    try:
        result = await _create_deployment_impl(
            service=service,
            user_google_email="test@example.com",
            script_id=script_id,
            description="MCP Test Deployment",
        )
        print(result)

        if "Deployment ID:" in result:
            deployment_id = result.split("Deployment ID: ")[1].split("\n")[0]
            return deployment_id
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None


async def test_list_deployments(service, script_id):
    """Test listing deployments"""
    print(f"\n=== Test: List Deployments {script_id} ===")

    from gappsscript.apps_script_tools import _list_deployments_impl

    try:
        result = await _list_deployments_impl(
            service=service, user_google_email="test@example.com", script_id=script_id
        )
        print(result)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def test_list_processes(service):
    """Test listing script processes"""
    print("\n=== Test: List Processes ===")

    from gappsscript.apps_script_tools import _list_script_processes_impl

    try:
        result = await _list_script_processes_impl(
            service=service, user_google_email="test@example.com", page_size=10
        )
        print(result)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def cleanup_test_project(service, script_id):
    """
    Cleanup test project (requires Drive API).
    Note: Apps Script API does not have a delete endpoint.
    Projects must be deleted via Drive API by moving to trash.
    """
    print(f"\n=== Cleanup: Delete Project {script_id} ===")
    print("Note: Apps Script projects must be deleted via Drive API")
    print(f"Please manually delete: https://script.google.com/d/{script_id}/edit")


async def run_all_tests():
    """Run all manual tests"""
    print("=" * 60)
    print("Apps Script MCP Manual Test Suite")
    print("=" * 60)

    print("\nGetting OAuth credentials...")
    creds = get_credentials()

    print("Building API services...")
    script_service = build("script", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    test_script_id = None
    deployment_id = None

    try:
        success = await test_list_projects(drive_service)
        if not success:
            print("\nWarning: List projects failed")

        test_script_id = await test_create_project(script_service)
        if test_script_id:
            print(f"\nCreated test project: {test_script_id}")

            await test_get_project(script_service, test_script_id)
            await test_update_content(script_service, test_script_id)

            await asyncio.sleep(2)

            await test_run_function(script_service, test_script_id)

            deployment_id = await test_create_deployment(script_service, test_script_id)
            if deployment_id:
                print(f"\nCreated deployment: {deployment_id}")

            await test_list_deployments(script_service, test_script_id)
        else:
            print("\nSkipping tests that require a project (creation failed)")

        await test_list_processes(script_service)

    finally:
        if test_script_id:
            await cleanup_test_project(script_service, test_script_id)

    print("\n" + "=" * 60)
    print("Manual Test Suite Complete")
    print("=" * 60)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Manual E2E test for Apps Script")
    parser.add_argument(
        "--yes", "-y", action="store_true", help="Skip confirmation prompt"
    )
    args = parser.parse_args()

    print("\nIMPORTANT: This script will:")
    print("1. Create a test Apps Script project in your account")
    print("2. Run various operations on it")
    print("3. Leave the project for manual cleanup")
    print("\nYou must manually delete the test project after running this.")

    if not args.yes:
        response = input("\nContinue? (yes/no): ")
        if response.lower() not in ["yes", "y"]:
            print("Aborted")
            return

    asyncio.run(run_all_tests())


if __name__ == "__main__":
    main()
