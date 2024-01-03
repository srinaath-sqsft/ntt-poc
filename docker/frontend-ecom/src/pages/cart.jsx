/* eslint-disable camelcase */
import React, { useState, useContext, useEffect } from 'react'
import CartItemList from '../components/cart/CartItemList'
import CartSummary from '../components/cart/CartSummary'
import CartCheckout from '../components/cart/CartCheckout'
import { graphql, navigate } from 'gatsby'
import Layout from '../components/layout'
import AppSearchAPIConnector from '@elastic/search-ui-app-search-connector'
import getConfig from '../getConfig';
import styled from "styled-components";
import { apm } from "@elastic/apm-rum";

const CartContainer = styled.div`
    box-shadow: inset 0 0 0 1px #f8f9fa, 0 0 0 0 transparent;
    background-color: #f8f9fa;
    padding-bottom: 1rem;
`

const Separator = styled.hr`
    margin-top: 1rem;
    margin-bottom: 1rem;
    border: 0;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    width: 85%;
`


const Cart = ({ data, location }) => {
    const [loading, setLoading] = useState(true)
    const [completed, setCompleted] = useState(false)
    const [cartId, setCartId] = useState({})
    const [apiConnector, setApiConnector] = useState()
    const [items, setItems] = useState([])



    useEffect(() => {

        getConfig().then(([endpointBase, searchKey, engineNames]) => {
            loadCart();
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


    async function loadCart() {
        const data = await fetch(`/api/cart`)
            .then(response => {
                return response.json()
            }).catch(error => {
                console.log(error)

            })
        setLoading(false)
        setItems(data.items)
    }



   

    const handleSubmit = async (values) => {
        //const curr = apm.getCurrentTransaction();
        //curr.name = "POST /api/checkout";
        //curr.type = "http-request";
        const response = await fetch(`/api/checkout`, {
            method: "post",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(values),
        });
        const data = await response.json();
        navigate("/checkout", {state: {order: data, ok: response.ok}})
        
        // setCompleted(true)
    }

    return (
        <Layout apiConnector={apiConnector}>
            <CartContainer>
                <CartSummary />
                <Separator />
                <CartItemList items={items} loading={loading} />
                <Separator />
                <CartCheckout onSubmit={handleSubmit} />
            </CartContainer>
        </Layout>
    )
}

export default Cart