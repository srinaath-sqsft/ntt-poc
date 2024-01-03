import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const WrapperEl = styled.div`
  padding: 0 2.5rem;
  max-width: 1320px;
  margin: 0 auto;
  height: 100%;
`

const Wrapper = ({ children }) => <WrapperEl>{children}</WrapperEl>

Wrapper.propTypes = {
  children: PropTypes.node
}

export default Wrapper
