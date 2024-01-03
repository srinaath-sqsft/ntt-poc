import React from "react";
import styled from "styled-components";
import Img from "gatsby-image"
import { Link } from 'gatsby'


const Figure = styled(Link)`
    display: block;
    margin-bottom: 2.25rem;
    margin-right: 12px;
    cursor: pointer;
    width: 20%;
`

const FigureCaption = styled.div`
  margin-top: .375rem;
  color: #272e36;
  text-align: center;
`

const Recommendation = ({ data }) => {
  return (

    <Figure to={`/products/${data.department}/${data.category}/${data.id}`}>
      <Img fluid={data.images[0].childImageSharp.fluid} />
      <FigureCaption>
        {data.name}<br />${data.price}
      </FigureCaption>
    </Figure>
  )
}

export default Recommendation;
