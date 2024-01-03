import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'

const NavigationContainer = styled.nav`
  display: flex;
  align-items: center;
  margin-right: auto;
`

const NavLink = styled(Link)`
  text-transform: uppercase;
  font-size: .8125rem;
  font-weight: 500;
  color: ${props => props.theme.colors.gray9};
  margin-left: 1rem;
  letter-spacing: 0.05em;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`

const SaleNavLink = styled(NavLink)`
  color: ${props => props.theme.colors.red};
`

const PrimaryNavigation = () => (
  <NavigationContainer>
    <NavLink to={'/'}>Women</NavLink>
    <NavLink to={'/'}>Men</NavLink>
    <SaleNavLink to={'/'}>Sale</SaleNavLink>
    <NavLink to={'/'}>Home</NavLink>
  </NavigationContainer>
)

export default PrimaryNavigation
