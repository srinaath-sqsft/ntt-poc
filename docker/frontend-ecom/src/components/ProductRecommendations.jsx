import React, { useState, useEffect } from 'react'
import styled from "styled-components";
import Recommendation from './Recommendation'
import fetch from 'node-fetch'


const Title = styled.div`
    font-size: 1.1em;
    font-weight: 600;
    padding-top: 1.5em;
    flex-grow: 1;
    flex-basis: 0;
    color: #272e36;
`


const FigureList = styled.ul`
    display: flex;
    list-style: none;
    flex-wrap: wrap;
    padding: 0;
    justify-content: space-between;
`


const ProductRecommendations = ({ recommendations }) => {


    const [recommendationData, setRecommendationData] = useState([])
    useEffect(() => {
        loadRecommendationsDetails()
    }, []);


    async function loadRecommendationsDetails() {
        let details = []
        for (let id of recommendations) {
            const data = await fetch(`/api/products-detail/${id}`)
                .then(response => {
                    return response.json()
                }).catch(error => {
                    console.log(error)
                })
            details.push(data)
        }
        setRecommendationData(details)
    }


    return (
        <>
            <Title>Products you might also like</Title>
            <FigureList>
                {recommendationData.slice(0, 4).map((recommendation ) => (
                    <Recommendation key={recommendation.id} data={recommendation} />
                ))}
            </FigureList>
        </>
    )
};



export default ProductRecommendations;
