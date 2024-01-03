import React, { useEffect, useState } from "react";
import styled from "styled-components";
import FlexItem from './flexItem';
import { Link }  from 'gatsby';
import fetch from 'node-fetch'

const DisplayText = styled.div`
  font-family: ${props => props.theme.fontFamily.display};
  text-align: center;
`

const BannerText = styled(DisplayText)`
  font-weight: 500;
  font-size: 1.5rem;
`

const Underline = styled(Link)`
  color: white;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  position: relative;

  &:after {
    content: '';
    width: 100%;
    height: 2px;
    background: currentColor;
    position: absolute;
    left: 0;
    top: 100%;
  }
`

const Ads = ({ }) => {

    const [ads, setAds] = useState([])
    useEffect(() => {
        loadAds()
    }, []);


    async function loadAds() {
        const data = await fetch(`/api/ads`)
            .then(response => {
                return response.json()
            }).catch(error => {
                console.log(error)
            })
        setAds(data)
    }
    if (ads.length > 0) {
    return (
        <>
            <FlexItem>
               <BannerText>{ads[0].text}</BannerText>
            </FlexItem>
            <FlexItem grow={0}>
                  <Underline to={ads[0].redirect_url}>See the offer</Underline>
            </FlexItem>
        </>
    ) }
    else return (<></>)
}

export default Ads;