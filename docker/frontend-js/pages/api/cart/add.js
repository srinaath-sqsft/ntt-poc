import fetch from "node-fetch";

const endpoint = process.env["API_ENDPOINT"];

export default async function handler(req, res) {
  const response = await fetch(`${endpoint}/add-cart`, {
    method: req.method,
    mode: "cors",
    headers: req.headers,
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
}
