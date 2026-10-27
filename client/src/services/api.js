
const API_URL = "http://localhost:5000/api";

// Register a new user
export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
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
    method: "GET",
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

// Get all registered users except the logged-in user
export async function getUsers() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/users`, {
    method: "GET",
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

// Send a message to another user
export async function sendMessage(receiverId, text) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receiverId,
      text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send message");
  }

  return data.message;
}

// Get message history with another user
export async function getMessages(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/messages/${userId}`, {
    method: "GET",
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
