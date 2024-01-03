import React from 'react'
import PropTypes from 'prop-types'
import { withTheme } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGrinHearts } from '@fortawesome/free-regular-svg-icons'

import { formatPrice, getProductPath } from '../../utils'

import {
  Container,
  Image,
  SaleBanner,
  Title,
  SalePrice,
  ListPrice,
  Price
} from './styledComponents'

const ProductCard = ({ product }) => {
  const {
    department,
    category,
    id,
    name,
    on_sale,
    price,
    sale_price,
    images
  } = product

  return (
    <Container to={getProductPath(department, category, id)}>
      <Image fluid={images[0].childImageSharp.fluid} />
      {on_sale.raw === 'true' &&
        <SaleBanner>
          <FontAwesomeIcon icon={faGrinHearts} />
          On Sale
        </SaleBanner>
      }
      <Title>{name}</Title>
      {on_sale ? (
        <div>
          <SalePrice>{formatPrice(sale_price)}</SalePrice>
          <ListPrice>{formatPrice(price)}</ListPrice>
        </div>
      ) : (
          <Price>{formatPrice(price)}</Price>
        )}
    </Container>
  )
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired
}

export default withTheme(ProductCard)
