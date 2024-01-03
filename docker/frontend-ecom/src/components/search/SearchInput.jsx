import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { SearchBox } from '@elastic/react-search-ui'
import { navigate } from 'gatsby'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

import Autocomplete from "./Autocomplete";

const inputSizes = {
  's': '40px',
  'l': '50px'
}

const InputContainer = styled.div`
  height: ${props => inputSizes[props.size]};
  position: relative;

  .sui-search-box {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: stretch;

    &__submit {
      display: none;
    }

    &__wrapper {
      width: 100%;
      height: 100%;
      outline: none;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      position: relative;
    }

    &__text-input {
      outline: none;
      position: relative;
      display: flex;
      align-items: center;
      height: ${props => inputSizes[props.size]};
      font-size: ${props => props.size === 's' ? '1rem' : '1.25rem'};
      width: 100%;
      padding: 0 1rem 0 ${props => inputSizes[props.size]};
      border: 1px solid ${props => props.theme.colors.gray4};
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      background: ${props => props.theme.colors.gray1};

      &::-webkit-input-placeholder,
      &::-ms-input-placeholder,
      &::placeholder {
        color: ${props => props.theme.colors.gray5};
      }

      &:focus {
        box-shadow: rgba(59, 69, 79, 0.3) 0px 2px 4px;
        border-top: 1px solid ${props => props.theme.colors.primary};
        border-left: 1px solid ${props => props.theme.colors.primary};
        border-right: 1px solid ${props => props.theme.colors.primary};
        border-bottom: 1px solid ${props => props.theme.colors.primary};

        outline: 0;
        border-color: ${props => props.theme.colors.primary};
        background: ${props => props.theme.colors.white};

        & + [class*='SearchInput__InputIconContainer'] {
          color: ${props => props.theme.colors.primary}
        }
      }
    }

    &__autocomplete-container {
      display: none;
      flex-direction: column;
      left: 0;
      right: 0;
      top: 98%;
      margin: 0;
      padding: 24px 0 12px 0;
      line-height: 1.5;
      background: ${props => props.theme.colors.white};
      position: absolute;
      box-shadow: rgba(59, 69, 79, 0.3) 0px 2px 4px;
      border-top: 1px solid ${props => props.theme.colors.gray4};
      border-left: 1px solid ${props => props.theme.colors.primary};
      border-right: 1px solid ${props => props.theme.colors.primary};
      border-bottom: 1px solid ${props => props.theme.colors.primary};

      ul {
        list-style: none;
        margin: 0;
        padding: 0 0 24px 0;
        background: transparent;

        &:last-child {
          padding: 0;
        }

        li {
          margin: 0 12px;
          font-size: 0.9em;
          padding: 4px 12px;
          color: ${props => props.theme.colors.gray8};

          &:hover {
            background: ${props => props.theme.colors.primary};
            color: ${props => props.theme.colors.white};

            em {
              background: transparent;
              color: ${props => props.theme.colors.white};
            }
          }

          &[aria-selected="true"] {
            background: ${props => props.theme.colors.primary};
            color: ${props => props.theme.colors.white};

            em {
              background: transparent;
              color: ${props => props.theme.colors.white};
            }
          }

          em {
            font-style: normal;
            color: ${props => props.theme.colors.primary};
            background: #edf0fd;
          }
        }
      }
    }

    &__section-title {
      color: ${props => props.theme.colors.gray6};
      font-size: 0.7em;
      letter-spacing: 1px;
      font-weight: normal;
      padding: 0 0 4px 24px;
      text-transform: uppercase;
    }

    &.autocomplete {
      .sui-search-box__text-input {
        box-shadow: rgba(59, 69, 79, 0.3) 0px 2px 4px;
      }

      .sui-search-box__autocomplete-container {
        display: flex;
        z-index: 2;
      }
    }
  }
`

const InputIconContainer = styled.div`
  width: ${props => inputSizes[props.size]};
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
  color: ${props => props.isFocused ? props.theme.colors.primary : props.theme.colors.gray6};
`

const SearchInput = ({
  onChange,
  onKeyPress,
  size,
  navigateOnSuggestionSelect,
  placeholder
}) => {
  const [isFocused, setFocused] = useState(true)
  const onFocus = () => setFocused(true)
  const onBlur = () => setFocused(false)
  const searchField = useRef(null)
  const isLarge = size === 'l'

  useEffect(() => {
    searchField.current.focus()
  }, [])

  return (
    <InputContainer size={size}>
      <SearchBox
        autocompleteView={Autocomplete}
        isFocused={isFocused}
        autocompleteResults={
          isLarge ? false :
          {
            titleField: 'name',
            urlField: 'id',
            priceField: 'price',
            salePriceField: 'sale_price',
            ratingField: 'rating',
            sectionTitle: 'Suggested Results'
          }
        }
        autocompleteMinimumCharacters={2}
        autocompleteSuggestions={{
          sectionTitle: 'Suggested Queries'
        }}
        inputProps={{
          placeholder: placeholder || '',
          type: 'search',
          ref: searchField,
          onChange,
          onKeyPress,
          onFocus,
          onBlur
        }}
        debounceLength={200}
        onSelectAutocomplete={(
          selection,
          _,
          defaultOnSelectAutocomplete
        ) => {
          if (selection.suggestion && navigateOnSuggestionSelect) {
            navigate(`/search?q=${selection.suggestion}`)
          } else if (selection.suggestion && !navigateOnSuggestionSelect) {
            defaultOnSelectAutocomplete(selection);
          } else {
            const { department, category, id } = selection
            navigate(`/products/${department.raw}/${category.raw}/${id.raw}`)
          }
        }}
      />
      <InputIconContainer size={size} isFocused={isFocused}>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </InputIconContainer>
    </InputContainer>
  )
}

SearchInput.propTypes = {
  autoFocus: PropTypes.bool,
  inputProps: PropTypes.object,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onKeyPress: PropTypes.func,
  navigateOnSuggestionSelect: PropTypes.bool,
  size: PropTypes.oneOf(['s','l']),
  placeholder: PropTypes.string,
}

SearchInput.defaultProps = {
  autoFocus: false,
  navigateOnSuggestionSelect: false,
  size: 's'
}

export default SearchInput
