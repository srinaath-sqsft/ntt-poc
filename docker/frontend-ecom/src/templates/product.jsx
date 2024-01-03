import React, {useEffect, useState} from 'react'
import { graphql, navigate } from 'gatsby'
import AppSearchAPIConnector from '@elastic/search-ui-app-search-connector'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'
import { startCase } from 'lodash'

import { formatPrice, generateStars } from '../utils'

import getConfig from '../getConfig';
import Layout from '../components/layout'
import ProductImageCarousel from '../components/productImageCarousel'
import ProductSection from '../components/ProductSection'
import Spacer from '../components/Spacer'
import UnorderedList from '../components/unorderedList'
import ProductRecommendations from '../components/ProductRecommendations'

import AddToCart from '../components/addToCart'

import fetch from 'node-fetch'

const ProductContainer = styled.div`
  display: flex;
  align-items: stretch;
`

const ProductMain = styled.div`
  width: 65%;
`

const ProductDetails = styled.div`
  display: block;
  width: 50%;
  max-width: 400px;
`

const Title = styled.h1`
  font-weight: 900;
  color: ${props => props.theme.colors.black};
  font-size: ${props => props.theme.sizes.xl}rem;
  letter-spacing: -0.04em;
  margin: ${props => props.theme.sizes.s}rem 0;
`

const Price = styled.span`
  font-size: ${props => props.theme.sizes.l}rem;
  font-weight: 500;
  color: ${props => props.theme.colors.gray8};
`

const SalePrice = styled(Price)`
  color: ${props => props.theme.colors.red};
`

const ListPrice = styled(Price)`
  color: ${props => props.theme.colors.gray7};
  text-decoration: line-through;
  margin-left: .5em;
`

const HorizontalRule = styled.hr`
  height: 4px;
  background: ${props => props.theme.colors.gray2};
  border: 0;
`

const Paragraph = styled.p`
  color: ${props => props.theme.colors.gray8};
  line-height: 1.45;
  max-width: 600px;
`

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`

const Breadcrumb = styled.span`
  font-weight: 500;
  font-size: ${props => props.theme.sizes.m}rem;
  color: ${props => props.theme.colors.gray8};
  display: inline-flex;
  align-items: center;
  text-transform: capitalize;

  &: after {
    content: '/';
    padding: 0 .5rem;
    display: inline-block;
  }
`

const ActiveBreadcrumb = styled(Breadcrumb)`
  color: ${props => props.theme.colors.black};
  font-weight: 600;

  &:after {
    content: '';
  }
`

export default ({ data, location }) => {
  const {
    id,
    department,
    category,
    name,
    price,
    on_sale,
    colors,
    sizes,
    images,
    sale_price,
    description,
    details,
    fit,
    rating
  } = data.allProductsJson.edges[0].node



  // This mess with  useEffect is to ake sure AppSearchAPIConnector is not
  // created until after SSR occurs, because we need to read credentials for
  // the URL to make sure the connector is only created once.
  const [apiConnector, setApiConnector] = useState()
  const [recommendations, setRecommendations] = useState([])

  useEffect( () => {
    loadRecommendation()
    getConfig().then(([endpointBase, searchKey, engineNames]) => {
      if (searchKey && endpointBase) {
        setApiConnector(new AppSearchAPIConnector({
          searchKey: searchKey,
          engineName: 'products' in engineNames ? engineNames['products'] : 'ecommerce',
          endpointBase: endpointBase,
          cacheResponses: false
        }))
      } else {
        navigate('/error')
      }
    })
  }, [])

  async function loadRecommendation() {
    const data = await fetch(`/api/recommendations`)
        .then(response => {
            return response.json()
        }).catch(error => {
            console.log(error)

        })
    setRecommendations(data)
}




  return (
    <Layout apiConnector={apiConnector} >
      <Helmet>
        <title>{name} | Gallivant</title>
      </Helmet>
      <Breadcrumbs>
        <Breadcrumb>{department}</Breadcrumb>
        <Breadcrumb>{startCase(category)}</Breadcrumb>
        <ActiveBreadcrumb>{name}</ActiveBreadcrumb>
      </Breadcrumbs>
      <ProductContainer>
        <ProductMain>
          <ProductImageCarousel images={images} />
          {recommendations.length > 0 && (
                <ProductRecommendations recommendations={recommendations} />
          )}
        </ProductMain>
        <ProductDetails>
          <Title>{name}</Title>
          <div>
            {on_sale ?
              <>
                <SalePrice>{formatPrice(sale_price)}</SalePrice>
                <ListPrice>{formatPrice(price)}</ListPrice>
              </>
            :
              <Price>{formatPrice(price)}</Price>
            }
          </div>
          <Spacer />
          {rating > 0 &&
            <ProductSection>
              {generateStars(rating)}
            </ProductSection>
          }
          <AddToCart colors={colors} sizes={sizes} product_id={id} image={images[0].childImageSharp.fluid} name={name} price={price} />
          <Spacer />
          <HorizontalRule />
          <Spacer />
          {/* <ProductSection>
            <Paragraph>{description}</Paragraph>
          </ProductSection> */}
          <ProductSection label="Fit">
            <UnorderedList listItems={fit} />
          </ProductSection>
          <ProductSection label="Details">
            <UnorderedList listItems={details} />
          </ProductSection>
        </ProductDetails>
      </ProductContainer>
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    allProductsJson(
      filter: {
        id: {
          eq: $id
        }
      }
    ) {
      edges {
        node {
          id
          department
          category
          name
          price
          on_sale
          colors
          images {
            childImageSharp {
              fluid(maxWidth: 1000, maxHeight: 1000, quality: 85) {
                ...GatsbyImageSharpFluid
              }
            }
          }
          sizes
          sale_price
          description
          details
          fit
          rating
        }
      }
    }
  }
`
