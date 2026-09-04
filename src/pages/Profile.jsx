import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

function Profile() {
  const [notifications, setNotifications] = useState(true);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("Hirwa Shalom");
  const [email, setEmail] = useState("hirwa@example.com");

  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);

  const handleEditProfile = () => {
    setEditName(name);
    setEditEmail(email);
    setEditing(true);
  };

  const handleSaveProfile = () => {
    setName(editName);
    setEmail(editEmail);
    setEditing(false);

    alert("Profile updated successfully.");
  };

  const handleLogout = () => {
    alert("Logout will be connected to authentication later.");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and app settings
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile information */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              {name.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {name}
              </h2>

              <p className="truncate text-sm text-gray-500">{email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="small"
            onClick={handleEditProfile}
            className="mt-4"
          >
            Edit Profile
          </Button>
        </Card>

        {/* Settings */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>

          <div className="mt-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Notifications
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Receive journey and bus updates
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifications ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    notifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Language</p>

                <p className="mt-1 text-xs text-gray-400">
                  Application language
                </p>
              </div>

              <span className="text-sm font-medium text-gray-600">
                English
              </span>
            </div>
          </div>
        </Card>

        {/* App information */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900">
            App Information
          </h2>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Version</span>

            <span className="text-sm font-medium text-gray-700">1.0.0</span>
          </div>
        </Card>

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Profile
              </h2>

              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
              />

              <Input
                label="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;