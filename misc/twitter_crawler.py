import tweepy
import time

#   auth = tweepy.OAuthHandler("hU3g07FbVGffjgXZTCHnqOKiU", "8ytA3i99c6pHo13CBmEDHjAaSCBxMYAGsnKIkJ51Qff4yZpeJx")
#auth.set_access_token("157035167-FrhisHJ44NVdjY3WvevWVHE6btmCNPlCFo0fBw4z", "AQIegKpztlsvpi8EDsV9Gjk2Vaxtv8rxHwROCFud55JDw")

auth = tweepy.OAuthHandler("157035167-FrhisHJ44NVdjY3WvevWVHE6btmCNPlCFo0fBw4z", "AQIegKpztlsvpi8EDsV9Gjk2Vaxtv8rxHwROCFud55JDw")
auth.set_access_token("hU3g07FbVGffjgXZTCHnqOKiU", "8ytA3i99c6pHo13CBmEDHjAaSCBxMYAGsnKIkJ51Qff4yZpeJx")

api = tweepy.API(auth)

public_tweets = api.home_timeline()
for tweet in public_tweets:
    print(tweet.text)
    time.sleep(60)
