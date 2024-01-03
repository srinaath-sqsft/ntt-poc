import React, { useState, useContext, useEffect } from 'react';

import styled from "styled-components";

export const MessageHeader = styled.div`
font-weight: bold;
color: #794b02;
`

export const Message = styled.div`
box-shadow: inset 0 0 0 1px #c9ba9b, 0 0 0 0 transparent;
background-color: #fffaf3;
color: #573a08;
min-height: 1em;
margin: 1em 0;
padding: 1em 1.5em;
line-height: 1.4285em;
width: 80%;
margin: auto;
`