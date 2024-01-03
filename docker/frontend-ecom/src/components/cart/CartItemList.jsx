import React from 'react';
import CartProduct from "./CartProduct";
import {Message, MessageHeader} from "../message";
import styled from "styled-components";

const Result = styled.div`
    display: table;
    width: 100%;
`

const CartItemList = ({items, loading}) => {


    if (items.length === 0 && !loading)
        return (
            <Message>
                <MessageHeader>Your cart is empty</MessageHeader>
                <p>
                    You will need to add some items to the cart before you can checkout.
        </p>
            </Message>
        )

    return (
        <Result>
            {items.map(item => {
                return <CartProduct key={item.id} item={item} />
            })}
        </Result>
    )

}

export default CartItemList;