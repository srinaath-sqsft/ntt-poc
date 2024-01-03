import React from "react";
import styled from "styled-components";

import { formatPrice, generateStars } from "../../utils"

import {
  Title,
  SalePrice,
  ListPrice,
  Price,
  Rating,
} from "../products/styledComponents"

const AutocompleteResults = styled.ul`
  padding: 0 12px !important;

  li {
    margin: 0 !important;
  }
`

const AutocompleteResult = styled.li`
  display: flex;
  align-items: center;

  & + & {
    margin-top: .25rem !important;
  }

  &:hover,
  &[aria-selected="true"] {
    cursor: pointer;

    * {
      color: ${props => props.theme.colors.white};
    }
  }
`

const AutocompleteResultThumbnail = styled.img`
  max-width: ${props => props.theme.sizes.xxl}rem;
  margin-right: ${props => props.theme.sizes.s}rem;
  flex-grow: 0;
`

const AutocompleteTitle = styled(Title)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AutocompleteResultContent = styled.span`
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - 3rem);
`

const AutocompleteResultMeta = styled.span`
  display: flex;
  align-items: center;

  > * {
    margin-top: 0;
    margin-bottom: 0;
    margin-right: .5em;
  }
`

function getRaw(result, value) {
  if (!result[value] || !result[value].raw) return;
  return result[value].raw;
}

function getSnippet(result, value) {
  if (!result[value] || !result[value].snippet) return;
  return result[value].snippet;
}

function getSuggestionTitle(suggestionType, autocompleteSuggestions) {
  if (autocompleteSuggestions.sectionTitle) {
    return autocompleteSuggestions.sectionTitle;
  }

  if (
    autocompleteSuggestions[suggestionType] &&
    autocompleteSuggestions[suggestionType].sectionTitle
  ) {
    return autocompleteSuggestions[suggestionType].sectionTitle;
  }
}

function getProductImage(result) {
  const images = getRaw(result, 'images') || [];
  const imageString = images[0];
  if (!imageString) return "";

  const image = JSON.parse(imageString);
  return image.childImageSharp.fluid.src;
}

function Autocomplete({
  autocompleteResults,
  autocompletedResults,
  autocompleteSuggestions,
  autocompletedSuggestions,
  getItemProps,
  getMenuProps
}) {
  let index = 0;
  return (
    <div
      {...getMenuProps({
        className: "sui-search-box__autocomplete-container"
      })}
    >
      <div>
        {!!autocompleteSuggestions &&
          Object.entries(autocompletedSuggestions).map(
            ([suggestionType, suggestions]) => {
              return (
                <React.Fragment key={suggestionType}>
                  {getSuggestionTitle(
                    suggestionType,
                    autocompleteSuggestions
                  ) &&
                    suggestions.length > 0 && (
                      <div className="sui-search-box__section-title">
                        {getSuggestionTitle(
                          suggestionType,
                          autocompleteSuggestions
                        )}
                      </div>
                    )}
                  {suggestions.length > 0 && (
                    <ul className="sui-search-box__suggestion-list">
                      {suggestions.map(suggestion => {
                        index++;
                        return (
                          // eslint-disable-next-line react/jsx-key
                          <li
                            {...getItemProps({
                              key:
                                suggestion.suggestion || suggestion.highlight,
                              index: index - 1,
                              item: suggestion
                            })}
                          >
                            {suggestion.highlight ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: suggestion.highlight
                                }}
                              />
                            ) : (
                              <span>{suggestion.suggestion}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </React.Fragment>
              );
            }
          )}
        {!!autocompleteResults &&
          !!autocompletedResults &&
          autocompletedResults.length > 0 &&
          autocompleteResults.sectionTitle && (
            <div className="sui-search-box__section-title">
              {autocompleteResults.sectionTitle}
            </div>
          )}
        {!!autocompleteResults &&
          !!autocompletedResults &&
          autocompletedResults.length > 0 && (
            <AutocompleteResults className="sui-search-box__results-list">
              {autocompletedResults.map(result => {
                index++;
                const titleSnippet = getSnippet(
                  result,
                  autocompleteResults.titleField
                );
                const titleRaw = getRaw(result, autocompleteResults.titleField);
                const imageSrc = getProductImage(result);
                const price = getRaw(result, autocompleteResults.priceField);
                const salePrice = getRaw(result, autocompleteResults.salePriceField);
                const rating = getRaw(result, autocompleteResults.ratingField);

                return (
                  // eslint-disable-next-line react/jsx-key
                  <AutocompleteResult
                    {...getItemProps({
                      key: result.id.raw,
                      index: index - 1,
                      item: result
                    })}
                  >
                    <AutocompleteResultThumbnail alt={titleRaw} src={imageSrc} />
                    <AutocompleteResultContent>
                      {titleSnippet ? (
                        <AutocompleteTitle
                          dangerouslySetInnerHTML={{
                            __html: titleSnippet
                          }}
                        />
                      ) : (
                        <AutocompleteTitle>{titleRaw}</AutocompleteTitle>
                      )}
                      <AutocompleteResultMeta>
                        {salePrice ? (
                          <>
                            <ListPrice>{formatPrice(price)}</ListPrice>
                            <SalePrice>{formatPrice(salePrice)}</SalePrice>
                          </>
                        ) : (
                          <Price>{formatPrice(price)}</Price>
                        )}
                        {rating && <Rating>{generateStars(rating)}</Rating>}
                      </AutocompleteResultMeta>
                    </AutocompleteResultContent>
                  </AutocompleteResult>
                );
              })}
            </AutocompleteResults>
          )}
      </div>
    </div>
  );
}

export default Autocomplete;
