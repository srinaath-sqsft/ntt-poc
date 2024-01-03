import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 0.5rem;
`

const Size = styled.span`
  height: ${props => props.theme.sizes.xxl}rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${props => props.theme.sizes.m}rem;
  border: 1px solid ${props => props.active ? 'transparent' : props.theme.colors.gray3};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: ${props => props.theme.sizes.m}rem;
  font-weight: 600;
  color: ${props => props.active ? props.theme.colors.white : props.theme.colors.gray8};
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => !props.active && props.theme.colors.primary};
  }
`

const ProductSizes = ({ sizes }) => {
  const [selectedSize, setSelectedSize] = useState('')

  return (
    <Container>
      {sizes.map((size, index) => <Size active={selectedSize === size} onClick={() => setSelectedSize(size)} key={index}>{size}</Size>)}
    </Container>
  )
}

ProductSizes.propTypes = {
  sizes: PropTypes.array.isRequired
}

export default withTheme(ProductSizes)
