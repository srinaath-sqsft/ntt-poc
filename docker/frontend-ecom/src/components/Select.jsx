import React from 'react'
import PropTypes from 'prop-types'
import styled, { withTheme } from 'styled-components'
import { capitalize } from 'lodash'

const Container = styled.span`
  position: relative;

  &:after {
    content: '';
    display: ${props => props.options.length > 1 ? 'block' : 'none'};
    width: 6px;
    height: 6px;
    position: absolute;
    top: 50%;
    margin-top: -2px;
    right: ${props => props.theme.sizes.m}rem;
    border-right: 2px solid ${props => props.theme.colors.gray4};
    border-bottom: 2px solid ${props => props.theme.colors.gray4};
    transform: translateY(-50%) rotate(45deg);
    z-index: 2;
    pointer-events: none;
  }
`

const SelectElement = styled.select`
  height: ${props => props.theme.sizes.xxl}rem;
  border: 1px solid ${props => props.theme.colors.gray4};
  border-radius: 0;
  appearance: none;
  padding: 0 ${props => props.options.length > 1 ? props.theme.sizes.xl : props.theme.sizes.m}rem 0 ${props => props.theme.sizes.m}rem;
  background: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.gray8};
`

const Option = styled.option`
  text-transform: capitalize;
`

const Select = ({ options, onChange, defaultValue }) => (
  <Container options={options}>
    <SelectElement options={options} disabled={options.length === 1} defaultValue={defaultValue} onChange={onChange}>
      {options.map((option) => <Option key={option.value} value={option.value}>{capitalize(option.label)}</Option>)}
    </SelectElement>
  </Container>
)

Select.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string
}

export default withTheme(Select)
