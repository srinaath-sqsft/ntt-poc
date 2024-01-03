import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'
import Img from "gatsby-image"

const Container = styled.div`
  display: flex;
  // width: 50%;
  margin-right: 2.5rem;
`
const Thumbnails = styled.div`
  flex-grow: 0;
  width: 100px;
  margin-right: 1rem;
`
const ActiveImage = styled.div`
  flex: 1;
  margin: auto;
  max-width: 60%;
`

const ThumbnailContainer = styled.div`
  margin-bottom: 1rem;
  opacity: ${props => props.active ? '1' : '0.75'};
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`

const ProductImageCarousel = ({ images }) => {
  const [activeImage, setActiveImage] = useState(images[0])

  return (
    <Container>
      {/* <Thumbnails>
        {images.map((image, index) => (
          <ThumbnailContainer active={activeImage === image} key={index} onClick={() => setActiveImage(image)}>
            <Img fluid={image.childImageSharp.fluid} />
          </ThumbnailContainer>
        ))}
      </Thumbnails> */}
      <ActiveImage>
        <Img fluid={activeImage.childImageSharp.fluid} />
      </ActiveImage>
    </Container>
  )
}

ProductImageCarousel.propTypes = {
  images: PropTypes.array.isRequired
}

export default withTheme(ProductImageCarousel)
