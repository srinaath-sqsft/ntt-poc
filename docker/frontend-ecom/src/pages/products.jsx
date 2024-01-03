import React, {useEffect, useState} from 'react'
import { graphql, navigate } from 'gatsby'
import AppSearchAPIConnector from '@elastic/search-ui-app-search-connector'

import getConfig from '../getConfig';
import Layout from '../components/layout'

export default ({ data, location }) => {

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

  const products = []
  data.allProductsJson.edges.forEach(({ node }) => {
    products.push(node)
  })

  return (
    <Layout apiConnector={apiConnector} >
      It's all in the console.
    </Layout>
  )
}

export const query = graphql`
  query {
    allProductsJson(limit: 50) {
      edges {
        node {
          id
          name
          department
          category
          price
          details
          description
          images {
            childImageSharp {
              fluid(maxWidth: 600, maxHeight: 600) {
                ...GatsbyImageSharpFluid
              }
            }
          }
          fit
        }
      }
    }
  }
`
