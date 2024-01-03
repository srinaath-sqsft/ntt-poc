import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { renderPrice, renderTotalCost } from "../../components/Price";

const Checkout = ({}) => {
  if (!global.window) {
    return <h2>No Orders found</h2>;
  }
  const order = window.sessionStorage.getItem("order");
  const details = JSON.parse(order);
  const { order_id, shipping_tracking_id, items } = details;
  const shippingCost = renderPrice(details, "shipping_cost");
  const totalCost = renderTotalCost(items);
  return (
    <>
      <Header />
      <main role="main">
        <div className="py-5">
          <div className="container bg-light py-3 px-lg-5">
            <div className="row mt-5 py-2">
              <div className="col">
                <h3>Your order is complete!</h3>
                <p>
                  Order Confirmation ID: <strong>{order_id}</strong>
                  <br />
                  Shipping Tracking ID: <strong>{shipping_tracking_id}</strong>
                </p>
                <p>
                  Shipping Cost: <strong>{shippingCost}</strong>
                  <br />
                  Total Paid: <strong>USD {totalCost.toFixed(2)}</strong>
                </p>
                <a className="btn btn-primary" href="/" role="button">
                  Browse other products &rarr;{" "}
                </a>
              </div>
            </div>
            <hr />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
