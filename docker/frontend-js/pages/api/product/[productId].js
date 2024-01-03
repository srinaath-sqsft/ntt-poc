import fetch from "node-fetch";

const endpoint = process.env["API_ENDPOINT"];
export default async function handler(req, res) {
  const { productId } = req.query;
  const fetchOptions = { headers: req.headers };
  const productRes = await fetch(
    `${endpoint}/product/${productId}`,
    fetchOptions
  );
  const recommendationsRes = await fetch(
    `${endpoint}/recommendations`,
    fetchOptions
  );
  const adsResponse = await fetch(`${endpoint}/ads`, fetchOptions);
  const product = await productRes.json();
  const recommendations = await recommendationsRes.json();
  const first4Recommendations = recommendations.slice(0, 4);
  const ads = await adsResponse.json();
  const productsParallel = first4Recommendations.map(
    async (id) => await fetch(`${endpoint}/product/${id}`, fetchOptions)
  );
  const productsResponse = await (
    await Promise.all(productsParallel)
  ).map((res) => res.json());
  const products = await Promise.all(productsResponse);
  res.json({ product, recommendations: products, ads: ads[0] });
}
