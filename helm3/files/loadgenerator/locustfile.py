import json

from locust import HttpLocust, TaskSet
from faker import Faker

import random
from random import randint


def generate_card(type=None):
    """
    Prefill some values based on the card type
    """
    card_types = ["visa", "mastercard", "discover", "amex"]

    def prefill(t):
        # typical number of digits in credit card
        def_length = 16

        """
        Prefill with initial numbers and return it including the total number of digits
        remaining to fill
        """
        if t == card_types[0]:
            return [4], def_length - 1

        elif t == card_types[1]:
            # master card start with 5 and is 16 digits long
            return [5, randint(1, 5)], def_length - 2

        elif t == card_types[3]:
            # master card start with 5 and is 16 digits long
            return [3, 7], def_length - 3

        else:
            # this section probably not even needed here
            return [], def_length

    def finalize(nums):
        """
        Make the current generated list pass the Luhn check by checking and adding
        the last digit appropriately bia calculating the check sum
        """
        check_sum = 0

        # is_even = True if (len(nums) + 1 % 2) == 0 else False

        """
        Reason for this check offset is to figure out whther the final list is going
        to be even or odd which will affect calculating the check_sum.
        This is mainly also to avoid reversing the list back and forth which is specified
        on the Luhn algorithm.
        """
        check_offset = (len(nums) + 1) % 2

        for i, n in enumerate(nums):
            if (i + check_offset) % 2 == 0:
                n_ = n * 2
                check_sum += n_ - 9 if n_ > 9 else n_
            else:
                check_sum += n
        return nums + [10 - (check_sum % 10)]

    # main body
    if type:
        t = type.lower()
    else:
        t = random.choice(card_types)
    if t not in card_types:
        print
        "Unknown type: '%s'" % type
        print
        "Please pick one of these supported types: %s" % card_types
        return
    initial, rem = prefill(t)
    so_far = initial + [randint(1, 9) for x in range(rem - 1)]
    card = "".join(map(str, finalize(so_far)))
    return '-'.join(card[i:i + 4] for i in range(0, len(card), 4))[0:19]


fake = Faker()
email = fake.email()

class UserBehavior(TaskSet):
    headers = {}



    def on_start(self):
        self.index()

    products = [
        '0PUK6V6EV0',
        '1YMWWN1N4O',
        '2ZYFJ3GM2N',
        '66VCHSJNUP',
        '6E92ZMYYFZ',
        '9SIQT8TOJO',
        'L9ECAV7KIM',
        'LS4PSXUNUM',
        'OLJCESPC7Z']

    def index(self):
        self.headers = {
            "X-Forwarded-User": email,
            "User-Agent": fake.user_agent(),
        }
        self.client.get("/", headers=self.headers)

    def setCurrency(self):
        currencies = ['USD']
        self.client.post("/setCurrency",
                         {'currency_code': random.choice(currencies)}, headers=self.headers)

    def browseProduct(self):
        self.client.get("/product/" + random.choice(self.products), headers=self.headers)

    def viewCart(self):
        self.client.get("/cart", headers=self.headers)

    def addToCart(self):
        product = random.choice(self.products)
        self.client.get("/product/" + product, headers=self.headers)
        self.client.post("/cart", {
            'product_id': product,
            'quantity': random.choice([1, 2])}, headers=self.headers)

    def checkout(self):
        self.addToCart()
        body = {
            'email': email,
            'street_address': fake.street_address(),
            'zip_code': fake.postalcode(),
            'city': fake.city(),
            'state': fake.state(),
            'country': fake.country(),
            'credit_card_number': generate_card(type=random.choice(["visa","visa","visa","visa","visa","visa","visa","visa","visa", "mastercard"])),
            'credit_card_expiration_month': fake.credit_card_expire(start="now", end="+10y", date_format="%m"),
            'credit_card_expiration_year': fake.credit_card_expire(start="now", end="+10y", date_format="%Y"),
            'credit_card_cvv': fake.credit_card_security_code(),
        }
        self.client.post("/cart/checkout", body, headers=self.headers)
        self.client.cookies.clear()

    # checkout = random.choice([1, 1,1,1,1, 0])
    tasks = {
        index: 1,
        setCurrency: 1,
        browseProduct: 5,
        addToCart: 1,
        viewCart: 1,
        checkout: 1}


class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 5000
    max_wait = 10000