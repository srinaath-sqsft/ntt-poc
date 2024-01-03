import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme, keyframes } from 'styled-components'
import getConfig from '../getConfig';
import { navigate } from "gatsby"
import ProductSection from './ProductSection'
import ProductSizes from './ProductSizes'
import Select from './Select'
import { drop, times } from 'lodash'
import { apm } from "@elastic/apm-rum";

const Button = styled.button`
  height: 3.125rem;
  background: #006de4;
  color: ${props => props.theme.colors.white};
  padding: 0 1rem;
  display: inline-flex;
  align-items: center;
  appearance: none;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  // text-decoration: underline;
  text-transform: uppercase;
  transition: background 0.2s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.colors.primaryLight};
  }
`
const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  animation: ${rotate360} 1s linear infinite;
  transform: translateZ(0);
  
  border-top: 2px solid grey;
  border-right: 2px solid grey;
  border-bottom: 2px solid grey;
  border-left: 4px solid black;
  background: transparent;
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;



const mapOptionsToSelect = (options) => {
  const selectOptions = []
  options.map(option => selectOptions.push({ value: option, label: option }))
  return selectOptions
}

const AddToCart = ({ colors, sizes, product_id, price, image, name }) => {
  const [apiUrl, setApiUrl] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConfig().then(([endpointBase, searchKey, engineNames, kbUrl, apiUrl]) => {
      setApiUrl(apiUrl)
    }
    )
  });

  const addProductToCart = () => {
  //console.log(apm)
  //const curr = apm.getCurrentTransaction();
  //curr.end();
  //curr.name = "POST /api/add-cart";
  //curr.type = "http-request";
    setLoading(true);
    fetch('/api/add-cart', {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        productId: product_id,
        quantity: quantity,
        price: price,
        image: JSON.stringify(image),
        name: name
      })
    })
    .then(
      response => response.json().then(json => navigate(json.redirect))
      )
  }


  const handleQuantityChange = (e) => { setQuantity(e.target.value) }

  return (
    <>
      <ProductSection label="Color">
        <Select options={mapOptionsToSelect(colors)} />
      </ProductSection>
      <ProductSection label="Sizes">
        <ProductSizes sizes={sizes} />
      </ProductSection>
      <ProductSection label="Quantity">
        <Select options={mapOptionsToSelect(drop(times(11)))} onChange={handleQuantityChange} />
      </ProductSection>
      <ProductSection>
        {loading ? <Spinner /> : <Button name="Add To Cart" onClick={addProductToCart}>
          Add To Cart
        </Button>}

      </ProductSection>
    </>
  );

}



AddToCart.propTypes = {
  label: PropTypes.string
}

export default withTheme(AddToCart)
