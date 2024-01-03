import React from 'react'
import PropTypes from "prop-types"
import styled from 'styled-components'

const ListContainer = styled.ul`
  margin: 0;
  padding: 0;
  list-style-position: inside;
`

const ListItem = styled.li`
  padding: 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.gray8};
  line-height: 1.45;
`

const UnorderedList = ({ listItems }) => (
  <ListContainer>
    {listItems.map((node, index) => <ListItem key={index}>{node}</ListItem>)}
  </ListContainer>
)

UnorderedList.propTypes = {
  listItems: PropTypes.array
}

export default UnorderedList
