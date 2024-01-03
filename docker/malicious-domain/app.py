# flask_web/app.py
import time

from flask import Flask
app = Flask(__name__)

@app.route('/foobar', methods=['GET', 'POST'])
def hello_world():
    time.sleep(5)
    return 'Hey, we have Flask in a Docker container!'

if __name__ == '__main__':
    app.run(host= '0.0.0.0', port=80)