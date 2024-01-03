/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require(`path`)
const fs = require('fs')
const products_output_file = './products.json'

const product_stream = fs.createWriteStream(products_output_file, {flags:'w'})

exports.createPages = ({
  graphql,
  actions: { createPage }
}) => {
  return new Promise((resolve, reject) => {
    graphql(`
      {
        allProductsJson {
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
                    base64
                    aspectRatio
                    src
                    srcSet
                    sizes
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
    `).then(result => {
      result.data.allProductsJson.edges.forEach(({ node }) => {
        createPage({
          path: `/products/${node.department}/${node.category}/${node.id}`,
          component: path.resolve(`./src/templates/product.jsx`),
          context: node,
        })
        product_stream.write(JSON.stringify(node) + '\n');
      })
      product_stream.end()
      resolve()
    })
  })
}