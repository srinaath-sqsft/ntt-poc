import fetch from "node-fetch";

const endpoint = process.env["API_ENDPOINT"];

export default async function handler(req, res) {
  const response = await fetch(`${endpoint}/products`, {
    headers: req.headers,
  });
  const products = await response.json();
  res.json(products);
}
