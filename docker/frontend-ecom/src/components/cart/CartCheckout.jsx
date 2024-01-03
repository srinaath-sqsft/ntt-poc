import React from 'react'
import styled from "styled-components";
import { Form, Field } from "react-final-form";
import Wrapper from "../wrapper";
import FlexGroup from "../flexGroup";
import FlexItem from "../flexItem";
import {Button} from "../button"
const CheckoutButton = styled(Button)`
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;
    width: 11.5em;
`

const Label = styled.label`
    margin-bottom: 0.5rem;
`

const StyledField = styled(Field)`
    display: block;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #495057;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    margin-bottom: 1rem;
`

const CheckoutContainer = styled.div`
    width: 80%;
    margin-left: auto;
    margin-right: auto;
`


const CartCheckout = ({onSubmit}) => {


    return (
        <CheckoutContainer>
            <FlexGroup>
                <FlexItem><h3>Checkout</h3></FlexItem>
            </FlexGroup>
            <Form
                onSubmit={onSubmit}
                render={({handleSubmit, form }) => (
                    <form onSubmit={handleSubmit}>
                        <FlexGroup>
                            <FlexItem grow={3}>
                                <Label htmlFor="email">E-mail Address</Label>
                                <StyledField
                                    component="input"
                                    name="email"
                                    defaultValue="someone@example.com"
                                    className="form-control"
                                    type="email"
                                ></StyledField>
                            </FlexItem>
                            <FlexItem grow={3}>
                                <Label htmlFor="street_address">Street Address</Label>
                                <StyledField
                                    component="input"
                                    name="street_address"
                                    defaultValue="1600 Amphitheatre Parkway"
                                    className="form-control"
                                    type="text"
                                />
                            </FlexItem>
                            <FlexItem grow={1}>
                                <Label htmlFor="zip_code">Zip Code</Label>
                                <StyledField
                                    component="input"
                                    name="zip_code"
                                    defaultValue="1600 Amphitheatre Parkway"
                                    className="form-control"
                                    defaultValue="94043"
                                    type="text"
                                />
                            </FlexItem>
                        </FlexGroup>
                        <FlexGroup>
                            <FlexItem grow={3}>
                                <Label htmlFor="city">City</Label>
                                <StyledField
                                    component="input"
                                    name="city"
                                    defaultValue="Mountain View"
                                    className="form-control"
                                    type="text"
                                />
                            </FlexItem>
                            <FlexItem grow={1}>
                                <Label htmlFor="state">State</Label>
                                <StyledField
                                    component="input"
                                    name="state"
                                    defaultValue="CA"
                                    className="form-control"
                                    type="text"
                                />
                            </FlexItem>
                            <FlexItem grow={3}>
                                <Label htmlFor="country">Country</Label>
                                <StyledField
                                    component="input"
                                    name="country"
                                    defaultValue="United States"
                                    className="form-control"
                                    type="text"
                                />
                            </FlexItem>
                        </FlexGroup>
                        <FlexGroup>
                            <FlexItem grow={4}>
                                <Label htmlFor="credit_card_number">Credit Card Number</Label>
                                <StyledField
                                    id='credit_card_number'
                                    component="input"
                                    name="credit_card_number"
                                    defaultValue="4432-8015-6152-0454"
                                    className="form-control"
                                    type="text"
                                />
                            </FlexItem>
                            <FlexItem grow={1}>
                                <Label htmlFor="credit_card_expiration_month">Month</Label>
                                <StyledField
                                    component="select"
                                    name="credit_card_expiration_month"
                                    className="form-control"
                                    defaultValue="1"
                                >
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </StyledField>
                            </FlexItem>
                            <FlexItem grow={1}>
                                <Label htmlFor="credit_card_expiration_year">Year</Label>
                                <StyledField
                                    component="select"
                                    name="credit_card_expiration_year"
                                    className="form-control"
                                    defaultValue="2024"
                                >
                                    <option value="2020">2020</option>
                                    <option value="2021">2021</option>
                                    <option value="2022">2022</option>
                                    <option value="2023">2023</option>
                                </StyledField>
                            </FlexItem>
                            <FlexItem grow={1}>
                                <Label htmlFor="credit_card_cvv">CVV</Label>
                                <StyledField
                                    component="input"
                                    type="password"
                                    className="form-control"
                                    name="credit_card_cvv"
                                    defaultValue="672"
                                    autoComplete="off"
                                    pattern="\d{3}"
                                ></StyledField>
                            </FlexItem>
                        </FlexGroup>
                        <FlexGroup>
                            <FlexItem flex={0}>
                                <CheckoutButton name="Checkout" type="submit">
                                    Place your order &rarr;
                                </CheckoutButton>
                            </FlexItem>
                        </FlexGroup>
                    </form>
                )}
            />
        </CheckoutContainer>
    )
}

export default CartCheckout;