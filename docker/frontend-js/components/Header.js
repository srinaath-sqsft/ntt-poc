import React from "react";
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import Cookies from "js-cookie";
import { apm,init } from "@elastic/apm-rum";

init({
  serviceName: "frontend-rum",
  breakdownMetrics: true,
  environment: "prod",
  propagateTracestate: true,
  serverUrl:
    process.env.NEXT_PUBLIC_ELASTIC_APM_SERVER_URLS,
});

var userId = ""

const Header = ({}) => {
  if (!Cookies.get("local_user_id")) {
    const { data, error } = useSWR("/api/user", (url) =>
      fetch(url).then((r) => r.json())
    );
    if (error) {
        console.log(error)
        return <div>Failed to load user information</div>;
    }
    if (!data) return <div>loading user information...</div>;

    if (data.user == "") {
      Cookies.set("local_user_id", performance.now() + "-" + Date.now());
    } else
    {
      Cookies.set("local_user_id", data.user);
      document.getElementById('userId').innerHTML = data.user;
    }
  }
  apm.addLabels({ "userId": Cookies.get("local_user_id") })
  userId = Cookies.get("local_user_id");

  //const transaction = apm.startTransaction("/home", "page-load", {
  //  canReuse: true,
  //  managed: true,
  //});
  //console.log(apm)
  //var transaction = apm.getCurrentTransaction()
  //console.log(transaction)
  //if(typeof transaction !== "undefined") {
  //  transaction.addLabels({ "userId": Cookies.get("local_user_id") })
  //  console.log("userId")
  //  console.log(Cookies.get("local_user_id"))
  //}
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, shrink-to-fit=no"
        />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <title>Gallivant Shop</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@4.1.1/dist/css/bootstrap.css"
          integrity="sha256-KeWggbCyRNU5k8MgZ7Jf8akh/OtL7Qu/YloCBpayj40="
          crossOrigin="anonymous"
        />
      </Head>
      <header>
        <div className="navbar navbar-dark bg-dark box-shadow">
          <div className="container d-flex justify-content-between">
            <a href="/" className="navbar-brand d-flex align-items-center">
              Gallivant Shop
            </a>
            <form
              className="form-inline ml-auto"
              method="POST"
              action="/currency"
              id="currency_form"
            >
              <select name="currency_code" className="form-control">
                <option value="USD">USD</option>
              </select>
              <Link href="/cart">
                <a className="btn btn-primary btn-light ml-2" role="button">
                  View Cart ({userId})
                </a>
              </Link>
            </form>
          </div>
          <style jsx>{`
            .form-control {
              width: auto;
            }
          `}</style>
        </div>
      </header>
    </>
  );
};

export default Header;
