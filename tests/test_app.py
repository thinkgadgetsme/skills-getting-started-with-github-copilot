from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Ensure a known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity_name = "Chess Club"
    test_email = "test_user@example.com"

    # Ensure clean starting state for this email
    if test_email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(test_email)

    # Signup
    signup_resp = client.post(f"/activities/{activity_name}/signup?email={test_email}")
    assert signup_resp.status_code == 200
    signup_json = signup_resp.json()
    assert "Signed up" in signup_json.get("message", "")
    # Verify participant is present via GET
    get_resp = client.get("/activities")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert test_email in data[activity_name]["participants"]

    # Unregister
    unregister_resp = client.post(f"/activities/{activity_name}/unregister?email={test_email}")
    assert unregister_resp.status_code == 200
    unregister_json = unregister_resp.json()
    assert "Unregistered" in unregister_json.get("message", "")

    # Verify removal
    get_resp2 = client.get("/activities")
    assert get_resp2.status_code == 200
    data2 = get_resp2.json()
    assert test_email not in data2[activity_name]["participants"]
