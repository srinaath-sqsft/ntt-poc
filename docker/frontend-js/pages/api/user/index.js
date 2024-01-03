import fetch from "node-fetch";

const endpoint = process.env["API_ENDPOINT"];

export default async function handler(req, res) {
  const response = await fetch(`${endpoint}/user`, {
    headers: req.headers,
  });
  const user = await response.json();
  res.json(user);
}
