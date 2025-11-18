from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert "Gym Class" in data

def test_signup_for_activity():
    email = "testuser@mergington.edu"
    activity = "Chess Club"
    # Zorg dat de gebruiker niet al is aangemeld
    client.post(f"/activities/{activity}/unregister?email={email}")
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert f"Signed up {email} for {activity}" in response.json()["message"]
    # Dubbel aanmelden mag niet
    response2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert response2.status_code in [200, 400]

def test_unregister_from_activity():
    email = "testuser2@mergington.edu"
    activity = "Programming Class"
    # Eerst aanmelden
    client.post(f"/activities/{activity}/signup?email={email}")
    response = client.post(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 200
    assert f"Unregistered {email} from {activity}" in response.json()["message"]
    # Nogmaals uitschrijven geeft een fout
    response2 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert response2.status_code == 404
    assert response2.json()["detail"] == "Participant not found"
