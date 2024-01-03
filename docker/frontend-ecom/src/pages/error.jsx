import React from "react"
import { graphql } from 'gatsby'
import styled from 'styled-components'

import Img from 'gatsby-image'
import SEO from "../components/seo"

import Error from '../images/error.inline.svg'

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
`

const BackgroundImage = styled(Img)`
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  object-fit: cover;
  z-index: 1;
`

const Content = styled.div`
  max-width: 400px;
  text-align: center;
  position: relative;
  z-index: 2;
  color: white;

  svg {
    opacity: 0.5;
  }

  h1 {
    font-weight: 400;
  }
`

const NotFoundPage = ({ data }) => (
  <Container>
    <SEO title="Error: Error" />
    <Content>
      <Error />
      <h1>Something went wrong :( </h1>
    </Content>
  </Container>
)

export const query = graphql`
  query {
    backgroundImage: file(relativePath: { eq: "error-bg.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 1440, maxHeight: 900) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`

export default NotFoundPage
