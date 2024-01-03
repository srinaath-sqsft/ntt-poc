import React from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'

const FlexGroupContainer = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: ${props => props.alignItems};
  flex-direction: ${props => props.direction};
  justify-content: ${props => props.justifyContent};
  flex-wrap: ${props => props.wrap};
  margin: 0 -${props => (props.gutterSizes[props.gutterSize] * .5)}rem;
  height: 100%;

  & > [class*="flexItem__FlexItemContainer"] {
    margin: 0 ${props => (props.gutterSizes[props.gutterSize] * .5)}rem;
  }
`

const FlexGroup = props => {
  const gutterSizes = {
    none: 0,
    xs: props.theme.sizes.xs,
    s: props.theme.sizes.s,
    m: props.theme.sizes.m,
    l: props.theme.sizes.l,
    xl: props.theme.sizes.xl
  }

  const { children } = props
  return (
    <FlexGroupContainer gutterSizes={gutterSizes} {...props}>
      {children}
    </FlexGroupContainer>
  )
}

FlexGroup.propTypes = {
  alignItems: PropTypes.oneOf(['stretch','flex-start','flex-end','center','baseline']),
  children: PropTypes.node,
  direction: PropTypes.oneOf(['row','row-reverse','column','column-reverse']),
  gutterSize: PropTypes.oneOf(['xs','s','m','l','xl']),
  justifyContent: PropTypes.oneOf(['flex-start','flex-end','center','space-around','space-between','space-evenly']),
  wrap: PropTypes.oneOf(['nowrap', 'wrap', 'wrap-reverse']),
}

FlexGroup.defaultProps = {
  gutterSize: 'l',
  alignItems: 'stretch',
  responsive: true,
  justifyContent: 'flex-start',
  direction: 'row',
  component: 'div',
  wrap: 'nowrap'
}

export default withTheme(FlexGroup)
