import React from 'react'
import numeral from 'numeral'
import { times } from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'

export const generateStars = (number) => {
  const rating = Math.round(parseFloat(number))
  const difference = 5 - rating

  if (rating === 0) {
    return null
  }

  const ActiveStar = styled(FontAwesomeIcon)`
  `
  const InactiveStar = styled(FontAwesomeIcon)`
    opacity: 0.2;
  `

  return difference > 0 ? (
    <>
      {times(rating).map((i) => <ActiveStar key={i} icon={faStar} />)}
      {times(difference).map((i) => <InactiveStar key={i} icon={faStar} />)}
    </>
  ) : times(rating).map((i) => <ActiveStar key={i} icon={faStar} />)
}

export const formatPrice = (value) => {
  return numeral(value).format('$0,0.00')
}

export const getProductPath = (department, category, id) => `/products/${department}/${category}/${id}`
