import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const FlexItemContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-basis: 0%;
  ${props => !!props.grow && `flex-grow: ${props.grow};`}
  ${props => !!props.flex && `flex: ${props.flex};`}
  ${props => !!props.shrink && `flex-shrink: ${props.shrink};`}
  ${props => !!props.justifySelf && `justify-self: ${props.justifySelf};`}
`

const FlexItem = props => <FlexItemContainer {...props}>{props.children}</FlexItemContainer>

FlexItem.propTypes = {
  children: PropTypes.node,
  flex: PropTypes.oneOf([0, 1]),
  shrink: PropTypes.oneOf([0, 1]),
  grow: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  justifySelf: PropTypes.oneOf(['auto','normal','stretch','center','start','end'])
}

FlexItem.defaultProps = {
  grow: 1,
  justifySelf: 'auto'
}

export default FlexItem
