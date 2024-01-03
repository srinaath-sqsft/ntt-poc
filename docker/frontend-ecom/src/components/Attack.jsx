import React, { useEffect, useState } from 'react'
import fetch from 'node-fetch'
import { Button } from './button'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faShield, faShieldVirus } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'

const Done = styled(FontAwesomeIcon)`
    color: green;
    font-size: 25px;
  `
const Ready = styled(FontAwesomeIcon)`
  color: red;   
  font-size: 25px;
  &:hover {
      cursor: pointer;
  }
`

const Attack = () => {
    const [done, setDone] = useState(false);

    const sendAttack = (e) => {
        setDone(true)
        fetch('/api/attack', {
            method: 'GET',
            headers: {
            "Content-type": "application/json",
            }
        })
        }

    return (
        <>
            {done? <Done icon={faCheckCircle}/> : <Ready icon={faShieldVirus} onClick={sendAttack} />}
        </>
    )

}

export default Attack;