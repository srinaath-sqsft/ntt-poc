
import React, { useState, useContext, useEffect } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/layout'
import AppSearchAPIConnector from '@elastic/search-ui-app-search-connector'
import getConfig from '../getConfig';
import {Message, MessageHeader} from "../components/message";
import { BrowseButton } from "../components/button";
import fetch from 'node-fetch'

const Checkout = ({ data, location }) => {

    const [apiConnector, setApiConnector] = useState()

    useEffect(() => {
        emptyCart()
        getConfig().then(([endpointBase, searchKey, engineNames]) => {
            if (searchKey && endpointBase) {
                setApiConnector(new AppSearchAPIConnector({
                    searchKey: searchKey,
                    engineName: 'products' in engineNames ? engineNames['products'] : 'ecommerce',
                    endpointBase: endpointBase,
                    cacheResponses: false
                }))
            } else {
                console.log("error")
                navigate('/error')
            }
        })
    }, [])

    if (typeof location.state === `undefined`) {
        return (
            <Layout apiConnector={apiConnector}>
            <Message>
                <MessageHeader>Error - Order could not be placed!</MessageHeader>
                <BrowseButton to="/">Browse more products &rarr;{" "}</BrowseButton>
            </Message>
        </Layout>

        )
    }
    if (!location.state.ok) {
        return (
            <Layout apiConnector={apiConnector}>
            <Message>
                <MessageHeader>Error - Something went wrong :(</MessageHeader>
                <BrowseButton to="/">Browse more products &rarr;{" "}</BrowseButton>
            </Message>
        </Layout>
        )
    }

    console.log(location.state)
    const { order_id, shipping_tracking_id, items } = location.state.order;

    

    const totalCost = renderTotalCost(items);
    

    function renderTotalCost(items) {
        var totalCost = 0;
        var i;
        for (i in items) {
            totalCost = totalCost + (items[i].item.price * items[i].item.quantity)
        }
        return totalCost;
    }

    function emptyCart() {

        fetch(`/api/empty-cart`, { "method": "POST" })
            .then(response => response.json())
            .catch(error => {
                console.log(error)
            })
    }



    return (
        <Layout apiConnector={apiConnector}>
            <Message>
                <MessageHeader>Your order has been placed!</MessageHeader>
                <p>
                    Order Confirmation ID: <strong>{order_id}</strong>
                    <br />
                  Shipping Tracking ID: <strong>{shipping_tracking_id}</strong>
                </p>
                <p>
                    <br />
                  Total Paid: <strong>USD {totalCost.toFixed(2)}</strong>
                </p>
                <BrowseButton to="/">Browse more products &rarr;{" "}</BrowseButton>
            </Message>
        </Layout>
    );
};

export default Checkout;