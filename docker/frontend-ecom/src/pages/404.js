import React from "react"
import styled from 'styled-components'

import SEO from "../components/seo"

import Error from '../images/error.inline.svg'

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const NotFoundPage = () => (
  <Container>
    <SEO title="404: Not found" />
    <Content>
      <Error />
      <h1>NOT FOUND</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Content>
  </Container>
)

export default NotFoundPage
