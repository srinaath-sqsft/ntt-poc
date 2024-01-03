import React, { useEffect, useState } from 'react'
import PropTypes from "prop-types"
import { StaticQuery, graphql, Link } from "gatsby"
import styled, { ThemeProvider } from 'styled-components'
import { Helmet } from 'react-helmet'
import BackgroundImage from 'gatsby-background-image'
import loadable from '@loadable/component'

import Header from "./header"
import Wrapper from './wrapper'

import Cookies from "js-cookie";
import { apm } from "@elastic/apm-rum";
import fetch from 'node-fetch'
import Attack from './Attack';

import "./layout.css"


// const ChatWidget = loadable(() => import('./chat'))


const fontStack = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;'

const theme = {
  fontFamily: {
    body: `'Inter UI', ${fontStack}`,
    display: `titling-gothic-fb-extended, ${fontStack}`,
    brand: `ff-brokenscript-web, ${fontStack}`
  },
  colors: {
    primary: '#2232e0',
    primaryLight: '#2271E0',
    red: '#f95e5b',
    white: '#ffffff',
    gray1: '#f9fafb',
    gray2: '#e9edf2',
    gray3: '#dae2eb',
    gray4: '#c5d1de',
    gray5: '#a5b4c4',
    gray6: '#8b9bad',
    gray7: '#647487',
    gray8: '#536170',
    gray9: '#3b454f',
    black: '#272e36'
  },
  sizes: {
    xs: .25,
    s: .5,
    m: .75,
    l: 1.5,
    xl: 2,
    xxl: 2.5
  }
}

const GlobalFooter = styled(BackgroundImage)`
  height: 200px;
  margin-top: 2.5rem;
  padding: 2.5rem 0;
  color: white;
`

const Brand = styled(Link)`
  font-family: ${props => props.theme.fontFamily.brand};
  font-size: 2.25rem;
  letter-spacing: -0.04em;
  color: #000;
   &:hover {
    color: ${props => props.theme.colors.primary};
  }
`

const Layout = ({ children, showAttack, showSearch, apiConnector }) => {


  const [user, setUser] = useState(1);

  useEffect(() => {
    loadUser();
  });

  async function loadUser() {
    if (!Cookies.get("local_user_id")) {
      var data = await fetch(`/api/user`)
        .then(response => {
          return response.json()
        }).catch(error => {
          console.log(error)
          if (error) {
            return <div>Failed to load user information</div>;
          }
        })
      data = JSON.parse(data)
      if (data.user == "") {
        Cookies.set("local_user_id", performance.now() + "-" + Date.now());
      } else {
        // Cookies.set("local_user_id", data.user);
        Cookies.set("local_user_id", data.user);

        //document.getElementById('userId').innerHTML = data.user;
      }
    }
    setUser(Cookies.get("local_user_id"))
    apm.addLabels({ "userId": Cookies.get("local_user_id") })

  }
  return (
    <ThemeProvider theme={theme}>
      <StaticQuery
        query={graphql`
            query {
              site {
                siteMetadata {
                  title
                }
              }
              footerBackground: file(relativePath: { eq: "footer-bg.jpg" }) {
                childImageSharp {
                  fluid(maxWidth: 1440, maxHeight: 540) {
                    ...GatsbyImageSharpFluid
                  }
                }
              }
            }
          `}
        render={data => (
          <>
            <Helmet>
              <title>{data.site.siteMetadata.title}</title>
              <meta
                name="viewport"
                content="width=device-width,initial-scale=1,shrink-to-fit=no,viewport-fit=cover"
              />
            </Helmet>
            <Header showSearch={showSearch} siteTitle={data.site.siteMetadata.title} apiConnector={apiConnector} />
            <div>
              <main>
                <Wrapper>{children}</Wrapper>
              </main>
            </div>
            <GlobalFooter fluid={data.footerBackground.childImageSharp.fluid}>
              <Wrapper>
                User Session Id: {user} <br />
                AMEX number, not accepted for copy&paste : 340000000000009<br /><br />
                {showAttack? <Attack /> : <></>}
              </Wrapper>
            </GlobalFooter>

            {/* <ChatWidget/> */}
          </>
        )}
      />
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node,
  showSearch: PropTypes.bool,
  showAttack: PropTypes.bool
}

Layout.defaultProps = {
  showSearch: true,
  showAttack: false
}


export default Layout
