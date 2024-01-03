import React from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'

const Container = styled.div`
  margin-bottom: 2rem;
`
const Label = styled.small`
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: ${props => props.theme.sizes.xs}rem;
`

const ProductSection = ({ children, label }) => (
  <Container>
    {label && <Label>{label}</Label>}
    {children}
  </Container>
)

ProductSection.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired
}

export default withTheme(ProductSection)
