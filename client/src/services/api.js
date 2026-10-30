
const API_URL = "http://localhost:5000/api";

// Register a new user
export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

// Login user
export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

// Get currently logged-in user
export async function getCurrentUser() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
  }

  return data.user;
}

// Get all registered users
export async function getUsers() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }

  return data.users;
}

// Send a message
export async function sendMessage(receiverId, text) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiverId, text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send message");
  }

  return data.message;
}

// Get message history
export async function getMessages(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch messages");
  }

  return data.messages;
}

// Get unread message counts
export async function getUnreadCounts() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages/unread-counts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch unread counts");
  }

  return data.unreadCounts;
}

// Mark messages as read
export async function markMessagesRead(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages/${userId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to mark messages as read");
  }

  return data;
}

// Edit a message
export async function editMessage(messageId, text) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to edit message");
  }

  return data.updatedMessage;
}

// Delete a message for everyone
export async function deleteMessageForEveryone(messageId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/messages/${messageId}/everyone`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete message");
  }

  return data.deletedMessage;
}

// Delete a message only for the current user
export async function deleteMessageForMe(messageId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/messages/${messageId}/me`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete message");
  }

  return data.deletedMessage;
}

// Update current user's profile.
export async function updateProfile(profileData) {
  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile.");
  }

  return data.user;
}