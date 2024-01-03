import React, { useState, useContext, useEffect } from 'react'
import getConfig from '../../getConfig'
import styled from "styled-components";
import Img from "gatsby-image"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons'


const Item = styled.div`
    
    border-style: dotted;
    border-color: rgba(238, 238, 238, 1);
    border-image-slice: 33% 33%;
    border-image-repeat: round;
    display: flex;
    min-width: 85%;
    width: max-content;
    margin: auto;
    margin-top: 0.5em;
`
const ItemSection = styled.div`
    flex: 1;
    min-width: 6em;
    margin-top: auto;
    margin-bottom: auto;
    padding: 1em;
    &:first-child {
        max-width: 6em;
    }
`
const ItemName = styled.div`
    font-weight: bold;
`
const ItemSKU = styled.div`
    font-size: 0.75em;
    color: #6c757d;
    margin-top: 0.5em;
`
const ItemQuantity = styled.div` `
const ItemPrice = styled.div`
    font-weight: bold;
    color: #6c757d;
    margin-top: 0.5em;
`

const CartProduct = ({ item }) => {

    const removeItem = () => {
        console.log("remove item: " + item.id)
        // context.removeLineItem(context.client, context.checkout.id, line_item.id)
    }

    item.fluid = JSON.parse(item.image)

    return (
        <Item>
            <ItemSection><Img fluid={item.fluid} /></ItemSection>
            <ItemSection>
                <ItemName>{item.name}</ItemName>
                <ItemSKU>{item.id}</ItemSKU>
            </ItemSection>
            <ItemSection>
                <ItemQuantity>Qty: {item.quantity}</ItemQuantity>
                <ItemPrice>{item.price}</ItemPrice>
            </ItemSection>
            {/* <ItemSection>
                <FontAwesomeIcon icon={faTrashAlt} onClick={removeItem} />
            </ItemSection> */}
        </Item>
    )
}

export default CartProduct;