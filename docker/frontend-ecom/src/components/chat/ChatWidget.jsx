import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Widget, addResponseMessage, toggleMsgLoader } from 'react-chat-widget'
import * as ElasticAppSearch from '@elastic/app-search-javascript'
import retext from 'retext'
import retextPOS from 'retext-pos'
import retextKeywords from 'retext-keywords'
import nlcstToString from 'nlcst-to-string'
import getConfig from '../../getConfig'
import { navigate } from 'gatsby'

import 'react-chat-widget/lib/styles.css'

let greetingSent = false

const stripHtml = (html) => {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const Container = styled.div`
  .rcw-widget-container {
    right: 1px;
    z-index: 999999;
  }
  .rcw-conversation-container {
    &.active {
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.03),
      0px 1px 2px rgba(0, 0, 0, 0.03),
      0px 4px 8px rgba(0, 0, 0, 0.03),
      0px 8px 16px rgba(0, 0, 0, 0.2);
    }
    .rcw-header {
      background:
        #B6458A
        url('data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wgARCAAeABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDBAH/xAAYAQADAQEAAAAAAAAAAAAAAAAAAQIDBP/aAAwDAQACEAMQAAABjwz69NSJU6YViNxhH//EABoQAAMBAQEBAAAAAAAAAAAAAAABAhEhMUH/2gAIAQEAAQUC4cHUH2niiNkpalyS/D//xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIQESIx/9oACAEDAQE/AW8GzJcr/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEBEhMf/aAAgBAgEBPwFLJpEe1//EABcQAAMBAAAAAAAAAAAAAAAAAAEgMEH/2gAIAQEABj8C2AT/xAAfEAACAQMFAQAAAAAAAAAAAAAAAREhQVEQMWFxkcH/2gAIAQEAAT8hbhUPNCLhteaO7YqZl34VjBTOBXG+CVsf/9oADAMBAAIAAwAAABAM0A//xAAYEQEBAQEBAAAAAAAAAAAAAAABEQAhMf/aAAgBAwEBPxCauEKBkescJd//xAAYEQEBAQEBAAAAAAAAAAAAAAABABEhQf/aAAgBAgEBPxDZhI2Kw8T3uX//xAAgEAEAAgICAQUAAAAAAAAAAAABABEhMUFR4WFxkaHR/9oACAEBAAE/EDBSvRbcrzleNsT2HpaI0vfMwA89++5RO1XmWYeCnx5hZ2QsaEpi67iu3f74iXDFsVKhxR9T/9k=')
        no-repeat
        center center / 100%;
    }
    .rcw-title {
      font-family: ${props => props.theme.fontFamily.display};
      text-transform: uppercase;
      font-weight: 500;
      padding-bottom: 8px;
      text-shadow: 0 2px 4px rgba(black, 0.5);
      + span {
        opacity: 0.875;
      }
    }
  }
  .rcw-launcher {
    background: ${props => props.theme.colors.primary};
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.03),
    0px 1px 2px rgba(0, 0, 0, 0.03),
    0px 4px 8px rgba(0, 0, 0, 0.03),
    0px 8px 16px rgba(0, 0, 0, 0.2);
  }
  .rcw-close-launcher {
    position: relative;
    top: 2px;
  }
  .rcw-message-text {
    font-weight: 500;
  }
  .rcw-client {
    .rcw-message-text {
      background: ${props => props.theme.colors.primary};
      color: ${props => props.theme.colors.white};
    }
  }
`


const ChatWidget = () => {

    // This mess with  useEffect is to ake sure AppSearchAPIConnector is not
  // created until after SSR occurs, because we need to read credentials for
  // the URL to make sure the connector is only created once.
  const [client, setClient] = useState()
  const [ kbUrl, setKbUrl ] = useState()
  useEffect( () => {
    getConfig().then(([endpointBase, searchKey, engineNames, kbUrl]) => {
      if (searchKey && endpointBase) {
        setClient(ElasticAppSearch.createClient({
          searchKey,
          endpointBase,
          engineName: engineNames && 'kb' in engineNames ? engineNames['kb'] : 'help-center',
          cacheResponses: false
        }))
        setKbUrl(kbUrl)
      } else {
        navigate('/error')
      }
    })
  }, [])

  useEffect(() => {
    if (!greetingSent) {
      greetingSent = true
      addResponseMessage('Hello, do you have a question?')
    }
  }, [])

  const handleNewUserMessage = (newMessage) => {
    retext().use(retextPOS).use(retextKeywords).process(newMessage, (err, file) => {
        const keywords = []
        file.data.keywords.forEach((keyword) => {
          keywords.push(nlcstToString(keyword.matches[0].node))
        })

        const phrases = []
        file.data.keyphrases.forEach((phrase) => {
          phrases.push(phrase.matches[0].nodes.map(nlcstToString).join(''))
        })

        const query = keywords.length > 0 ? keywords.join(' ') : newMessage

        client.search(query).then((resultList) => {
          const result = resultList.rawResults[0]
          const score = result._meta.score
          const id = result._meta.id
          toggleMsgLoader()
          setTimeout(() => {
            toggleMsgLoader()
            if (score < 1000) {
              addResponseMessage(`I'm not sure — let me connect you with someone who may be able to help.  One moment.`)
            } else {
              let answer = stripHtml(result.body.snippet)
              const lastPeriodIdx = answer.lastIndexOf('. ')
              if (answer.indexOf('. ') < lastPeriodIdx && (answer.length - lastPeriodIdx) < 10) {
                answer = answer.substring(0, lastPeriodIdx + 1)
              }
              addResponseMessage(`${answer}\n\nRead more [here](${kbUrl}/article/${id}).`)
            }
          }, 1000)
        })
      }
    )
  }

  return (
    <Container>
      <Widget
        title="Need help?"
        subtitle="Our agents are here to assist"
        handleNewUserMessage={handleNewUserMessage}
      />
    </Container>
  );
}

export default ChatWidget;