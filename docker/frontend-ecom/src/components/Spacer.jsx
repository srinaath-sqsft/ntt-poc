import React from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'

const Element = styled.div`
  height: ${props => props.height};
`

const Spacer = (props) => {
  const sizes = {
    xs: `${props.theme.sizes.xs}rem`,
    s: `${props.theme.sizes.s}rem`,
    m: `${props.theme.sizes.m}rem`,
    l: `${props.theme.sizes.l}rem`,
    xl: `${props.theme.sizes.xl}rem`,
    xxl: `${props.theme.sizes.xxl}rem`
  }

  return <Element height={sizes[props.size]} />
}

Spacer.propTypes = {
  size: PropTypes.oneOf(['xs', 's', 'm', 'l', 'xl', 'xxl'])
}

Spacer.defaultProps = {
  size: 'l'
}

export default withTheme(Spacer)
