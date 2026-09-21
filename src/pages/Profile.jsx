import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

function Profile({ user, onLogout }) {
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
  if (onLogout) {
    onLogout();
  }
};

  return (
    <div className="min-h-screen bg-[#071426] px-5 py-6 text-white">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#20d9c2]">
          Siga Transit
        </p>
        <h1 className="mt-1 text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-white/55">
          Manage your account and app settings
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile information */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#20d9c2]/15 text-xl font-bold text-[#20d9c2]">
              {name.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-white">
                {name}
              </h2>

              <p className="truncate text-sm text-white/50">{email}</p>
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
          <h2 className="text-base font-semibold text-white">Settings</h2>

          <div className="mt-4 divide-y divide-white/10">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-white">
                  Notifications
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Receive journey and bus updates
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifications ? "bg-[#20d9c2]" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-[#071426] transition ${
                    notifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-white">Language</p>

                <p className="mt-1 text-xs text-white/40">
                  Application language
                </p>
              </div>

              <span className="text-sm font-medium text-white/70">
                English
              </span>
            </div>
          </div>
        </Card>

        {/* App information */}
        <Card>
          <h2 className="text-base font-semibold text-white">
            App Information
          </h2>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-white/50">Version</span>

            <span className="text-sm font-medium text-white/80">1.0.0</span>
          </div>
        </Card>

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
          <div className="w-full max-w-md rounded-t-[30px] bg-[#10243c] p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Edit Profile
              </h2>

              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
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

              <Button
                onClick={handleSaveProfile}
                className="bg-[#20d9c2] text-[#071426] hover:bg-[#18c5b0]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;