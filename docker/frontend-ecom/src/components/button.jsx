import React from 'react'
import styled from 'styled-components'
import { Link } from "gatsby"


export const Button = styled.button`
  height: 2.125rem;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  padding: 0.5em 1rem;
  display: inline-flex;
  align-items: center;
  appearance: none;
  border: 0;
  font-weight: 600;
  transition: background 0.2s ease;
  cursor: pointer;
  border-radius: 8px;
  margin-right: 0.5em;

  &:hover {
    background: ${props => props.theme.colors.primaryLight};
  }
`

export const BrowseButton = styled(Link)`
    color: #fff;
    background-color: #17a2b8;
    border-color: #17a2b8;
    height: 2.125rem;
    padding: 0.5em 1rem;
    display: inline-flex;
    align-items: center;
    appearance: none;
    border: 0;
    font-weight: 600;
    transition: background 0.2s ease;
    cursor: pointer;
    border-radius: 8px;
    margin-right: 0.5em;

    &:hover {
        background: ${props => props.theme.colors.primaryLight};
    }
`