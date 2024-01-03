import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'
import { startCase, take, drop } from 'lodash'

import { generateStars } from '../../utils'

export const FacetContainer = styled.div`
  margin-bottom: 1.5rem;
`
export const FacetHeader = styled.div`
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: .5rem;
  letter-spacing: 0.08em;
  font-size: ${props => props.theme.sizes.m}rem;
  color: ${props => props.theme.colors.gray9};
`
const FacetContent = styled.div``
const FacetOptionsGroup = styled.div`
  display: ${props => props.visible ? 'block' : 'none'};
`
const FacetOptionsGroupControl = styled.button`
  background: transparent;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.65rem;
  color: ${props => props.theme.colors.gray7};
  height: ${props => props.theme.sizes.l}rem;
  appearance: none;
  padding: 0;
  display: block;
  align-items: center;
  border: 0;
  font-weight: 600;
  cursor: pointer;

  &:focus {
    outline: 0;
  }
`
const FacetOption = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.gray9};
`
const FacetOptionInput = styled.input`
  margin-right: .5rem;
`
const FacetOptionLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  height: 1.5rem;
  ${props => props.checked && `color: ${props.theme.colors.primary};`}
  ${props => props.checked && 'font-weight: 600;'}
`
const FacetOptionCount = styled.span`
  color: ${props => props.theme.colors.gray7};
`

const FacetRatingStars = styled.div`
  display: flex;
  align-items: center;

  svg {
    font-size: 0.75rem;
  }
`

const SearchFacet = ({ label, booleanValueName, onRemove, onSelect, options, values, showCount, type }) => {
  const OptionNodes = () => {
    const [showMore, setshowMore] = useState(false)
    const optionsGroupControlOnClick = () => showMore ? setshowMore(false) : setshowMore(true)

    return options.length > 5 ? (
      <>
        <FacetOptionsGroup visible={true}>
          {take(options, 5).map((option, index) => {
            const checked = values.includes(option.value)
            return (
              <FacetOption key={index}>
                <FacetOptionInput
                  type="checkbox"
                  name={label}
                  value={option.value}
                  id={`facet_${label}_${index}`}
                  checked={checked}
                  onChange={() => checked ? onRemove(option.value) : onSelect(option.value)}
                />
                <FacetOptionLabel checked={checked} htmlFor={`facet_${label}_${index}`}>
                  {startCase(option.value) || option.name}
                  {showCount && <FacetOptionCount className="count">{option.count.toLocaleString()}</FacetOptionCount>}
                </FacetOptionLabel>
              </FacetOption>
            )
          })}
        </FacetOptionsGroup>
        <FacetOptionsGroup visible={showMore}>
          {drop(options, 5).map((option, index) => {
            const checked = values.includes(option.value)
            return (
              <FacetOption key={index}>
                <FacetOptionInput
                  type="checkbox"
                  name={label}
                  value={option.value}
                  id={`facet_${label}_additional_${index}`}
                  checked={checked}
                  onChange={() => checked ? onRemove(option.value) : onSelect(option.value)}
                />
                <FacetOptionLabel checked={checked} htmlFor={`facet_${label}_additional_${index}`}>
                  {startCase(option.value) || option.name}
                  {showCount && <FacetOptionCount className="count">{option.count.toLocaleString()}</FacetOptionCount>}
                </FacetOptionLabel>
              </FacetOption>
            )
          })}
        </FacetOptionsGroup>
        <FacetOptionsGroupControl onClick={optionsGroupControlOnClick}>{showMore ? '- Show Less' : `+ Show ${drop(options, 5).length} More`}</FacetOptionsGroupControl>
      </>
    ) : (
      <FacetOptionsGroup visible={true}>
        {options.map((option, index) => {

          const isRangeFilter = type === 'rating' || type === 'range'
          const isBooleanFilter = !!booleanValueName
          const value = isRangeFilter ? { from: Number(option.value.from), to: Number(option.value.to) } : option.value
          const checked = isRangeFilter ? values.filter(elem => elem.from === value.from && elem.to === value.to).length > 0 : values.includes(option.value)

          if (isBooleanFilter && option.value === 'false') { return false }
          return (
            <FacetOption key={index}>
              <FacetOptionInput
                type="checkbox"
                name={label}
                value={value}
                id={`facet_${label}_${index}`}
                checked={checked}
                onChange={() => checked ? onRemove(value) : onSelect(value)}
              />
              <FacetOptionLabel checked={checked} htmlFor={`facet_${label}_${index}`}>
                {type === 'rating' ? <FacetRatingStars>{generateStars(index + 1)}&nbsp;and up</FacetRatingStars> : startCase(booleanValueName || option.value) || option.name}
                {showCount && <FacetOptionCount className="count">{option.count.toLocaleString()}</FacetOptionCount>}
              </FacetOptionLabel>
            </FacetOption>
          )
        })}
      </FacetOptionsGroup>
    )
  }

  return (
    <FacetContainer>
      {label && <FacetHeader>{label}</FacetHeader>}
      <FacetContent>
        <OptionNodes />
      </FacetContent>
    </FacetContainer>
  )
}

SearchFacet.propTypes = {
  label: PropTypes.string,
  booleanValueName: PropTypes.string,
  options: PropTypes.array.isRequired,
  values: PropTypes.array.isRequired,
  showCount: PropTypes.bool,
  onRemove: PropTypes.func,
  onSelect: PropTypes.func,
  type: PropTypes.oneOf(['default', 'rating', 'range'])
}

SearchFacet.defaultProps = {
  showCount: true,
  type: 'default'
}

export default withTheme(SearchFacet)
