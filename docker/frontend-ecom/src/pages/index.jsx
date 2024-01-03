import React, {useEffect, useState} from 'react'
import { graphql, navigate } from 'gatsby'
import styled from 'styled-components'
import AppSearchAPIConnector from '@elastic/search-ui-app-search-connector'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTruck, faGift, faShieldHeart } from '@fortawesome/free-solid-svg-icons'
import {faGrin, faThumbsUp, faHeart } from '@fortawesome/free-regular-svg-icons'
import Img from 'gatsby-image'

import getConfig from '../getConfig';
import Layout from '../components/layout'
import ProductCard from '../components/products/ProductCard'
import FlexGroup from '../components/flexGroup';
import FlexItem from '../components/flexItem';
import Wrapper from '../components/wrapper';
import Ads from '../components/Ads';

const PageGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 60px 60px auto 460px auto;
  grid-template-areas:
    'promo1 promo2 promo3'
    'banner banner banner'
    'promo4 primaryProducts primaryProducts'
    'promo5 promo6 promo7'
    'secondaryProducts secondaryProducts secondaryProducts';
`

const PrimaryProductsGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr 1fr 1fr 1fr;
`

const SecondaryProductsGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
`

const GridItem = styled.div`
  grid-area: ${props => props.area || 'auto'};
`

const Promo = styled.div`
  background: ${props => props.theme.colors.gray1};
  height: 100%;
  overflow: hidden;
  position: relative;
`

const PromoBackground = styled(Img)`
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  object-fit: cover;
`

const PromoContent = styled.div`
  position: relative;
  z-index: 2;
  height: 100%;
  color: ${props => props.theme.colors.white};
  padding: 3rem 0;
`

const Banner = styled(Promo)`
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
`

const DisplayText = styled.div`
  font-family: ${props => props.theme.fontFamily.display};
  text-transform: uppercase;
  text-align: center;
`

const BrandText = styled.div`
  font-family: ${props => props.theme.fontFamily.brand};
  text-transform: uppercase;
  text-align: center;
  font-size: ${props => props.size ? `${props.size}rem` : '2.25rem'};
`



const PromoText = styled(DisplayText)`
  font-weight: 900;
  font-size: 2.25rem;
`

const XSmallIcon = styled(FontAwesomeIcon)`
  font-size: ${props => props.theme.sizes.l}rem;
`
const SmallIcon = styled(FontAwesomeIcon)`
  font-size: ${props => props.theme.sizes.xl}rem;
`
const LargeIcon = styled(FontAwesomeIcon)`
  font-size: 3.25rem;
`

const PromoBanner = styled(Promo)`
  padding: 1rem;
  font-size: .875rem;
  color: ${props => props.theme.colors.gray9};
`

const Underline = styled.u`
  text-transform: uppercase;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  position: relative;

  &:after {
    content: '';
    width: 100%;
    height: 2px;
    background: currentColor;
    position: absolute;
    left: 0;
    top: 100%;
  }
