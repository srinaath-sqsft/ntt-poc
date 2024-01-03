import React, {useEffect, useState} from 'react'
import { graphql, navigate } from 'gatsby'
import styled from 'styled-components'

import getConfig from '../getConfig';
import AppSearchAPIConnector from '@elastic/search-ui-app-search-connector'
import { SearchProvider, WithSearch, Facet, Paging, PagingInfo, Sorting } from '@elastic/react-search-ui'
import BackgroundImage from 'gatsby-background-image'
import Pagination from 'rc-pagination'

import Layout from '../components/layout'
import ProductResult from '../components/products/ProductResult'
import Select from '../components/Select'
import RangeSlider from '../components/search/RangeSlider'
import SearchFacet from '../components/search/SearchFacet'
import SearchInput from '../components/search/SearchInput'

const facetsConfig = {
  facets: {
    department: { type: 'value', size: 100 },
    colors: { type: 'value', size: 100 },
    category: { type: 'value', size: 100 },
    on_sale: { type: 'value', size: 100 },
    sizes: { type: 'value', size: 100 },
    rating: {
      type: 'range', ranges: [
        { from: 0.0001, to: 5, name: "0 and up" }, // FIXME: hack for 0 value
        { from: 1, to: 5, name: "1 and up" },
        { from: 2, to: 5, name: "2 and up" },
        { from: 3, to: 5, name: "3 and up" },
        { from: 4, to: 5, name: "4 and up" }
      ]
    }
  }
}

const resultFields = {
  result_fields: {
    name: { snippet: { size: 200, fallback: true } },
    category: { raw: {} },
    department: { raw: {} },
    colors: { raw: {} },
    on_sale: { raw: {} },
    images: { raw: {} },
    price: { raw: { size: 20 } },
    sale_price: { raw: { size: 20 } },
    rating: { raw: { size: 20 } }
  }
}

const config = {
  initialState: {
    resultsPerPage: 20
  },
  searchQuery: { ...facetsConfig, ...resultFields },
  autocompleteQuery: {
    suggestions: {
      size: 6,
      types: {
        documents: {
          fields: ["name"]
        }
      }
    }
  }
}

const SearchBoxContainer = styled.div`
  margin-bottom: 2rem;
`

const PageGrid = styled.div`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas: "facets results results";
`

const FacetsContainer = styled.div`
  background: ${props => props.theme.colors.gray1};
  grid-area: facets;
`

const FacetsHeader = styled(BackgroundImage)`
  z-index: 1;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: ${props => props.theme.colors.white};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-size: .75em;
  justify-content: space-between;
`

const FacetsHeaderButtonLink = styled.button`
    display: inline-block;
    border: none;
    margin: 0;
    text-decoration: none;
    background: none;
    color: ${props => props.theme.colors.primaryLight};
    font-size: .8rem;
    line-height: 1;
    cursor: pointer;
    -webkit-appearance: none;
    -moz-appearance: none;
`

const FacetsContent = styled.div`
  padding: 1rem;
`

const ResultsContainer = styled.div`
  grid-area: results;
`

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  height: 50px;
`

const ResultsGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr 1fr 1fr 1fr;
`

const ResultsPagination = styled(Pagination)`
  list-style: none;
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid ${props => props.theme.colors.gray3};

  li {
    height: ${props => props.theme.sizes.l}rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 0.875rem;
    font-weight: 500;
    color: ${props => props.theme.colors.gray8};
    cursor: pointer;

    &.rc-pagination-total-text {
      margin-right: auto;
    }

    &.rc-pagination-item,
    &.rc-pagination-next,
    &.rc-pagination-prev {
      &:hover {
        color: ${props => props.theme.colors.primary};
      }
    }

    &.rc-pagination-item {
      border-radius: 2px;
      background: ${props => props.theme.colors.gray1};
      padding: 0 ${props => props.theme.sizes.m}rem;

      &.rc-pagination-item-active {
        background: ${props => props.theme.colors.primary};
        color: ${props => props.theme.colors.white};
      }
    }

    &.rc-pagination-disabled {
      color: ${props => props.theme.colors.gray6};
      pointer-events: none;
    }

    &.rc-pagination-jump-next:before {
      content: '•••';
      color: ${props => props.theme.colors.gray5};
    }

    &.rc-pagination-next:before {
      content: 'Next';
    }

    &.rc-pagination-prev:before {
      content: 'Previous';
    }

    & + li {
      margin-left: ${props => props.theme.sizes.s}rem;
    }
  }
`
const mapContextToProps = ({
  results,
  resultsPerPage,
  totalResults,
  clearFilters
}) => ({
  results,
  resultsPerPage,
  totalResults,
  clearFilters
})

