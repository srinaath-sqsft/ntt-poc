import React from 'react'
import styled from "styled-components";
import {Button, BrowseButton} from "../button"
import { Link, navigate } from "gatsby"
import { apm } from "@elastic/apm-rum";

const Summary = styled.div`
    display: flex;
`

const SummaryRight = styled.div`
    text-align: right;
    flex-grow: 1;
    flex-basis: 0;
    padding-top: 0.5em;
`

const SummaryTitle = styled.div`
    font-weight: bold;
    font-size: 1.5em;
    padding-left: 2em;
    padding-top: 0.5em;
    flex-grow: 1;
    flex-basis: 0;

`



const EmptyButton = styled(Button)`
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;

`


const CartSummary = () => {

    async function emptyCart() {
        //const curr = apm.getCurrentTransaction();
        //curr.name = "POST /api/empty-cart";
        //curr.type = "http-request";
        const data = await fetch(`/api/empty-cart`, { "method": "POST" })
            .then(
                response => response.json().then(json => navigate(json.redirect))
            )
            .catch(error => {
                console.log(error)
            })
    }


    return (
        <Summary>
            <SummaryTitle>Your shopping cart</SummaryTitle>
            <SummaryRight>
                <EmptyButton name="Empty Cart" onClick={emptyCart}>Empty cart</EmptyButton>
                <BrowseButton name="Browse Products" to="/">Browse more products &rarr;{" "}</BrowseButton>
            </SummaryRight>
        </Summary>
    )
}

export default CartSummary;