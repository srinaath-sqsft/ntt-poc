import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'
import { withSearch } from '@elastic/react-search-ui'
import _get from 'lodash/get'

import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

import { FacetContainer, FacetHeader } from './SearchFacet'

const createSliderWithTooltip = Slider.createSliderWithTooltip
const Range = createSliderWithTooltip(Slider.Range)

const Container = styled.div`
  padding: 0 0.33rem 1.25rem;
`

const RangeSlider = ({
  options,
  label,
  field,
  setFilter,
  filters,
  min,
  max,
  prefix,
  step,
  theme: { colors }
}) => {
  const [value, setValue] = useState([
    parseInt(_get(filters[0], 'price[0].from', min)),
    parseInt(_get(filters[0], 'price[0].to', max))
  ])

  const updateFilterValue = () => setFilter(field, { from: value[0], to: value[1] })

  useEffect(() => {
    if (!filters[0]) {
      setValue([min, max])
    }
  }, [filters])

  return (
    <FacetContainer>
      <FacetHeader>{label}</FacetHeader>
      <Container options={options}>
        <Range
          min={min}
          max={max}
          value={value}
          marks={{
            [min]: `${prefix}${min}`,
            [max]: `${prefix}${max}`
          }}
          onChange={setValue}
          onAfterChange={updateFilterValue}
          step={step}
          tipFormatter={value => `${prefix}${value}`}
          trackStyle={[{ background: colors.gray7 }]}
          railStyle={{ background: colors.gray3 }}
          dotStyle={{ border: 'none', background: colors.gray3 }}
          handleStyle={[{ borderColor: colors.gray7 }]}
        />
      </Container>
    </FacetContainer>
  )
}

RangeSlider.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object),
  theme: PropTypes.object,
  label: PropTypes.string.isRequired,
  prefix: PropTypes.string,
  field: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number
}

RangeSlider.defaultProps = {
  step: 1
}

export default withSearch(({ filters, setFilter }) => ({ filters, setFilter }))(withTheme(RangeSlider))
