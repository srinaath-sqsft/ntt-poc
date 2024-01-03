import { Link, navigate } from "gatsby"
import PropTypes from "prop-types"
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons'
import { SearchProvider } from '@elastic/react-search-ui'

import FlexGroup from './flexGroup'
import FlexItem from './flexItem'
import PrimaryNavigation from './primaryNavigation'
import Wrapper from './wrapper'
import SearchInput from './search/SearchInput'

import Cookies from "js-cookie";
import getConfig from '../getConfig';

import '../rum'
import Avatar from 'react-avatar';




const config = {
  autocompleteQuery: {
    suggestions: {
      size: 4,
      types: {
        documents: {
          fields: ["name"]
        }
      }
    },
    results: {
      search_fields: {
        name: {}
      },
      result_fields: {
        name: { snippet: { fallback: true } },
        category: { raw: {} },
        department: { raw: {} },
        images: { raw: {} },
        price: { raw: { size: 20 } },
        sale_price: { raw: { size: 20 } },
        rating: { raw: { size: 20 } }
      }
    },
  }
}

const GlobalHeader = styled.header`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1.45rem;
  height: 4.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.gray2};
`

const Brand = styled(Link)`
  font-family: ${props => props.theme.fontFamily.brand};
  font-size: 2.25rem;
  letter-spacing: -0.04em;
  color: ${props => props.theme.colors.black};

  &:hover {
    color: ${props => props.theme.colors.primary}
  }
`

const HeaderSearchContainer = styled(FlexItem)`
  display: ${props => props.showSearch ? 'block' : 'none'};
  max-width: 400px;
  margin-left: auto !important;
`

const ShoppingCartContainer = styled(FlexItem)`
  margin-left: ${props => props.showSearch ? '0' : 'auto'} !important;
`


const ShoppingCartWrap = styled.div`
  flex: 0 1 20px;

  @media (max-width: 768px) and (orientation: landscape) {
    flex: 0 1 25px;
  }
`

const ShoppingCart = styled(FontAwesomeIcon)`
  color: ${props => props.theme.colors.gray7};
  font-size: 1.25rem;
`




const Header = props => {

  const [user, setUser] = useState(1);


  const { siteTitle, showSearch, apiConnector } = props
  const [searchQuery, setSearchQuery] = useState()

  const handleInputChange = e => setSearchQuery(e.target.value)

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      navigate(`/search?q=${searchQuery}`)
    }
  }

  useEffect(() => {
    setUser(Cookies.get("local_user_id") )
  });

  

  return (
    <GlobalHeader>
      <Wrapper>
        <FlexGroup alignItems="center">
          <FlexItem grow={0}>
            <Brand to={'/'}>{siteTitle}</Brand>
          </FlexItem>
          <FlexItem grow={0}>
            <PrimaryNavigation />
          </FlexItem>
          <HeaderSearchContainer showSearch={showSearch}>
            {apiConnector && <SearchProvider config={{ ...config, apiConnector }}>
              <SearchInput onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="Search" navigateOnSuggestionSelect={true} />
            </SearchProvider>}
          </HeaderSearchContainer>
          <ShoppingCartContainer showSearch={showSearch} grow={0}>
            <ShoppingCartWrap as={Link} to="/cart">
              <ShoppingCart icon={faCartShopping} />
            </ShoppingCartWrap>
          </ShoppingCartContainer>
          <Avatar color={'#272e36'} name={user} round={true} size='40' />
        </FlexGroup>
      </Wrapper>
    </GlobalHeader>
  )
}

Header.propTypes = {
  siteTitle: PropTypes.string,
  showSearch: PropTypes.bool
}

Header.defaultProps = {
  siteTitle: ``,
  showSearch: true
}

export default Header
