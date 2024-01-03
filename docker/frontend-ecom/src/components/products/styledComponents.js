import { Link } from 'gatsby'
import styled from 'styled-components'
import Img from 'gatsby-image'

export const Container = styled(Link)`
  display: block;
  color: ${props => props.theme.colors.gray9};
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`

export const Image = styled(Img)`
  margin-bottom: ${props => props.theme.sizes.s}rem;
`

export const Title = styled.div`
  font-size: ${props => props.theme.sizes.m}rem;

  em {
    font-weight: 700;
  }
`

export const Price = styled.span`
  font-size: ${props => props.theme.sizes.m}rem;
  font-weight: 600;
`

export const SalePrice = styled(Price)`
  color: ${props => props.theme.colors.red};
  margin-right: .25rem;
`

export const ListPrice = styled(Price)`
  color: ${props => props.theme.colors.gray6};
  text-decoration: line-through;
`

export const Rating = styled.div`
  margin-top: .25rem;
  font-size: 0.5rem;
  opacity: 0.8;

  svg + svg {
    margin-left: .05rem;
  }
`

export const SaleBanner = styled.div`
  display: flex;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.65rem;
  font-weight: 600;
  margin-bottom: .25rem;

  svg {
    margin-right: .25rem;
  }
`
