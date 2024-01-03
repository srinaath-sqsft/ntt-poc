import fetch from "node-fetch";

const endpoint = process.env["API_ENDPOINT"];
export default async function handler(req, res) {
  const fetchOptions = { headers: req.headers };
  const cartRes = await fetch(`${endpoint}/cart`, fetchOptions);
  const recommendationsRes = await fetch(
    `${endpoint}/recommendations`,
    fetchOptions
  );
  const recommendations = await recommendationsRes.json();
  const first4Recommendations = recommendations.slice(0, 4);
  const productsParallel = first4Recommendations.map(
    async (id) => await fetch(`${endpoint}/product/${id}`, fetchOptions)
  );
  const productsResponse = await (
    await Promise.all(productsParallel)
  ).map((res) => res.json());
  const products = await Promise.all(productsResponse);

  let { items } = await cartRes.json();
  if (items.length === 0) {
    res.json({
      recommendations: products,
      items: [],
    });
    return;
  }
  const cartProductsResp = items.map(
    async (item) =>
      await fetch(`${endpoint}/product/${item.product_id}`, fetchOptions)
  );
  const cartProdJson = await (await Promise.all(cartProductsResp)).map((res) =>
    res.json()
  );
  const cartProducts = await Promise.all(cartProdJson);
  items = items.map((item, index) => ({ ...item, ...cartProducts[index] }));
  res.json({ items, recommendations: products });
}