const SearchPage = ({ data, location }) => {
  // This mess with  useEffect is to ake sure AppSearchAPIConnector is not
  // created until after SSR occurs, because we need to read credentials for
  // the URL to make sure the connector is only created once.
  const [apiConnector, setApiConnector] = useState()
  useEffect( () => {
    getConfig().then(([endpointBase, searchKey, engineNames]) => {
      if (searchKey && endpointBase) {
        setApiConnector(new AppSearchAPIConnector({
          searchKey: searchKey,
          engineName: 'products' in engineNames ? engineNames['products'] : 'ecommerce',
          endpointBase: endpointBase,
          cacheResponses: false
        }))
      } else {
        navigate('/error')
      }
    })
  }, []) 


  return (
  <Layout showSearch={false} location={location} >
    {apiConnector && <SearchProvider config={{ ...config, apiConnector }}>
       <WithSearch mapContextToProps={mapContextToProps}>
        {({
          results,
          resultsPerPage,
          totalResults,
          clearFilters
        }) => {
          const handleClearClick = e => {
            e.preventDefault()
            clearFilters()
          }
          return <>
            <SearchBoxContainer>
              <SearchInput size="l" />
            </SearchBoxContainer>
            <PageGrid>
              <FacetsContainer>
                <FacetsHeader fluid={data.footerBackground.childImageSharp.fluid}>
                  Filter results
                  <FacetsHeaderButtonLink onClick={handleClearClick}>
                    Reset
                  </FacetsHeaderButtonLink>
                </FacetsHeader>
                <FacetsContent>
                  <Facet
                    show={2}
                    field="department"
                    label="Department"
                    view={props => <SearchFacet {...props} />}
                  />

                  <Facet
                    show={100}
                    field="category"
                    label="Category"
                    view={props => <SearchFacet {...props} />}
                  />

                  <Facet
                    show={100}
                    field="on_sale"
                    label="On Sale"
                    view={props => <SearchFacet booleanValueName="Semi Annual Sale" {...props} />}
                  />

                  <RangeSlider
                    min={0}
                    max={999}
                    prefix="$"
                    field="price"
                    label="Price"
                  />

                  <Facet
                    show={100}
                    field="colors"
                    label="Colors"
                    view={props => <SearchFacet {...props} />}
                  />

                  <Facet
                    show={100}
                    field="sizes"
                    label="Size"
                    view={props => <SearchFacet {...props} />}
                  />

                  <Facet
                    field="rating"
                    label="Rating"
                    view={props => <SearchFacet type="rating" showCount={false} {...props} />}
                  />
                </FacetsContent>
              </FacetsContainer>

              <ResultsContainer>
                <ResultsHeader>
                  <PagingInfo />
                  <Sorting
                    sortOptions={[
                      { name: "Sort by Relevance", value: "_score", direction: "desc" },
                      { name: "Sort by Price (high to low)", value: "price", direction: "desc" },
                      { name: "Sort by Price (low to high)", value: "price", direction: "asc" },
                      { name: "Sort by Name", value: "name", direction: "asc" },
                      { name: "Sort by Rating", value: "rating", direction: "desc" }
                    ]}
                    view={({ onChange, value, options }) => <Select options={options} onChange={o => onChange(o.target.value)} defaultValue={value} />}
                  />
                </ResultsHeader>
                <ResultsGrid>
                  {results.map((result, index) => <ProductResult key={index} product={result} />)}
                </ResultsGrid>
                <Paging
                  view={({ current, onChange }) => <ResultsPagination
                    onChange={onChange}
                    current={current}
                    total={totalResults}
                    pageSize={resultsPerPage}
                    hideOnSinglePage={true}
                  />}
                />
              </ResultsContainer>
            </PageGrid>
          </>
        }}
      </WithSearch>
    </SearchProvider>}
  </Layout>
)}

export const query = graphql`
  query {
    footerBackground: file(relativePath: { eq: "footer-bg.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 1440, maxHeight: 540) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`

export default SearchPage
