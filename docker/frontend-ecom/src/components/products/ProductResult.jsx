import React from 'react'
import PropTypes from 'prop-types'
import { withTheme } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGrinHearts } from '@fortawesome/free-regular-svg-icons'

import { formatPrice, getProductPath, generateStars } from '../../utils'

import {
  Container,
  Image,
  SaleBanner,
  Title,
  SalePrice,
  ListPrice,
  Price,
  Rating
} from './styledComponents'

const ProductResult = ({ product }) => {
  const {
    department,
    category,
    id,
    name,
    on_sale,
    price,
    sale_price,
    images,
    rating
  } = product

  const image = images.raw && images.raw.length > 0 ? images.raw[0] : images.raw

  const getValue = (field) => {
    return <span dangerouslySetInnerHTML={{ __html: field.snippet }} /> || field.raw
  }

  return (
    <Container to={getProductPath(department.raw, category.raw, id.raw)}>
      <Image fluid={JSON.parse(image).childImageSharp.fluid} />
      {on_sale.raw === 'true' &&
        <SaleBanner>
          <FontAwesomeIcon icon={faGrinHearts} />
          On Sale
        </SaleBanner>
      }
      <Title>{getValue(name)}</Title>
      {on_sale.raw === 'true' ? (
        <div>
          <SalePrice>{formatPrice(sale_price.raw)}</SalePrice>
          <ListPrice>{formatPrice(price.raw)}</ListPrice>
        </div>
      ) : (
        <Price>{ formatPrice(price.raw)}</Price>
      )}
      <Rating>{generateStars(rating.raw)}</Rating>
    </Container>
  )
}

ProductResult.propTypes = {
  product: PropTypes.object.isRequired
}

export default withTheme(ProductResult)
