import React from "react";

export const renderTotalCost = (items) => {
  return items.reduce((acc, { cost, item }) => {
    const value = `${cost.units}.${cost.nanos || 0}`;
    return acc + Number(value) * Number(item.quantity);
  }, 0);
};

export const renderPrice = (data, key = "price_usd") => {
  const value = data[key];
  const price = `${value.units}.${value.nanos || 0}`;
  return value.currency_code + " " + Number(price).toFixed(2);
};

const renderMoney = (items) => {
  const price = items.reduce((acc, { price_usd, quantity }) => {
    const value = `${price_usd.units}.${price_usd.nanos || 0}`;
    return acc + Number(value) * Number(quantity);
  }, 0);

  return price.toFixed(2);
};

export const TotalPrice = ({ items }) => (
  <div className="row pt-2 my-3">
    <div className="col text-center">
      Total Cost: <strong>USD {renderMoney(items)}</strong>
    </div>
  </div>
);

const Price = ({ data }) => <p className="text-muted">{renderPrice(data)}</p>;
export default Price;
