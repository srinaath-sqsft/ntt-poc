const createProxyMiddleware = require("http-proxy-middleware")

module.exports = {
  siteMetadata: {
    title: `Gallivant`,
    description: `Elastic App Search ecommerce demo`,
    author: `@zumwalt`,
  },
  developMiddleware: app => {
    app.use(
      "/api/",
      createProxyMiddleware({
        target: "http://localhost:3000"
      })
    )
  },
  plugins: [
    {
      resolve: `gatsby-plugin-compile-es6-packages`,
      options: {
        modules: [`@elastic/react-search-ui`, `@elastic/search-ui-app-search-connector`],
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Gallivant`,
        short_name: `gallivant`,
        start_url: `/`,
        background_color: `#223ad7`,
        theme_color: `#223ad7`,
        display: `minimal-ui`,
        icon: `src/images/favicon-128.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-transformer-json`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `./src/data/`,
      },
    },
    {
      resolve: "gatsby-plugin-web-font-loader",
      options: {
        typekit: {
          id: "hij2qox",
        },
      },
    },
    `gatsby-plugin-styled-components`,
    {
      resolve: "gatsby-plugin-react-svg",
      options: {
        rule: {
          include: /\.inline\.svg$/,
        },
      },
    }
  ],
}