`

const IndexPage = ({ data, location }) => {
  const primaryProducts = data.primary.edges
  const secondaryProducts = data.secondary.edges

  // This mess with  useEffect is to ake sure AppSearchAPIConnector is not
  // created until after SSR occurs, because we need to read credentials for
  // the URL to make sure the connector is only created once.
  const [apiConnector, setApiConnector] = useState()
  useEffect( () => {
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

  return (
    <Layout showAttack={true} apiConnector={apiConnector} >
      <PageGrid>
        <GridItem area="promo1">
          <PromoBanner>
            <FlexGroup>
              <FlexItem grow={0}>
                <XSmallIcon icon={faTruck} />
              </FlexItem>
              <FlexItem flex={1}>
                <strong>Free shipping + returns</strong>
              </FlexItem>
              <FlexItem grow={0}>Details</FlexItem>
            </FlexGroup>
          </PromoBanner>
        </GridItem>
        <GridItem area="promo2">
          <PromoBanner>
            <FlexGroup>
              <FlexItem grow={0}>
                <XSmallIcon icon={faGift} />
              </FlexItem>
              <FlexItem flex={1}>
                <strong>Give the gift of Gallivant</strong>
              </FlexItem>
              <FlexItem grow={0}>Details</FlexItem>
            </FlexGroup>
          </PromoBanner>
        </GridItem>
        <GridItem area="promo3">
          <PromoBanner>
            <FlexGroup>
              <FlexItem grow={0}>
                <XSmallIcon icon={faShieldHeart} />
              </FlexItem>
              <FlexItem flex={1}>
                <strong>Get special offers + more</strong>
              </FlexItem>
              <FlexItem grow={0}>Details</FlexItem>
            </FlexGroup>
          </PromoBanner>
        </GridItem>
        <GridItem area="banner">
          <Banner>
            <Wrapper>
              <FlexGroup alignItems="center">
              <Ads />
              </FlexGroup>
            </Wrapper>
          </Banner>
        </GridItem>
        <GridItem area="promo4">
          <Promo>
            <PromoBackground fluid={data.promoImage1.childImageSharp.fluid} />
            <PromoContent>
              <FlexGroup direction="column" alignItems="center">
                <FlexItem grow={0}>
                  <LargeIcon icon={faGrin} />
                </FlexItem>
                <FlexItem flex={1}>
                  <PromoText>Top picks for her</PromoText>
                </FlexItem>
                <FlexItem grow={0}>
                  <Underline>Shop now</Underline>
                </FlexItem>
              </FlexGroup>
            </PromoContent>
          </Promo>
        </GridItem>
        <GridItem area="primaryProducts">
          <PrimaryProductsGrid>
            {primaryProducts.map(({ node }, index) => (
              <GridItem key={index}>
                <ProductCard product={node} />
              </GridItem>
            ))}
          </PrimaryProductsGrid>
        </GridItem>
        <GridItem area="promo5">
          <Promo>
            <PromoBackground fluid={data.promoImage2.childImageSharp.fluid} />
            <PromoContent>
              <FlexGroup direction="column" alignItems="center">
                <FlexItem grow={0}>
                  <LargeIcon icon={faThumbsUp} />
                </FlexItem>
                <FlexItem>
                  <PromoText>New arrivals</PromoText>
                </FlexItem>
                <FlexItem grow={0}>
                  <Underline>Get at it</Underline>
                </FlexItem>
              </FlexGroup>
            </PromoContent>
          </Promo>
        </GridItem>
        <GridItem area="promo6">
          <Promo>
            <PromoBackground fluid={data.promoImage3.childImageSharp.fluid} />
            <PromoContent>
              <FlexGroup direction="column" alignItems="center">
                <FlexItem grow={0}>
                </FlexItem>
                <FlexItem>
                  <PromoText>Back in stock</PromoText>
                </FlexItem>
                <FlexItem grow={0}>
                  <Underline>For now</Underline>
                </FlexItem>
              </FlexGroup>
            </PromoContent>
          </Promo>
        </GridItem>
        <GridItem area="promo7">
          <Promo>
            <PromoBackground fluid={data.promoImage4.childImageSharp.fluid} />
            <PromoContent>
              <FlexGroup direction="column" alignItems="center">
                <FlexItem grow={0}>
                  <LargeIcon icon={faHeart} />
                </FlexItem>
                <FlexItem>
                  <BrandText size="3.5">Most loved</BrandText>
                </FlexItem>
                <FlexItem grow={0}>
                  <Underline>Shop now</Underline>
                </FlexItem>
              </FlexGroup>
            </PromoContent>
          </Promo>
        </GridItem>
        <GridItem area="secondaryProducts">
          <SecondaryProductsGrid>
            {secondaryProducts.map(({ node }, index) => (
              <GridItem key={index}>
                <ProductCard product={node} />
              </GridItem>
            ))}
          </SecondaryProductsGrid>
        </GridItem>
      </PageGrid>
    </Layout>
  )
}

export const promoImage = graphql`
  fragment promoImage on File {
    childImageSharp {
      fluid(maxWidth: 400, maxHeight: 600) {
        ...GatsbyImageSharpFluid
      }
    }
  }
`

export const query = graphql`
  query {
    primary: allProductsJson(
      limit: 12
      filter: {
        department: {
          eq: "women"
        }
      }
    ) {
      edges {
        node {
          id
          name
          department
          category
          on_sale
          price
          sale_price
          images {
            childImageSharp {
              fluid(maxWidth: 200, maxHeight: 200) {
                ...GatsbyImageSharpFluid
              }
            }
          }
        }
      }
    }
    secondary: allProductsJson(
      limit: 12
      filter: {
        department: {
          eq: "men"
        }
      }
    ) {
      edges {
        node {
          id
          name
          department
          category
          on_sale
          price
          sale_price
          images {
            childImageSharp {
              fluid(maxWidth: 200, maxHeight: 200) {
                ...GatsbyImageSharpFluid
              }
            }
          }
        }
      }
    }
    promoImage1: file(relativePath: { eq: "promo/promo-1.jpg" }) {
      ...promoImage
    }
    promoImage2: file(relativePath: { eq: "promo/promo-2.jpg" }) {
      ...promoImage
    }
    promoImage3: file(relativePath: { eq: "promo/promo-3.jpg" }) {
      ...promoImage
    }
    promoImage4: file(relativePath: { eq: "promo/promo-4.jpg" }) {
      ...promoImage
    }
  }
`

export default IndexPage
