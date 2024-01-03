import React from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'

const FacetContainer = styled.div`
  margin-bottom: 1.5rem;
`
const FacetHeader = styled.div`
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: .25rem;
  letter-spacing: 0.08em;
  font-size: ${props => props.theme.sizes.m}rem;
  color: ${props => props.theme.colors.gray9};
`
const FacetContent = styled.div``

const FacetOption = styled.div``
const FacetOptionInput = styled.input``
const FacetOptionLabel = styled.label``
const FacetOptionCount = styled.span``

const Facet = ({ label, onRemove, onSelect, options, values, showCount }) => (
  <FacetContainer>
    {label && <FacetHeader>{label}</FacetHeader>}
    <FacetContent>
      {options.map(option => {
        const checked = values.includes(option.value)

        return (
          <FacetOption key={option.value}>
            <FacetOptionInput
              type="checkbox"
              name={label}
              value={option.value}
              id={`facet_${label}${option.value}`}
              checked={checked}
              onChange={() => checked ? onRemove(option.value) : onSelect(option.value)}
            />
            <FacetOptionLabel htmlFor={`facet_${label}${option.value}`}>
              {` ${option.value} `}
              {showCount && <FacetOptionCount className="count">{option.count.toLocaleString()}</FacetOptionCount>}
            </FacetOptionLabel>
          </FacetOption>
        )
      })}
    </FacetContent>
  </FacetContainer>
)

Facet.propTypes = {
  label: PropTypes.string,
  options: PropTypes.array.isRequired,
  values: PropTypes.array.isRequired,
  showCount: PropTypes.bool,
  onRemove: PropTypes.func,
  onSelect: PropTypes.func
}

Facet.defaultProps = {
  showCount: true
}

export default withTheme(Facet)
