
import { getUsers } from "./services/api";

async function testUsers() {
  try {
    const users = await getUsers();
    console.log("Registered users:", users);
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
  }
}

testUsers();
